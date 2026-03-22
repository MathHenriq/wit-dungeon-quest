import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalyticsFilters } from "@/hooks/useTeacherAnalytics";

interface Props {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
  classes: { id: string; name: string }[];
}

export function AnalyticsFilters({ filters, onChange, classes }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select
        value={String(filters.period)}
        onValueChange={(v) => onChange({ ...filters, period: Number(v) })}
      >
        <SelectTrigger className="w-36 bg-dungeon-dark border-gold/30 text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="14">Últimos 14 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.classId ?? "all"}
        onValueChange={(v) => onChange({ ...filters, classId: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44 bg-dungeon-dark border-gold/30 text-foreground">
          <SelectValue placeholder="Todas as turmas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as turmas</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
