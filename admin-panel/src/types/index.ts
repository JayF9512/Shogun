// TypeScript interfaces mirroring the backend Prisma models / DTOs.
// BigInt columns are serialised as strings over JSON.

export type ResourceType = "RICE" | "WOOD" | "STONE" | "IRON" | "CHARCOAL" | "CATALYST";
export const RESOURCE_TYPES: ResourceType[] = [
  "RICE",
  "WOOD",
  "STONE",
  "IRON",
  "CHARCOAL",
  "CATALYST",
];

export type CurrencyType = "JADE" | "HONOUR" | "FEAR" | "CORRUPTION";
export const CURRENCY_TYPES: CurrencyType[] = ["JADE", "HONOUR", "FEAR", "CORRUPTION"];

export type TroopClass = "SAMURAI_GUARD" | "YUMI_ARCHERS" | "KOMAINU_RIDERS";
export type ProgressionTier = "STANDARD" | "INDUSTRIAL";
export type ModerationStatus = "OPEN" | "INVESTIGATING" | "ACTION_TAKEN" | "DISMISSED";
export type EnvironmentTier = "DEVELOPMENT" | "STAGING" | "PRODUCTION";

export interface Account {
  id: string;
  email: string;
  role: "PLAYER" | "MODERATOR" | "ADMIN";
  banned: boolean;
  banReason?: string | null;
  lastLoginAt?: string | null;
}

export interface CurrencyBalance {
  id: string;
  currency: CurrencyType;
  amount: string;
}

export interface ResourceStock {
  id: string;
  resource: ResourceType;
  amount: string;
  capacity: string;
  productionPerHour: number;
}

export interface Settlement {
  id: string;
  name: string;
  tenshuLevel: number;
  resourceStates?: ResourceStock[];
}

export interface Player {
  id: string;
  displayName: string;
  level: number;
  tier: ProgressionTier;
  industrialLevel: number;
  power: string;
  vipLevel: number;
  online: boolean;
  lastSeenAt?: string | null;
  account?: Account;
  settlement?: Settlement | null;
  currencyBalances?: CurrencyBalance[];
  createdAt?: string;
}

export interface PlayerHeroView {
  id: string;
  name: string;
  level: number;
  stars: number;
  rarity: string;
}

export interface PlayerPetView {
  id: string;
  name: string;
  level: number;
  evolution: number;
}

export interface TroopCount {
  troopClass: TroopClass;
  count: number;
  wounded: number;
}

export interface MarchView {
  id: string;
  state: string;
  targetX: number;
  targetY: number;
  arrivesAt?: string | null;
}

export interface CurrencyTx {
  id: string;
  currency: CurrencyType;
  delta: string;
  reason: string;
  createdAt: string;
}

export interface PlayerDetail extends Player {
  heroes: PlayerHeroView[];
  pets: PlayerPetView[];
  troops: TroopCount[];
  marches: MarchView[];
  transactions: CurrencyTx[];
  resources: ResourceStock[];
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  adminName?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description?: string | null;
  enabled: boolean;
  rolloutPct: number;
  environment: EnvironmentTier;
  updatedAt?: string;
}

export interface EventDefinition {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  type?: string;
  startsAt: string;
  endsAt: string;
  maxParticipants?: number;
  participantCount?: number;
  rewards?: Record<string, unknown> | null;
  status?: "SCHEDULED" | "ACTIVE" | "ENDED";
}

export interface SeasonView {
  id: string;
  index: number;
  name: string;
  industrialCap: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  priceUsdCents: number;
  jadeGranted: number;
  active: boolean;
}

export interface StoreOffer {
  id: string;
  productId: string;
  productName?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  percentOff?: number;
}

export interface RewardCode {
  id: string;
  code: string;
  contents: Record<string, unknown>;
  maxRedemptions: number;
  redemptions: number;
  expiresAt?: string | null;
}

export interface DiscountCampaign {
  id: string;
  name: string;
  percentOff: number;
  startsAt: string;
  endsAt: string;
}

export interface ModerationCase {
  id: string;
  playerId: string;
  playerName?: string;
  reason: string;
  reporter?: string;
  status: ModerationStatus;
  createdAt: string;
}

export interface EconomyParam {
  key: string;
  label: string;
  category: string;
  value: number;
  unit?: string;
}

export interface EconomyChange {
  id: string;
  key: string;
  from: number;
  to: number;
  adminName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalPlayers: number;
  dau: number;
  mau: number;
  revenueToday: number; // cents
  activeMarches: number;
  activeBattles: number;
}
