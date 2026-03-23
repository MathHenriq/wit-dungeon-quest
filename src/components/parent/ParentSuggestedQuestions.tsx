import { MessageCircle } from "lucide-react";

interface Props {
  questions: string[];
}

export function ParentSuggestedQuestions({ questions }: Props) {
  if (questions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
        <MessageCircle size={18} className="text-indigo-500" />
        Perguntas para fazer ao seu filho
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Baseadas no que ele aprendeu esta semana. Tente fazer uma por dia!
      </p>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: '#eef2ff', color: '#6366f1' }}
            >
              {i + 1}
            </span>
            <p className="text-sm text-slate-700 italic leading-relaxed">{q}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
