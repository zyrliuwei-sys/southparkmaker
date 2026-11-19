import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { atomic, AtomicGuardError, guard } from '@/core/db/atomic';
import { MAX_REFERENCE_BYTES } from '@/core/storage/character-reference';
import { aiTask } from '@/config/db/schema';
import type { CharacterResolution } from '@/lib/character-pricing';

export const CHARACTER_CREDIT_COST = 10;
export { MAX_REFERENCE_BYTES } from '@/core/storage/character-reference';
export const MAX_CHARACTER_BODY_BYTES =
  4 * Math.ceil(MAX_REFERENCE_BYTES / 3) + 8192;
export const CHARACTER_SCENE = 'character';
export const CHARACTER_MODELS = {
  falText: 'fal-ai/flux-1/schnell',
  falPhoto: 'fal-ai/flux/dev/image-to-image',
  replicateText: 'black-forest-labs/flux-schnell',
  seeapiText: 'seedream-5-5',
} as const;

export type CharacterInput = {
  prompt: string;
  aspectRatio: '1:1' | '3:4';
  resolution?: CharacterResolution;
  image?: {
    data: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  };
};
export type CharacterTask = typeof aiTask.$inferSelect;
export type CharacterProviderName = 'fal' | 'replicate' | 'seeapi';
export type CharacterProviderSelection = {
  name: CharacterProviderName;
  model: string;
  key: string;
  baseUrl?: string;
};
export type CharacterStatus =
  'pending' | 'processing' | 'success' | 'failed' | 'canceled';
export type CharacterResult = {
  taskId: string;
  status: CharacterStatus;
  images: string[];
  error?: string;
};

export function selectCharacterProvider(
  configs: Record<string, string>,
  photo: boolean
): CharacterProviderSelection | null {
  if (configs.seeapi_api_key?.trim()) {
    return {
      name: 'seeapi',
      model: CHARACTER_MODELS.seeapiText,
      key: configs.seeapi_api_key.trim(),
      baseUrl: configs.seeapi_base_url,
    };
  }
  if (configs.fal_api_key?.trim()) {
    return {
      name: 'fal',
      model: photo ? CHARACTER_MODELS.falPhoto : CHARACTER_MODELS.falText,
      key: configs.fal_api_key,
    };
  }
  if (!photo && configs.replicate_api_token?.trim()) {
    return {
      name: 'replicate',
      model: CHARACTER_MODELS.replicateText,
      key: configs.replicate_api_token,
    };
  }
  return null;
}

export function buildCharacterPrompt(prompt: string, photo = false) {
  return [
    'Create one original South Park-inspired 2D paper-cutout cartoon character.',
    'Large round head, oversized white oval eyes with tiny black pupils, simple small mouth, short rounded body, flat solid colors and crisp layered paper shapes.',
    'Full body centered, visible shoes, playful handmade animation style, snowy Colorado mountain town background with evergreen trees.',
    'Do not recreate any existing television character. No text, logos, watermarks, speech bubbles or photorealistic rendering.',
    photo
      ? 'Use the supplied photo only as a reference for the person’s hairstyle, skin tone and outfit; reimagine them as an original cutout character.'
      : '',
    `Character description: ${prompt}`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function characterImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images.slice(0, 1).flatMap((item) => {
    const value = typeof item === 'string' ? item : item?.imageUrl;
    if (typeof value !== 'string' || value.length > 2048) return [];
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password
        ? [url.href]
        : [];
    } catch {
      return [];
    }
  });
}

export function isCharacterTask(
  task: CharacterTask | null | undefined,
  userId: string
): task is CharacterTask {
  return Boolean(
    task &&
    task.userId === userId &&
    task.scene === CHARACTER_SCENE &&
    !task.deletedAt &&
    task.mediaType === 'image' &&
    ['fal', 'replicate', 'seeapi'].includes(task.provider) &&
    Object.values(CHARACTER_MODELS).includes(task.model as any)
  );
}

export function isTerminalCharacterStatus(status: string) {
  return ['success', 'failed', 'canceled'].includes(status);
}

export function publicCharacterResult(task: CharacterTask): CharacterResult {
  let images: string[] = [];
  if (task.status === 'success') {
    try {
      images = characterImageUrls(JSON.parse(task.taskResult || '{}').images);
    } catch {
      /* Invalid results expose no internal data. */
    }
  }
  return {
    taskId: task.id,
    status: task.status as CharacterStatus,
    images,
    ...(['failed', 'canceled'].includes(task.status)
      ? {
          error:
            'This character could not be generated. Your credits have been returned.',
        }
      : {}),
  };
}

export async function findCharacterTask(
  id: string
): Promise<CharacterTask | undefined> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, id))
    .limit(1);
  return task;
}

export async function findLatestCharacterTask(
  userId: string
): Promise<CharacterTask | undefined> {
  const [task] = await db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        eq(aiTask.scene, CHARACTER_SCENE),
        eq(aiTask.mediaType, 'image'),
        isNull(aiTask.deletedAt),
        inArray(aiTask.provider, ['fal', 'replicate', 'seeapi']),
        inArray(aiTask.model, Object.values(CHARACTER_MODELS))
      )
    )
    .orderBy(desc(aiTask.createdAt), desc(aiTask.id))
    .limit(1);
  return task;
}

export async function initializeCharacterTask(
  taskId: string,
  input: CharacterInput,
  referenceKey?: string
) {
  await db()
    .update(aiTask)
    .set({
      scene: CHARACTER_SCENE,
      options: JSON.stringify({
        aspectRatio: input.aspectRatio,
        photo: Boolean(input.image),
        resolution: input.resolution || '2K',
        ...(referenceKey ? { referenceKey } : {}),
      }),
    })
    .where(
      and(
        eq(aiTask.id, taskId),
        eq(aiTask.status, 'pending'),
        isNull(aiTask.taskId)
      )
    );
}

/** Terminal states never regress when a slow concurrent poll arrives later. */
export async function saveCharacterProgress(params: {
  taskId: string;
  status: CharacterStatus;
  upstreamId?: string;
  images?: string[];
}) {
  try {
    await atomic((q) => [
      guard({
        table: aiTask,
        column: 'userId',
        where: eq(aiTask.id, params.taskId),
        require: inArray(aiTask.status, ['pending', 'processing']),
        message: 'Character task already completed',
      }),
      q
        .update(aiTask)
        .set({
          status: params.status,
          ...(params.upstreamId ? { taskId: params.upstreamId } : {}),
          ...(params.images
            ? {
                taskResult: JSON.stringify({
                  images: characterImageUrls(params.images),
                }),
              }
            : {}),
        })
        .where(eq(aiTask.id, params.taskId)),
    ]);
  } catch (error) {
    if (!(error instanceof AtomicGuardError)) throw error;
  }
}
