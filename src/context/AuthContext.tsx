import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_USERS } from '../lib/studyStore';
import type { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  partnerUser: UserProfile | null;
  loading: boolean;
  error: string | null;
  isSupabaseConnected: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabase = isSupabaseConfigured();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth state
  useEffect(() => {
    async function initAuth() {
      setLoading(true);
      setError(null);

      if (isSupabase && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Verify authorization
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError || !profile?.is_authorized) {
              await supabase.auth.signOut();
              setError('Access Denied: This is a private study room. Your account is not in the authorized whitelist.');
              setCurrentUser(null);
            } else {
              setCurrentUser(profile);
            }
          }
        } catch (err) {
          console.error('Auth initialization error:', err);
        }
      } else {
        // Local mode: Restore last active mock user or default to Partner 1
        const savedUserId = localStorage.getItem('studyspace_active_user_id') || 'user-001';
        const found = MOCK_USERS.find((u) => u.id === savedUserId) || MOCK_USERS[0];
        setCurrentUser(found);
      }

      setLoading(false);
    }

    initAuth();

    // Listen to real Supabase auth state changes if connected
    const client = supabase;
    if (isSupabase && client) {
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile?.is_authorized) {
            setCurrentUser(profile);
            setError(null);
          } else {
            await client.auth.signOut();
            setError('Unauthorized: Your email address has not been added to this private study space.');
            setCurrentUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isSupabase]);

  const login = async (email: string, password = ''): Promise<boolean> => {
    setError(null);
    setLoading(true);

    if (isSupabase && supabase) {
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(signInError.message || 'Login failed. Please verify credentials.');
          setLoading(false);
          return false;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!profile?.is_authorized) {
            await supabase.auth.signOut();
            setError('Access Denied: This study room is private. Account is not authorized.');
            setLoading(false);
            return false;
          }

          setCurrentUser(profile);
          setLoading(false);
          return true;
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during login.');
        setLoading(false);
        return false;
      }
    } else {
      // Local Whitelist verification
      const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('studyspace_active_user_id', matched.id);
        setLoading(false);
        return true;
      } else {
        // Strict privacy: reject arbitrary users
        setError(`Access Denied: "${email}" is not an authorized member of this private study space.`);
        setLoading(false);
        return false;
      }
    }

    setLoading(false);
    return false;
  };

  const logout = async () => {
    if (isSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    if (!isSupabase) {
      localStorage.removeItem('studyspace_active_user_id');
    }
  };

  // Convenient tester switcher to test both user perspectives on localhost
  const switchUser = (userId: string) => {
    if (!isSupabase) {
      const target = MOCK_USERS.find((u) => u.id === userId);
      if (target) {
        setCurrentUser(target);
        localStorage.setItem('studyspace_active_user_id', target.id);
      }
    }
  };

  const partnerUser = currentUser
    ? MOCK_USERS.find((u) => u.id !== currentUser.id) || null
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        partnerUser,
        loading,
        error,
        isSupabaseConnected: isSupabase,
        login,
        logout,
        switchUser,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
