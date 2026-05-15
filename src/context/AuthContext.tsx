import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: 'admin' | 'cr' | 'student';
  status: 'approved' | 'pending' | 'rejected';
  createdAt: any;
  lastLoginAt: any;
}

interface AppSettings {
  loginApprovalRequired: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: AppSettings | null;
  loading: boolean;
  isAdmin: boolean;
  isCR: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Auth Changes
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Load Global Settings
    const settingsRef = doc(db, 'settings', 'app');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      } else {
        // Init settings if missing
        setDoc(settingsRef, { loginApprovalRequired: false });
        setSettings({ loginApprovalRequired: false });
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // 3. Load/Sync User Profile
    const profileRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(profileRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setLoading(false);
      } else {
        // Create new profile
        const isApprovalRequired = settings?.loginApprovalRequired ?? false;
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'New User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: 'student',
          status: isApprovalRequired ? 'pending' : 'approved',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        await setDoc(profileRef, newProfile);
        setProfile(newProfile);
        setLoading(false);
      }
    });

    return () => unsubscribeProfile();
  }, [user, settings]);

  const isAdmin = profile?.role === 'admin' && profile?.status === 'approved';
  const isCR = (profile?.role === 'cr' || profile?.role === 'admin') && profile?.status === 'approved';
  const isApproved = profile?.status === 'approved';

  return (
    <AuthContext.Provider value={{ user, profile, settings, loading, isAdmin, isCR, isApproved }}>
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
