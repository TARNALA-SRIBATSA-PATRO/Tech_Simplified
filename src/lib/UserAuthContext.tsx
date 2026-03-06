import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, apiGetUserProfile } from '@/lib/api';

interface UserAuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (profile: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (profile: UserProfile) => void;
  isLoading: boolean;
}

const UserAuthContext = createContext<UserAuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  isLoading: true,
});

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('user_jwt');
    if (token) {
      apiGetUserProfile()
        .then(profile => setUser(profile))
        .catch(() => {
          // Token invalid/expired — clear it
          localStorage.removeItem('user_jwt');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (profile: UserProfile, token: string) => {
    localStorage.setItem('user_jwt', token);
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('user_jwt');
    setUser(null);
  };

  const updateUser = (profile: UserProfile) => {
    setUser(profile);
  };

  return (
    <UserAuthContext.Provider value={{
      user,
      isLoggedIn: user !== null,
      login,
      logout,
      updateUser,
      isLoading,
    }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(UserAuthContext);
}
