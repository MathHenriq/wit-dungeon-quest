import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Props {
  students: { id: string; name: string }[];
  loadStudentDNA: (id: string) => Promise<Record<string, number> | null>;
  isLoading: boolean;
}

const LABELS: Record<string, string> = {
  consistency: "Consistência",
  speed: "Velocidade",
  collaboration: "Colaboração",
  creativity: "Criatividade",
  leadership: "Liderança",
  resilience: "Resiliência",
};

export function StudentDNARadar({ students, loadStudentDNA, isLoading }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [dna, setDna] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (students.length > 0 && !selectedId) setSelectedId(students[0].id);
  }, [students]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    loadStudentDNA(selectedId).then((data) => {
      setDna(data);
      setLoading(false);
    });
  }, [selectedId]);

  const radarData = dna
    ? Object.entries(LABELS).map(([key, label]) => ({ subject: label, value: dna[key] ?? 0 }))
    : [];

  return (
    <div className="card-fantasy">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-display text-lg text-gold">🧬 DNA do Aventureiro</h3>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-44 bg-dungeon-dark border-gold/30 text-primary-foreground">
            <SelectValue placeholder="Selecionar aluno" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading || loading ? (
        <Skeleton className="h-56 w-full" />
      ) : !dna ? (
        <p className="text-muted-foreground text-sm text-center py-12">Selecione um aluno.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "8px", color: "#fff" }}
              formatter={(v: number) => [`${v}/100`, ""]}
            />
            <Radar
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
