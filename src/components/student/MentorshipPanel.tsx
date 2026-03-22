import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import { GameIcon } from "@/components/icons/GameIcon";
import type { Student, Mentorship } from "@/types";

interface MentorshipPanelProps {
  student: Student;
}

export function MentorshipPanel({ student }: MentorshipPanelProps) {
  const [mentorship, setMentorship] = useState<Mentorship | null>(null);
  const [mentorStudent, setMentorStudent] = useState<Student | null>(null);
  const [menteeStudent, setMenteeStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, [student.id]);

  async function load() {
    setIsLoading(true);
    // Look for any active mentorship involving this student
    const { data } = await supabaseStudent
      .from("mentorships")
      .select("*")
      .or(`mentor_id.eq.${student.id},mentee_id.eq.${student.id}`)
      .eq("status", "active")
      .maybeSingle();

    if (data) {
      const m = data as unknown as Mentorship;
      setMentorship(m);
      // Load mentor/mentee info
      const [{ data: mentorData }, { data: menteeData }] = await Promise.all([
        supabaseStudent.from("students").select("*").eq("id", m.mentor_id).maybeSingle(),
        supabaseStudent.from("students").select("*").eq("id", m.mentee_id).maybeSingle(),
      ]);
      setMentorStudent(mentorData as unknown as Student | null);
      setMenteeStudent(menteeData as unknown as Student | null);
    }
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="holo-panel flex justify-center py-6">
        <Loader2 size={22} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  const isMentor = mentorship?.mentor_id === student.id;
  const isMentee = mentorship?.mentee_id === student.id;

  // ── Mentor view ──
  if (isMentor && menteeStudent) {
    const menteeLevel = menteeStudent.level ?? 1;
    const completions = 0; // would need separate query for completions count
    const streak = menteeStudent.presencas_consecutivas ?? 0;

    return (
      <div className="holo-panel space-y-4">
        <div
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "Rajdhani, sans-serif", color: "#ffd700" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: "#ffd700" }} />
          Mentoria
        </div>

        <div
          className="rounded-lg px-4 py-3"
          style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)" }}
        >
          <p className="font-bold text-yellow-400 text-sm flex items-center gap-2" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px" }}>
            <GameIcon id="crown" size={16} ringColor="#ffd700" />
            Você é MENTOR!
          </p>
          <p className="text-xs text-white/40 mt-0.5">+10% XP bônus para suas atividades</p>
          {(student as Student & { mentor_xp?: number }).mentor_xp != null && (
            <p className="text-xs text-yellow-400/60 mt-1">
              Mentor XP: {(student as Student & { mentor_xp?: number }).mentor_xp}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Seu Aprendiz
          </p>
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.12)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}
              >
                <GameIcon id="user" size={20} ringColor="#00e5ff" />
              </div>
              <div>
                <p className="font-bold text-white text-sm" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                  {menteeStudent.character_name || menteeStudent.name}
                </p>
                <p className="text-xs text-white/40">
                  Nível {menteeLevel} · {menteeStudent.character_class || "Aventureiro"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <GameIcon id="flame" size={10} />
                Sequência: {streak}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Mentee view ──
  if (isMentee && mentorStudent) {
    return (
      <div className="holo-panel space-y-4">
        <div
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ fontFamily: "Rajdhani, sans-serif", color: "#00e5ff" }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45 bg-cyan-400" />
          Mentoria
        </div>

        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Meu Mentor
          </p>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: "rgba(0,229,255,0.05)", border: "1px solid rgba(0,229,255,0.15)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,215,0,0.1)", border: "2px solid rgba(255,215,0,0.3)" }}
            >
              <GameIcon id="crown" size={22} ringColor="#ffd700" />
            </div>
            <div>
              <p className="font-bold text-yellow-400 text-sm" style={{ fontFamily: "Rajdhani, sans-serif", letterSpacing: "1px" }}>
                {mentorStudent.character_name || mentorStudent.name}
              </p>
              <p className="text-xs text-white/40">
                Nível {mentorStudent.level} · {mentorStudent.character_class || "Aventureiro"}
              </p>
              <p className="text-xs text-cyan-400/60 mt-1 italic">
                "Pode contar comigo na jornada!"
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── No mentorship ──
  const MENTOR_LEVEL_REQ = 8;
  const currentLevel = student.level ?? 1;
  const pct = Math.min((currentLevel / MENTOR_LEVEL_REQ) * 100, 100);

  return (
    <div className="holo-panel space-y-4">
      <div
        className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white/40"
        style={{ fontFamily: "Rajdhani, sans-serif" }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-sm rotate-45" style={{ background: "rgba(255,255,255,0.2)" }} />
        Mentoria
      </div>

      <div
        className="rounded-xl p-4 text-center"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <GameIcon id="user" size={36} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm text-white/50 mb-1">Você ainda não tem mentor nem aprendiz.</p>
        <p className="text-xs text-white/30">Alunos de nível 8+ podem ser nomeados mentores pelo professor.</p>

        {currentLevel < MENTOR_LEVEL_REQ && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>Nível atual: {currentLevel}</span>
              <span>Meta: {MENTOR_LEVEL_REQ}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: "rgba(255,215,0,0.5)" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
