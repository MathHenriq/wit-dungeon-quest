import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useParentPortal, generateSuggestedQuestions } from "@/hooks/useParentPortal";
import { ParentSummaryCard } from "@/components/parent/ParentSummaryCard";
import { ParentWeeklyActivity } from "@/components/parent/ParentWeeklyActivity";
import { ParentSuggestedQuestions } from "@/components/parent/ParentSuggestedQuestions";
import { ParentProgressChart } from "@/components/parent/ParentProgressChart";
import { ParentAttendanceCalendar } from "@/components/parent/ParentAttendanceCalendar";
import { ParentReportDownload } from "@/components/parent/ParentReportDownload";
import {
  BookOpen, LogOut, ChevronDown, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ParentPortal() {
  const navigate = useNavigate();
  const {
    parentName, children, selectedChildId, setSelectedChildId,
    summary, isLoading, isSummaryLoading,
    loadParent, redeemInvite, logout,
  } = useParentPortal();

  const [authChecked, setAuthChecked] = useState(false);
  const inviteProcessed = useRef(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/pais/login', { replace: true });
        return;
      }
      setAuthChecked(true);

      // Process invite code stored before OAuth redirect
      const code = sessionStorage.getItem('parent_invite_code');
      if (code && !inviteProcessed.current) {
        inviteProcessed.current = true;
        sessionStorage.removeItem('parent_invite_code');
        try {
          const result = await redeemInvite(code, user.user_metadata?.full_name ?? 'Responsável');
          if (result?.success) {
            toast.success('Vínculo criado! Bem-vindo ao portal dos pais.');
            await loadParent();
          } else {
            toast.error(result?.error ?? 'Código inválido ou expirado.');
          }
        } catch {
          toast.error('Erro ao processar código de convite.');
        }
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/pais/login', { replace: true });
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={36} />
          <p className="text-slate-400 text-sm">Carregando portal...</p>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(c => c.student_id === selectedChildId);
  const questions = summary ? generateSuggestedQuestions(summary) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Portal dos Pais</p>
              {parentName && <p className="text-xs text-slate-400">{parentName}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs"
          >
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* No children */}
        {children.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-600 mb-1">Nenhum filho vinculado</h2>
            <p className="text-sm text-slate-400 mb-4">
              Peça ao professor para gerar um código de convite e acesse novamente com o código.
            </p>
            <Button variant="outline" onClick={handleLogout} className="text-slate-500">
              Sair e usar código de convite
            </Button>
          </div>
        )}

        {/* Child selector (multiple children) */}
        {children.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <label className="text-xs text-slate-500 font-medium mb-2 block">Selecionar filho</label>
            <div className="relative">
              <select
                value={selectedChildId ?? ''}
                onChange={e => setSelectedChildId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-400 pr-8"
              >
                {children.map(c => (
                  <option key={c.student_id} value={c.student_id}>
                    {c.character_name || c.name} — {c.class_name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Summary loading */}
        {isSummaryLoading && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-indigo-400 mx-auto" size={28} />
          </div>
        )}

        {/* Content */}
        {summary && !isSummaryLoading && (
          <>
            <ParentSummaryCard summary={summary} />
            <ParentWeeklyActivity summary={summary} />
            {questions.length > 0 && <ParentSuggestedQuestions questions={questions} />}
            <ParentProgressChart summary={summary} />
            <ParentAttendanceCalendar summary={summary} />
            {selectedChild && (
              <ParentReportDownload
                studentId={selectedChild.student_id}
                studentName={selectedChild.character_name || selectedChild.name}
              />
            )}
            <div className="text-center pt-2">
              <button
                onClick={() => loadParent()}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1.5 mx-auto transition-colors"
              >
                <RefreshCw size={12} /> Atualizar dados
              </button>
            </div>
          </>
        )}

        {!summary && !isSummaryLoading && children.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <AlertCircle size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Ainda não há dados para este período.</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-slate-300">
        Portal dos Pais — WIT Dungeon Quest
      </footer>
    </div>
  );
}
