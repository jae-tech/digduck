import { redirect } from "@tanstack/react-router";
import { useLicenseStore } from "@/features/license/store/license.store";

export interface AuthGuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function createAuthGuard(options: AuthGuardOptions = {}) {
  const {
    requireAuth = true,
    requireAdmin = false,
    redirectTo,
  } = options;

  return () => {
    const state = useLicenseStore.getState();
    const isAuthenticated = state.isLicenseValid && !!state.licenseKey && !state.isLicenseExpired();
    const isAdmin = state.isAdminUser();

    // 인증이 필요한 경우 체크
    if (requireAuth && !isAuthenticated) {
      throw redirect({ to: redirectTo || "/license" });
    }

    // 관리자 권한이 필요한 경우 체크
    if (requireAdmin) {
      if (!isAuthenticated) {
        throw redirect({ to: "/license" });
      }
      if (!isAdmin) {
        throw redirect({ to: redirectTo || "/crawler" });
      }
    }
  };
}

// 자주 사용되는 가드들을 미리 정의
export const requireAuth = createAuthGuard({
  requireAuth: true,
  requireAdmin: false,
});

export const requireAdmin = createAuthGuard({
  requireAuth: true,
  requireAdmin: true,
});

export const requireUser = createAuthGuard({
  requireAuth: true,
  requireAdmin: false,
});