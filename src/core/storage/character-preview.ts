import {
  CHARACTER_DOWNLOAD_HEADERS,
  downloadCharacterAsset,
} from './character-download';

type ImagePipeline = {
  transform: (options: {
    width: number;
    height: number;
    fit: string;
  }) => ImagePipeline;
  output: (options: {
    format: string;
    quality: number;
  }) => Promise<{ response: () => Response }>;
};
type ImagesBinding = {
  input: (stream: ReadableStream<Uint8Array>) => ImagePipeline;
};

/** Unpaid visitors receive only a resized raster, never the upstream original. */
export async function previewCharacterAsset(
  url: string,
  provider: string,
  paid: boolean,
  fetcher: typeof fetch = fetch
) {
  const original = await downloadCharacterAsset(
    url,
    provider,
    'character-preview',
    fetcher
  );
  if (!original.ok || !original.body) return original;
  if (paid) {
    const headers = new Headers(original.headers);
    headers.set('Content-Disposition', 'inline');
    return new Response(original.body, { headers });
  }
  const images = (globalThis as { __CF_ENV__?: { IMAGES?: ImagesBinding } })
    .__CF_ENV__?.IMAGES;
  if (!images) {
    await original.body.cancel();
    return new Response('Preview temporarily unavailable', {
      status: 503,
      headers: CHARACTER_DOWNLOAD_HEADERS,
    });
  }
  try {
    const output = await images
      .input(original.body)
      .transform({ width: 480, height: 480, fit: 'scale-down' })
      .output({ format: 'image/webp', quality: 50 });
    const response = output.response();
    return new Response(response.body, {
      headers: {
        ...CHARACTER_DOWNLOAD_HEADERS,
        'Content-Type': 'image/webp',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return new Response('Preview temporarily unavailable', {
      status: 503,
      headers: CHARACTER_DOWNLOAD_HEADERS,
    });
  }
}
