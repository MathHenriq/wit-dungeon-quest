import { useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isIdentityEvent =
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT";

        // Show loading only when we don't yet have a teacher (fresh login/load).
        // If teacher is already resolved, SIGNED_IN can re-fire on tab focus —
        // skip the spinner so the dashboard doesn't flash loading.
        const needsLoad = isIdentityEvent && !teacherRef.current;
        if (needsLoad) setIsLoading(true);

        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (!session?.user) {
            setTeacher(null);
            return;
          }

          // If teacher is already loaded and this is not a fresh sign-in,
          // skip the DB query — avoids blocking UI on tab-focus token refreshes.
          if (teacherRef.current && !isIdentityEvent) return;

          // Deduplicate: if a lookup is already running, skip this one
          if (lookupInProgressRef.current) return;
          lookupInProgressRef.current = true;

          let { data: teacherData } = await supabase
            .from("teachers")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();

          // First login (any provider): auto-create teacher record if not found
          if (!teacherData) {
            const displayName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "Professor";

            const { data: created } = await supabase
              .from("teachers")
              .insert({ name: displayName, user_id: session.user.id })
              .select()
              .maybeSingle();

            teacherData = created;
          }

          setTeacher(teacherData);
        } catch (err) {
          console.error("[AuthContext] onAuthStateChange error:", err);
          setTeacher(null);
        } finally {
          lookupInProgressRef.current = false;
          if (needsLoad) setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
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
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const loginWithGoogle = async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: [
          "email",
          "profile",
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.rosters.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
        ].join(" "),
        redirectTo: `${window.location.origin}/professor`,
        queryParams: {
          access_type: "offline",
          // "select_account" allows switching accounts without forcing re-consent
          prompt: "select_account",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTeacher(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        teacher,
        isLoading,
        signUp,
        signIn,
        loginWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

