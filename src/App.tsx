import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorRecoveryToast } from "@/components/ErrorRecoveryToast";
import StudentPortal from "./pages/StudentPortal";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorRecoveryToast />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudentPortal />} />
            <Route path="/professor/login" element={<TeacherLogin />} />
            <Route path="/professor" element={<TeacherDashboard />} />
            <Route path="/professor/analytics" element={<TeacherAnalytics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
