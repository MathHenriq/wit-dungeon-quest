import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorRecoveryToast } from "@/components/ErrorRecoveryToast";
import { ColorBlindFilters } from "@/components/ColorBlindFilters";
import StudentPortal from "./pages/StudentPortal";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import ParentLogin from "./pages/ParentLogin";
import ParentPortal from "./pages/ParentPortal";
import ParentReport from "./pages/ParentReport";
import ParentStudentView from "./pages/ParentStudentView";
import PresentationMode from "./pages/PresentationMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ColorBlindFilters />
        <Toaster />
        <Sonner />
        <ErrorRecoveryToast />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudentPortal />} />
            <Route path="/professor/login" element={<TeacherLogin />} />
            <Route path="/professor" element={<TeacherDashboard />} />
            <Route path="/professor/analytics" element={<TeacherAnalytics />} />
            <Route path="/pais/login" element={<ParentLogin />} />
            <Route path="/pais" element={<ParentPortal />} />
            <Route path="/pais/filho" element={<ParentStudentView />} />
            <Route path="/relatorio/:reportId" element={<ParentReport />} />
            <Route path="/professor/apresentacao" element={<PresentationMode />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
