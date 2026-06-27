import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, auth, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
import { User, onAuthStateChanged, signOut, sendPasswordResetEmail, updateEmail, updateProfile } from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Set basic user details first to render the website instantly (within a second)
        const enhancedUser: any = {
          ...firebaseUser,
          id: firebaseUser.uid,
          email: firebaseUser.email,
        };
        setUser(enhancedUser);
        setLoading(false);
        
        // Run full database status checks (blocked, incidents, customer doc) in the background
        checkUserStatus(firebaseUser);
      } else {
        setUser(null);
        setIsBlocked(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUserStatus = async (firebaseUser: User) => {
    // Check if user is blocked or has incidents
    try {
      const blockedRes = await getDoc(doc(db, 'blocked_users', firebaseUser.uid));
      const incidentRes = await getDoc(doc(db, 'security_incidents', firebaseUser.uid));
      
      if (blockedRes.exists() || incidentRes.exists()) {
        setIsBlocked(true);
        await signOut(auth);
        setUser(null);
        return;
      }
      
      setIsBlocked(false);
      
      // Ensure customer record and custom customer ID
      try {
        const customerDoc = await getDoc(doc(db, "customers", firebaseUser.uid));
        if (!customerDoc.exists()) {
          const customerId = "CUS-" + Math.random().toString(36).substr(2, 6).toUpperCase();
          await setDoc(doc(db, "customers", firebaseUser.uid), {
            id: firebaseUser.uid,
            customer_id: customerId,
            email: firebaseUser.email,
            created_at: serverTimestamp(),
            last_login: serverTimestamp(),
          });
        } else {
          // update last login time
          await setDoc(doc(db, "customers", firebaseUser.uid), {
            ...customerDoc.data(),
            last_login: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Error updating customer record:", e);
      }
    } catch (err) {
      console.warn("Error checking user status:", err);
      const enhancedUser: any = {
        ...firebaseUser,
        id: firebaseUser.uid,
      };
      setUser(enhancedUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const changeEmail = async (newEmail: string) => {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, newEmail);
    }
  };

  const updateName = async (newName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: newName });
      setUser((prev: any) => ({ ...prev, displayName: newName }));
    }
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


