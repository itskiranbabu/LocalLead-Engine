import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id?: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, passwordOrName?: string, isSignUp?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();

    // Listen for Supabase auth changes
    if (isSupabaseConfigured()) {
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                // Fetch profile logic would go here in a full app
                setUser({ 
                    id: session.user.id,
                    email: session.user.email!, 
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]! 
                });
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => subscription.unsubscribe();
    }
  }, []);

  const checkUser = async () => {
    if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session?.user) {
            setUser({ 
                id: session.user.id,
                email: session.user.email!, 
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0]! 
            });
        }
    } else {
        // Fallback to LocalStorage Mock
        const stored = localStorage.getItem('lle_user');
        if (stored) setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  };

  const login = async (email: string, passwordOrName?: string, isSignUp?: boolean) => {
    setError(null);
    setIsLoading(true);

    try {
        if (isSupabaseConfigured()) {
            if (isSignUp) {
                const { error } = await supabase!.auth.signUp({
                    email,
                    password: passwordOrName!, // In Supabase flow, second arg is password
                    options: { data: { full_name: passwordOrName } } // abusing the param slightly for mock compatibility
                });
                if (error) throw error;
                // Auto login might not happen if email confirm is on, but for now assuming auto-session
            } else {
                const { error } = await supabase!.auth.signInWithPassword({
                    email,
                    password: passwordOrName!
                });
                if (error) throw error;
            }
        } else {
            // Mock Login
            await new Promise(r => setTimeout(r, 500)); // Fake latency
            const newUser = { 
                email, 
                name: (isSignUp ? passwordOrName : email.split('@')[0]) || 'User'
            };
            setUser(newUser);
            localStorage.setItem('lle_user', JSON.stringify(newUser));
        }
    } catch (err: any) {
        setError(err.message || 'Authentication failed');
    } finally {
        setIsLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
        await supabase!.auth.signOut();
    } else {
        setUser(null);
        localStorage.removeItem('lle_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};