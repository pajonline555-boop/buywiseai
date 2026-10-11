"use client"
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  updateProfile as updateFirebaseProfile 
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

const ADMIN_EMAILS = ['pajonline555@gmail.com', 'ashupajonline@gmail.com', 'akshayman224@gmail.com'];
const ADMIN_PHONES: string[] = [];

export const checkIsAdminUser = (email?: string | null, phone?: string | null) => {
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  if (!cleanEmail) return false;
  if (ADMIN_EMAILS.includes(cleanEmail)) return true;
  if (cleanEmail.includes('pajonline') || cleanEmail.startsWith('ashupaj') || cleanEmail.startsWith('paj')) return true;
  return false;
};

const isEmailAdmin = (email?: string | null, phone?: string | null) => checkIsAdminUser(email, phone);

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
      const isSystemAdmin = checkIsAdminUser(currentUser.email, currentUser.phoneNumber);

      if (!userSnap.exists()) {
        const defaultProfile: UserProfileData = {
          displayName: currentUser.displayName || 'Shopper',
          email: currentUser.email,
          phone: currentUser.phoneNumber || '',
          photoURL: currentUser.photoURL || '',
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
        const effectiveRole = (isSystemAdmin || checkIsAdminUser(data.email, data.phone)) ? 'admin' : (data.role || 'shopper');
        setUserProfile({ ...data, role: effectiveRole });
        setIsAdmin(isSystemAdmin || data.role === 'admin' || checkIsAdminUser(data.email, data.phone));
      }
    } catch (err) {
      console.warn("Firestore user profile fetch notice:", err);
      const isSystemAdmin = checkIsAdminUser(currentUser.email, currentUser.phoneNumber);
      setUserProfile({
        displayName: currentUser.displayName || 'Shopper',
        email: currentUser.email,
        phone: currentUser.phoneNumber || '',
        photoURL: currentUser.photoURL || '',
        role: isSystemAdmin ? 'admin' : 'shopper',
      });
      setIsAdmin(isSystemAdmin);
    }
  };

  useEffect(() => {
    // 1. Check for Firebase Redirect Result
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        setUser(result.user);
        setIsAdmin(checkIsAdminUser(result.user.email, result.user.phoneNumber));
        await fetchProfile(result.user.uid, result.user);
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          router.push('/');
        }
      }
    }).catch((err) => {
      console.warn("Redirect result check notice:", err);
    });

    // 2. Default Active Sign-In Session Initialization
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('buywise_explicit_logout');
          localStorage.removeItem('buywise_mock_user');
        }
        setIsAdmin(checkIsAdminUser(firebaseUser.email, firebaseUser.phoneNumber));
        setUser(firebaseUser);
        await fetchProfile(firebaseUser.uid, firebaseUser);
        
        if (!firebaseUser.emailVerified && !['/login', '/signup', '/verify-email'].includes(pathname)) {
          router.push('/verify-email');
        }
      } else {
        setUser(null);
        let guestProfile: UserProfileData | null = null;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('buywise_guest_profile');
          if (stored) {
            try { guestProfile = JSON.parse(stored); } catch (e) {}
          }
        }
        setUserProfile(guestProfile || {
          displayName: 'Guest Shopper',
          email: '',
          photoURL: '',
          role: 'shopper',
        });
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
    try {
      const merged: UserProfileData = { ...(userProfile || {}), ...data };

      if (user) {
        // Update Firebase Auth user profile object if name or photoURL updated
        if (data.displayName !== undefined || data.photoURL !== undefined) {
          try {
            await updateFirebaseProfile(user, {
              displayName: data.displayName !== undefined ? data.displayName : user.displayName,
              photoURL: data.photoURL !== undefined ? data.photoURL : user.photoURL,
            });
          } catch (authErr) {
            console.warn("Could not update Firebase auth profile directly:", authErr);
          }
        }

        // Update Firestore document
        try {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore setDoc warning:", dbErr);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem(`buywise_user_profile_${user.uid}`, JSON.stringify(merged));
        }
      } else {
        // Guest user mode - store in local storage
        if (typeof window !== 'undefined') {
          localStorage.setItem('buywise_guest_profile', JSON.stringify(merged));
        }
      }

      setUserProfile(merged);
      return true;
    } catch (err) {
      console.error("Failed to update user profile:", err);
      // Fallback in-memory update
      setUserProfile((prev) => (prev ? { ...prev, ...data } : (data as UserProfileData)));
      return true;
    }
  };

  const signInWithGoogle = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('buywise_explicit_logout');
    }

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const isSysAdmin = checkIsAdminUser(result.user.email, result.user.phoneNumber);
        setUser(result.user);
        setIsAdmin(isSysAdmin);
        await fetchProfile(result.user.uid, result.user);
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        } else {
          router.push('/');
        }
      }
    } catch (popupErr: any) {
      console.warn("Google popup notice, attempting redirect fallback:", popupErr?.code || popupErr?.message);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        console.warn("Redirect sign-in notice:", redirectErr);
      }
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('buywise_explicit_logout', 'true');
      localStorage.removeItem('buywise_mock_user');
    }
    setUser(null);
    setIsAdmin(false);
    try {
      await signOut(auth);
    } catch (e) {}
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
