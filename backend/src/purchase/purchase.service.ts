import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Purchase validation & entitlement granting (spec §32 payment security).
 * - Server-authoritative: the client never grants its own entitlements (§98).
 * - Idempotent: keyed on platformTxId so a replayed receipt grants once (§111).
 */
@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initiate/validate a purchase. If the platformTxId was already processed,
   * returns the existing transaction unchanged (idempotency).
   */
  async processPurchase(params: {
    playerId: string;
    productId: string;
    platform: string;
    platformTxId: string;
  }) {
    const existing = await this.prisma.purchaseTransaction.findUnique({
      where: { platformTxId: params.platformTxId },
    });
    if (existing) {
      return { transaction: existing, idempotent: true };
    }

    const product = await this.prisma.catalogProduct.findUnique({
      where: { id: params.productId },
    });
    if (!product || !product.active) throw new NotFoundException('Product unavailable');

    // In production this is where the store receipt is verified with Apple/Google.
    const verified = await this.verifyReceipt(params.platform, params.platformTxId);

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseTransaction.create({
        data: {
          playerId: params.playerId,
          productId: product.id,
          platform: params.platform,
          platformTxId: params.platformTxId,
          priceUsdCents: product.priceUsdCents,
          status: verified ? 'GRANTED' : 'FAILED',
          validatedAt: verified ? new Date() : null,
          grantedAt: verified ? new Date() : null,
        },
      });

      if (verified && product.jadeGranted > 0) {
        await this.grantCurrency(tx, params.playerId, 'JADE', product.jadeGranted, created.id);
      }
      return created;
    });

    return { transaction, idempotent: false };
  }

  /** Grant currency with a ledger entry keyed by refId for auditability. */
  private async grantCurrency(
    tx: any,
    playerId: string,
    currency: 'JADE' | 'HONOUR' | 'FEAR' | 'CORRUPTION',
    amount: number,
    refId: string,
  ) {
    await tx.currencyBalance.upsert({
      where: { playerId_currency: { playerId, currency } },
      update: { amount: { increment: BigInt(amount) } },
      create: { playerId, currency, amount: BigInt(amount) },
    });
    await tx.currencyTransaction.create({
      data: { playerId, currency, delta: BigInt(amount), reason: 'PURCHASE', refId },
    });
  }

  // Placeholder receipt verification. Replace with real store validation.
  private async verifyReceipt(_platform: string, _platformTxId: string): Promise<boolean> {
    return true;
  }
}
