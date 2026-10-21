import { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Teacher } from "@/types";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref so the callback always sees the latest teacher without re-subscribing
  const teacherRef = useRef<Teacher | null>(null);
  useEffect(() => { teacherRef.current = teacher; }, [teacher]);

  // Prevents concurrent teacher lookups (e.g. INITIAL_SESSION + SIGNED_IN firing together)
  const lookupInProgressRef = useRef(false);

  // Safety net: if isLoading gets stuck (e.g. Supabase cold start or
  // concurrent cross-tab SIGNED_IN events), release after 8 s.
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setIsLoading(false), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // When the teacher's tab returns to foreground, probe getSession() so the SDK refreshes
  // the token if it expired while the tab was backgrounded. TOKEN_REFRESHED is handled by
  // the onAuthStateChange guard (no re-render). SIGNED_OUT goes through normally.
  // We do NOT change state here to avoid false sign-outs during mid-refresh races.
  useEffect(() => {
    const onVisible = async () => {
      if (document.hidden) return;
      if (!teacherRef.current) return;
      console.log("[AuthContext] tab visible — probing session");
      try {
        await supabase.auth.getSession();
      } catch (err) {
        console.error("[AuthContext] visibility session probe failed:", err);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    // Quem está logado agora: uma busca que termina depois de um SIGNED_OUT não volta o professor.
    let current: string | null = null;

    // Busca (ou cria, no primeiro login) o professor deste login. Roda FORA do
    // callback do onAuthStateChange: esperar uma chamada do Supabase lá dentro
    // trava o lock do login, e toda chamada seguinte (as do painel também) fica
    // parada para sempre. Uma busca por vez.
    const lookup = (user: User, needsLoad: boolean) => {
      lookupInProgressRef.current = true;
      window.setTimeout(() => {
        void (async () => {
          try {
            let { data: teacherData } = await supabase
              .from("teachers")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle();

            // First login (any provider): auto-create teacher record if not found
            if (!teacherData) {
              const displayName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Professor";

              const { data: created } = await supabase
                .from("teachers")
                .insert({ name: displayName, user_id: user.id })
                .select()
                .maybeSingle();

              teacherData = created;
            }

            if (current === user.id) setTeacher(teacherData);
          } catch (err) {
            console.error("[AuthContext] teacher lookup error:", err);
            if (current === user.id) setTeacher(null);
          } finally {
            lookupInProgressRef.current = false;
            if (needsLoad) setIsLoading(false);
          }
        })();
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const isIdentityEvent =
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT";

        setSession(session);
        setUser(session?.user ?? null);
        current = session?.user?.id ?? null;

        if (!session?.user) {
          setTeacher(null);
          setIsLoading(false);
          return;
        }

        // Token renovado, ou SIGNED_IN de novo ao voltar para a aba com o mesmo
        // professor: nada a buscar (o painel não pisca carregando).
        if (!isIdentityEvent) return;
        if (teacherRef.current?.user_id === session.user.id) return;

        // Deduplicate: if a lookup is already running, skip this one
        if (lookupInProgressRef.current) return;

        // Show loading only when we don't yet have a teacher (fresh login/load).
        const needsLoad = !teacherRef.current;
        if (needsLoad) setIsLoading(true);
        lookup(session.user, needsLoad);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // As quatro ações abaixo só dependem do módulo `supabase` e dos setters, que
  // o React garante estáveis — por isso deps vazias. Elas precisam ser estáveis
  // porque entram no `value` do provider: recriadas a cada render, invalidavam
  // o contexto e re-renderizavam toda a árvore abaixo dele.
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: "teacher",
        },
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Só identifica o professor. Nenhum escopo do Google Sala de Aula:
        // a integração foi removida e nenhum dado de aluno vem do Google.
        scopes: "email profile",
        redirectTo: `${window.location.origin}/professor`,
        queryParams: {
          // "select_account" allows switching accounts without forcing re-consent
          prompt: "select_account",
        },
      },
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTeacher(null);
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    teacher,
    isLoading,
    signUp,
    signIn,
    loginWithGoogle,
    signOut,
  }), [user, session, teacher, isLoading, signUp, signIn, loginWithGoogle, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

