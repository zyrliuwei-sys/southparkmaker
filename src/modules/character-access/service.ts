import { and, eq, gt, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

import { db } from '@/core/db';
import { atomic } from '@/core/db/atomic';
import { characterAccess, order } from '@/config/db/schema';
import { characterProducts } from '@/config/pricing';

/** Signup-only grant. Repeated auth hooks never replenish a claimed trial. */
export async function grantWelcomeCharacterTrial(userId: string) {
  const exists = async () =>
    (
      await db()
        .select({ id: characterAccess.userId })
        .from(characterAccess)
        .where(eq(characterAccess.userId, userId))
        .limit(1)
    ).length > 0;
  if (await exists()) return;
  try {
    await atomic((q) => [q.insert(characterAccess).values({ userId })]);
  } catch (error) {
    if (!(await exists())) throw error;
  }
}

export async function hasPaidCharacterDownload(userId: string) {
  const [paid] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.status, 'paid'),
        isNotNull(order.paidAt),
        gt(sql<number>`coalesce(${order.paymentAmount}, ${order.amount})`, 0),
        inArray(
          order.productId,
          characterProducts.map((p) => p.productId)
        ),
        isNull(order.deletedAt)
      )
    )
    .limit(1);
  return Boolean(paid);
}

export async function getCharacterAccess(userId: string) {
  const [[trial], downloadUnlocked] = await Promise.all([
    db()
      .select()
      .from(characterAccess)
      .where(eq(characterAccess.userId, userId))
      .limit(1),
    hasPaidCharacterDownload(userId),
  ]);
  return {
    freeGenerationAvailable: Boolean(trial && !trial.trialTaskId),
    downloadUnlocked,
  };
}

/** An old failure/refund cannot release the reservation of a newer request. */
export async function releaseCharacterTrial(userId: string, taskId: string) {
  await atomic((q) => [
    q
      .update(characterAccess)
      .set({ trialTaskId: null })
      .where(
        and(
          eq(characterAccess.userId, userId),
          eq(characterAccess.trialTaskId, taskId)
        )
      ),
  ]);
}
