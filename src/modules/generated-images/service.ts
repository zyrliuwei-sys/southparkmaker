import { and, count, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, user } from '@/config/db/schema';
import type { PageResult } from '@/lib/api-client';
import { generatedCharacterImage } from '@/lib/character-assets';
import {
  generatedImagesQuery,
  type GeneratedImage,
  type GeneratedImagesQuery,
} from '@/lib/generated-images';
import { keywordMatch } from '@/lib/sql-search';

// Include existing character generations; reference photos and provider diagnostics
// never leave this service. Browser-only manual designs have no server record.
const visible = () =>
  and(
    eq(user.type, 'user'),
    eq(aiTask.mediaType, 'image'),
    eq(aiTask.scene, 'character'),
    isNull(aiTask.deletedAt)
  );

export async function listGeneratedImages(
  input: GeneratedImagesQuery
): Promise<PageResult<GeneratedImage>> {
  const { page, pageSize, search, userId, status } =
    generatedImagesQuery.parse(input);
  const where = and(
    visible(),
    userId ? eq(aiTask.userId, userId) : undefined,
    status ? eq(aiTask.status, status) : undefined,
    keywordMatch(search, {
      contains: [user.email, user.name, aiTask.prompt],
      exact: [user.id, aiTask.id],
    })
  );
  const [rows, totals] = await Promise.all([
    db()
      .select({
        id: aiTask.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        prompt: aiTask.prompt,
        status: aiTask.status,
        provider: aiTask.provider,
        model: aiTask.model,
        createdAt: aiTask.createdAt,
        taskResult: aiTask.taskResult,
      })
      .from(aiTask)
      .innerJoin(user, eq(user.id, aiTask.userId))
      .where(where)
      .orderBy(desc(aiTask.createdAt), desc(aiTask.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db()
      .select({ n: count() })
      .from(aiTask)
      .innerJoin(user, eq(user.id, aiTask.userId))
      .where(where),
  ]);
  return {
    items: rows.map(
      ({ taskResult, createdAt, ...row }: (typeof rows)[number]) => ({
        ...row,
        createdAt: createdAt.toISOString(),
        imageUrl:
          row.status === 'success'
            ? generatedCharacterImage(taskResult, row.provider)
            : null,
      })
    ),
    total: Number(totals[0]?.n ?? 0),
  };
}

export async function findGeneratedImage(id: string) {
  const [row] = await db()
    .select({
      provider: aiTask.provider,
      taskResult: aiTask.taskResult,
    })
    .from(aiTask)
    .innerJoin(user, eq(user.id, aiTask.userId))
    .where(and(visible(), eq(aiTask.id, id), eq(aiTask.status, 'success')))
    .limit(1);
  if (!row) return null;
  const imageUrl = generatedCharacterImage(row.taskResult, row.provider);
  return imageUrl ? { imageUrl, provider: row.provider } : null;
}
