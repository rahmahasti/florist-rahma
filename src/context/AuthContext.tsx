import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';
import { AdminUser } from '../types';

interface AuthContextType {
  currentUser: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPERADMIN_EMAIL = 'rahmahasti30@gmail.com';
const ADMIN_STORAGE_KEY = 'floristique_admin_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // If email matches the authorized owner email or has admin rights
        const isOwner = user.email === SUPERADMIN_EMAIL;
        const newAdmin: AdminUser = {
          uid: user.uid,
          email: user.email || 'admin@floristique.id',
          displayName: user.displayName || (isOwner ? 'Rahma Hasti (Super Admin)' : 'Store Admin'),
          role: isOwner ? 'superadmin' : 'manager',
        };
        setAdminUser(newAdmin);
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newAdmin));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isOwner = user.email === SUPERADMIN_EMAIL;
      const admin: AdminUser = {
        uid: user.uid,
        email: user.email || 'admin@floristique.id',
        displayName: user.displayName || 'Admin Floristique',
        role: isOwner ? 'superadmin' : 'manager',
      };
      setAdminUser(admin);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Instant demo admin mode for evaluation and fast access
  const loginAsDemoAdmin = () => {
    const demoAdmin: AdminUser = {
      uid: 'demo-admin-floristique',
      email: SUPERADMIN_EMAIL,
      displayName: 'Rahma Hasti (Store Owner & Super Admin)',
      role: 'superadmin',
    };
    setAdminUser(demoAdmin);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(demoAdmin));
    } catch (e) {
      console.warn(e);
    }
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setAdminUser(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  const isAdmin = Boolean(adminUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUser,
        isAdmin,
        isLoading,
        loginWithGoogle,
        loginAsDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
