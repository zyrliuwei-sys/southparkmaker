/** Only provider-owned raster hosts may be previewed or downloaded. */
export function isCharacterAssetUrl(value: string, provider: string) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    )
      return false;
    const hosts: Record<string, string> = {
      seeapi: 'assets.seeapi.com',
      fal: 'fal.media',
      replicate: 'replicate.delivery',
    };
    const host = hosts[provider];
    return Boolean(
      host &&
      (url.hostname === host ||
        (provider !== 'seeapi' && url.hostname.endsWith('.' + host)))
    );
  } catch {
    return false;
  }
}

export function generatedCharacterImage(
  result: string | null,
  provider: string
) {
  try {
    const images: unknown = JSON.parse(result || '{}')?.images;
    if (!Array.isArray(images)) return null;
    const first = images[0];
    const url: unknown = typeof first === 'string' ? first : first?.imageUrl;
    return typeof url === 'string' &&
      url.length <= 2048 &&
      isCharacterAssetUrl(url, provider)
      ? new URL(url).href
      : null;
  } catch {
    return null;
  }
}
