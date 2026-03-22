import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperSignature } from "@/components/DeveloperSignature";
import { AincradBackground } from "@/components/ui/AincradBackground";
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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AincradBackground scene="default" />
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
            style={{ background: 'rgba(201,164,74,0.08)', border: '1px solid rgba(201,164,74,0.25)' }}
          >
            <div className="flex items-center gap-1">
              <Sword className="text-yellow-400" size={22} />
              <Shield className="text-yellow-400" size={22} />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1" style={{ letterSpacing: '4px' }}>WIT DUNGEON</h1>
          <p className="text-white/40 text-sm">Painel do Professor</p>
        </div>

        <div className="holo-panel-accent space-y-4">
          {/* Primary: Google sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-3 font-semibold text-white/80 disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
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
              className="w-full flex items-center justify-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors py-1"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showEmailForm ? "rotate-180" : ""}`}
              />
              {showEmailForm ? "Ocultar" : "Usar email e senha"}
            </button>

            {showEmailForm && (
              <div className="mt-4 space-y-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="flex-1 py-2 rounded-lg font-semibold transition-all text-sm"
                    style={isLogin
                      ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="flex-1 py-2 rounded-lg font-semibold transition-all text-sm"
                    style={!isLogin
                      ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00e5ff' }
                      : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    Cadastrar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">Seu Nome</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Professor(a) Silva"
                          required={!isLogin}
                          className="w-full px-4 py-3 pl-11 rounded-lg outline-none transition-all text-white/85 text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="professor@escola.com"
                        required
                        className="w-full px-4 py-3 pl-11 rounded-lg outline-none transition-all text-white/85 text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2 text-white/50 uppercase tracking-wider">Senha</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 pl-11 rounded-lg outline-none transition-all text-white/85 text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-cyber w-full py-3 justify-center"
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

        <div className="text-center mt-6 space-y-2">
          <Link to="/" className="text-sm text-white/30 hover:text-cyan-400 transition-colors">
            ← Voltar para portal do aluno
          </Link>
          <DeveloperSignature className="text-center" />
        </div>
      </div>
    </div>
  );
}
