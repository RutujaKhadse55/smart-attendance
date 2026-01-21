// context/AuthContext.tsx
import React, { createContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserByCredentials } from '../db/queries';

type User = { id: number; username: string; role: 'Admin'|'Attendance Teacher'|'Batch Teacher' };

export const AuthContext = createContext<{
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}>({
  user: null, login: async () => false, logout: async () => {}, loading: true
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('session');
      if (raw) setUser(JSON.parse(raw));
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await getUserByCredentials(username, password);
    if (u) {
      const session = { id: u.id, username: u.username, role: u.role };
      await AsyncStorage.setItem('session', JSON.stringify(session));
      setUser(session as User);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('session');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
