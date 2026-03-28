import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ChevronDown, ChevronUp, Send, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { generateFloorWithAI, getApiKey, setApiKey, type GeneratedFloor } from '@/lib/ai/claudeService';
import { usePublishFloor } from '@/hooks/useFloors';
import { ELEMENT_META } from '@/types/character';
import type { ElementType } from '@/types/character';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ELEMENTS: ElementType[] = [
  'Fire','Water','Electric','Grass','Ice','Ground',
  'Fighting','Steel','Poison','Dark','Ghost','Flying',
];

const TRIGGER_LABELS: Record<string, string> = {
  hp_below_50:  'HP < 50%',
  turn_3:       'Turno 3',
  random_20pct: '20% aleatório',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,229,255,0.15)',
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.65rem',
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: 'rgba(0,229,255,0.55)',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function CyberInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(0,229,255,0.2)',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#e2e8f0',
        fontSize: '0.88rem',
        outline: 'none',
        fontFamily: "'Exo 2', sans-serif",
      }}
    />
  );
}

// ─── Sub-component: enemy preview card ───────────────────────────────────────

function EnemyCard({
  enemy,
  isBoss = false,
}: {
  enemy: GeneratedFloor['enemies'][number] | GeneratedFloor['boss'];
  isBoss?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boss = isBoss ? (enemy as GeneratedFloor['boss']) : null;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isBoss ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`,
        background: isBoss ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isBoss ? '#fbbf24' : '#cbd5e1',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{isBoss ? '👾' : '👹'}</span>
        <span style={{ flex: 1, fontWeight: 600, fontFamily: "'Rajdhani', sans-serif", fontSize: '0.9rem' }}>
          {enemy.name}
          <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
            Lv. {enemy.level}
          </span>
        </span>
        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
          HP {enemy.hpMax}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Lore */}
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                {enemy.lore}
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: '#64748b' }}>
                <span>❤️ {enemy.hpMax}</span>
                <span>🛡️ {enemy.defFisica}</span>
                <span>🔮 {enemy.defMagica}</span>
                <span>💨 {enemy.velocidade}</span>
              </div>

              {/* Abilities */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {enemy.abilities.map(a => (
                  <span
                    key={a}
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(0,229,255,0.06)',
                      border: '1px solid rgba(0,229,255,0.15)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      color: '#67e8f9',
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>

              {/* Boss special */}
              {boss && (
                <div
                  style={{
                    borderRadius: 6,
                    background: 'rgba(251,191,36,0.07)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                    ⚡ {boss.specialAbilityName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#d97706' }}>
                    {boss.specialAbilityEffect}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#92400e', marginTop: 4 }}>
                    Trigger: {TRIGGER_LABELS[boss.specialTrigger] ?? boss.specialTrigger}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FloorCreator() {
  // Form state
  const [theme,      setTheme]    = useState('');
  const [elements,   setElements] = useState<ElementType[]>([]);
  const [levelMin,   setLevelMin] = useState(1);
  const [levelMax,   setLevelMax] = useState(10);
  const [apiKey,     setApiKeyState] = useState(getApiKey);
  const [showKey,    setShowKey]  = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated,    setGenerated]    = useState<GeneratedFloor | null>(null);

  const publishMutation = usePublishFloor();

  // ── Element toggle ───────────────────────────────────────────────────────────
  const toggleElement = (el: ElementType) => {
    setElements(prev =>
      prev.includes(el)
        ? prev.filter(e => e !== el)
        : prev.length < 3 ? [...prev, el] : prev,
    );
  };

  // ── Save API key to localStorage ─────────────────────────────────────────────
  const handleSaveKey = () => {
    setApiKey(apiKey);
    toast.success('Chave salva!');
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error('Preencha o tema do andar.');
      return;
    }
    if (elements.length === 0) {
      toast.error('Selecione pelo menos 1 elemento.');
      return;
    }
    if (levelMin < 1 || levelMax < levelMin) {
      toast.error('Verifique os níveis (min ≥ 1, max ≥ min).');
      return;
    }

    setIsGenerating(true);
    setGenerated(null);
    try {
      const data = await generateFloorWithAI({ theme, elements, levelMin, levelMax });
      setGenerated(data);
      toast.success('Andar gerado! Revise e publique.');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Erro ao gerar andar.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublish = () => {
    if (!generated) return;
    publishMutation.mutate(
      { theme, levelMin, levelMax, elements, generated },
      {
        onSuccess: () => {
          setGenerated(null);
          setTheme('');
          setElements([]);
        },
      },
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          ⚔️ Criar Andar
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Use IA para gerar inimigos, boss e lore temáticos.
        </p>
      </div>

      {/* API Key */}
      <Panel>
        <SectionLabel>🔑 Chave API Anthropic</SectionLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKeyState(e.target.value)}
              placeholder="sk-ant-..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: 8,
                padding: '10px 40px 10px 14px',
                color: '#e2e8f0',
                fontSize: '0.88rem',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => setShowKey(s => !s)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
              }}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            style={{
              padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem',
              background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
              color: '#67e8f9', fontWeight: 600, whiteSpace: 'nowrap',
            }}
          >
            Salvar
          </button>
        </div>
        <p style={{ fontSize: '0.68rem', color: '#475569', marginTop: 6 }}>
          Armazenada apenas no localStorage do navegador. Não é enviada ao servidor.
        </p>
      </Panel>

      {/* Form */}
      <Panel>
        <SectionLabel>🗺️ Configuração do Andar</SectionLabel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Theme */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Tema
            </label>
            <CyberInput
              value={theme}
              onChange={setTheme}
              placeholder="Ex: Floresta Sombria, Caverna de Lava, Abismo Gelado…"
            />
          </div>

          {/* Level range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Nível Mínimo
              </label>
              <CyberInput
                type="number"
                value={levelMin}
                onChange={v => setLevelMin(Math.max(1, Number(v)))}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Nível Máximo
              </label>
              <CyberInput
                type="number"
                value={levelMax}
                onChange={v => setLevelMax(Math.max(levelMin, Number(v)))}
              />
            </div>
          </div>

          {/* Elements */}
          <div>
            <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 8 }}>
              Elementos (máx. 3)
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
              }}
            >
              {ALL_ELEMENTS.map(el => {
                const meta    = ELEMENT_META[el];
                const checked = elements.includes(el);
                const maxed   = elements.length >= 3 && !checked;
                return (
                  <button
                    key={el}
                    onClick={() => !maxed && toggleElement(el)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 10px', borderRadius: 7, cursor: maxed ? 'not-allowed' : 'pointer',
                      background: checked
                        ? `${meta.color}22`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${checked ? meta.color : 'rgba(255,255,255,0.08)'}`,
                      opacity: maxed ? 0.35 : 1,
                      transition: 'all 0.15s',
                      color: checked ? meta.color : '#64748b',
                      fontSize: '0.75rem',
                      fontWeight: checked ? 700 : 400,
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{el}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      {/* Generate button */}
      <motion.button
        onClick={handleGenerate}
        disabled={isGenerating}
        whileHover={!isGenerating ? { scale: 1.02 } : {}}
        whileTap={!isGenerating ? { scale: 0.98 } : {}}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 10,
          border: '1px solid rgba(0,229,255,0.4)',
          background: isGenerating
            ? 'rgba(0,229,255,0.04)'
            : 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,77,255,0.15))',
          color: isGenerating ? '#475569' : '#00e5ff',
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: 2,
          textTransform: 'uppercase',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 0.2s',
          boxShadow: isGenerating ? 'none' : '0 0 20px rgba(0,229,255,0.15)',
        }}
      >
        <Wand2 size={18} />
        {isGenerating ? 'Gerando com IA…' : 'Gerar Andar com IA'}
      </motion.button>

      {/* Preview */}
      <AnimatePresence>
        {generated && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Lore */}
            <Panel>
              <SectionLabel>📖 Lore do Andar</SectionLabel>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                {generated.floorLore}
              </p>
            </Panel>

            {/* Enemies */}
            <Panel>
              <SectionLabel>👹 Inimigos ({generated.enemies.length})</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {generated.enemies.map((e, i) => (
                  <EnemyCard key={i} enemy={e} />
                ))}
              </div>
            </Panel>

            {/* Boss */}
            <Panel>
              <SectionLabel>👾 Boss</SectionLabel>
              <EnemyCard enemy={generated.boss} isBoss />
            </Panel>

            {/* Action row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <motion.button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '13px',
                  borderRadius: 10,
                  border: '1px solid rgba(74,222,128,0.4)',
                  background: 'rgba(74,222,128,0.1)',
                  color: publishMutation.isPending ? '#475569' : '#4ade80',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: publishMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Send size={16} />
                {publishMutation.isPending ? 'Publicando…' : 'Publicar'}
              </motion.button>

              <motion.button
                onClick={() => setGenerated(null)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '13px',
                  borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.07)',
                  color: '#f87171',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <RotateCcw size={16} />
                Descartar
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
