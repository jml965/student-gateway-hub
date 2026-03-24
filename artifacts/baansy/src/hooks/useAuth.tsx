import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setToken, clearToken } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  role: "student" | "admin" | "university";
  status: string;
  universityId?: number | null;
  createdAt: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isUniversity: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("baansy_token");
    if (!token) { setLoading(false); return; }
    api.get<User>("/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register", data);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin: user?.role === "admin",
      isUniversity: user?.role === "university",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
