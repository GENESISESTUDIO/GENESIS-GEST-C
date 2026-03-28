import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  displayName: string | null;
  name?: string;
  email: string | null;
  photoURL: string | null;
  role: 'admin' | 'manager' | 'engineer' | 'operator';
  company_id: string;
  company?: string;
  phone?: string;
  tax_id?: string;
  address?: string;
  permissions: string[];
  accessible_projects: string[];
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, updates, { merge: true });
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            if (!data.company_id) {
              const isPlatformAdmin = firebaseUser.email === 'simaojeovany4@gmail.com';
              const defaultCompanyId = isPlatformAdmin ? 'genesis-cc-gest' : 'pending';
              const updates = { company_id: defaultCompanyId };
              
              // If it's the platform admin, also ensure the company document exists
              if (isPlatformAdmin) {
                const companyDocRef = doc(db, 'companies', defaultCompanyId);
                const companyDoc = await getDoc(companyDocRef);
                if (!companyDoc.exists()) {
                  await setDoc(companyDocRef, {
                    id: defaultCompanyId,
                    name: 'GENESIS CC GEST',
                    owner_uid: firebaseUser.uid,
                    created_at: new Date().toISOString()
                  });
                }
              }

              await setDoc(userDocRef, updates, { merge: true });
              setProfile({ ...data, ...updates });
            } else {
              setProfile(data);
            }
          } else {
            // Create a default profile for new users
            const isPlatformAdmin = firebaseUser.email === 'simaojeovany4@gmail.com';
            const defaultCompanyId = isPlatformAdmin ? 'genesis-cc-gest' : 'pending';
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: isPlatformAdmin ? 'admin' : 'operator',
              company_id: defaultCompanyId,
              permissions: isPlatformAdmin ? ['all'] : [],
              accessible_projects: []
            };

            // If it's the platform admin, also ensure the company document exists
            if (isPlatformAdmin) {
              const companyDocRef = doc(db, 'companies', defaultCompanyId);
              const companyDoc = await getDoc(companyDocRef);
              if (!companyDoc.exists()) {
                await setDoc(companyDocRef, {
                  id: defaultCompanyId,
                  name: 'GENESIS CC GEST',
                  owner_uid: firebaseUser.uid,
                  created_at: new Date().toISOString()
                });
              }
            }

            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching/creating user profile:", error);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
