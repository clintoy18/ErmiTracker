import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { getUserProfile, registerOrganizationUser } from "../services/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFromSession(session) {
      const currentUser = session?.user ?? null;

      if (!isMounted) {
        return;
      }

      setUser(currentUser);
      setError("");

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userProfile = await getUserProfile(currentUser.id);

        if (!isMounted) {
          return;
        }

        setProfile(userProfile);

        if (!userProfile) {
          setError("No user profile found in Supabase public.users for this account.");
        }
      } catch (profileError) {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setError(profileError.message || "Unable to load user profile.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError && isMounted) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }

      loadFromSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadFromSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      role: profile?.role || null,
      organizationName: profile?.organizationName || "Barangay",
      organizationId: profile?.id || null,
      isAdmin: profile?.role === "admin",
      isOrg: profile?.role === "org",
      displayName: profile?.name || user?.email || "User",
      login: async (email, password) => {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          throw loginError;
        }
      },
      register: (payload) => registerOrganizationUser(payload),
      logout: async () => {
        const { error: logoutError } = await supabase.auth.signOut();

        if (logoutError) {
          throw logoutError;
        }
      },
    }),
    [error, loading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
