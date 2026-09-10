"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

export interface UserShoppingPreferences {
  currency?: string;
  categories?: string[];
  retailers?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  smartCompareSort?: string;
}

export interface UserProfileData {
  displayName?: string;
  email?: string | null;
  phone?: string;
  photoURL?: string;
  role?: 'shopper' | 'partner' | 'admin' | string;
  preferredLanguage?: string;
  shoppingPreferences?: UserShoppingPreferences;
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfileData>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = ['pajonline555@gmail.com', 'akshayman224@gmail.com'];
const isEmailAdmin = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase().trim());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (uid: string, currentUser: User) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const isSystemAdmin = isEmailAdmin(currentUser.email);
      
      if (!userSnap.exists()) {
        const defaultProfile: UserProfileData = {
          displayName: currentUser.displayName || 'Shopper',
          email: currentUser.email,
          role: isSystemAdmin ? 'admin' : 'shopper',
          preferredLanguage: 'en',
          shoppingPreferences: {
            currency: 'INR',
            categories: ['Fashion & Clothing', 'Mobiles & Smartphones', 'Audio & Headphones'],
            retailers: ['Amazon India', 'Flipkart', 'Myntra'],
            minPrice: 500,
            maxPrice: 50000,
          },
        };
        await setDoc(userRef, {
          ...defaultProfile,
          createdAt: serverTimestamp(),
        });
        setUserProfile(defaultProfile);
        setIsAdmin(isSystemAdmin);
      } else {
        const data = userSnap.data() as UserProfileData;
        const effectiveRole = isSystemAdmin ? 'admin' : (data.role || 'shopper');
        setUserProfile({ ...data, role: effectiveRole });
        setIsAdmin(isSystemAdmin || data.role === 'admin');
      }
    } catch (err) {
      console.warn("Firestore user profile fetch notice:", err);
      const isSystemAdmin = isEmailAdmin(currentUser.email);
      setUserProfile({
        displayName: currentUser.displayName || 'Shopper',
        email: currentUser.email,
        role: isSystemAdmin ? 'admin' : 'shopper',
      });
      setIsAdmin(isSystemAdmin);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAdmin(isEmailAdmin(user.email));
        setUser(user);
        await fetchProfile(user.uid, user);
        
        if (!user.emailVerified && !['/login', '/signup', '/verify-email'].includes(pathname)) {
          router.push('/verify-email');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfileData>): Promise<boolean> => {
    if (!user) return false;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...data } : (data as UserProfileData)));
      return true;
    } catch (err) {
      console.error("Failed to update user profile:", err);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAdmin, 
      signInWithGoogle, 
      logout,
      updateUserProfile,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
