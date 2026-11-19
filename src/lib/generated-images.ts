import { z } from 'zod';

export const GENERATED_IMAGE_STATUSES = [
  'success',
  'pending',
  'processing',
  'failed',
  'canceled',
] as const;
export type GeneratedImageStatus = (typeof GENERATED_IMAGE_STATUSES)[number];
export const generatedImagesQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(500).optional(),
    userId: z.string().min(1).max(191).optional(),
    status: z.enum(GENERATED_IMAGE_STATUSES).optional(),
  })
  .strict();
export type GeneratedImagesQuery = z.infer<typeof generatedImagesQuery>;
export interface GeneratedImage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  prompt: string;
  status: string;
  provider: string;
  model: string;
  createdAt: string;
  imageUrl: string | null;
}
