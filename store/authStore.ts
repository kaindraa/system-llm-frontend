import { create } from "zustand";
import { User, UserRole } from "@/types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initializeAuth: () => void;
}

// Normalize role to uppercase (handle backend sending lowercase)
const normalizeRole = (role: string | undefined): UserRole | undefined => {
  if (!role) return undefined;
  const normalized = role.toUpperCase();
  if (normalized === "ADMIN" || normalized === "STUDENT") {
    return normalized as UserRole;
  }
  return undefined;
};

// Ensure user role is normalized
const normalizeUser = (user: User | null): User | null => {
  if (!user) return null;
  return {
    ...user,
    role: normalizeRole(user.role) || UserRole.STUDENT,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    // Normalize user role before storing
    const normalizedUser = normalizeUser(user);

    if (typeof window !== "undefined") {
      if (normalizedUser) {
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem("user");
      }
    }
    set({ user: normalizedUser, isAuthenticated: !!normalizedUser });
  },

  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    // Force redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  initializeAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      let user = userStr ? JSON.parse(userStr) : null;

      // Normalize user role when loading from localStorage
      user = normalizeUser(user);

      console.log("[AuthStore] Initialized - user:", user?.email, "role:", user?.role);
      set({ user, token, isAuthenticated: !!(user && token), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));
