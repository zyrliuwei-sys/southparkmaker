import {
  AIMediaType,
  AITaskStatus,
  type AIConfigs,
  type AIGenerateParams,
  type AIProvider,
  type AITaskResult,
} from './types';

export class SeeAPIError extends Error {
  constructor(
    readonly status: number,
    readonly definitive: boolean
  ) {
    super(`SeeAPI request failed (HTTP ${status})`);
  }
}
export function seeApiEndpoint(base: string | undefined, path: string) {
  const url = new URL(base?.trim() || 'https://api.seeapi.com');
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('Invalid SeeAPI API root');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/v1/${path}`;
  return url;
}
function isReferenceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.hash &&
      value.length <= 2048
    );
  } catch {
    return false;
  }
}

export class SeeAPIProvider implements AIProvider {
  readonly name = 'seeapi';
  constructor(
    public configs: AIConfigs & { apiKey: string; baseUrl?: string }
  ) {}
  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(seeApiEndpoint(this.configs.baseUrl, path), {
      ...init,
      headers: {
        Authorization: `Bearer ${this.configs.apiKey.trim()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
      // Do not forward credentials on redirects; Workers rejects "error" mode.
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      // 409/429/5xx and transport failures can be ambiguous. Reuse the same
      // idempotency key rather than refunding a possibly accepted generation.
      throw new SeeAPIError(
        response.status,
        [400, 401, 402, 403, 404, 413, 422].includes(response.status)
      );
    }
    return response.json();
  }
  private result(
    data: any,
    expectedId?: string,
    endpoint?: string
  ): AITaskResult {
    const g = data?.generation;
    if (
      !g ||
      typeof g.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,160}$/.test(g.id) ||
      (expectedId && g.id !== expectedId) ||
      g.model !== 'seedream-5-5' ||
      !['text-to-image', 'image-to-image'].includes(g.endpoint) ||
      (endpoint !== undefined && g.endpoint !== endpoint)
    )
      throw new Error('Invalid SeeAPI receipt');
    const statuses: Record<string, AITaskStatus> = {
      processing: AITaskStatus.PROCESSING,
      succeeded: AITaskStatus.SUCCESS,
      failed: AITaskStatus.FAILED,
      canceled: AITaskStatus.CANCELED,
      refunded: AITaskStatus.FAILED,
      expired: AITaskStatus.FAILED,
    };
    const taskStatus = statuses[g.status];
    if (!taskStatus) throw new Error('Unknown SeeAPI task state');
    return {
      taskId: g.id,
      taskStatus,
      taskInfo: {
        images: Array.isArray(g.result?.assets)
          ? g.result.assets
              .filter((a: any) => a.type === 'image')
              .map((a: any) => ({ imageUrl: a.url }))
          : [],
      },
    };
  }
  async generate({ params }: { params: AIGenerateParams }) {
    if (
      params.mediaType !== AIMediaType.IMAGE ||
      params.model !== 'seedream-5-5' ||
      !params.options?.idempotencyKey
    )
      throw new Error('Invalid Seedream request');
    const references = params.options.image_input;
    if (
      references !== undefined &&
      (!Array.isArray(references) ||
        references.length !== 1 ||
        typeof references[0] !== 'string' ||
        !isReferenceUrl(references[0]))
    )
      throw new Error('Supply one HTTPS reference photo');
    const endpoint = references ? 'image-to-image' : 'text-to-image';
    return this.result(
      await this.request('generations', {
        method: 'POST',
        headers: { 'Idempotency-Key': params.options.idempotencyKey },
        body: JSON.stringify({
          model: 'seedream-5-5',
          endpoint,
          provider: 'seeapi',
          input: {
            prompt: params.prompt,
            aspect_ratio: params.options.aspect_ratio || '1:1',
            resolution: params.options.resolution || '2K',
            output_format: 'png',
            background: 'auto',
            nsfw_checker: true,
            ...(references ? { input_images: references } : {}),
          },
        }),
      }),
      undefined,
      endpoint
    );
  }
  async query({ taskId }: { taskId: string }) {
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(taskId))
      throw new Error('Invalid SeeAPI task ID');
    return this.result(
      await this.request(`generations/${encodeURIComponent(taskId)}`),
      taskId
    );
  }
}
