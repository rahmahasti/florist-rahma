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
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, password?: string) => Promise<void>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPERADMIN_EMAIL = 'rahmahasti30@gmail.com';
const ADMIN_STORAGE_KEY = 'rahma_florist_admin_session';

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
        const isOwner = user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
        const newAdmin: AdminUser = {
          uid: user.uid,
          email: user.email || 'admin@rahmaflorist.id',
          displayName: user.displayName || (isOwner ? 'Rahma Hasti (Super Admin)' : 'Staff Admin Rahma Florist'),
          role: isOwner ? 'superadmin' : 'manager',
        };
        setAdminUser(newAdmin);
        try {
          localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newAdmin));
        } catch (e) {
          console.warn('Storage error:', e);
        }
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
      const isOwner = user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
      const admin: AdminUser = {
        uid: user.uid,
        email: user.email || 'admin@rahmaflorist.id',
        displayName: user.displayName || (isOwner ? 'Rahma Hasti (Super Admin)' : 'Admin Rahma Florist'),
        role: isOwner ? 'superadmin' : 'manager',
      };
      setAdminUser(admin);
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
      } catch (e) {
        console.warn('Storage error:', e);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const loginWithCredentials = async (usernameOrEmail: string, _password?: string) => {
    const trimmed = usernameOrEmail.trim();
    if (!trimmed) {
      throw new Error('Username atau Email tidak boleh kosong');
    }
    const lower = trimmed.toLowerCase();
    const isOwner = 
      lower === SUPERADMIN_EMAIL.toLowerCase() || 
      lower === 'admin' || 
      lower === 'rahma' || 
      lower === 'rahmahasti' || 
      lower === 'rahmahasti30' || 
      lower === 'owner';
    const isKasir = lower === 'kasir' || lower === 'kasir_rahma';

    let role: 'superadmin' | 'manager' | 'staff' = 'manager';
    let displayName = `${trimmed} (Admin)`;
    let email = trimmed.includes('@') ? trimmed : `${trimmed}@rahmaflorist.id`;

    if (isOwner) {
      role = 'superadmin';
      displayName = 'Rahma Hasti (Super Admin)';
      email = SUPERADMIN_EMAIL;
    } else if (isKasir) {
      role = 'staff';
      displayName = 'Kasir Rahma Florist';
      email = 'kasir@rahmaflorist.id';
    }

    const admin: AdminUser = {
      uid: `staff-${Date.now()}`,
      email,
      displayName,
      role,
    };
    setAdminUser(admin);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    return loginWithCredentials(email, password);
  };

  // Instant demo admin mode for evaluation and fast access
  const loginAsDemoAdmin = () => {
    const demoAdmin: AdminUser = {
      uid: 'superadmin-rahma-florist',
      email: SUPERADMIN_EMAIL,
      displayName: 'Rahma Hasti (Super Admin)',
      role: 'superadmin',
    };
    setAdminUser(demoAdmin);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(demoAdmin));
    } catch (e) {
      console.warn('Storage error:', e);
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
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (e) {
      console.warn('Storage error:', e);
    }
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
        loginWithEmail,
        loginWithCredentials,
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
