import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, Printer, Loader2, CheckCircle, Trophy, Lightbulb, MessageCircle, Flame,
} from "lucide-react";

interface ReportStudent {
  name: string;
  character_name: string | null;
  level: number;
  streak_current: number;
  presencas_consecutivas: number;
  class_name: string;
  character_class: string | null;
}

interface ReportData {
  student: ReportStudent;
  topics_learned: { name: string; description: string }[];
  missions_completed: { title: string; description: string }[];
  bosses_faced: { name: string; title: string; defeated: boolean; score: number }[];
  login_count: number;
}

interface Report {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  report_data: ReportData;
  created_at: string;
}

function generateQuestions(data: ReportData): string[] {
  const q: string[] = [];
  data.topics_learned?.forEach(t => {
    q.push(`"O que é ${t.name}? Pode me explicar de um jeito simples?"`);
    if (t.description) q.push(`"Pra que serve ${t.name} no mundo real?"`);
  });
  data.bosses_faced?.filter(b => b.defeated).forEach(b => {
    q.push(`"O que o desafio '${b.title || b.name}' testava? O que você precisou saber?"`);
  });
  data.bosses_faced?.filter(b => !b.defeated).forEach(b => {
    q.push(`"Vi que o desafio '${b.title || b.name}' foi difícil. O que faltou pra vencer?"`);
  });
  data.missions_completed?.forEach(m => {
    q.push(`"Pode me mostrar algo que fez na missão '${m.title}'?"`);
  });
  if (q.length < 2) {
    q.push('"O que você está aprendendo na aula de IA?"');
    q.push('"Tem algo no sistema que está achando difícil?"');
    q.push('"O que você mais gosta de fazer nas aulas?"');
  }
  return q.slice(0, 5);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ParentReport() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!reportId) { setNotFound(true); setIsLoading(false); return; }
    supabase
      .from('parent_reports')
      .select('*')
      .eq('id', reportId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setReport(data as unknown as Report);
        setIsLoading(false);
      });
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 text-lg font-semibold mb-2">Relatório não encontrado</p>
          <p className="text-slate-400 text-sm">O link pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  const data = report.report_data;
  const questions = generateQuestions(data);
  const typeLabel = report.report_type === 'monthly' ? 'Mensal' : 'Semanal';

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-page { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-page">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">WIT Dungeon Quest</p>
                <h1 className="text-xl font-bold text-slate-800">Relatório {typeLabel}</h1>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              <Printer size={14} /> Imprimir
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Período: <span className="font-medium text-slate-700">{fmt(report.period_start)} — {fmt(report.period_end)}</span>
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {data.student?.character_name || data.student?.name}
                </h2>
                {data.student?.character_name && (
                  <p className="text-sm text-slate-500">{data.student.name}</p>
                )}
                {data.student?.class_name && (
                  <p className="text-sm text-slate-400">Turma: {data.student.class_name}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl font-bold text-indigo-600">Nível {data.student?.level}</p>
                <div className="flex items-center gap-1 justify-end text-xs text-orange-500 mt-0.5">
                  <Flame size={12} /> {data.student?.streak_current} dias seguidos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Topics */}
        {(data.topics_learned?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-page">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-green-500" />
              O que seu filho aprendeu
            </h3>
            <div className="space-y-2">
              {data.topics_learned.map((t, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-green-50">
                  <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t.name}</p>
                    {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missions */}
        {(data.missions_completed?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-page">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-blue-500" />
              Missões completadas
            </h3>
            <div className="space-y-2">
              {data.missions_completed.map((m, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-blue-50">
                  <CheckCircle size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{m.title}</p>
                    {m.description && <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bosses */}
        {(data.bosses_faced?.length ?? 0) > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-page">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Trophy size={18} className="text-purple-500" />
              Desafios enfrentados
            </h3>
            <div className="space-y-2">
              {data.bosses_faced.map((b, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: b.defeated ? '#f5f3ff' : '#fff7ed' }}>
                  <Trophy size={15} className={b.defeated ? "text-purple-500" : "text-orange-400"} />
                  <p className="text-sm font-medium text-slate-700 flex-1">{b.title || b.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${b.defeated ? 'text-purple-600 bg-purple-100' : 'text-orange-600 bg-orange-100'}`}>
                    {b.defeated ? `Derrotado (${b.score}%)` : `Em progresso (${b.score}%)`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {questions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-page">
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
              <MessageCircle size={18} className="text-indigo-500" />
              Perguntas para conversar com seu filho
            </h3>
            <p className="text-xs text-slate-400 mb-4">Tente fazer uma por dia!</p>
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: '#eef2ff', color: '#6366f1' }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 italic leading-relaxed">{q}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 print-page">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{data.login_count}</p>
              <p className="text-xs text-slate-400">Acessos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{data.missions_completed?.length ?? 0}</p>
              <p className="text-xs text-slate-400">Missões</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{data.bosses_faced?.filter(b => b.defeated).length ?? 0}</p>
              <p className="text-xs text-slate-400">Bosses derrubados</p>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-300 py-4">
          Gerado automaticamente pelo WIT Dungeon Quest
        </div>
      </div>
    </div>
  );
}
