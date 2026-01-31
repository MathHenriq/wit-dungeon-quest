import { useStudent } from "@/hooks/useStudent";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const {
    student,
    isLoading,
    saveStudent,
    requestChallenge,
    requestItem,
    hasChallengeRequest,
    hasItemRequest,
    logout,
  } = useStudent();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return <LoginForm onSubmit={saveStudent} />;
  }

  return (
    <Dashboard
      student={student}
      onLogout={logout}
      onRequestChallenge={requestChallenge}
      onRequestItem={requestItem}
      hasChallengeRequest={hasChallengeRequest}
      hasItemRequest={hasItemRequest}
    />
  );
};

export default Index;
