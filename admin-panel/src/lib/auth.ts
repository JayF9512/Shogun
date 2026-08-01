// Lightweight client-side JWT/session helpers.
// The token is stored in a cookie so the API interceptor can attach it and so
// middleware/route guards can read it. For production, the backend should set
// an httpOnly cookie on POST /admin/auth/login; this client cookie mirrors it
// for local development where the backend auth route may not yet exist.

export const TOKEN_COOKIE = "shogun_admin_token";

export function setToken(token: string, maxAgeSeconds = 60 * 60 * 8) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(
    token,
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + TOKEN_COOKIE + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function clearToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
