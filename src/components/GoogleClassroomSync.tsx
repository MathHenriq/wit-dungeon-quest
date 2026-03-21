import { useState, useCallback } from "react";
import { useGoogleClassroom } from "@/hooks/useGoogleClassroom";
import type { ClassroomCourse, ClassroomCoursework, ActivityLink, ImportResult, SyncResult } from "@/hooks/useGoogleClassroom";
import { toast } from "sonner";
import {
  GraduationCap, RefreshCw, CheckCircle, Download, AlertTriangle,
  Users, BookOpen, Loader2, ExternalLink, ChevronRight, ChevronDown,
  Zap, Unlink, Trophy, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  teacherId: string;
  onDataChanged: () => void;
}

interface ImportProgress {
  step: "creating" | "students" | "done";
  result?: ImportResult;
}

function ClassroomIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
      <rect width="48" height="48" rx="8" fill="#0F9D58" />
      <path d="M24 14a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm24 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM24 26c4.418 0 8 1.79 8 4v2H16v-2c0-2.21 3.582-4 8-4zm-12 3c2.21 0 4 .895 4 2v1H8v-1c0-1.105 1.79-2 4-2zm24 0c2.21 0 4 .895 4 2v1h-8v-1c0-1.105 1.79-2 4-2z" fill="white" />
    </svg>
  );
}

function NotConnected({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center py-10 max-w-md mx-auto">
      <div className="flex justify-center mb-4"><ClassroomIcon /></div>
      <h3 className="font-display text-xl text-gold mb-2">Google Classroom</h3>
      <p className="text-muted-foreground text-sm mb-6">
        Conecte sua conta do Google Classroom para importar turmas, alunos e sincronizar atividades automaticamente.
      </p>
      <Button onClick={onConnect} className="btn-fantasy gap-2 mx-auto">
        <ExternalLink size={16} />
        Conectar Google Classroom
      </Button>
      <div className="mt-6 p-3 rounded-lg bg-white/5 text-xs text-muted-foreground text-left space-y-1">
        <p className="font-semibold text-foreground mb-2">Permissões solicitadas:</p>
        <p>• Ver suas turmas do Google Classroom</p>
        <p>• Ver a lista de alunos de cada turma</p>
        <p>• Ver entregas dos alunos nas atividades</p>
      </div>
    </div>
  );
}

function ImportProgressView({ progress }: { progress: ImportProgress }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="space-y-3 max-w-xs mx-auto text-sm">
        <div className="flex items-center gap-3">
          {progress.step === "creating"
            ? <Loader2 size={18} className="animate-spin text-gold" />
            : <CheckCircle size={18} className="text-emerald-400" />}
          <span className={progress.step === "creating" ? "text-gold" : "text-emerald-400"}>
            Criando turma no WIT Dungeon...
          </span>
        </div>
        <div className="flex items-center gap-3">
          {progress.step === "creating"
            ? <div className="w-[18px] h-[18px] rounded-full border border-white/20" />
            : progress.step === "students"
            ? <Loader2 size={18} className="animate-spin text-gold" />
            : <CheckCircle size={18} className="text-emerald-400" />}
          <span className={
            progress.step === "creating" ? "text-muted-foreground"
            : progress.step === "students" ? "text-gold"
            : "text-emerald-400"
          }>
            Importando alunos...
          </span>
        </div>
        {progress.step === "done" && progress.result && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left">
            <p className="font-display text-emerald-400 text-base mb-1">Importação concluída!</p>
            <p className="text-muted-foreground">
              <span className="text-foreground font-semibold">{progress.result.studentsImported}</span> alunos adicionados à turma{" "}
              <span className="text-foreground font-semibold">"{progress.result.className}"</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const WORK_TYPE_LABEL: Record<string, string> = {
  ASSIGNMENT: "Tarefa",
  SHORT_ANSWER_QUESTION: "Pergunta",
  MULTIPLE_CHOICE_QUESTION: "Múltipla escolha",
};

function ActivityRow({
  coursework,
  link,
  isSyncing,
  onLink,
  onUnlink,
  onSync,
}: {
  coursework: ClassroomCoursework;
  link: ActivityLink | undefined;
  isSyncing: boolean;
  onLink: (cw: ClassroomCoursework, coins: number) => void;
  onUnlink: (linkId: string) => void;
  onSync: (link: ActivityLink) => void;
}) {
  const [coins, setCoins] = useState(link?.reward_coins ?? 15);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-border/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{coursework.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground/70 bg-white/5 px-1.5 py-0.5 rounded">
            {WORK_TYPE_LABEL[coursework.workType] ?? coursework.workType}
          </span>
          {link?.last_synced_at && (
            <span className="text-xs text-muted-foreground/50">
              Sync: {new Date(link.last_synced_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>

      {link ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs bg-gold/15 text-gold px-2 py-1 rounded-full font-semibold">
            {link.reward_coins} moedas
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={isSyncing}
            onClick={() => onSync(link)}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1 h-7 px-2 text-xs"
          >
            {isSyncing ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
            Sync
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUnlink(link.id)}
            className="text-muted-foreground hover:text-destructive h-7 px-2"
            title="Desvincular"
          >
            <Unlink size={11} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">moedas</span>
            <input
              type="number"
              value={coins}
              min={1}
              max={999}
              onChange={e => setCoins(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 px-1 py-0.5 rounded border border-border bg-background text-xs text-center"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onLink(coursework, coins)}
            className="border-gold/30 text-gold hover:bg-gold/10 gap-1 h-7 px-2 text-xs"
          >
            <Zap size={11} />
            Vincular
          </Button>
        </div>
      )}
    </div>
  );
}

function CourseCard({
  course,
  isImported,
  onImport,
  isDisabled,
  linkedActivities,
  fetchCoursework,
  onLinkActivity,
  onUnlinkActivity,
  onSyncActivity,
  syncingLinkId,
}: {
  course: ClassroomCourse;
  isImported: boolean;
  onImport: (course: ClassroomCourse) => void;
  isDisabled: boolean;
  linkedActivities: ActivityLink[];
  fetchCoursework: (courseId: string) => Promise<ClassroomCoursework[]>;
  onLinkActivity: (course: ClassroomCourse, cw: ClassroomCoursework, coins: number) => void;
  onUnlinkActivity: (linkId: string) => void;
  onSyncActivity: (link: ActivityLink) => void;
  syncingLinkId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [coursework, setCoursework] = useState<ClassroomCoursework[] | null>(null);
  const [isLoadingCw, setIsLoadingCw] = useState(false);

  const courseLinks = linkedActivities.filter(l => l.course_id === course.id);

  const handleExpand = async () => {
    if (!expanded && coursework === null) {
      setIsLoadingCw(true);
      try {
        const cw = await fetchCoursework(course.id);
        setCoursework(cw);
      } catch {
        toast.error("Erro ao carregar atividades.");
      } finally {
        setIsLoadingCw(false);
      }
    }
    setExpanded(v => !v);
  };

  return (
    <div className="rounded-xl bg-white/5 border border-border overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
          <BookOpen size={20} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{course.name}</p>
          {course.section && (
            <p className="text-xs text-muted-foreground">{course.section}</p>
          )}
          {courseLinks.length > 0 && (
            <p className="text-xs text-gold/70 mt-0.5">
              <Trophy size={10} className="inline mr-1" />
              {courseLinks.length} atividade{courseLinks.length !== 1 ? "s" : ""} vinculada{courseLinks.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isImported ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <CheckCircle size={14} />
              <span>Importado</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isDisabled}
              onClick={() => onImport(course)}
              className="border-gold/30 text-gold hover:bg-gold/10 gap-1"
            >
              <Download size={14} />
              Importar
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExpand}
            className="text-muted-foreground hover:text-foreground gap-1 px-2"
            title="Ver atividades"
          >
            {isLoadingCw
              ? <Loader2 size={14} className="animate-spin" />
              : expanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-border/40">
          <p className="text-xs text-muted-foreground pt-3 pb-1 font-semibold">
            Atividades publicadas
          </p>
          {isLoadingCw ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : coursework && coursework.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-4">
              Nenhuma atividade publicada nesta turma.
            </p>
          ) : coursework ? (
            <div className="space-y-2">
              {coursework.map(cw => (
                <ActivityRow
                  key={cw.id}
                  coursework={cw}
                  link={linkedActivities.find(l => l.coursework_id === cw.id)}
                  isSyncing={syncingLinkId === linkedActivities.find(l => l.coursework_id === cw.id)?.id}
                  onLink={(c, coins) => onLinkActivity(course, c, coins)}
                  onUnlink={onUnlinkActivity}
                  onSync={onSyncActivity}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function GoogleClassroomSync({ teacherId, onDataChanged }: Props) {
  const {
    isConnected, courses, isLoading, isSyncing, importedCourseIds, linkedActivities,
    connectClassroom, fetchCourses, importCourse, fetchCoursework,
    linkActivity, unlinkActivity, syncActivity,
  } = useGoogleClassroom(teacherId);

  const [hasFetched, setHasFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [permError, setPermError] = useState(false);
  const [syncingLinkId, setSyncingLinkId] = useState<string | null>(null);

  const handleFetchCourses = async () => {
    setIsFetching(true);
    setPermError(false);
    try {
      await fetchCourses();
      setHasFetched(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "PERMISSION_DENIED") {
        setPermError(true);
      } else {
        toast.error("Erro ao buscar turmas. Tente reconectar.");
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async (course: ClassroomCourse) => {
    setImportProgress({ step: "creating" });
    try {
      const result = await importCourse(course, () => setImportProgress({ step: "students" }));
      setImportProgress({ step: "done", result });
      onDataChanged();
      toast.success(`${result.studentsImported} alunos importados com sucesso!`);
      setTimeout(() => setImportProgress(null), 4000);
    } catch (err) {
      setImportProgress(null);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error(`Erro: ${msg}`);
    }
  };

  const handleLinkActivity = useCallback(async (
    course: ClassroomCourse,
    cw: ClassroomCoursework,
    coins: number
  ) => {
    try {
      await linkActivity(course, cw, null, coins);
      toast.success(`"${cw.title}" vinculada — ${coins} moedas por entrega!`);
    } catch (err) {
      toast.error("Erro ao vincular atividade.");
      console.error(err);
    }
  }, [linkActivity]);

  const handleUnlinkActivity = useCallback(async (linkId: string) => {
    try {
      await unlinkActivity(linkId);
      toast.success("Atividade desvinculada.");
    } catch {
      toast.error("Erro ao desvincular.");
    }
  }, [unlinkActivity]);

  const handleSyncActivity = useCallback(async (link: ActivityLink) => {
    setSyncingLinkId(link.id);
    try {
      const result: SyncResult = await syncActivity(link);
      if (result.rewarded > 0) {
        toast.success(`${result.rewarded} aluno${result.rewarded !== 1 ? "s" : ""} premiado${result.rewarded !== 1 ? "s" : ""}!`, {
          description: result.skipped > 0 ? `${result.skipped} já havia${result.skipped !== 1 ? "m" : ""} recebido a recompensa.` : undefined,
        });
        onDataChanged();
      } else if (result.skipped > 0) {
        toast.info("Todos os alunos que entregaram já foram premiados.", { description: `${result.skipped} entrega${result.skipped !== 1 ? "s" : ""} encontrada${result.skipped !== 1 ? "s" : ""}` });
      } else {
        toast.info("Nenhuma entrega encontrada ainda.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg === "PERMISSION_DENIED") {
        toast.error("Permissão negada", { description: "Reconecte o Classroom para conceder acesso às atividades." });
      } else {
        toast.error(`Erro ao sincronizar: ${msg}`);
      }
    } finally {
      setSyncingLinkId(null);
    }
  }, [syncActivity, onDataChanged]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!isConnected) {
    return <NotConnected onConnect={connectClassroom} />;
  }

  if (importProgress) {
    return <ImportProgressView progress={importProgress} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-sm text-emerald-400 font-semibold">Conectado ao Google Classroom</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchCourses}
          disabled={isFetching}
          className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
        >
          {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {hasFetched ? "Atualizar lista" : "Carregar turmas"}
        </Button>
      </div>

      {/* Permission error */}
      {permError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-red-400 font-semibold">Permissão negada (403)</p>
            <p className="text-muted-foreground mt-1">
              Os scopes do Google Classroom não foram autorizados. Reconecte sua conta para conceder as permissões necessárias.
            </p>
            <Button size="sm" onClick={connectClassroom} className="mt-2 gap-1">
              <ExternalLink size={13} />
              Reconectar com permissões
            </Button>
          </div>
        </div>
      )}

      {/* Course list */}
      {!hasFetched && !permError && (
        <div className="text-center py-10 text-muted-foreground">
          <GraduationCap size={36} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">Clique em "Carregar turmas" para ver seus cursos do Google Classroom.</p>
        </div>
      )}

      {hasFetched && courses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma turma ativa encontrada no Google Classroom.
        </div>
      )}

      {hasFetched && courses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Users size={13} />
            {courses.length} turma{courses.length !== 1 ? "s" : ""} ativa{courses.length !== 1 ? "s" : ""} encontrada{courses.length !== 1 ? "s" : ""}
            <ChevronRight size={13} />
            <span className="text-gold">{importedCourseIds.size} importada{importedCourseIds.size !== 1 ? "s" : ""}</span>
          </div>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              isImported={importedCourseIds.has(course.id)}
              onImport={handleImport}
              isDisabled={isSyncing}
              linkedActivities={linkedActivities}
              fetchCoursework={fetchCoursework}
              onLinkActivity={handleLinkActivity}
              onUnlinkActivity={handleUnlinkActivity}
              onSyncActivity={handleSyncActivity}
              syncingLinkId={syncingLinkId}
            />
          ))}
        </div>
      )}

      {/* Linked activities summary — shown even without hasFetched */}
      {linkedActivities.length > 0 && (
        <div className="mt-2 p-4 rounded-xl bg-gold/5 border border-gold/20">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={15} className="text-gold" />
            <span className="text-sm font-semibold text-gold">
              {linkedActivities.length} atividade{linkedActivities.length !== 1 ? "s" : ""} vinculada{linkedActivities.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-2">
            {linkedActivities.map(link => (
              <div key={link.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{link.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.last_synced_at
                      ? `Último sync: ${new Date(link.last_synced_at).toLocaleString("pt-BR")}`
                      : "Nunca sincronizado"}
                  </p>
                </div>
                <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full shrink-0">
                  {link.reward_coins} moedas
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={syncingLinkId === link.id}
                  onClick={() => handleSyncActivity(link)}
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1 h-7 px-2 text-xs shrink-0"
                >
                  {syncingLinkId === link.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <RotateCcw size={11} />}
                  Sync
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
