// Patch 3.3 — Forge UI.
// Pulls recipes + materials + owned consumables + active buffs from
// the get_my_forge_state RPC. Each recipe lists its ingredient
// requirements with green/red checks so the student sees at a glance
// what they can craft. On forge, calls forge_recipe RPC and replays
// the state. GSAP for the "ingredients sink in, result rises" beat.

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { toast } from 'sonner';
import { Loader2, Check, X, Hammer } from 'lucide-react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { GameIcon } from '@/components/icons/GameIcon';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

interface Ingredient { material: string; qty: number; }
interface Recipe {
  key:          string;
  name:         string;
  description:  string;
  icon:         string;
  rarity:       Rarity;
  result_type:  'consumable' | 'buff';
  result_name:  string;
  result_icon:  string;
  ingredients:  Ingredient[];
}
interface OwnedConsumable { key: string; name: string; icon: string; rarity: Rarity; quantity: number; }
interface ActiveBuff      { key: string; name: string; icon: string; rarity: Rarity; battles_left: number; }
interface ForgeState {
  recipes:      Recipe[];
  materials:    Record<string, number>;
  consumables:  OwnedConsumable[];
  active_buffs: ActiveBuff[];
}

const RARITY: Record<Rarity, { label: string; color: string; border: string }> = {
  common:   { label: 'Comum',   color: '#c8d0d8', border: 'rgba(200,208,216,0.3)' },
  uncommon: { label: 'Incomum', color: '#4ade80', border: 'rgba(74,222,128,0.4)' },
  rare:     { label: 'Rara',    color: '#60c8f8', border: 'rgba(96,200,248,0.4)' },
  epic:     { label: 'Épica',   color: '#b57bee', border: 'rgba(181,123,238,0.5)' },
};

export function ForgePanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<ForgeState>({
    queryKey: ['forge-state'],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabaseStudent.rpc('get_my_forge_state');
      if (error) throw error;
      return data as ForgeState;
    },
  });
  const [busyRecipe, setBusyRecipe] = useState<string | null>(null);
  const flashRef = useRef<Record<string, HTMLDivElement | null>>({});

  async function handleForge(recipeKey: string) {
    if (busyRecipe) return;
    setBusyRecipe(recipeKey);

    // Quick "ingredients sink" beat on the recipe card.
    const card = flashRef.current[recipeKey];
    if (card) {
      gsap.fromTo(card,
        { boxShadow: '0 0 0 rgba(255,200,80,0)' },
        { boxShadow: '0 0 32px rgba(255,200,80,0.65)', duration: 0.35, yoyo: true, repeat: 1 });
    }

    try {
      const { data, error } = await supabaseStudent.rpc('forge_recipe', { p_recipe_key: recipeKey });
      if (error) throw error;
      const res = data as { success: boolean; error?: string; result_type?: string;
                            consumable?: { name: string }; buff?: { name: string; duration: number } };
      if (!res?.success) {
        toast.error(res?.error === 'insufficient_materials' ? 'Faltam materiais.' : (res?.error ?? 'Falha ao forjar.'));
        return;
      }
      const name = res.consumable?.name ?? res.buff?.name ?? 'Item';
      const extra = res.buff ? ` (${res.buff.duration} batalha${res.buff.duration === 1 ? '' : 's'})` : '';
      toast.success(`Forjado: ${name}${extra}`);
      // Invalidate forge state + materials tab data.
      qc.invalidateQueries({ queryKey: ['forge-state'] });
      qc.invalidateQueries({ queryKey: ['my-materials'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setBusyRecipe(null);
    }
  }

  if (isLoading || !data) {
    return <div style={emptyStyle}><Loader2 className="animate-spin" /> Carregando forja…</div>;
  }

  // Wave B — forge recipes hidden for now. Materials still drop and stack
  // in inventory; once recipes are designed/balanced we re-enable the grid.
  return (
    <div style={{ padding: '8px 0 24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '3px',
        color: 'rgba(255,200,80,0.65)', marginBottom: 12,
      }}>
        <Hammer size={14} /> FORJA
      </div>

      <div style={{
        margin: '40px auto',
        maxWidth: 420,
        padding: '32px 24px',
        textAlign: 'center',
        background: 'rgba(8,12,22,0.5)',
        border: '1px dashed rgba(255,200,80,0.35)',
        borderRadius: 12,
      }}>
        <div style={{
          display: 'inline-flex',
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,200,80,0.10)',
          border: '1px solid rgba(255,200,80,0.35)',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Hammer size={26} color="#ffd700" />
        </div>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 16, fontWeight: 700, letterSpacing: '3px',
          color: '#ffd700', marginBottom: 8,
        }}>
          EM BREVE
        </div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13, lineHeight: 1.5,
          color: 'rgba(200,216,240,0.65)',
        }}>
          A forja está sendo recalibrada. Continue caçando inimigos — os
          materiais que você coleta ficam guardados no seu inventário e
          poderão ser combinados em breve.
        </div>
      </div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const materialsMap = data.materials ?? {};

  return (
    <div style={{ padding: '8px 0 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '3px',
        color: 'rgba(255,200,80,0.65)', marginBottom: 12,
      }}>
        <Hammer size={14} /> FORJA — combine materiais
      </div>

      {/* Active buffs strip (compact) */}
      {data.active_buffs?.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14,
          padding: '8px 10px',
          background: 'rgba(74,222,128,0.05)',
          border: '1px solid rgba(74,222,128,0.25)',
          borderRadius: 8,
        }}>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '1.5px', color: '#4ade80' }}>
            BUFFS ATIVOS
          </span>
          {data.active_buffs.map(b => (
            <span key={b.key} style={{
              fontFamily: "'Rajdhani', sans-serif", fontSize: 11,
              color: '#e2e8f0', background: 'rgba(74,222,128,0.10)',
              border: '1px solid rgba(74,222,128,0.3)', borderRadius: 4,
              padding: '2px 8px',
            }}>
              {b.name} ×{b.battles_left}
            </span>
          ))}
        </div>
      )}

      {/* Recipes grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 10,
      }}>
        {data.recipes.map(r => {
          const ingStatus = r.ingredients.map(i => ({
            ...i, have: materialsMap[i.material] ?? 0,
          }));
          const canForge = ingStatus.every(i => i.have >= i.qty);
          const rar = RARITY[r.rarity];
          return (
            <div
              key={r.key}
              ref={el => { flashRef.current[r.key] = el; }}
              style={{
                padding: '12px 14px',
                background: 'rgba(8,12,22,0.5)',
                border: `1px solid ${rar.border}`,
                borderRadius: 10,
                opacity: canForge ? 1 : 0.85,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                  background: `${rar.color}12`,
                  border: `1px solid ${rar.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GameIcon id={r.result_icon} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600,
                    color: '#e2e8f0',
                  }}>
                    {r.result_name}
                  </div>
                  <div style={{
                    fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.5px',
                    color: rar.color,
                  }}>
                    {rar.label.toUpperCase()} · {r.result_type === 'buff' ? 'BUFF' : 'CONSUMÍVEL'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{
                fontSize: 11, lineHeight: 1.4,
                color: 'rgba(200,216,240,0.65)',
                marginBottom: 10,
              }}>
                {r.description}
              </div>

              {/* Ingredients */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {ingStatus.map(i => {
                  const ok = i.have >= i.qty;
                  return (
                    <div key={i.material} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11,
                      color: ok ? '#4ade80' : '#f87171',
                    }}>
                      {ok ? <Check size={12} /> : <X size={12} />}
                      <span style={{ flex: 1, color: ok ? 'rgba(200,216,240,0.85)' : 'rgba(200,216,240,0.55)' }}>
                        {i.material}
                      </span>
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }}>
                        {i.have}/{i.qty}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Forge button */}
              <button
                onClick={() => handleForge(r.key)}
                disabled={!canForge || busyRecipe === r.key}
                style={{
                  width: '100%', padding: '7px 0', borderRadius: 6,
                  background: canForge ? 'rgba(255,200,80,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${canForge ? 'rgba(255,200,80,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  color: canForge ? '#ffd700' : 'rgba(255,255,255,0.25)',
                  fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '2.5px',
                  cursor: canForge && !busyRecipe ? 'pointer' : 'not-allowed',
                }}
              >
                {busyRecipe === r.key ? 'FORJANDO…' : canForge ? 'FORJAR' : 'FALTA MATERIAL'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Owned consumables */}
      {data.consumables?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: '3px',
            color: 'rgba(56,217,232,0.55)', marginBottom: 8,
          }}>
            CONSUMÍVEIS PRONTOS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.consumables.map(c => (
              <div key={c.key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: 'rgba(56,217,232,0.06)',
                border: '1px solid rgba(56,217,232,0.30)',
                borderRadius: 8,
              }}>
                <GameIcon id={c.icon} size={14} />
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#e2e8f0' }}>
                  {c.name}
                </span>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 800, color: '#38d9e8' }}>
                  ×{c.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const emptyStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '40px 20px', justifyContent: 'center',
  fontFamily: "'Rajdhani', sans-serif", fontSize: 14,
  color: 'rgba(200,216,240,0.45)',
};
