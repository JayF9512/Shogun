import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seasonPass, seasonZero, SeasonPassTier } from 'shogun-content';

/** Reward keys that map directly onto a CurrencyType balance. */
const CURRENCY_KEYS = ['JADE', 'HONOUR', 'FEAR', 'CORRUPTION'] as const;
type CurrencyKey = (typeof CURRENCY_KEYS)[number];

/**
 * Season Pass progress — server-authoritative per-player track state (spec §71).
 *
 * The tier ladder (points thresholds + rewards) is defined in the shared
 * `shogun-content` package; this service owns the *player state* (points earned,
 * premium unlock, claimed tiers) and grants rewards idempotently.
 */
@Injectable()
export class SeasonPassService {
  constructor(private readonly prisma: PrismaService) {}

  /** Static ladder definition (source of truth = content package). */
  definition() {
    return {
      season: { key: seasonZero.key, name: seasonZero.name },
      tiers: seasonPass,
      maxTier: seasonPass.length,
    };
  }

  /** Highest tier fully earned for a given points total. */
  static currentTier(points: number): number {
    let tier = 0;
    for (const t of seasonPass) {
      if (points >= t.requiredPoints) tier = t.tier;
      else break;
    }
    return tier;
  }

  private async ensureProgress(playerId: string, seasonKey: string) {
    const player = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundException('Player not found: ' + playerId);
    return this.prisma.seasonPassProgress.upsert({
      where: { playerId_seasonKey: { playerId, seasonKey } },
      create: { playerId, seasonKey },
      update: {},
    });
  }

  /** Player progress + derived current tier and claimable tiers per track. */
  async getProgress(playerId: string, seasonKey = seasonZero.key) {
    const progress = await this.ensureProgress(playerId, seasonKey);
    const currentTier = SeasonPassService.currentTier(progress.points);
    const claimableFree = seasonPass
      .filter((t) => t.tier <= currentTier && !progress.claimedFree.includes(t.tier))
      .map((t) => t.tier);
    const claimablePremium = progress.premium
      ? seasonPass
          .filter((t) => t.tier <= currentTier && !progress.claimedPremium.includes(t.tier))
          .map((t) => t.tier)
      : [];
    return {
      playerId,
      seasonKey,
      points: progress.points,
      premium: progress.premium,
      currentTier,
      maxTier: seasonPass.length,
      claimedFree: progress.claimedFree,
      claimedPremium: progress.claimedPremium,
      claimableFree,
      claimablePremium,
    };
  }

  /** Add pass points (server-authoritative; earned via play). */
  async addPoints(playerId: string, amount: number, seasonKey = seasonZero.key) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }
    await this.ensureProgress(playerId, seasonKey);
    await this.prisma.seasonPassProgress.update({
      where: { playerId_seasonKey: { playerId, seasonKey } },
      data: { points: { increment: Math.floor(amount) } },
    });
    return this.getProgress(playerId, seasonKey);
  }

  /** Unlock the premium track (called after a verified pass purchase). */
  async unlockPremium(playerId: string, seasonKey = seasonZero.key) {
    await this.ensureProgress(playerId, seasonKey);
    await this.prisma.seasonPassProgress.update({
      where: { playerId_seasonKey: { playerId, seasonKey } },
      data: { premium: true },
    });
    return this.getProgress(playerId, seasonKey);
  }

  /**
   * Claim a tier reward on the free or premium track. Idempotent: a tier can
   * only be claimed once per track. Currency rewards are credited atomically;
   * non-currency rewards (resources, shards) are returned for downstream grant.
   */
  async claim(
    playerId: string,
    tier: number,
    track: 'free' | 'premium',
    seasonKey = seasonZero.key,
  ) {
    const progress = await this.ensureProgress(playerId, seasonKey);
    const def: SeasonPassTier | undefined = seasonPass.find((t) => t.tier === tier);
    if (!def) throw new NotFoundException(`Unknown pass tier ${tier}`);

    const currentTier = SeasonPassService.currentTier(progress.points);
    if (tier > currentTier) {
      throw new BadRequestException(`Tier ${tier} not yet reached`);
    }
    if (track === 'premium' && !progress.premium) {
      throw new BadRequestException('Premium track not unlocked');
    }
    const claimedList = track === 'free' ? progress.claimedFree : progress.claimedPremium;
    if (claimedList.includes(tier)) {
      throw new BadRequestException(`Tier ${tier} already claimed on ${track} track`);
    }

    const reward = track === 'free' ? def.freeReward : def.premiumReward;

    await this.prisma.$transaction(async (tx) => {
      // Credit currency rewards onto the player's balances.
      for (const [key, value] of Object.entries(reward)) {
        if ((CURRENCY_KEYS as readonly string[]).includes(key) && value > 0) {
          const currency = key as CurrencyKey;
          await tx.currencyBalance.upsert({
            where: { playerId_currency: { playerId, currency } },
            create: { playerId, currency, amount: BigInt(value) },
            update: { amount: { increment: BigInt(value) } },
          });
          await tx.currencyTransaction.create({
            data: {
              playerId,
              currency,
              delta: BigInt(value),
              reason: `season_pass:${seasonKey}:${track}:tier${tier}`,
              refId: `pass:${seasonKey}:${track}:${tier}`,
            },
          });
        }
      }
      // Mark the tier claimed on the chosen track.
      await tx.seasonPassProgress.update({
        where: { playerId_seasonKey: { playerId, seasonKey } },
        data:
          track === 'free'
            ? { claimedFree: { push: tier } }
            : { claimedPremium: { push: tier } },
      });
    });

    return { playerId, seasonKey, tier, track, reward, claimed: true };
  }
}
