import { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase/firebaseConfig';
import { ensureUserProfile } from '@/services/firebase/userService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await ensureUserProfile(user);
        setUserProfile(profile);
      } catch (error) {
        console.error('No se pudo asegurar el perfil de usuario:', error);
        setUserProfile(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      authLoading,
      isAuthenticated: Boolean(currentUser),
    }),
    [currentUser, userProfile, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}