import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        const me = await api.auth.me();
        setUser(me);
      }
    } catch {
      await AsyncStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await api.auth.login(email, password);
    await AsyncStorage.setItem("token", result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function signup(name: string, email: string, password: string) {
    const result = await api.auth.signup(name, email, password);
    await AsyncStorage.setItem("token", result.token);
    setToken(result.token);
    setUser(result.user);
  }

  async function logout() {
    await AsyncStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
