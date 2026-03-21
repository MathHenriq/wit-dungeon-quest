import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { Sword, Shield, Mail, Lock, User, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export default function TeacherLogin() {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signUp, loginWithGoogle, teacher, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Navigate to dashboard once teacher is resolved
  useEffect(() => {
    if (teacher && !authLoading) {
      navigate("/professor");
    }
  }, [teacher, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await loginWithGoogle();
    if (error) {
      toast.error("Erro ao entrar com Google", { description: error.message });
      setIsGoogleLoading(false);
    }
    // On success: page redirects — no need to reset state
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error("Erro ao entrar", { description: error.message });
        }
        // On success: onAuthStateChange resolves teacher → useEffect navigates
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error("Erro ao cadastrar", { description: error.message });
        } else {
          toast.success("Conta criada!", { description: "Verifique seu email para confirmar o cadastro." });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dungeon-dark mb-4">
            <div className="flex items-center gap-1">
              <Sword className="text-gold" size={28} />
              <Shield className="text-gold" size={28} />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-dungeon-dark mb-2">WIT Dungeon</h1>
          <p className="text-muted-foreground">Painel do Professor</p>
        </div>

        <div className="card-fantasy space-y-4">
          {/* Primary: Google sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-lg border-2 border-border bg-background hover:bg-secondary transition-all flex items-center justify-center gap-3 font-semibold text-foreground disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {isGoogleLoading ? "Redirecionando..." : "Entrar com Google"}
          </button>

          {/* Divider + email/password fallback toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowEmailForm(v => !v)}
              className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showEmailForm ? "rotate-180" : ""}`}
              />
              {showEmailForm ? "Ocultar" : "Usar email e senha"}
            </button>

            {showEmailForm && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      isLogin ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                      !isLogin ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Cadastrar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">Seu Nome</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Professor(a) Silva"
                          required={!isLogin}
                          className="w-full px-4 py-3 pl-11 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="professor@escola.com"
                        required
                        className="w-full px-4 py-3 pl-11 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Senha</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 pl-11 rounded-lg border-2 border-border bg-background focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-fantasy w-full py-3 text-lg flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <><Shield size={20} />{isLogin ? "Entrar" : "Criar Conta"}</>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 space-y-3">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Voltar para portal do aluno
          </Link>
          <DeveloperSignature />
        </div>
      </div>
    </div>
  );
}
