import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const [blockedDoc, incidentDoc] = await Promise.all([
            getDoc(doc(db, "blocked_users", firebaseUser.uid)),
            getDoc(doc(db, "security_incidents", firebaseUser.uid))
          ]);
          
          if (blockedDoc.exists() || incidentDoc.exists()) {
            setIsBlocked(true);
            await signOut(auth);
            setUser(null);
          } else {
            setIsBlocked(false);
            setUser(firebaseUser);
          }
        } catch (err) {
          // If we can't check block status, assume safe but maybe log
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setIsBlocked(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => signOut(auth);
  
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  const changeEmail = async (newEmail: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateEmail(auth.currentUser, newEmail);
  };

  const updateName = async (newName: string) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    await updateProfile(auth.currentUser, { displayName: newName });
    // Force a state refresh
    setUser({ ...auth.currentUser });
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

