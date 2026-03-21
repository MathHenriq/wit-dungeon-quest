import { Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  overview: Record<string, number> | null;
  riskScores: unknown[] | null;
  dailyActivity: unknown[] | null;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ overview, riskScores, dailyActivity }: Props) {
  const exportJSON = () => {
    const data = { overview, riskScores, dailyActivity, exportedAt: new Date().toISOString() };
    download("analytics.json", JSON.stringify(data, null, 2), "application/json");
  };

  const exportCSV = () => {
    if (!riskScores || riskScores.length === 0) return;
    const rows = riskScores as { student_name: string; risk_score: number; days_since_last_login: number; streak_current: number; logins_last_14_days: number; missions_last_14_days: number }[];
    const header = "Aluno,Score de Risco,Dias sem Login,Streak Atual,Logins 14d,Missões 14d";
    const lines = rows.map(r =>
      `${r.student_name},${r.risk_score},${r.days_since_last_login},${r.streak_current},${r.logins_last_14_days},${r.missions_last_14_days}`
    );
    download("alunos_risco.csv", [header, ...lines].join("\n"), "text/csv");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10 gap-2">
          <Download size={16} />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>Exportar CSV (alunos em risco)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>Exportar JSON (completo)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
