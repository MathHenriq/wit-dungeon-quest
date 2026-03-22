import { useState, useEffect, useCallback } from "react";
import { supabaseStudent } from "@/integrations/supabase/studentClient";
import type { BossBattle, BossQuestion, BossAttempt } from "@/types";

interface Answer {
  question_id: string;
  answer: string;
  correct: boolean;
  damage_dealt: number;
}

export function useBossBattle(studentId: string) {
  const [activeBosses, setActiveBosses] = useState<BossBattle[]>([]);
  const [myAttempts, setMyAttempts] = useState<BossAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBosses = useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      // Get student class info first
      const { data: studentData } = await supabaseStudent
        .from("students")
        .select("class_id, teacher_id")
        .eq("id", studentId)
        .single();

      if (!studentData) return;

      const classFilter = studentData.class_id
        ? `class_id.is.null,class_id.eq.${studentData.class_id}`
        : `class_id.is.null`;

      const { data: bossData } = await supabaseStudent
        .from("boss_battles")
        .select("*")
        .eq("teacher_id", studentData.teacher_id)
        .eq("is_active", true)
        .or(classFilter)
        .order("created_at", { ascending: false });

      const { data: attemptsData } = await supabaseStudent
        .from("boss_attempts")
        .select("*")
        .eq("student_id", studentId);

      setActiveBosses((bossData || []) as BossBattle[]);
      setMyAttempts((attemptsData || []) as BossAttempt[]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadBosses();
  }, [loadBosses]);

  const getBossAttempt = (bossId: string) =>
    myAttempts.find(a => a.boss_id === bossId);

  return { activeBosses, myAttempts, isLoading, loadBosses, getBossAttempt };
}

// Separate hook for the battle itself
export function useBattleSession(bossId: string, studentId: string) {
  const [boss, setBoss] = useState<BossBattle | null>(null);
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [totalDamage, setTotalDamage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [lastResult, setLastResult] = useState<'hit' | 'miss' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(30);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data: bossData } = await supabaseStudent
        .from("boss_battles")
        .select("*")
        .eq("id", bossId)
        .single();

      const { data: questionsData } = await supabaseStudent
        .from("boss_questions")
        .select("*")
        .eq("boss_id", bossId)
        .order("sort_order");

      setBoss(bossData as BossBattle);
      setQuestions((questionsData || []) as BossQuestion[]);

      if (bossData?.time_limit_minutes) {
        setTimeLeft(bossData.time_limit_minutes * 60);
      }
      setIsLoading(false);
    };
    load();
  }, [bossId]);

  // Global timer countdown
  useEffect(() => {
    if (timeLeft === null || isFinished) return;
    if (timeLeft <= 0) {
      finishBattle(answers, totalDamage, false);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, isFinished]);

  // Per-question timer: reset to 30 on each new question
  useEffect(() => {
    if (isFinished) return;
    setQuestionTimeLeft(30);
  }, [currentIndex, isFinished]);

  // Per-question timer countdown (pauses while showing hit/miss result)
  useEffect(() => {
    if (isFinished || lastResult !== null) return;
    if (questionTimeLeft <= 0) {
      submitAnswer('__timeout__');
      return;
    }
    const t = setTimeout(() => setQuestionTimeLeft(q => q - 1), 1000);
    return () => clearTimeout(t);
  }, [questionTimeLeft, isFinished, lastResult, submitAnswer]);

  const submitAnswer = useCallback((answer: string) => {
    if (!boss || isFinished || lastResult !== null) return;
    const question = questions[currentIndex];
    if (!question) return;

    const correct = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
    const damage = correct ? question.damage : 0;
    const newAnswer: Answer = { question_id: question.id, answer, correct, damage_dealt: damage };
    const newAnswers = [...answers, newAnswer];
    const newDamage = totalDamage + damage;

    setLastResult(correct ? 'hit' : 'miss');
    setAnswers(newAnswers);
    setTotalDamage(newDamage);

    setTimeout(() => {
      setLastResult(null);
      if (currentIndex + 1 >= questions.length) {
        finishBattle(newAnswers, newDamage, true);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1100);
  }, [boss, isFinished, lastResult, questions, currentIndex, answers, totalDamage]);

  const finishBattle = useCallback(async (finalAnswers: Answer[], finalDamage: number, _allAnswered: boolean) => {
    if (!boss || isSaving) return;
    setIsSaving(true);
    const defeated = finalDamage >= boss.boss_hp;
    setIsDefeated(defeated);
    setIsFinished(true);

    try {
      await supabaseStudent.from("boss_attempts").insert({
        boss_id: bossId,
        student_id: studentId,
        answers: finalAnswers as unknown as never,
        total_damage: finalDamage,
        boss_defeated: defeated,
        coins_earned: defeated ? boss.reward_coins : 0,
        xp_earned: defeated ? boss.reward_xp : 0,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      });

      if (defeated) {
        await supabaseStudent.rpc("give_boss_rewards" as never, {
          p_student_id: studentId,
          p_coins: boss.reward_coins,
          p_xp: boss.reward_xp,
        });
        // Give pet XP for defeating boss (+20)
        void supabaseStudent.rpc("give_pet_xp" as never, { p_student_id: studentId, p_xp: 20 });
      }
    } catch (err) {
      console.error("[BattleSession] save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [boss, bossId, studentId, isSaving]);

  const currentHp = Math.max(0, (boss?.boss_hp ?? 0) - totalDamage);
  const hpPct = boss ? (currentHp / boss.boss_hp) * 100 : 100;

  return {
    boss, questions, currentIndex, totalDamage, isFinished, isDefeated,
    lastResult, isLoading, isSaving, timeLeft, questionTimeLeft, currentHp, hpPct, submitAnswer,
  };
}
