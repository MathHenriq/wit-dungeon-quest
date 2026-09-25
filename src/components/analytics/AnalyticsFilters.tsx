import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalyticsFilters } from "@/hooks/useTeacherAnalytics";

interface Props {
  filters: AnalyticsFilters;
  onChange: (f: AnalyticsFilters) => void;
}

export function AnalyticsFilters({ filters, onChange }: Props) {
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
    </div>
  );
}
