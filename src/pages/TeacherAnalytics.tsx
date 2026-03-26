import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTeacherAnalytics } from "@/hooks/useTeacherAnalytics";
import { AnalyticsOverview } from "@/components/analytics/AnalyticsOverview";
import { DailyActivityChart } from "@/components/analytics/DailyActivityChart";
import { EngagementHeatmap } from "@/components/analytics/EngagementHeatmap";
import { ClassComparisonChart } from "@/components/analytics/ClassComparisonChart";
import { StudentRiskPanel } from "@/components/analytics/StudentRiskPanel";
import { StudentDNARadar } from "@/components/analytics/StudentDNARadar";
import { AchievementTimeline } from "@/components/analytics/AchievementTimeline";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { ExportButton } from "@/components/analytics/ExportButton";
import { FullExport } from "@/components/analytics/FullExport";
import { WeeklySummary } from "@/components/analytics/WeeklySummary";
import { ArrowLeft, BarChart3, RefreshCw, Sword, Shield, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TeacherAnalytics() {
  const { teacher, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const {
    filters, setFilters,
    overview, heatmap, dailyActivity, riskScores, classComparison,
    isLoading, loadStudentDNA, seedDemo, clearDemo, refresh,
  } = useTeacherAnalytics(teacher?.id);

  useEffect(() => {
    if (!authLoading && !teacher) navigate("/professor/login");
  }, [authLoading, teacher, navigate]);

  useEffect(() => {
    if (!teacher) return;
    supabase.from("classes").select("id, name").eq("teacher_id", teacher.id).order("name")
      .then(({ data }) => setClasses(data ?? []));
    supabase.from("students").select("id, name").eq("teacher_id", teacher.id).eq("status", "active").order("name")
      .then(({ data }) => setStudents(data ?? []));
  }, [teacher]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemo();
      toast.success("500 eventos de demonstração gerados!");
    } catch {
      toast.error("Erro ao gerar dados de demonstração.");
    } finally {
      setSeeding(false);
    }
  };

  const handleClearDemo = async () => {
    setClearing(true);
    try {
      await clearDemo();
      toast.success("Dados de demonstração removidos.");
    } catch {
      toast.error("Erro ao remover dados de demonstração.");
    } finally {
      setClearing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-dungeon-dark text-foreground py-4 px-4 md:px-6 shadow-lg border-b border-gold/20">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/professor")}
              className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Sword className="text-gold" size={20} />
                <Shield className="text-gold" size={20} />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-gold flex items-center gap-2">
                  <BarChart3 size={20} />
                  Dungeon Analytics
                </h1>
                <p className="text-xs text-foreground/70">{teacher?.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AnalyticsFilters filters={filters} onChange={setFilters} classes={classes} />
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            >
              <RefreshCw size={14} />
              Atualizar
            </Button>
            <ExportButton overview={overview} riskScores={riskScores} dailyActivity={dailyActivity} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Weekly Summary */}
        {teacher && (
          <WeeklySummary teacherId={teacher.id} classId={filters.classId} />
        )}

        {/* KPI Overview */}
        <AnalyticsOverview overview={overview} isLoading={isLoading} />

        {/* Daily Activity */}
        <DailyActivityChart
          data={dailyActivity}
          isLoading={isLoading}
          classes={classes}
          onClassChange={(classId) => setFilters((f) => ({ ...f, classId }))}
        />

        {/* Heatmap + Class Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EngagementHeatmap data={heatmap} isLoading={isLoading} />
          <ClassComparisonChart data={classComparison} isLoading={isLoading} />
        </div>

        {/* Risk Panel */}
        <StudentRiskPanel data={riskScores} isLoading={isLoading} classes={classes} />

        {/* DNA Radar + Achievement Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StudentDNARadar students={students} loadStudentDNA={loadStudentDNA} isLoading={isLoading} />
          <AchievementTimeline teacherId={teacher?.id ?? ""} classId={filters.classId} />
        </div>

        {/* Demo Seed */}
        <div className="card-fantasy border-dashed border-gold/20 text-center py-6">
          <Sparkles className="mx-auto text-gold/50 mb-2" size={28} />
          <p className="text-sm text-muted-foreground mb-3">
            Sem dados ainda? Gere eventos de demonstração para visualizar o dashboard funcionando.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDemo}
              disabled={seeding || clearing}
              className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            >
              {seeding ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {seeding ? "Gerando..." : "Gerar dados de demonstração (~500 eventos)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDemo}
              disabled={seeding || clearing}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
            >
              {clearing ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {clearing ? "Removendo..." : "Limpar dados de demonstração"}
            </Button>
          </div>
        </div>

        {/* Full Export */}
        <div className="px-4 pb-8">
          {teacher && (
            <FullExport teacherId={teacher.id} classes={classes} students={students} />
          )}
        </div>
      </main>
    </div>
  );
}
