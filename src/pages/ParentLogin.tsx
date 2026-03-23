import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight, Loader2, AlertCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ParentLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If already a parent, go to portal
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pa } = await supabase
          .from('parent_accounts')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (pa) {
          navigate('/pais', { replace: true });
          return;
        }
      }
      setChecking(false);
    };
    check();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const cleanCode = inviteCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (cleanCode) {
        sessionStorage.setItem('parent_invite_code', cleanCode);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/pais` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? 'Erro ao fazer login com Google.');
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const codeLength = inviteCode.replace(/[^A-Z0-9a-z]/g, '').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Portal dos Pais</h1>
          <p className="text-slate-500 mt-1">Acompanhe o progresso do seu filho</p>
        </div>

        <div className="space-y-4">
          {/* With invite code */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" />
              Tenho um código de convite
            </p>
            <p className="text-xs text-slate-400 mb-3">
              Insira o código enviado pelo professor antes de continuar com o Google.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABCD-1234"
              maxLength={9}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            {inviteCode.trim().length > 0 && codeLength < 8 && (
              <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> O código deve ter 8 caracteres (ex: ABCD-1234)
              </p>
            )}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Entrar com Google (com código)
            </Button>
          </div>

          {/* Already have account */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Já tenho conta</p>
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              disabled={isLoading}
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-11 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
              Entrar com Google
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
            <ArrowRight size={14} /> Portal do Aluno
          </Link>
          <Link to="/professor/login" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
            <ArrowRight size={14} /> Portal do Professor
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
