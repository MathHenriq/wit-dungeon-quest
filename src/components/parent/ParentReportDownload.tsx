import { useState } from "react";
import { FileText, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  studentId: string;
  studentName: string;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const end = new Date(now);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function ParentReportDownload({ studentId, studentName }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { start, end } = getWeekRange();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('generate_parent_report', {
        p_student_id: studentId,
        p_period_start: start,
        p_period_end: end,
        p_type: 'weekly',
      });
      if (error) throw error;
      const url = `${window.location.origin}/relatorio/${data}`;
      setReportUrl(url);
      toast.success('Relatório gerado com sucesso!');
    } catch (err) {
      console.error('[ParentReportDownload]', err);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!reportUrl) return;
    await navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copiado!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
        <FileText size={18} className="text-indigo-500" />
        Relatório Semanal
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Gere um relatório desta semana com link compartilhável.
      </p>

      {!reportUrl ? (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: '#6366f1', color: 'white' }}
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {isGenerating ? 'Gerando...' : `Gerar relatório de ${studentName}`}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-xs text-slate-500 flex-1 truncate">{reportUrl}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-all"
              style={{ background: copied ? '#dcfce7' : '#eff6ff', color: copied ? '#16a34a' : '#3b82f6' }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <button
            onClick={() => { setReportUrl(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 w-full text-center"
          >
            Gerar outro relatório
          </button>
        </div>
      )}
    </div>
  );
}
