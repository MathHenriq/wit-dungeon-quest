import { createContext } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Teacher } from "@/types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  teacher: Teacher | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
