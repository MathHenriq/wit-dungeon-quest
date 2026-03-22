import { useState, useEffect, useRef } from "react";
import { ChevronRight, CheckCircle } from "lucide-react";
import { AincradBackground } from "@/components/ui/AincradBackground";
import { SwordIcon, WandIcon, BowIcon, HeartIcon } from "@/components/icons/SaoIcons";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { Student } from "@/types";

// ─── Internal hook ────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 35, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

// ─── Class definitions ─────────────────────────────────────────────────────

interface ClassDef {
  id: string;
  name: string;
  bonusKey: string;
  bonusValue: number;
  bonus: string;
  ringColor: string;
  fillColor: string;
  bgColor: string;
  borderColor: string;
  description: string;
  Icon: React.FC<{ size?: number; ringColor?: string; fillColor?: string; bgColor?: string }>;
}

const CLASSES: ClassDef[] = [
  {
    id: "Guerreiro",
    name: "Guerreiro",
    bonusKey: "attr_forca",
    bonusValue: 3,
    bonus: "Força +3",
    ringColor: "#ff6b35",
    fillColor: "#ff6b35",
    bgColor: "rgba(255,107,53,0.08)",
    borderColor: "rgba(255,107,53,0.3)",
    description: "Enfrenta bugs de frente. Mestre em resolver problemas e superar desafios diretos.",
    Icon: SwordIcon,
  },
  {
    id: "Mago",
    name: "Mago",
    bonusKey: "attr_inteligencia",
    bonusValue: 3,
    bonus: "Inteligência +3",
    ringColor: "#b388ff",
    fillColor: "#b388ff",
    bgColor: "rgba(124,77,255,0.08)",
    borderColor: "rgba(124,77,255,0.3)",
    description: "Domina os feitiços do código. Especialista em lógica, algoritmos e pensamento abstrato.",
    Icon: WandIcon,
  },
  {
    id: "Arqueiro",
    name: "Arqueiro",
    bonusKey: "attr_destreza",
    bonusValue: 3,
    bonus: "Destreza +3",
    ringColor: "#4caf50",
    fillColor: "#4caf50",
    bgColor: "rgba(76,175,80,0.08)",
    borderColor: "rgba(76,175,80,0.3)",
    description: "Mira certeira nos dados. Especialista em análise, visualização e precisão.",
    Icon: BowIcon,
  },
  {
    id: "Curandeiro",
    name: "Curandeiro",
    bonusKey: "attr_carisma",
    bonusValue: 3,
    bonus: "Carisma +3",
    ringColor: "#00e5ff",
    fillColor: "#00e5ff",
    bgColor: "rgba(0,229,255,0.08)",
    borderColor: "rgba(0,229,255,0.3)",
    description: "Fortalece a equipe. Especialista em colaboração, comunicação e apoio aos colegas.",
    Icon: HeartIcon,
  },
  {
    id: "Engenheiro",
    name: "Engenheiro",
    bonusKey: "attr_resistencia",
    bonusValue: 3,
    bonus: "Resistência +3",
    ringColor: "#78909c",
    fillColor: "#78909c",
    bgColor: "rgba(120,144,156,0.08)",
    borderColor: "rgba(120,144,156,0.3)",
    description: "Constrói sistemas sólidos. Especialista em arquitetura, infraestrutura e projetos duráveis.",
    Icon: SwordIcon,
  },
  {
    id: "Alquimista",
    name: "Alquimista",
    bonusKey: "attr_inteligencia",
    bonusValue: 3,
    bonus: "Inteligência +3",
    ringColor: "#ffca28",
    fillColor: "#ffca28",
    bgColor: "rgba(255,202,40,0.08)",
    borderColor: "rgba(255,202,40,0.3)",
    description: "Transforma dados em ouro. Mestre em experimentação, testes e descobertas inesperadas.",
    Icon: WandIcon,
  },
  {
    id: "Bardo",
    name: "Bardo",
    bonusKey: "attr_carisma",
    bonusValue: 3,
    bonus: "Carisma +3",
    ringColor: "#f48fb1",
    fillColor: "#f48fb1",
    bgColor: "rgba(244,143,177,0.08)",
    borderColor: "rgba(244,143,177,0.3)",
    description: "Conta histórias com dados. Especialista em apresentação, design e comunicação visual.",
    Icon: HeartIcon,
  },
  {
    id: "Espiao",
    name: "Espião",
    bonusKey: "attr_agilidade",
    bonusValue: 3,
    bonus: "Agilidade +3",
    ringColor: "#26c6da",
    fillColor: "#26c6da",
    bgColor: "rgba(38,198,218,0.08)",
    borderColor: "rgba(38,198,218,0.3)",
    description: "Encontra padrões ocultos. Especialista em segurança, testes e descoberta de falhas.",
    Icon: BowIcon,
  },
  {
    id: "Monge",
    name: "Monge",
    bonusKey: "attr_agilidade",
    bonusValue: 3,
    bonus: "Agilidade +3",
    ringColor: "#80cbc4",
    fillColor: "#80cbc4",
    bgColor: "rgba(128,203,196,0.08)",
    borderColor: "rgba(128,203,196,0.3)",
    description: "Flui com o código. Especialista em metodologias ágeis, produtividade e foco mental.",
    Icon: SwordIcon,
  },
  {
    id: "Necromante",
    name: "Necromante",
    bonusKey: "attr_inteligencia",
    bonusValue: 3,
    bonus: "Inteligência +3",
    ringColor: "#7e57c2",
    fillColor: "#7e57c2",
    bgColor: "rgba(126,87,194,0.08)",
    borderColor: "rgba(126,87,194,0.3)",
    description: "Ressuscita projetos mortos. Especialista em refatoração, legacy code e recuperação de sistemas.",
    Icon: WandIcon,
  },
  {
    id: "Paladino",
    name: "Paladino",
    bonusKey: "attr_resistencia",
    bonusValue: 3,
    bonus: "Resistência +3",
    ringColor: "#ffd54f",
    fillColor: "#ffd54f",
    bgColor: "rgba(255,213,79,0.08)",
    borderColor: "rgba(255,213,79,0.3)",
    description: "Defende com honra. Especialista em qualidade de código, boas práticas e ética em IA.",
    Icon: SwordIcon,
  },
  {
    id: "Druida",
    name: "Druida",
    bonusKey: "attr_destreza",
    bonusValue: 3,
    bonus: "Destreza +3",
    ringColor: "#66bb6a",
    fillColor: "#66bb6a",
    bgColor: "rgba(102,187,106,0.08)",
    borderColor: "rgba(102,187,106,0.3)",
    description: "Conecta sistemas vivos. Especialista em APIs, integrações e ecossistemas de dados.",
    Icon: BowIcon,
  },
  {
    id: "Cavaleiro",
    name: "Cavaleiro",
    bonusKey: "attr_forca",
    bonusValue: 3,
    bonus: "Força +3",
    ringColor: "#ef9a9a",
    fillColor: "#ef9a9a",
    bgColor: "rgba(239,154,154,0.08)",
    borderColor: "rgba(239,154,154,0.3)",
    description: "Lidera a vanguarda. Especialista em gestão de projetos, liderança técnica e decisões sob pressão.",
    Icon: SwordIcon,
  },
  {
    id: "Oraculo",
    name: "Oráculo",
    bonusKey: "attr_inteligencia",
    bonusValue: 3,
    bonus: "Inteligência +3",
    ringColor: "#ce93d8",
    fillColor: "#ce93d8",
    bgColor: "rgba(206,147,216,0.08)",
    borderColor: "rgba(206,147,216,0.3)",
    description: "Prevê o futuro com dados. Especialista em machine learning, predições e modelos de IA.",
    Icon: WandIcon,
  },
  {
    id: "Samurai",
    name: "Samurai",
    bonusKey: "attr_destreza",
    bonusValue: 3,
    bonus: "Destreza +3",
    ringColor: "#ff7043",
    fillColor: "#ff7043",
    bgColor: "rgba(255,112,67,0.08)",
    borderColor: "rgba(255,112,67,0.3)",
    description: "Precision e disciplina. Especialista em código limpo, testes unitários e eficiência extrema.",
    Icon: BowIcon,
  },
];

const MOTIVATIONS = [
  "Quero aprender programação",
  "Quero dominar inteligência artificial",
  "Quero criar jogos e apps",
  "Quero entender o futuro da tecnologia",
  "Vim pela aventura e novidade",
];

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: () => void }) {
  const line1 = "Uma voz ecoa nas profundezas da Dungeon...";
  const line2 =
    "Aventureiro! Você foi convocado para uma jornada épica de conhecimento. Antes de entrar, preciso saber... quem é você?";

  const t1 = useTypewriter(line1, 35);
  const t2 = useTypewriter(t1.done ? line2 : "", 28, 400);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      {/* Rotating hexagon */}
      <div className="mb-10 animate-spin-slow">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <polygon
            points="60,4 110,32 110,88 60,116 10,88 10,32"
            fill="none"
            stroke="rgba(0,229,255,0.6)"
            strokeWidth="2"
          />
          <polygon
            points="60,16 98,38 98,82 60,104 22,82 22,38"
            fill="none"
            stroke="rgba(0,229,255,0.35)"
            strokeWidth="1.5"
          />
          <polygon
            points="60,28 86,44 86,76 60,92 34,76 34,44"
            fill="none"
            stroke="rgba(0,229,255,0.18)"
            strokeWidth="1"
          />
        </svg>
      </div>

      <p
        className="text-white/60 italic mb-6 text-lg max-w-md"
        style={{ fontFamily: "Rajdhani, sans-serif", minHeight: "1.8em" }}
      >
        {t1.displayed}
        {!t1.done && <span className="animate-pulse">|</span>}
      </p>

      {t1.done && (
        <p
          className="text-white text-xl max-w-lg mb-10"
          style={{ fontFamily: "Rajdhani, sans-serif", lineHeight: 1.5, minHeight: "4em" }}
        >
          {t2.displayed}
          {!t2.done && <span className="animate-pulse">|</span>}
        </p>
      )}

      {t1.done && t2.done && (
        <button onClick={onNext} className="btn-cyber animate-fade-in-up">
          <SwordIcon size={20} ringColor="#00e5ff" fillColor="#00e5ff" bgColor="transparent" />
          Começar Jornada
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function Step2({
  characterName,
  onChange,
  onNext,
  onBack,
}: {
  characterName: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <ProgressBar step={2} />
      <h2
        className="text-2xl font-bold text-white mb-8 text-center"
        style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}
      >
        Como será conhecido nas masmorras?
      </h2>

      <div className="w-full max-w-sm mb-6">
        <input
          type="text"
          value={characterName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Seu nome de aventureiro..."
          maxLength={32}
          className="w-full px-5 py-4 rounded-lg text-white text-xl text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "2px solid rgba(255,215,0,0.4)",
            fontFamily: "Rajdhani, sans-serif",
            letterSpacing: "3px",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.8)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,215,0,0.4)")}
          autoFocus
        />

        {characterName.length >= 2 && (
          <div
            className="mt-4 p-3 rounded-lg text-center animate-fade-in-up"
            style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)" }}
          >
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Pré-visualização</p>
            <p
              className="text-yellow-400 text-xl font-bold"
              style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "4px" }}
            >
              {characterName}
            </p>
          </div>
        )}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={characterName.trim().length < 2} />
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────

function Step3({
  selectedClass,
  onSelect,
  onNext,
  onBack,
}: {
  selectedClass: ClassDef | null;
  onSelect: (c: ClassDef) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-8">
      <ProgressBar step={3} />
      <h2
        className="text-2xl font-bold text-white mb-2 text-center"
        style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}
      >
        Toda jornada precisa de um papel
      </h2>
      <p className="text-white/40 text-sm mb-8 text-center">Escolha sua classe de aventureiro</p>

      <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 w-full max-w-md mb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.2) transparent' }}>
        {CLASSES.map((cls) => {
          const selected = selectedClass?.id === cls.id;
          return (
            <button
              key={cls.id}
              onClick={() => onSelect(cls)}
              className="flex flex-col items-center gap-3 p-5 rounded-xl transition-all duration-200 relative"
              style={{
                background: selected ? cls.bgColor : "rgba(255,255,255,0.03)",
                border: `2px solid ${selected ? cls.ringColor : "rgba(255,255,255,0.08)"}`,
                transform: selected ? "scale(1.03)" : "scale(1)",
              }}
            >
              {selected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle size={16} color={cls.ringColor} />
                </div>
              )}
              <cls.Icon
                size={52}
                ringColor={cls.ringColor}
                fillColor={cls.fillColor}
                bgColor={cls.bgColor}
              />
              <span
                className="font-bold text-white text-sm"
                style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px" }}
              >
                {cls.name}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: cls.bgColor,
                  border: `1px solid ${cls.borderColor}`,
                  color: cls.fillColor,
                }}
              >
                {cls.bonus}
              </span>
            </button>
          );
        })}
      </div>

      {selectedClass && (
        <div
          className="w-full max-w-md p-4 rounded-lg mb-6 animate-fade-in-up"
          style={{
            background: selectedClass.bgColor,
            border: `1px solid ${selectedClass.borderColor}`,
          }}
        >
          <p className="text-white/80 text-sm text-center">{selectedClass.description}</p>
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selectedClass} />
    </div>
  );
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

function Step4({
  selectedMotivation,
  customMotivation,
  onSelectMotivation,
  onCustomChange,
  onNext,
  onBack,
}: {
  selectedMotivation: string;
  customMotivation: string;
  onSelectMotivation: (v: string) => void;
  onCustomChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center min-h-screen p-6 pt-8">
      <ProgressBar step={4} />
      <h2
        className="text-2xl font-bold text-white mb-2 text-center"
        style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}
      >
        O que te trouxe à Dungeon?
      </h2>
      <p className="text-white/40 text-sm mb-8 text-center">Opcional — mas nos ajuda a personalizar sua jornada</p>

      <div className="w-full max-w-md space-y-2 mb-6">
        {MOTIVATIONS.map((m) => {
          const active = selectedMotivation === m && !customMotivation;
          return (
            <button
              key={m}
              onClick={() => {
                onSelectMotivation(m);
                onCustomChange("");
              }}
              className="w-full text-left px-4 py-3 rounded-lg transition-all duration-150 flex items-center gap-3"
              style={{
                background: active ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? "rgba(0,229,255,0.4)" : "rgba(255,255,255,0.06)"}`,
                color: active ? "#00e5ff" : "rgba(255,255,255,0.7)",
                fontFamily: "Rajdhani, sans-serif",
                letterSpacing: "0.5px",
              }}
            >
              <span
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{ borderColor: active ? "#00e5ff" : "rgba(255,255,255,0.2)" }}
              >
                {active && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
              </span>
              {m}
            </button>
          );
        })}

        <textarea
          value={customMotivation}
          onChange={(e) => {
            onCustomChange(e.target.value);
            if (e.target.value) onSelectMotivation("");
          }}
          placeholder="Ou escreva com suas próprias palavras..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg text-sm text-white/80 resize-none mt-2"
          style={{
            background: customMotivation ? "rgba(0,229,255,0.04)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${customMotivation ? "rgba(0,229,255,0.3)" : "rgba(255,255,255,0.08)"}`,
            outline: "none",
            fontFamily: "Exo 2, sans-serif",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(0,229,255,0.4)")}
          onBlur={(e) =>
            (e.target.style.borderColor = customMotivation
              ? "rgba(0,229,255,0.3)"
              : "rgba(255,255,255,0.08)")
          }
        />
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={false} />
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────

function Step5({
  characterName,
  selectedClass,
  onBack,
  onSeal,
  saving,
  sealDone,
}: {
  characterName: string;
  selectedClass: ClassDef | null;
  onBack: () => void;
  onSeal: () => void;
  saving: boolean;
  sealDone: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      {/* Decorative rules */}
      <div className="flex items-center gap-3 w-full max-w-sm mb-4">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,215,0,0.4))" }} />
        <span className="text-yellow-400 text-lg">◆</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,215,0,0.4))" }} />
      </div>

      <p
        className="text-yellow-400 text-xs font-bold tracking-[4px] uppercase mb-6"
        style={{ textShadow: "0 0 12px rgba(255,215,0,0.5)" }}
      >
        Juramento do Aventureiro
      </p>

      <div
        className="w-full max-w-sm p-6 rounded-xl mb-6"
        style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.2)" }}
      >
        <p
          className="text-white/90 text-base leading-relaxed mb-4"
          style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.5px" }}
        >
          Eu,{" "}
          <span className="text-yellow-400 font-bold">{characterName || "Aventureiro"}</span>, da classe{" "}
          <span style={{ color: selectedClass?.fillColor ?? "#00e5ff", fontWeight: "bold" }}>
            {selectedClass?.name ?? "Desconhecida"}
          </span>
          , juro explorar as masmorras do conhecimento com coragem e dedicação.
        </p>
        <p className="text-white/40 text-sm italic">Que minha jornada comece!</p>
      </div>

      <div className="flex items-center gap-3 w-full max-w-sm mb-8">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,215,0,0.4))" }} />
        <span className="text-yellow-400 text-lg">◆</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,215,0,0.4))" }} />
      </div>

      {sealDone ? (
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <CheckCircle size={48} className="text-cyan-400" />
          <p className="text-cyan-400 font-bold text-lg" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "3px" }}>
            JURAMENTO SELADO!
          </p>
        </div>
      ) : (
        <button onClick={onSeal} disabled={saving} className="btn-cyber-gold text-base py-3 px-8">
          <SwordIcon size={20} ringColor="#ffd700" fillColor="#ffd700" bgColor="transparent" />
          {saving ? "Selando..." : "Selar Juramento"}
          <SwordIcon size={20} ringColor="#ffd700" fillColor="#ffd700" bgColor="transparent" />
        </button>
      )}

      {!sealDone && (
        <button
          onClick={onBack}
          className="mt-4 text-white/30 hover:text-white/60 text-sm transition-colors"
        >
          ← Voltar
        </button>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step - 1) / 4) * 100);
  return (
    <div className="w-full max-w-sm mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/40 text-xs">Passo {step - 1} de 4</span>
        <span className="text-white/40 text-xs">{pct}%</span>
      </div>
      <div className="cyber-progress">
        <div className="cyber-progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <div className="flex gap-4 mt-2">
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-lg font-semibold transition-colors text-sm"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Voltar
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="btn-cyber"
      >
        Próximo
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  student: Student;
  onComplete: () => void;
}

export function OnboardingFlow({ student, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassDef | null>(null);
  const [selectedMotivation, setSelectedMotivation] = useState("");
  const [customMotivation, setCustomMotivation] = useState("");
  const [saving, setSaving] = useState(false);
  const [sealDone, setSealDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSeal = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const update: Record<string, unknown> = {
        character_name: characterName.trim(),
        character_class: selectedClass.id,
        motivation: customMotivation.trim() || selectedMotivation || null,
        [selectedClass.bonusKey]:
          ((student[selectedClass.bonusKey as keyof Student] as number) ?? 0) +
          selectedClass.bonusValue,
      };
      await supabaseStudent.from("students").update(update).eq("id", student.id);
      setSealDone(true);
      timerRef.current = setTimeout(onComplete, 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <AincradBackground scene="login" />
      <div className="relative z-10 w-full h-full overflow-y-auto">
        {step === 1 && <Step1 onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2
            characterName={characterName}
            onChange={setCharacterName}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <Step3
            selectedClass={selectedClass}
            onSelect={setSelectedClass}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <Step4
            selectedMotivation={selectedMotivation}
            customMotivation={customMotivation}
            onSelectMotivation={setSelectedMotivation}
            onCustomChange={setCustomMotivation}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <Step5
            characterName={characterName}
            selectedClass={selectedClass}
            onBack={() => setStep(4)}
            onSeal={handleSeal}
            saving={saving}
            sealDone={sealDone}
          />
        )}
      </div>
    </div>
  );
}
