import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isBlocked: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  updateName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserStatus(session.user);
      } else {
        setUser(null);
        setIsBlocked(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          checkUserStatus(session.user);
        } else {
          setUser(null);
          setIsBlocked(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (supabaseUser: User) => {
    try {
      const [blockedRes, incidentRes] = await Promise.all([
        supabase.from('blocked_users').select('*').eq('id', supabaseUser.id).single(),
        supabase.from('security_incidents').select('*').eq('id', supabaseUser.id).single()
      ]);
      
      if (blockedRes.data || incidentRes.data) {
        setIsBlocked(true);
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setIsBlocked(false);
        setUser(supabaseUser);
        
        // Ensure customer record and custom customer ID
        try {
          const customerDoc = await getDoc(doc(db, "customers", supabaseUser.id));
          if (!customerDoc.exists()) {
            const customerId = "CUS-" + Math.random().toString(36).substr(2, 6).toUpperCase();
            await setDoc(doc(db, "customers", supabaseUser.id), {
              id: supabaseUser.id,
              customerId,
              email: supabaseUser.email,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
            });
          } else {
            // update last login time
            await setDoc(doc(db, "customers", supabaseUser.id), {
              ...customerDoc.data(),
              lastLogin: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Error updating customer record:", e);
        }
      }
    } catch (err) {
      setUser(supabaseUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
  };

  const changeEmail = async (newEmail: string) => {
    await supabase.auth.updateUser({ email: newEmail });
  };

  const updateName = async (newName: string) => {
    const { data: { user: updatedUser } } = await supabase.auth.updateUser({
      data: { displayName: newName }
    });
    if (updatedUser) setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isBlocked, logout, resetPassword, changeEmail, updateName }}>
      {!loading && children}
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


