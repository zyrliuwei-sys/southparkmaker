import { Buffer } from 'node:buffer';
import { z } from 'zod';

import {
  MAX_REFERENCE_BYTES,
  type CharacterInput,
} from '@/modules/characters/service';

const referenceSchema = z.strictObject({
  data: z
    .string()
    .min(12)
    .max(4 * Math.ceil(MAX_REFERENCE_BYTES / 3)),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const characterInputSchema = z
  .strictObject({
    prompt: z.string().trim().max(1500).default(''),
    aspectRatio: z.enum(['1:1', '3:4']).default('1:1'),
    resolution: z.enum(['1K', '1.5K', '2K']).default('2K'),
    image: referenceSchema.optional(),
  })
  .superRefine((input, ctx) => {
    if (!input.image && input.prompt.length < 3)
      ctx.addIssue({
        code: 'custom',
        path: ['prompt'],
        message: 'Describe your character.',
      });
  });

export function validateReferenceImage(
  image: NonNullable<CharacterInput['image']>
) {
  if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data) ||
    image.data.length % 4 !== 0
  ) {
    throw new Error('Choose a valid PNG, JPEG, or WebP photo.');
  }
  const bytes = Buffer.from(image.data, 'base64');
  if (
    !bytes.length ||
    bytes.length > MAX_REFERENCE_BYTES ||
    bytes.toString('base64') !== image.data
  ) {
    throw new Error('Choose a photo smaller than 3 MB.');
  }
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const webp =
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(
    (image.mimeType === 'image/png' && png) ||
    (image.mimeType === 'image/jpeg' && jpeg) ||
    (image.mimeType === 'image/webp' && webp)
  )) {
    throw new Error('The photo does not match its image type.');
  }
  return `data:${image.mimeType};base64,${image.data}`;
}
