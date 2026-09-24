import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorRecoveryToast } from "@/components/ErrorRecoveryToast";
import { ColorBlindFilters } from "@/components/ColorBlindFilters";
import { IntroRouter } from "@/components/IntroRouter";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { BootSequence } from "@/components/boot-sequence";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Patch 10.2: lazy-load heavy routes + the three.js background. Cuts the
// initial bundle from a single 3.2 MB chunk to ~1.2 MB + per-route chunks
// fetched on demand. Each chunk is also cached separately, so a deploy
// touching ShopScreen doesn't bust the AdminPanel cache.
const SpaceBackground   = lazy(() => import("@/components/background/SpaceBackground").then(m => ({ default: m.SpaceBackground })));
const StudentPortal     = lazy(() => import("./pages/StudentPortal"));
const TeacherLogin      = lazy(() => import("./pages/TeacherLogin"));
const TeacherDashboard  = lazy(() => import("./pages/TeacherDashboard"));
const TeacherAnalytics  = lazy(() => import("./pages/TeacherAnalytics"));
const AdminPanel        = lazy(() => import("./pages/AdminPanel"));
const ParentLogin       = lazy(() => import("./pages/ParentLogin"));
const ParentPortal      = lazy(() => import("./pages/ParentPortal"));
const ParentReport      = lazy(() => import("./pages/ParentReport"));
const ParentStudentView = lazy(() => import("./pages/ParentStudentView"));
const PresentationMode  = lazy(() => import("./pages/PresentationMode"));
const BattleDemo        = lazy(() => import("./pages/BattleDemo"));
const FloorMapDemo      = lazy(() => import("./pages/FloorMapDemo"));
const FloorSelectDemo   = lazy(() => import("./pages/FloorSelectDemo"));
const CardsDemo         = lazy(() => import("./pages/CardsDemo"));
const NotFound          = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      retry: 1,
      // Sem staleTime o padrão é 0: toda vez que um componente monta, a query
      // é considerada velha e vai à rede de novo. Na prática o aluno pagava um
      // round-trip ao Supabase a cada ida e volta entre hub, loja e inventário.
      // 30 s cobre a navegação normal de uma aula sem servir dado velho — quem
      // precisa de tempo real (PvP, eventos) usa polling próprio, e quem grava
      // invalida a query na hora.
      staleTime: 30_000,
      // Mantém o dado em memória por 5 min depois que ninguém mais o observa,
      // para que voltar a uma tela pinte na hora com o cache e revalide atrás.
      gcTime: 5 * 60_000,
    },
  },
});

// Lightweight fallback while a route chunk downloads. Intentionally minimal —
// the boot sequence already covers cold starts; route swaps are typically
// sub-200 ms on a warm cache.
function RouteFallback() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(4,6,10,0.6)", color: "rgba(255,255,255,0.6)",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase",
      pointerEvents: "none",
    }}>
      carregando…
    </div>
  );
}

// Inner component — must live inside <BrowserRouter> to use useNavigate
function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.location.pathname === '/') {
        localStorage.setItem('hasSeenIntro', 'true');
        navigate('/login');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [navigate]);

  return (
    // O boundary fica FORA do Suspense: a rejeição de um import() de rota
    // lazy sobe pelo Suspense, não é capturada por ele. Sem isto, um chunk que
    // não baixa deixa o #root vazio, sem mensagem nem botão.
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/"                       element={<IntroRouter />} />
          <Route path="/login"                  element={<StudentPortal />} />
          <Route path="/boot-test"              element={<BootSequence />} />
          <Route path="/professor/login"        element={<TeacherLogin />} />
          <Route path="/professor"              element={<TeacherDashboard />} />
          <Route path="/professor/analytics"   element={<TeacherAnalytics />} />
          <Route path="/professor/admin"        element={<AdminPanel />} />
          <Route path="/pais/login"             element={<ParentLogin />} />
          <Route path="/pais"                   element={<ParentPortal />} />
          <Route path="/pais/filho"             element={<ParentStudentView />} />
          <Route path="/relatorio/:reportId"    element={<ParentReport />} />
          <Route path="/professor/apresentacao" element={<PresentationMode />} />
          <Route path="/battle-demo"            element={<BattleDemo />} />
          <Route path="/floor-map-demo"         element={<FloorMapDemo />} />
          <Route path="/floor-select-demo"      element={<FloorSelectDemo />} />
          <Route path="/cartas-demo"            element={<CardsDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*"                       element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Patch 10.2: three.js bg is deferred — null fallback so the page
            renders flat-black for a frame instead of blocking on the deps. */}
        <Suspense fallback={null}>
          <SpaceBackground />
        </Suspense>
        <ColorBlindFilters />
        <Toaster />
        <Sonner />
        <ErrorRecoveryToast />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
