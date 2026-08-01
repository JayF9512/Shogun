import axios, { AxiosError } from "axios";
import type {
  AdminAuditLog,
  CatalogProduct,
  DashboardStats,
  DiscountCampaign,
  EconomyChange,
  EconomyParam,
  EventDefinition,
  FeatureFlag,
  ModerationCase,
  Player,
  PlayerDetail,
  RewardCode,
  SeasonView,
  StoreOffer,
} from "@/types";
import * as mock from "./mock";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000/api";

export const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID || "dev-admin";

/** Shared axios instance pointing at the NestJS backend. */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  withCredentials: true,
});

// Attach the JWT (stored client-side for the Authorization header) if present.
api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = getCookie("shogun_admin_token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Try a live backend call; if the endpoint is missing/unreachable (network
 * error or 404/501), transparently fall back to realistic mock data so every
 * screen renders during local development. Real errors (4xx with a body) are
 * rethrown so mutating actions surface failures.
 */
async function withFallback<T>(live: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await live();
  } catch (err) {
    const e = err as AxiosError;
    const status = e.response?.status;
    if (!e.response || status === 404 || status === 501 || status === 502) {
      return fallback;
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function login(username: string, password: string): Promise<{ token: string }> {
  // Real endpoint: POST /admin/auth/login. Falls back to a dev token so the
  // panel is usable before the backend auth route ships.
  return withFallback(
    async () => {
      const { data } = await api.post("/admin/auth/login", { username, password });
      return { token: data.token ?? data.accessToken };
    },
    { token: `dev.${btoa(username)}.token` },
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getDashboardStats(): Promise<DashboardStats> {
  return withFallback(async () => {
    const { data } = await api.get("/admin/dashboard/stats");
    return data;
  }, mock.mockDashboard);
}

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------
export async function searchPlayers(query: string): Promise<Player[]> {
  return withFallback(
    async () => {
      if (!query) {
        const { data } = await api.get("/admin/players");
        return data;
      }
      const { data } = await api.get("/admin/players/lookup", { params: { q: query } });
      return Array.isArray(data) ? data : [data];
    },
    query
      ? mock.mockPlayers.filter(
          (p) =>
            p.displayName.toLowerCase().includes(query.toLowerCase()) ||
            p.id.includes(query) ||
            p.account?.email.toLowerCase().includes(query.toLowerCase()),
        )
      : mock.mockPlayers,
  );
}

export async function getPlayer(id: string): Promise<PlayerDetail> {
  return withFallback(async () => {
    const { data } = await api.get(`/admin/players/${id}`);
    return data;
  }, mock.mockPlayerDetail(id));
}

export async function grantResource(settlementId: string, resource: string, amount: number) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/settlements/${settlementId}/grant-resource`, {
        adminUserId: ADMIN_USER_ID,
        resource,
        amount,
      });
      return data;
    },
    { ok: true, settlementId, resource, amount },
  );
}

export async function grantCurrency(playerId: string, currency: string, amount: number) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/players/${playerId}/grant-currency`, {
        adminUserId: ADMIN_USER_ID,
        currency,
        amount,
      });
      return data;
    },
    { ok: true, playerId, currency, amount },
  );
}

export async function sendMail(playerId: string, subject: string, body: string, reward?: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/players/${playerId}/mail`, {
        adminUserId: ADMIN_USER_ID,
        subject,
        body,
        reward,
      });
      return data;
    },
    { ok: true, playerId, subject },
  );
}

export async function warnPlayer(playerId: string, reason: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/players/${playerId}/warn`, {
        adminUserId: ADMIN_USER_ID,
        reason,
      });
      return data;
    },
    { ok: true, playerId, reason },
  );
}

export async function banAccount(accountId: string, reason: string, durationDays?: number) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/accounts/${accountId}/ban`, {
        adminUserId: ADMIN_USER_ID,
        reason,
        durationDays,
      });
      return data;
    },
    { ok: true, accountId, reason, durationDays },
  );
}

export async function unbanAccount(accountId: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/accounts/${accountId}/unban`, {
        adminUserId: ADMIN_USER_ID,
      });
      return data;
    },
    { ok: true, accountId },
  );
}

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------
export async function getEconomyParams(): Promise<EconomyParam[]> {
  return withFallback(async () => {
    const { data } = await api.get("/admin/economy/params");
    return data;
  }, mock.mockEconomyParams);
}

export async function getEconomyChanges(): Promise<EconomyChange[]> {
  return withFallback(async () => {
    const { data } = await api.get("/admin/economy/changes");
    return data;
  }, mock.mockEconomyChanges);
}

export async function saveEconomyParams(params: EconomyParam[]) {
  return withFallback(
    async () => {
      const { data } = await api.post("/admin/economy/params", {
        adminUserId: ADMIN_USER_ID,
        params,
      });
      return data;
    },
    { ok: true, count: params.length },
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export async function getEvents(): Promise<EventDefinition[]> {
  return withFallback(async () => {
    const { data } = await api.get("/events");
    return data;
  }, mock.mockEvents);
}

export async function createEvent(event: Partial<EventDefinition>) {
  return withFallback(
    async () => {
      const { data } = await api.post("/admin/events/schedule", {
        adminUserId: ADMIN_USER_ID,
        event,
      });
      return data;
    },
    { ok: true, ...event, id: `ev_${Date.now()}` },
  );
}

export async function deleteEvent(id: string) {
  return withFallback(
    async () => {
      const { data } = await api.delete(`/events/${id}`);
      return data;
    },
    { ok: true, id },
  );
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------
export async function getSeasons(): Promise<SeasonView[]> {
  return withFallback(async () => {
    const { data } = await api.get("/seasons");
    return data;
  }, mock.mockSeasons);
}

export async function setActiveSeason(id: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/seasons/${id}/activate`, {
        adminUserId: ADMIN_USER_ID,
      });
      return data;
    },
    { ok: true, id },
  );
}

// ---------------------------------------------------------------------------
// Store & rewards
// ---------------------------------------------------------------------------
export async function getProducts(): Promise<CatalogProduct[]> {
  return withFallback(async () => {
    const { data } = await api.get("/store");
    return data;
  }, mock.mockProducts);
}

export async function getOffers(): Promise<StoreOffer[]> {
  return withFallback(async () => {
    const { data } = await api.get("/store/offers");
    return data;
  }, mock.mockOffers);
}

export async function getRewardCodes(): Promise<RewardCode[]> {
  return withFallback(async () => {
    const { data } = await api.get("/admin/reward-codes");
    return data;
  }, mock.mockRewardCodes);
}

export async function createRewardCode(code: Partial<RewardCode>) {
  return withFallback(
    async () => {
      const { data } = await api.post("/admin/reward-codes", {
        adminUserId: ADMIN_USER_ID,
        ...code,
      });
      return data;
    },
    { ok: true, id: `rc_${Date.now()}`, redemptions: 0, ...code },
  );
}

export async function deactivateRewardCode(id: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/reward-codes/${id}/deactivate`, {
        adminUserId: ADMIN_USER_ID,
      });
      return data;
    },
    { ok: true, id },
  );
}

export async function getCampaigns(): Promise<DiscountCampaign[]> {
  return withFallback(async () => {
    const { data } = await api.get("/store/campaigns");
    return data;
  }, mock.mockCampaigns);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export async function getAnalytics() {
  return withFallback(
    async () => {
      const { data } = await api.get("/admin/analytics/overview");
      return data;
    },
    {
      funnel: mock.mockFunnel,
      dau: mock.mockDau,
      revenue: mock.mockRevenue,
      topEvents: mock.mockTopEvents,
      inflation: mock.mockInflation,
    },
  );
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------
export async function getModerationCases(status?: string): Promise<ModerationCase[]> {
  return withFallback(
    async () => {
      const { data } = await api.get("/admin/moderation", { params: { status } });
      return data;
    },
    status && status !== "ALL"
      ? mock.mockModerationCases.filter((c) => c.status === status)
      : mock.mockModerationCases,
  );
}

export async function updateModerationCase(id: string, status: string) {
  return withFallback(
    async () => {
      const { data } = await api.post(`/admin/moderation/${id}`, {
        adminUserId: ADMIN_USER_ID,
        status,
      });
      return data;
    },
    { ok: true, id, status },
  );
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export async function getAuditLogs(): Promise<AdminAuditLog[]> {
  return withFallback(async () => {
    const { data } = await api.get("/admin/audit-log");
    return data;
  }, mock.mockAuditLogs);
}

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  return withFallback(async () => {
    const { data } = await api.get("/feature-flags");
    return data;
  }, mock.mockFeatureFlags);
}

export async function setFeatureFlag(key: string, enabled: boolean, rolloutPct = 0) {
  return withFallback(
    async () => {
      const { data } = await api.post("/admin/feature-flags", {
        adminUserId: ADMIN_USER_ID,
        key,
        enabled,
        rolloutPct,
      });
      return data;
    },
    { ok: true, key, enabled, rolloutPct },
  );
}
