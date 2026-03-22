import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import { toast } from "sonner";
import type { PetType, StudentPet } from "@/types";

// ─── Pet Stage SVGs ───────────────────────────────────────────────────────────

function PetStageSVG({ stage, color = "#00e5ff" }: { stage: number; color?: string }) {
  if (stage === 1) {
    // Egg
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}>
        <circle cx="40" cy="40" r="38" fill={`${color}10`} stroke={`${color}30`} strokeWidth="1" />
        <ellipse cx="40" cy="44" rx="18" ry="22" fill={color} opacity="0.85" />
        <ellipse cx="34" cy="36" rx="4" ry="5" fill="white" opacity="0.25" />
      </svg>
    );
  }
  if (stage === 2) {
    // Juvenile with small wings
    return (
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: `drop-shadow(0 0 12px ${color}66)`, animation: "glow-breathe 3s ease-in-out infinite" }}>
        <circle cx="40" cy="40" r="38" fill={`${color}10`} stroke={`${color}30`} strokeWidth="1" />
        {/* Body */}
        <ellipse cx="40" cy="46" rx="12" ry="15" fill={color} opacity="0.9" />
        {/* Head */}
        <circle cx="40" cy="29" r="9" fill={color} opacity="0.9" />
        {/* Eyes */}
        <circle cx="37" cy="27" r="2" fill="#0a0e1a" />
        <circle cx="43" cy="27" r="2" fill="#0a0e1a" />
        {/* Small wings */}
        <path d="M28 40 Q18 32 22 44 Z" fill={color} opacity="0.7" />
        <path d="M52 40 Q62 32 58 44 Z" fill={color} opacity="0.7" />
      </svg>
    );
  }
  // Stage 3: Full adult with spread wings
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ filter: `drop-shadow(0 0 16px ${color}88)`, animation: "glow-breathe 2s ease-in-out infinite" }}>
      <circle cx="40" cy="40" r="38" fill={`${color}15`} stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Large wings */}
      <path d="M28 38 Q8 20 12 50 Q18 54 28 48 Z" fill={color} opacity="0.8" />
      <path d="M52 38 Q72 20 68 50 Q62 54 52 48 Z" fill={color} opacity="0.8" />
      {/* Body */}
      <ellipse cx="40" cy="50" rx="11" ry="13" fill={color} opacity="0.95" />
      {/* Head */}
      <circle cx="40" cy="32" r="10" fill={color} opacity="0.95" />
      {/* Crown / crest */}
      <path d="M34 22 L37 15 L40 20 L43 13 L46 22 Z" fill={color} opacity="0.9" />
      {/* Eyes */}
      <circle cx="36.5" cy="30" r="2.5" fill="#0a0e1a" />
      <circle cx="43.5" cy="30" r="2.5" fill="#0a0e1a" />
      <circle cx="36.5" cy="30" r="1" fill="white" opacity="0.6" />
      <circle cx="43.5" cy="30" r="1" fill="white" opacity="0.6" />
      {/* Tail */}
      <path d="M36 62 Q30 74 38 72 Q40 78 42 72 Q50 74 44 62 Z" fill={color} opacity="0.75" />
    </svg>
  );
}

function bonusLabel(pet: PetType) {
  if (!pet.bonus_type || !pet.bonus_value) return null;
  if (pet.bonus_type === "xp") return `+${pet.bonus_value}% XP`;
  if (pet.bonus_type === "coins") return `+${pet.bonus_value} Moedas`;
  if (pet.bonus_type === "streak_protection") return "Proteção de Sequência";
  return null;
}

const STAGE_COLORS = ["#00e5ff", "#ffd700", "#ff6b35"];

// ─── PetPanel ─────────────────────────────────────────────────────────────────

interface PetPanelProps {
  studentId: string;
  teacherId: string;
}

export function PetPanel({ studentId, teacherId }: PetPanelProps) {
  const [myPet, setMyPet] = useState<StudentPet | null>(null);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [evolved, setEvolved] = useState(false);

  useEffect(() => {
    load();
  }, [studentId, teacherId]);

  async function load() {
    setIsLoading(true);
    const [{ data: petData }, { data: typesData }] = await Promise.all([
      supabaseStudent
        .from("student_pets")
        .select("*, pet_type:pet_types(*)")
        .eq("student_id", studentId)
        .eq("is_active", true)
        .maybeSingle(),
      supabaseStudent
        .from("pet_types")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("name"),
    ]);
    setMyPet(petData as unknown as StudentPet | null);
    setPetTypes((typesData ?? []) as unknown as PetType[]);
    setIsLoading(false);
  }

  async function adoptPet(petType: PetType) {
    setAdopting(petType.id);
    try {
      const { error } = await supabaseStudent.from("student_pets").insert({
        student_id: studentId,
        pet_type_id: petType.id,
        name: petType.name,
        xp: 0,
        current_stage: 1,
        is_active: true,
      } as never);
      if (error) {
        toast.error("Erro ao adotar pet: " + error.message);
        return;
      }
      // Give 3 XP for first-time login/adopt
      void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: studentId, p_xp: 3 });
      toast.success(`${petType.name} adotado!`);
      await load();
    } finally {
      setAdopting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="holo-panel flex justify-center py-8">
        <Loader2 size={28} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  if (myPet && myPet.pet_type) {
    const pt = myPet.pet_type;
    const nextThreshold = myPet.current_stage === 1 ? pt.evolution_threshold_2 : pt.evolution_threshold_3;
    const pct = myPet.current_stage >= 3 ? 100 : Math.min((myPet.xp / nextThreshold) * 100, 100);
    const stageName = myPet.current_stage === 1 ? pt.stage1_name : myPet.current_stage === 2 ? pt.stage2_name : pt.stage3_name;
    const color = STAGE_COLORS[myPet.current_stage - 1];

    return (
      <div className="holo-panel space-y-4">
        <div
          className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2 mb-2"
          style={{ fontFamily: "Rajdhani, sans-serif" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: color }} />
          Meu Pet
        </div>

        {evolved && (
          <div
            className="text-center py-3 rounded-lg font-bold text-lg animate-fade-in-up"
            style={{ background: `${color}20`, border: `1px solid ${color}50`, color, fontFamily: "Rajdhani, sans-serif", letterSpacing: "2px" }}
          >
            EVOLUCAO!
          </div>
        )}

        <div
          className="rounded-xl p-5 text-center"
          style={{ background: `${color}08`, border: `1px solid ${color}20` }}
        >
          <div className="flex justify-center mb-3">
            <PetStageSVG stage={myPet.current_stage} color={color} />
          </div>

          <p className="font-bold text-lg mb-1" style={{ color, fontFamily: "Rajdhani, sans-serif", letterSpacing: "2px" }}>
            {myPet.name}
          </p>
          <p className="text-sm text-white/50 mb-3">
            {pt.name} — Estágio {myPet.current_stage}: {stageName}
          </p>

          {/* XP Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>XP: {myPet.xp}</span>
              <span>{myPet.current_stage >= 3 ? "Máximo" : nextThreshold}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
              />
            </div>
          </div>

          {myPet.current_stage < 3 && (
            <p className="text-xs text-white/40 mt-2">
              Próxima evolução em {nextThreshold - myPet.xp} XP
            </p>
          )}

          {bonusLabel(pt) && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
              <GameIcon id="star" size={12} />
              {bonusLabel(pt)} ativo
            </div>
          )}
        </div>
      </div>
    );
  }

  // No pet — show adoption grid
  return (
    <div className="holo-panel space-y-4">
      <div
        className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45 bg-cyan-400" />
        Pets Disponíveis
      </div>

      {petTypes.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">
          Seu professor ainda não criou tipos de pet.
        </p>
      ) : (
        <>
          <p className="text-white/50 text-sm text-center">Escolha um companheiro de jornada!</p>
          <div className="grid grid-cols-2 gap-3">
            {petTypes.map((pt) => {
              const bonus = bonusLabel(pt);
              return (
                <div
                  key={pt.id}
                  className="rounded-xl p-4 flex flex-col items-center text-center gap-3"
                  style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}
                >
                  <PetStageSVG stage={1} color="#00e5ff" />
                  <div>
                    <p className="font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px" }}>
                      {pt.name}
                    </p>
                    {pt.description && (
                      <p className="text-xs text-white/40 mt-0.5">{pt.description}</p>
                    )}
                    {bonus && (
                      <p className="text-xs text-cyan-400 mt-1 flex items-center justify-center gap-1">
                        <GameIcon id="star" size={10} /> {bonus}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => adoptPet(pt)}
                    disabled={adopting === pt.id}
                    className="btn-cyber text-xs px-3 py-1.5 w-full justify-center"
                  >
                    {adopting === pt.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Adotar
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
