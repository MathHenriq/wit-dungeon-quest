import { useState } from "react";
import { Download, RefreshCw, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportData, type ExportOptions } from "@/lib/exportData";
import { toast } from "sonner";

interface Props {
  teacherId: string;
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
}

const DEFAULT_INCLUDE = {
  students: true,
  activity: true,
  missions: true,
  bosses: true,
  guilds: true,
  skills: true,
  inventory: false,
  chests: false,
};

const INCLUDE_LABELS: Record<keyof typeof DEFAULT_INCLUDE, string> = {
  students: "Alunos (dados gerais)",
  activity: "Atividade (analytics events)",
  missions: "Missões e desafios",
  bosses: "Boss battles (tentativas e scores)",
  guilds: "Guildas",
  skills: "Skill tree (progresso)",
  inventory: "Inventários",
  chests: "Baús (histórico)",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthAgoStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export function FullExport({ teacherId, classes, students }: Props) {
  const [include, setInclude] = useState(DEFAULT_INCLUDE);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [startDate, setStartDate] = useState(monthAgoStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [isExporting, setIsExporting] = useState(false);

  const toggleInclude = (key: keyof typeof DEFAULT_INCLUDE) => {
    setInclude(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    const anySelected = Object.values(include).some(Boolean);
    if (!anySelected) {
      toast.error("Selecione pelo menos uma categoria para exportar.");
      return;
    }
    setIsExporting(true);
    try {
      const opts: ExportOptions = {
        teacherId,
        startDate,
        endDate,
        classId: classId || undefined,
        studentId: studentId || undefined,
        format,
        include,
      };
      await exportData(opts);
      toast.success(format === 'json' ? "JSON exportado!" : "CSVs exportados! Verifique seus downloads.");
    } catch (err) {
      console.error("[FullExport]", err);
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-gold/20 bg-dungeon-dark/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold/50";

  return (
    <div className="card-fantasy">
      <h3 className="font-display text-base font-bold text-gold mb-4 flex items-center gap-2">
        <Download size={16} /> Export Completo de Dados
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Period */}
        <div className="space-y-1">
          <label className="text-xs text-foreground/50 uppercase tracking-wider">De</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-foreground/50 uppercase tracking-wider">Até</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
        </div>
        {/* Filters */}
        <div className="space-y-1">
          <label className="text-xs text-foreground/50 uppercase tracking-wider">Turma</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className={inputCls}>
            <option value="">Todas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-foreground/50 uppercase tracking-wider">Aluno</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
        {/* What to export */}
        <div>
          <p className="text-xs text-foreground/50 uppercase tracking-wider mb-2">O que exportar</p>
          <div className="space-y-2">
            {(Object.keys(DEFAULT_INCLUDE) as (keyof typeof DEFAULT_INCLUDE)[]).map(key => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={include[key]}
                  onChange={() => toggleInclude(key)}
                  className="w-4 h-4 accent-gold rounded"
                />
                <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                  {INCLUDE_LABELS[key]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <p className="text-xs text-foreground/50 uppercase tracking-wider mb-2">Formato</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all" style={{ borderColor: format === 'csv' ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)', background: format === 'csv' ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
              <input type="radio" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="accent-gold" />
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <FileSpreadsheet size={14} className="text-green-400" /> CSV (planilha por categoria)
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">Abre no Excel, Google Sheets. UTF-8 com acentos.</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all" style={{ borderColor: format === 'json' ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)', background: format === 'json' ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
              <input type="radio" value="json" checked={format === 'json'} onChange={() => setFormat('json')} className="accent-gold" />
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <FileJson size={14} className="text-blue-400" /> JSON (backup completo)
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">Estrutura completa — útil para backup ou importação.</p>
              </div>
            </label>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full mt-4 btn-fantasy gap-2"
          >
            {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
