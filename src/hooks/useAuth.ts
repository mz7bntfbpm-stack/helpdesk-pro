import { create } from 'zustand';
import { auth } from '../services/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchUserProfile: () => Promise<void>;
  createUserProfile: (firebaseUser: FirebaseUser, role?: UserRole) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  error: null,

  signInWithGoogle: async () => {
    try {
      set({ error: null });
      const { googleProvider } = await import('../services/firebase');
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile with default role
        const newUser: User = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Anonymous',
          photoURL: result.user.photoURL || undefined,
          role: 'customer', // Default role
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
        await setDoc(doc(db, 'users', result.user.uid), newUser);
        set({ user: newUser, firebaseUser: result.user });
      } else {
        const userData = userDoc.data() as User;
        set({ user: userData, firebaseUser: result.user });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, firebaseUser: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  setUser: (user) => set({ user }),

  fetchUserProfile: async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      set({ user: null, loading: false });
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        set({ user: userDoc.data() as User, firebaseUser, loading: false });
      } else {
        // Create profile if it doesn't exist
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Anonymous',
          photoURL: firebaseUser.photoURL || undefined,
          role: 'customer',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        set({ user: newUser, firebaseUser, loading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createUserProfile: async (firebaseUser: FirebaseUser, role: UserRole = 'customer') => {
    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Anonymous',
      photoURL: firebaseUser.photoURL || undefined,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    set({ user: newUser, firebaseUser });
    return newUser;
  },
}));

// Auth state listener setup
export const setupAuthListener = () => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    const { fetchUserProfile } = useAuthStore.getState();
    if (firebaseUser) {
      await fetchUserProfile();
    } else {
      useAuthStore.setState({ user: null, firebaseUser: null, loading: false });
    }
  });
};
