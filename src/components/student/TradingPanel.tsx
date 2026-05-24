import { useState, useEffect, useCallback } from "react";
import { supabaseAnon } from "@/integrations/supabase/anonClient";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Student, InventoryItem, ShopItem } from "@/types";
import { ArrowLeftRight, Loader2, CheckCircle, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/icons/GameIcon";

interface Props {
  student: Student;
  classmates?: Student[];
  inventory: InventoryItem[];
  onInventoryChanged?: () => void;
}

interface Trade {
  id: string;
  teacher_id: string;
  proposer_id: string;
  receiver_id: string;
  proposer_item_id: string;
  receiver_item_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  resolved_at: string | null;
  proposer_item?: ShopItem;
  receiver_item?: ShopItem | null;
  proposer?: { name: string; character_name: string | null };
  receiver?: { name: string; character_name: string | null };
}

export function TradingPanel({ student, classmates: classmatesProp, inventory, onInventoryChanged }: Props) {
  const [classmates, setClassmates] = useState<Student[]>(classmatesProp ?? []);
  const [tab, setTab] = useState<'propose' | 'incoming' | 'history'>('propose');

  useEffect(() => {
    if (classmatesProp && classmatesProp.length > 0) return;
    supabaseAnon
      .from('students')
      .select('id, name, character_name, class_id, level, teacher_id, coins, presencas_consecutivas')
      .eq('class_id', student.class_id)
      .eq('status', 'active')
      .then(({ data }) => setClassmates((data ?? []) as Student[]));
  }, [student.class_id, classmatesProp]);
  const [receiverId, setReceiverId] = useState('');
  const [myItemId, setMyItemId] = useState('');
  const [theirItemId, setTheirItemId] = useState('');
  const [receiverInventory, setReceiverInventory] = useState<InventoryItem[]>([]);
  const [isLoadingRecv, setIsLoadingRecv] = useState(false);
  const [isProposing, setIsProposing] = useState(false);

  const [incoming, setIncoming] = useState<Trade[]>([]);
  const [historyTrades, setHistoryTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Items from my inventory
  const myItems = inventory.filter(i => i.item).map(i => ({ inv: i, item: i.item! }));

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      // Pending incoming
      const { data: pendingData } = await supabaseAnon
        .from('trades')
        .select('id, teacher_id, proposer_id, receiver_id, proposer_item_id, receiver_item_id, status, created_at, resolved_at')
        .eq('receiver_id', student.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // History
      const { data: histData } = await supabaseAnon
        .from('trades')
        .select('id, teacher_id, proposer_id, receiver_id, proposer_item_id, receiver_item_id, status, created_at, resolved_at')
        .or(`proposer_id.eq.${student.id},receiver_id.eq.${student.id}`)
        .in('status', ['accepted', 'rejected', 'cancelled'])
        .order('resolved_at', { ascending: false })
        .limit(10);

      // Enrich with item + student data
      const allTrades = [...(pendingData ?? []), ...(histData ?? [])] as Trade[];
      const itemIds = [...new Set(allTrades.flatMap(t => [t.proposer_item_id, t.receiver_item_id]).filter(Boolean))] as string[];
      const studentIds = [...new Set(allTrades.flatMap(t => [t.proposer_id, t.receiver_id]))];

      const [{ data: items }, { data: students }] = await Promise.all([
        itemIds.length > 0
          ? supabaseAnon.from('shop_items')
              .select('id, teacher_id, name, description, category, cost, diamond_cost, min_level, rarity, icon, image_url, is_active, is_premium, source_anime, ability_mode, ability_key, ability_name, ability_description, ability_config, created_at, attr_forca, attr_destreza, attr_inteligencia, attr_carisma, attr_agilidade, attr_resistencia')
              .in('id', itemIds)
          : Promise.resolve({ data: [] }),
        supabaseAnon.from('students').select('id, name, character_name').in('id', studentIds),
      ]);

      const itemMap: Record<string, ShopItem> = {};
      for (const i of items ?? []) itemMap[i.id] = i as ShopItem;
      const studentMap: Record<string, { name: string; character_name: string | null }> = {};
      for (const s of students ?? []) studentMap[s.id] = { name: s.name, character_name: s.character_name };

      const enrich = (trades: Trade[]): Trade[] => trades.map(t => ({
        ...t,
        proposer_item: itemMap[t.proposer_item_id],
        receiver_item: t.receiver_item_id ? itemMap[t.receiver_item_id] : null,
        proposer: studentMap[t.proposer_id],
        receiver: studentMap[t.receiver_id],
      }));

      setIncoming(enrich((pendingData ?? []) as Trade[]));
      setHistoryTrades(enrich((histData ?? []) as Trade[]));
    } finally {
      setIsLoading(false);
    }
  }, [student.id]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  // Load receiver inventory when they're selected
  useEffect(() => {
    if (!receiverId) { setReceiverInventory([]); return; }
    setIsLoadingRecv(true);
    supabaseAnon
      .from('student_inventory')
      .select('*, item:shop_items(*)')
      .eq('student_id', receiverId)
      .then(({ data }) => {
        setReceiverInventory((data ?? []) as InventoryItem[]);
        setIsLoadingRecv(false);
      });
  }, [receiverId]);

  async function handlePropose() {
    if (!receiverId) { toast.error('Selecione para quem enviar a troca.'); return; }
    if (!myItemId) { toast.error('Selecione o item que você oferece.'); return; }
    setIsProposing(true);
    try {
      const { error } = await supabaseAnon.from('trades').insert({
        teacher_id: student.teacher_id,
        proposer_id: student.id,
        receiver_id: receiverId,
        proposer_item_id: myItemId,
        receiver_item_id: theirItemId || null,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Proposta enviada!');
      setMyItemId('');
      setTheirItemId('');
      setReceiverId('');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao propor troca.');
    } finally {
      setIsProposing(false);
    }
  }

  async function handleAccept(tradeId: string) {
    const { data, error } = await supabaseAnon.rpc('execute_trade', { p_trade_id: tradeId });
    const result = data as { success?: boolean; error?: string } | null;
    if (error) {
      toast.error(error.message ?? 'Erro ao aceitar troca.');
      loadTrades();
      return;
    }
    if (!result?.success) {
      toast.error(result?.error ?? 'Erro ao aceitar troca.');
      loadTrades();
      return;
    }
    toast.success('Troca realizada!');
    void supabaseStudent.rpc('increment_daily_counter', { p_type: 'trades_done', p_amount: 1 });
    loadTrades();
    onInventoryChanged?.();
  }

  async function handleReject(tradeId: string) {
    await supabaseAnon.from('trades').update({ status: 'rejected', resolved_at: new Date().toISOString() }).eq('id', tradeId);
    toast.success('Proposta recusada.');
    loadTrades();
  }

  const cardStyle = {
    background: 'rgba(10,14,26,0.8)',
    border: '1px solid rgba(0,229,255,0.1)',
    borderRadius: '16px',
    padding: '20px',
  };

  const receiverItems = receiverInventory.filter(i => i.item).map(i => ({ inv: i, item: i.item! }));

  return (
    <div style={cardStyle} className="space-y-4">
      <div className="flex items-center gap-2">
        <ArrowLeftRight size={18} style={{ color: '#00e5ff' }} />
        <p className="font-display text-base font-bold" style={{ color: '#00e5ff' }}>Trading</p>
        {incoming.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(255,152,0,0.2)', color: '#ff9800' }}>
            {incoming.length}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {(['propose', 'incoming', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === t ? 'rgba(0,229,255,0.3)' : 'transparent'}`,
              color: tab === t ? '#00e5ff' : 'rgba(255,255,255,0.4)',
            }}>
            {t === 'propose' ? 'Propor' : t === 'incoming' ? `Recebidas (${incoming.length})` : 'Histórico'}
          </button>
        ))}
      </div>

      {/* Propose Tab */}
      {tab === 'propose' && (
        <div className="space-y-3">
          {myItems.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Você não tem itens para trocar.
            </p>
          )}
          {myItems.length > 0 && (
            <>
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Com quem:</label>
                <select value={receiverId} onChange={e => setReceiverId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                  <option value="">— Selecionar colega —</option>
                  {classmates.filter(c => c.id !== student.id).map(c => (
                    <option key={c.id} value={c.id}>{c.character_name || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Você oferece:</label>
                  <select value={myItemId} onChange={e => setMyItemId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-xs"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                    <option value="">— Selecionar —</option>
                    {myItems.map(({ inv, item }) => (
                      <option key={inv.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Você quer:</label>
                  {isLoadingRecv ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 size={14} className="animate-spin" style={{ color: '#00e5ff' }} />
                    </div>
                  ) : (
                    <select value={theirItemId} onChange={e => setTheirItemId(e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-xs"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                      disabled={!receiverId}>
                      <option value="">— Qualquer item —</option>
                      {receiverItems.map(({ inv, item }) => (
                        <option key={inv.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Preview */}
              {myItemId && (
                <div className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}>
                  <div className="text-center flex-1">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Você dá</p>
                    <p className="text-xs font-bold" style={{ color: '#00e5ff' }}>
                      {myItems.find(i => i.item.id === myItemId)?.item.name ?? '—'}
                    </p>
                  </div>
                  <ArrowLeftRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <div className="text-center flex-1">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Você recebe</p>
                    <p className="text-xs font-bold" style={{ color: '#a78bfa' }}>
                      {theirItemId
                        ? receiverItems.find(i => i.item.id === theirItemId)?.item.name ?? '—'
                        : 'Qualquer item'}
                    </p>
                  </div>
                </div>
              )}

              <button onClick={handlePropose} disabled={isProposing || !myItemId || !receiverId}
                className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: 'rgba(0,229,255,0.1)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: '#00e5ff',
                  opacity: isProposing || !myItemId || !receiverId ? 0.5 : 1,
                }}>
                {isProposing ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
                Enviar Proposta
              </button>
            </>
          )}
        </div>
      )}

      {/* Incoming Tab */}
      {tab === 'incoming' && (
        <div className="space-y-3">
          {isLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin" style={{ color: '#00e5ff' }} size={20} /></div>}
          {!isLoading && incoming.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Nenhuma proposta recebida.</p>
          )}
          {incoming.map(trade => (
            <div key={trade.id} className="p-3 rounded-xl space-y-2"
              style={{ background: 'rgba(255,152,0,0.06)', border: '1px solid rgba(255,152,0,0.2)' }}>
              <p className="text-xs font-bold" style={{ color: '#ff9800' }}>
                {(trade.proposer?.character_name || trade.proposer?.name) ?? 'Aluno'} quer trocar:
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {trade.proposer_item ? (
                    <span className="flex items-center gap-1">
                      <GameIcon id={trade.proposer_item.icon ?? 'gem'} size={12} className="text-gold" />
                      {trade.proposer_item.name}
                    </span>
                  ) : '—'}
                </span>
                <ArrowLeftRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {trade.receiver_item ? (
                    <span className="flex items-center gap-1">
                      <GameIcon id={trade.receiver_item.icon ?? 'gem'} size={12} className="text-gold" />
                      {trade.receiver_item.name}
                    </span>
                  ) : 'Qualquer item'}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAccept(trade.id)}
                  className="flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"
                  style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)', color: '#4caf50' }}>
                  <CheckCircle size={12} /> Aceitar
                </button>
                <button onClick={() => handleReject(trade.id)}
                  className="flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  <X size={12} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {isLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin" style={{ color: '#00e5ff' }} size={20} /></div>}
          {!isLoading && historyTrades.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Sem histórico de trocas.</p>
          )}
          {historyTrades.map(trade => {
            const isProposer = trade.proposer_id === student.id;
            const partner = isProposer ? trade.receiver : trade.proposer;
            const statusColor = trade.status === 'accepted' ? '#4caf50' : trade.status === 'rejected' ? '#ef4444' : 'rgba(255,255,255,0.3)';
            const statusLabel = trade.status === 'accepted' ? 'Aceita' : trade.status === 'rejected' ? 'Recusada' : 'Cancelada';
            return (
              <div key={trade.id} className="flex items-center justify-between text-xs py-1.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  com <span style={{ color: '#a78bfa' }}>{(partner?.character_name || partner?.name) ?? '?'}</span>
                  {' '}{trade.proposer_item?.name ?? '—'} <ArrowLeftRight size={10} className="inline" /> {trade.receiver_item?.name ?? '—'}
                </span>
                <span style={{ color: statusColor, fontWeight: 'bold' }}>{statusLabel}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
