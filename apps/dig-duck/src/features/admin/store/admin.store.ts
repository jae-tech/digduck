import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AdminSession } from "../types/admin.types";

interface AdminStore extends AdminSession {
  setAuthenticated: (adminId: string) => void;
  logout: () => void;
  updateActivity: () => void;
  isSessionValid: () => boolean;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      adminId: null,
      loginTime: null,
      lastActivity: null,

      setAuthenticated: (adminId: string) => {
        const now = new Date();
        set({
          isAuthenticated: true,
          adminId,
          loginTime: now,
          lastActivity: now,
        });
      },

      logout: () =>
        set({
          isAuthenticated: false,
          adminId: null,
          loginTime: null,
          lastActivity: null,
        }),

      updateActivity: () => set({ lastActivity: new Date() }),

      isSessionValid: () => {
        const { isAuthenticated, lastActivity } = get();
        if (!isAuthenticated || !lastActivity) return false;

        const now = new Date().getTime();
        const lastActivityTime = new Date(lastActivity).getTime();
        return now - lastActivityTime < SESSION_TIMEOUT;
      },
    }),
    {
      name: "admin-session",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        adminId: state.adminId,
        loginTime: state.loginTime,
        lastActivity: state.lastActivity,
      }),
    },
  ),
);
