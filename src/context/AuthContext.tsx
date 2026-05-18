import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AlertCircle } from 'lucide-react';

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
  fundGoalAmount?: number;
  fundGoalTitle?: string;
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

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 1. Listen for Auth Changes
      const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) {
          setProfile(null);
          setLoading(false);
        }
      }, (error) => {
        console.error("Auth observer error:", error);
        setAuthError(error.message);
        setLoading(false);
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
      }, (error) => {
        console.error("Settings snapshot error:", error);
      });

      return () => {
        unsubscribeAuth();
        unsubscribeSettings();
      };
    } catch (err: any) {
      console.error("Critical Auth/DB initialization error:", err);
      setAuthError(err.message || "Failed to initialize standard security services.");
      setLoading(false);
    }
  }, []);

  if (authError && loading === false && !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertCircle className="text-amber-500" size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Security System Offline</h2>
            <p className="text-gray-400 text-sm">
              We're having trouble connecting to our authentication servers. The portal is running in partial mode.
            </p>
            <div className="text-[10px] font-mono text-red-500/50 pt-2 break-all">
              {authError}
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full h-12 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
