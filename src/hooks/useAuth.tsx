import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  no_ahli?: number | null;
  member_number?: number | null;
  nama_penuh: string;
  no_rumah: string;
  no_telefon: string | null;
  email: string;
  status_ahli: "pending" | "active" | "inactive";
  avatar_url: string | null;
  created_at: string;
}

interface UserRole {
  role: "pengerusi" | "naib_pengerusi" | "setiausaha" | "penolong_setiausaha" | "bendahari" | "ajk" | "ahli";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  isAdmin: boolean;
  isPengerusi: boolean;
  isNaibPengerusi: boolean;
  isSetiausaha: boolean;
  isBendahari: boolean;
  isAJK: boolean;
  canManageMembers: boolean;
  canDeleteData: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchRoles(session.user.id)
        ]).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (roleName: string) => roles.some(r => r.role === roleName);
  
  const isPengerusi = hasRole("pengerusi");
  const isNaibPengerusi = hasRole("naib_pengerusi");
  const isSetiausaha = hasRole("setiausaha") || hasRole("penolong_setiausaha");
  const isBendahari = hasRole("bendahari");
  const isAJK = hasRole("ajk");

  // Derived permissions
  const canDeleteData = isPengerusi;
  const canManageMembers = isPengerusi || isNaibPengerusi || isSetiausaha;
  // Admin generally means anyone with some management capability
  const isAdmin = isPengerusi || isNaibPengerusi || isSetiausaha || isBendahari || isAJK;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isAdmin,
        isPengerusi,
        isNaibPengerusi,
        isSetiausaha,
        isBendahari,
        isAJK,
        canManageMembers,
        canDeleteData,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
