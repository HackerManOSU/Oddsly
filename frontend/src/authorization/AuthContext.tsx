/* ++++++++++ IMPORTS ++++++++++ */
import React, { 
  createContext, 
  useState, 
  useEffect, 
  useCallback } 
  from 'react';

import { getUserProfile } from './AuthService';


/* ++++++++++ TYPES ++++++++++ */
interface User {
  uid: string;
  email: string;
  email_verified: boolean;
  fullName?: string;
  subscriptionStatus?: 'active' | 'inactive';

}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  refreshAuth: () => void;
}

// const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

/* ++++++++++ CONTEXT ++++++++++ */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ++++++++++ PROVIDER ++++++++++ */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  /* ++++++++++ AUTHENTICATION CHECK ++++++++++ */
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) { // Check for error
        setAuthState({
          user: null,
          loading: false,
          error: data.error,
        });
        return;
      }

      const profile = await getUserProfile();

      setAuthState({
        user: { 
          ...data.user, 
          fullName: profile.fullName, 
          subscriptionStatus: profile.subscriptionStatus 
        },
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshAuth = () => {
    setAuthState((prev) => ({ ...prev, loading: true }));
    checkAuth();
  };

  return (
    <AuthContext.Provider value={{ ...authState, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
