import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: any | null; // Using any to represent extended user object
  loading: boolean;
  isBlocked: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  updateName: (newName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkUserStatus(session.user);
      } else {
        setUser(null);
        setIsBlocked(false);
        setLoading(false);
      }
    });

    // Listen for auth changes
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

  const checkUserStatus = async (supabaseUser: any) => {
    // Check if user is blocked or has incidents
    try {
      const blockedRes = await getDoc(doc(db, 'blocked_users', supabaseUser.id));
      const incidentRes = await getDoc(doc(db, 'security_incidents', supabaseUser.id));
      
      if (blockedRes.exists() || incidentRes.exists()) {
        setIsBlocked(true);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      
      setIsBlocked(false);
      
      const enhancedUser: any = {
        ...supabaseUser,
        id: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
      };
      
      setUser(enhancedUser);

      // Ensure customer record and custom customer ID
      try {
        const customerDoc = await getDoc(doc(db, "customers", supabaseUser.id));
        if (!customerDoc.exists()) {
          const customerId = "CUS-" + Math.random().toString(36).substr(2, 6).toUpperCase();
          await setDoc(doc(db, "customers", supabaseUser.id), {
            id: supabaseUser.id,
            customer_id: customerId,
            email: supabaseUser.email,
            created_at: serverTimestamp(),
            last_login: serverTimestamp(),
          });
        } else {
          // update last login time
          await setDoc(doc(db, "customers", supabaseUser.id), {
            ...customerDoc.data(),
            last_login: serverTimestamp()
          });
        }
      } catch (e) {
        console.error("Error updating customer record:", e);
      }
    } catch (err) {
      console.error(err);
      const enhancedUser: any = {
        ...supabaseUser,
        id: supabaseUser.id,
        email: supabaseUser.email,
      };
      setUser(enhancedUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await signOut(auth); // Sign out of firebase as well just in case
  };
  
  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
  };

  const changeEmail = async (newEmail: string) => {
    await supabase.auth.updateUser({ email: newEmail });
  };

  const updateName = async (newName: string) => {
    await supabase.auth.updateUser({ data: { full_name: newName } });
    setUser((prev: any) => ({ ...prev, displayName: newName }));
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


