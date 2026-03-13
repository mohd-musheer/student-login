import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getFacultyByAuthId,
  getStudentByAuthId,
  Faculty,
  Student
} from '@/lib/database';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type AppUser = (Faculty & { role: 'faculty' }) | (Student & { role: 'student' });

interface AuthContextType {
  user: AppUser | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isFaculty: boolean;
  isStudent: boolean;
  loginFaculty: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginStudent: (rollNo: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile from database based on auth user
  const loadUserProfile = async (authUser: SupabaseUser) => {
    // Try faculty first
    const faculty = await getFacultyByAuthId(authUser.id);
    if (faculty) {
      setUser({ ...faculty, role: 'faculty' as const });
      setSupabaseUser(authUser);
      return;
    }

    // Try student
    const student = await getStudentByAuthId(authUser.id);
    if (student) {
      setUser({ ...student, role: 'student' as const });
      setSupabaseUser(authUser);
      return;
    }

    // No profile found - user exists in auth but not in app tables
    setUser(null);
    setSupabaseUser(authUser);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => loadUserProfile(session.user), 0);
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginFaculty = async (username: string, password: string) => {
    const email = `${username.trim().toLowerCase()}@faculty.digitalscan.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: 'Invalid username or password' };
    }

    return { success: true };
  };

  const loginStudent = async (rollNo: string, password: string) => {
    const email = `${rollNo.trim()}@student.digitalscan.local`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: 'Invalid roll number or password. Contact your faculty for credentials.' };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        isAuthenticated: !!user,
        isFaculty,
        isStudent,
        loginFaculty,
        loginStudent,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
