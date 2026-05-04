import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorRecoveryToast } from "@/components/ErrorRecoveryToast";
import { ColorBlindFilters } from "@/components/ColorBlindFilters";
import { SpaceBackground } from "@/components/background/SpaceBackground";
import { IntroRouter } from "@/components/IntroRouter";
import { BootSequence } from "@/components/boot-sequence";
import StudentPortal from "./pages/StudentPortal";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import AdminPanel from "./pages/AdminPanel";
import ParentLogin from "./pages/ParentLogin";
import ParentPortal from "./pages/ParentPortal";
import ParentReport from "./pages/ParentReport";
import ParentStudentView from "./pages/ParentStudentView";
import PresentationMode from "./pages/PresentationMode";
import BattleDemo from "./pages/BattleDemo";
import FloorMapDemo    from "./pages/FloorMapDemo";
import FloorSelectDemo from "./pages/FloorSelectDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      retry: 1,
    },
  },
});

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
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*"                       element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SpaceBackground />
        <ColorBlindFilters />
        <Toaster />
        <Sonner />
        <ErrorRecoveryToast />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
