// Realistic placeholder datasets used where the backend endpoint is not yet
// implemented (spec §28 admin surfaces). Read paths fall back to these so the
// UI is always fully populated during local development.
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

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();
const DAY = 86_400_000;

export const mockDashboard: DashboardStats = {
  totalPlayers: 48213,
  dau: 9124,
  mau: 31288,
  revenueToday: 738400, // cents => $7,384.00
  activeMarches: 412,
  activeBattles: 37,
};

export const mockPlayers: Player[] = Array.from({ length: 24 }).map((_, i) => {
  const industrial = i % 4 === 0 ? (i % 10) + 1 : 0;
  return {
    id: `pl_${(1000 + i).toString(16)}`,
    displayName: [
      "TakedaShingen",
      "OdaNobunaga",
      "DateMasamune",
      "UesugiKenshin",
      "SanadaYukimura",
      "TokugawaIeyasu",
      "MoriMotonari",
      "ShimazuYoshihiro",
    ][i % 8] + (i > 7 ? `_${i}` : ""),
    level: industrial > 0 ? 30 : 8 + ((i * 3) % 22),
    tier: industrial > 0 ? "INDUSTRIAL" : "STANDARD",
    industrialLevel: industrial,
    power: String(120000 + i * 48213),
    vipLevel: i % 13,
    online: i % 3 === 0,
    lastSeenAt: iso(-(i * 37 * 60000)),
    account: {
      id: `ac_${i}`,
      email: `player${i}@shogun.example`,
      role: "PLAYER",
      banned: i % 11 === 0 && i !== 0,
      banReason: i % 11 === 0 && i !== 0 ? "Botting — automated march patterns" : null,
      lastLoginAt: iso(-(i * 37 * 60000)),
    },
    currencyBalances: [
      { id: `cb_${i}_j`, currency: "JADE", amount: String(500 + i * 130) },
      { id: `cb_${i}_h`, currency: "HONOUR", amount: String(2000 + i * 900) },
      { id: `cb_${i}_f`, currency: "FEAR", amount: String(i * 210) },
      { id: `cb_${i}_c`, currency: "CORRUPTION", amount: String(i * 12) },
    ],
  };
});

export function mockPlayerDetail(id: string): PlayerDetail {
  const base = mockPlayers.find((p) => p.id === id) ?? mockPlayers[0];
  return {
    ...base,
    id,
    settlement: {
      id: `st_${id}`,
      name: "Kuroyama Castle",
      tenshuLevel: base.tier === "INDUSTRIAL" ? 30 : base.level,
    },
    resources: [
      { id: "r1", resource: "RICE", amount: "1240000", capacity: "2000000", productionPerHour: 12400 },
      { id: "r2", resource: "WOOD", amount: "980000", capacity: "2000000", productionPerHour: 9800 },
      { id: "r3", resource: "STONE", amount: "760500", capacity: "2000000", productionPerHour: 7600 },
      { id: "r4", resource: "IRON", amount: "402300", capacity: "1500000", productionPerHour: 4020 },
      { id: "r5", resource: "CHARCOAL", amount: "150200", capacity: "1000000", productionPerHour: 1500 },
      {
        id: "r6",
        resource: "CATALYST",
        amount: base.tier === "INDUSTRIAL" ? "42000" : "0",
        capacity: "500000",
        productionPerHour: base.tier === "INDUSTRIAL" ? 420 : 0,
      },
    ],
    heroes: [
      { id: "h1", name: "Hattori Hanzō", level: 42, stars: 5, rarity: "LEGENDARY" },
      { id: "h2", name: "Tomoe Gozen", level: 38, stars: 4, rarity: "EPIC" },
      { id: "h3", name: "Saitō Musashibō", level: 27, stars: 3, rarity: "RARE" },
    ],
    pets: [
      { id: "p1", name: "Kitsune", level: 12, evolution: 2 },
      { id: "p2", name: "Baku", level: 7, evolution: 1 },
    ],
    troops: [
      { troopClass: "SAMURAI_GUARD", count: 24500, wounded: 1200 },
      { troopClass: "YUMI_ARCHERS", count: 18800, wounded: 640 },
      { troopClass: "KOMAINU_RIDERS", count: 9600, wounded: 310 },
    ],
    marches: [
      { id: "m1", state: "MARCHING", targetX: 412, targetY: 88, arrivesAt: iso(15 * 60000) },
      { id: "m2", state: "GATHERING", targetX: 220, targetY: 301, arrivesAt: iso(52 * 60000) },
    ],
    transactions: Array.from({ length: 20 }).map((_, i) => ({
      id: `tx_${i}`,
      currency: (["JADE", "HONOUR", "FEAR"] as const)[i % 3],
      delta: String((i % 4 === 0 ? -1 : 1) * (100 + i * 37)),
      reason: ["ADMIN_GRANT", "PURCHASE", "EVENT_REWARD", "COMBAT", "SPEEDUP"][i % 5],
      createdAt: iso(-(i * 3 * 3600000)),
    })),
  };
}

export const mockAuditLogs: AdminAuditLog[] = Array.from({ length: 40 }).map((_, i) => ({
  id: `al_${i}`,
  adminUserId: `admin_${i % 3}`,
  adminName: ["ops.hana", "gm.ren", "support.kaito"][i % 3],
  action: [
    "GRANT_CURRENCY",
    "BAN",
    "SET_FEATURE_FLAG",
    "GRANT_RESOURCE",
    "SCHEDULE_EVENT",
    "UNBAN",
    "SEND_MAIL",
  ][i % 7],
  targetType: ["Player", "Account", "FeatureFlag", "Settlement", "EventDefinition"][i % 5],
  targetId: `tgt_${(2000 + i).toString(16)}`,
  metadata: { note: "auto-generated sample entry", amount: 100 + i * 5 },
  createdAt: iso(-(i * 47 * 60000)),
}));

export const mockFeatureFlags: FeatureFlag[] = [
  { id: "ff1", key: "industrial_ascension", description: "Enable Industrial Ascension (I1–I10)", enabled: true, rolloutPct: 100, environment: "PRODUCTION" },
  { id: "ff2", key: "clan_wars_v2", description: "New clan war ruleset", enabled: false, rolloutPct: 0, environment: "STAGING" },
  { id: "ff3", key: "store_lunar_sale", description: "Lunar New Year store banner", enabled: true, rolloutPct: 50, environment: "PRODUCTION" },
  { id: "ff4", key: "pet_evolution", description: "Pet evolution system", enabled: true, rolloutPct: 100, environment: "PRODUCTION" },
  { id: "ff5", key: "hero_relationships", description: "Hero bond/rival relationships", enabled: false, rolloutPct: 10, environment: "DEVELOPMENT" },
  { id: "ff6", key: "world_boss", description: "Server-wide world boss event", enabled: false, rolloutPct: 0, environment: "STAGING" },
];

export const mockEvents: EventDefinition[] = [
  { id: "ev1", key: "spring_conquest", name: "Spring Conquest", type: "PVP", startsAt: iso(-2 * DAY), endsAt: iso(5 * DAY), maxParticipants: 5000, participantCount: 3120, status: "ACTIVE", rewards: { tier1: "5000 JADE" } },
  { id: "ev2", key: "harvest_festival", name: "Harvest Festival", type: "COLLECTION", startsAt: iso(3 * DAY), endsAt: iso(10 * DAY), maxParticipants: 10000, participantCount: 0, status: "SCHEDULED", rewards: {} },
  { id: "ev3", key: "oni_invasion", name: "Oni Invasion", type: "PVE", startsAt: iso(-12 * DAY), endsAt: iso(-4 * DAY), maxParticipants: 8000, participantCount: 7412, status: "ENDED", rewards: {} },
];

export const mockSeasons: SeasonView[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `sn_${i}`,
  index: i + 1,
  name: [
    "Rising Sun", "Iron Blossom", "Crimson Tide", "Jade Dynasty", "Thunder Gods",
    "Frozen Peaks", "Silk Road", "Dragon's Wake", "Ronin's Path", "Celestial War",
    "Eclipse", "Shogunate",
  ][i],
  industrialCap: Math.min(10, i + 1),
  startsAt: iso((i - 1) * 30 * DAY),
  endsAt: iso(i * 30 * DAY),
  active: i === 0,
}));

export const mockProducts: CatalogProduct[] = [
  { id: "cp1", sku: "jade_small", name: "Pouch of Jade", description: "500 Jade", priceUsdCents: 499, jadeGranted: 500, active: true },
  { id: "cp2", sku: "jade_medium", name: "Chest of Jade", description: "1,200 Jade", priceUsdCents: 999, jadeGranted: 1200, active: true },
  { id: "cp3", sku: "jade_large", name: "Vault of Jade", description: "6,500 Jade", priceUsdCents: 4999, jadeGranted: 6500, active: true },
  { id: "cp4", sku: "starter_pack", name: "Daimyo Starter Pack", description: "Jade + resources + hero shard", priceUsdCents: 299, jadeGranted: 300, active: true },
  { id: "cp5", sku: "monthly_pass", name: "Shogun Monthly Pass", description: "Daily Jade for 30 days", priceUsdCents: 999, jadeGranted: 3000, active: false },
];

export const mockOffers: StoreOffer[] = [
  { id: "so1", productId: "cp3", productName: "Vault of Jade", startsAt: iso(-1 * DAY), endsAt: iso(6 * DAY), active: true, percentOff: 20 },
  { id: "so2", productId: "cp4", productName: "Daimyo Starter Pack", startsAt: iso(-3 * DAY), endsAt: iso(27 * DAY), active: true, percentOff: 0 },
];

export const mockRewardCodes: RewardCode[] = [
  { id: "rc1", code: "SHOGUN2026", contents: { JADE: 500 }, maxRedemptions: 10000, redemptions: 4231, expiresAt: iso(30 * DAY) },
  { id: "rc2", code: "WELCOMEBACK", contents: { JADE: 200, RICE: 50000 }, maxRedemptions: 5000, redemptions: 5000, expiresAt: iso(-2 * DAY) },
  { id: "rc3", code: "LUNARNEWYEAR", contents: { JADE: 888 }, maxRedemptions: 20000, redemptions: 12045, expiresAt: iso(12 * DAY) },
];

export const mockCampaigns: DiscountCampaign[] = [
  { id: "dc1", name: "Lunar New Year", percentOff: 20, startsAt: iso(-1 * DAY), endsAt: iso(6 * DAY) },
  { id: "dc2", name: "Weekend Flash", percentOff: 15, startsAt: iso(4 * DAY), endsAt: iso(6 * DAY) },
];

export const mockModerationCases: ModerationCase[] = Array.from({ length: 14 }).map((_, i) => ({
  id: `mc_${i}`,
  playerId: mockPlayers[i % mockPlayers.length].id,
  playerName: mockPlayers[i % mockPlayers.length].displayName,
  reason: [
    "Offensive clan name",
    "Chat abuse reported x4",
    "Suspected third-party automation",
    "Real-money trading advertisement",
    "Exploiting march speed bug",
  ][i % 5],
  reporter: ["system.anticheat", "player_report", "gm.ren"][i % 3],
  status: (["OPEN", "OPEN", "INVESTIGATING", "ACTION_TAKEN", "DISMISSED"] as const)[i % 5],
  createdAt: iso(-(i * 5 * 3600000)),
}));

export const mockEconomyParams: EconomyParam[] = [
  { key: "prod_rice", label: "Rice production / hr (base)", category: "Production", value: 1000, unit: "/hr" },
  { key: "prod_wood", label: "Wood production / hr (base)", category: "Production", value: 900, unit: "/hr" },
  { key: "prod_stone", label: "Stone production / hr (base)", category: "Production", value: 800, unit: "/hr" },
  { key: "prod_iron", label: "Iron production / hr (base)", category: "Production", value: 500, unit: "/hr" },
  { key: "prod_charcoal", label: "Charcoal production / hr (base)", category: "Production", value: 300, unit: "/hr" },
  { key: "prod_catalyst", label: "Catalyst production / hr (Industrial)", category: "Production", value: 120, unit: "/hr" },
  { key: "combat_counter_bonus", label: "Combat counter bonus", category: "Combat", value: 25, unit: "%" },
  { key: "level_mult_per_level", label: "Production bonus per building level", category: "Production", value: 10, unit: "%" },
  { key: "ascension_catalyst_cost", label: "Industrial Ascension catalyst cost (I1)", category: "Ascension", value: 50000, unit: "catalyst" },
  { key: "ascension_duration", label: "Industrial Ascension duration (I1)", category: "Ascension", value: 86400, unit: "sec" },
  { key: "march_base_speed", label: "March base speed", category: "March", value: 100, unit: "u/s" },
  { key: "march_komainu_bonus", label: "Komainu march speed bonus", category: "March", value: 15, unit: "%" },
];

export const mockEconomyChanges: EconomyChange[] = [
  { id: "ec1", key: "combat_counter_bonus", from: 20, to: 25, adminName: "gm.ren", createdAt: iso(-2 * DAY) },
  { id: "ec2", key: "prod_rice", from: 900, to: 1000, adminName: "ops.hana", createdAt: iso(-5 * DAY) },
  { id: "ec3", key: "march_base_speed", from: 90, to: 100, adminName: "ops.hana", createdAt: iso(-9 * DAY) },
];

// ---- Analytics placeholder series ----
export const mockFunnel = [
  { stage: "Install", value: 100000 },
  { stage: "Login", value: 72000 },
  { stage: "Tutorial", value: 61000 },
  { stage: "First battle", value: 44000 },
  { stage: "Level 30", value: 12500 },
  { stage: "Industrial Ascension", value: 4800 },
];

export const mockDau = Array.from({ length: 30 }).map((_, i) => ({
  day: new Date(now - (29 - i) * DAY).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
  users: 7000 + Math.round(2000 * Math.sin(i / 3)) + i * 40,
}));

export const mockRevenue = Array.from({ length: 30 }).map((_, i) => ({
  day: new Date(now - (29 - i) * DAY).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
  usd: 4000 + Math.round(1500 * Math.cos(i / 4)) + i * 30,
}));

export const mockTopEvents = [
  { name: "Spring Conquest", participants: 3120 },
  { name: "Oni Invasion", participants: 7412 },
  { name: "Dragon's Wake", participants: 5210 },
  { name: "Harvest Festival", participants: 2890 },
];

export const mockInflation = [
  { resource: "RICE", index: 1.04 },
  { resource: "WOOD", index: 1.11 },
  { resource: "STONE", index: 0.98 },
  { resource: "IRON", index: 1.22 },
  { resource: "CHARCOAL", index: 1.07 },
  { resource: "CATALYST", index: 1.35 },
];
