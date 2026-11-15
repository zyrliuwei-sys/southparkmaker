import { FalProvider } from '@/core/ai/fal';
import { ReplicateProvider } from '@/core/ai/replicate';
import { SeeAPIError, SeeAPIProvider } from '@/core/ai/seeapi';
import { AIMediaType, type AIProvider } from '@/core/ai/types';
import { getAuth } from '@/core/auth';
import { createTask } from '@/modules/ai-tasks/service';
import {
  buildCharacterPrompt,
  CHARACTER_CREDIT_COST,
  CHARACTER_SCENE,
  characterImageUrls,
  findCharacterTask,
  initializeCharacterTask,
  isCharacterTask,
  isTerminalCharacterStatus,
  MAX_CHARACTER_BODY_BYTES,
  publicCharacterResult,
  saveCharacterProgress,
  selectCharacterProvider,
  type CharacterProviderSelection,
  type CharacterTask,
} from '@/modules/characters/service';
import { getAllConfigs } from '@/modules/config/service';
import { revoke } from '@/modules/credits/service';
import {
  CHARACTER_RESOLUTIONS,
  characterCreditCost,
} from '@/lib/character-pricing';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { m } from '@/paraglide/messages.js';

import { characterInputSchema, validateReferenceImage } from './-input';

const privateResponse = { headers: { 'cache-control': 'no-store' } };
const MAX_TASK_AGE_MS = 30 * 60 * 1000;

type Dependencies = {
  session: (request: Request) => Promise<{ user: { id: string } } | null>;
  configs: () => Promise<Record<string, string>>;
  create: typeof createTask;
  initialize: typeof initializeCharacterTask;
  find: typeof findCharacterTask;
  progress: typeof saveCharacterProgress;
  refund: typeof revoke;
  provider: (selection: CharacterProviderSelection) => AIProvider;
};

const dependencies: Dependencies = {
  session: (request) => getAuth().api.getSession({ headers: request.headers }),
  configs: getAllConfigs,
  create: createTask,
  initialize: initializeCharacterTask,
  find: findCharacterTask,
  progress: saveCharacterProgress,
  refund: revoke,
  provider: (selection) =>
    selection.name === 'seeapi'
      ? new SeeAPIProvider({
          apiKey: selection.key,
          baseUrl: selection.baseUrl,
        })
      : selection.name === 'fal'
        ? new FalProvider({ apiKey: selection.key })
        : new ReplicateProvider({ apiToken: selection.key }),
};

async function readInput(request: Request) {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  ) {
    throw new Error('Send the character description as JSON.');
  }
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_CHARACTER_BODY_BYTES)
    throw new Error('Choose a photo smaller than 3 MB.');
  if (!request.body) throw new Error('Describe your character first.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_CHARACTER_BODY_BYTES) {
        await reader.cancel();
        throw new Error('Choose a photo smaller than 3 MB.');
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new Error('Send a valid character description.');
  }
}

async function refundFailedTask(task: CharacterTask, deps: Dependencies) {
  if (!['failed', 'canceled'].includes(task.status)) return;
  // revoke() claims the consumption record atomically. Repeated/concurrent
  // terminal polls repair interrupted refunds without returning value twice.
  let creditId: unknown;
  try {
    creditId = JSON.parse(task.taskInfo || '{}').creditId;
  } catch {
    return;
  }
  if (typeof creditId === 'string') await deps.refund(creditId);
}

export function createCharacterHandlers(deps: Dependencies = dependencies) {
  return {
    async config() {
      const configs = await deps.configs();
      const selection = selectCharacterProvider(configs, false);
      return respData(
        {
          enabled: Boolean(selectCharacterProvider(configs, false)),
          photoEnabled: Boolean(selectCharacterProvider(configs, true)),
          photoCostCredits: selectCharacterProvider(configs, true)
            ? CHARACTER_CREDIT_COST
            : undefined,
          costCredits:
            selection?.name === 'seeapi'
              ? characterCreditCost('2K')
              : CHARACTER_CREDIT_COST,
          resolutions:
            selection?.name === 'seeapi'
              ? CHARACTER_RESOLUTIONS.map((resolution) => ({
                  resolution,
                  costCredits: characterCreditCost(resolution),
                }))
              : [],
        },
        privateResponse
      );
    },

    async generate(request: Request) {
      const limited = enforceMinIntervalRateLimit(request, {
        intervalMs: 10_000,
        keyPrefix: 'character-generate-ip',
      });
      if (limited) return limited;
      if (
        request.headers.get('origin') !== new URL(request.url).origin ||
        request.headers.get('sec-fetch-site') === 'cross-site'
      ) {
        return respErr('Same-origin request required.', { status: 403 });
      }
      const session = await deps.session(request);
      if (!session?.user)
        return respErr('Sign in to generate your character.', { status: 401 });
      const userLimited = enforceMinIntervalRateLimit(request, {
        intervalMs: 10_000,
        keyPrefix: 'character-generate-user',
        extraKey: session.user.id,
      });
      if (userLimited) return userLimited;

      let input;
      try {
        const parsed = characterInputSchema.safeParse(await readInput(request));
        if (!parsed.success)
          return respErr(
            'Describe your character in 3 to 1,500 characters and choose a supported photo.',
            { status: 400 }
          );
        input = parsed.data;
      } catch (error) {
        return respErr(
          error instanceof Error
            ? error.message
            : 'Invalid character description.',
          { status: 400 }
        );
      }
      const configs = await deps.configs();
      const selection = selectCharacterProvider(configs, Boolean(input.image));
      if (!selection)
        return respErr(m['maker.ai.unavailable_error'](), { status: 503 });
      let imageData: string | undefined;
      try {
        if (input.image) imageData = validateReferenceImage(input.image);
      } catch (error) {
        return respErr((error as Error).message, { status: 400 });
      }

      let task: CharacterTask;
      const costCredits =
        selection.name === 'seeapi'
          ? characterCreditCost(input.resolution)
          : CHARACTER_CREDIT_COST;
      try {
        task = await deps.create({
          userId: session.user.id,
          mediaType: 'image',
          provider: selection.name,
          model: selection.model,
          prompt: input.prompt,
          costCredits,
          scene: CHARACTER_SCENE,
          options: {
            aspectRatio: input.aspectRatio,
            resolution: input.resolution,
            photo: Boolean(input.image),
          },
        });
      } catch (error) {
        const insufficient =
          error instanceof Error && error.message === 'Insufficient credits';
        return respErr(
          insufficient
            ? `You need ${costCredits} credits to generate a character. Choose a credit pack on the pricing page.`
            : 'Unable to start this character. Please try again.',
          { status: insufficient ? 402 : 503 }
        );
      }
      try {
        await deps.initialize(task.id, input);
        const provider = deps.provider(selection);
        const options =
          selection.name === 'seeapi'
            ? {
                idempotencyKey: task.id,
                aspect_ratio: input.aspectRatio,
                resolution: input.resolution,
              }
            : selection.name === 'fal'
              ? {
                  num_images: 1,
                  enable_safety_checker: true,
                  output_format: 'png',
                  ...(imageData
                    ? { image_input: [imageData], strength: 0.85 }
                    : {
                        num_inference_steps: 4,
                        image_size:
                          input.aspectRatio === '3:4'
                            ? 'portrait_4_3'
                            : 'square_hd',
                      }),
                }
              : {
                  aspect_ratio: input.aspectRatio,
                  num_outputs: 1,
                  output_format: 'png',
                  go_fast: true,
                };
        const result = await provider.generate({
          params: {
            mediaType: AIMediaType.IMAGE,
            model: selection.model,
            prompt: buildCharacterPrompt(input.prompt, Boolean(imageData)),
            options,
          },
        });
        if (!/^[A-Za-z0-9_-]{1,160}$/.test(result.taskId))
          throw new Error('Invalid provider receipt');
        const images = characterImageUrls(result.taskInfo?.images);
        const status =
          result.taskStatus === 'success' && images.length === 0
            ? 'failed'
            : result.taskStatus;
        await deps.progress({
          taskId: task.id,
          status,
          upstreamId: result.taskId,
          images,
        });
        const saved = await deps.find(task.id);
        if (!saved) throw new Error('Task unavailable');
        await refundFailedTask(saved, deps);
        return respData(publicCharacterResult(saved), {
          ...privateResponse,
          status: 202,
        });
      } catch (error) {
        if (
          selection.name === 'seeapi' &&
          !(error instanceof SeeAPIError && error.definitive)
        ) {
          // An interrupted submit may already have been billed upstream.
          // Keep the reservation and retry with the SAME stable task key.
          const pending = await deps.find(task.id);
          if (pending)
            return respData(publicCharacterResult(pending), {
              ...privateResponse,
              status: 202,
            });
        }
        // No raw upstream response is persisted: it may contain the input
        // photo, credentials or internal diagnostics.
        await deps.progress({ taskId: task.id, status: 'failed', images: [] });
        const failed = await deps.find(task.id);
        if (failed) await refundFailedTask(failed, deps);
        return respErr(
          'Your character could not be started. Your credits have been returned.',
          { status: 502 }
        );
      }
    },

    async read(request: Request, taskId: string) {
      const limited = enforceMinIntervalRateLimit(request, {
        intervalMs: 500,
        keyPrefix: 'character-poll-ip',
      });
      if (limited) return limited;
      const session = await deps.session(request);
      if (!session?.user)
        return respErr('Sign in to view your character.', { status: 401 });
      const userLimited = enforceMinIntervalRateLimit(request, {
        intervalMs: 1000,
        keyPrefix: 'character-poll-user',
        extraKey: session.user.id,
      });
      if (userLimited) return userLimited;
      if (!/^[a-f0-9-]{36}$/i.test(taskId))
        return respErr('Character not found.', { status: 404 });
      let task = await deps.find(taskId);
      if (!isCharacterTask(task, session.user.id))
        return respErr('Character not found.', { status: 404 });
      if (isTerminalCharacterStatus(task.status)) {
        await refundFailedTask(task, deps);
        return respData(publicCharacterResult(task), privateResponse);
      }
      // A submit interrupted before an upstream receipt is stored can be
      // safely failed later; no further provider request is submitted here.
      if (!task.taskId) {
        if (task.provider === 'seeapi') {
          const configs = await deps.configs();
          if (!configs.seeapi_api_key)
            return respErr(
              'Generation is waiting for its connection. Try again later.',
              { status: 503 }
            );
          try {
            const options = JSON.parse(task.options || '{}');
            const result = await deps
              .provider({
                name: 'seeapi',
                model: task.model,
                key: configs.seeapi_api_key,
                baseUrl: configs.seeapi_base_url,
              })
              .generate({
                params: {
                  mediaType: AIMediaType.IMAGE,
                  model: task.model,
                  prompt: buildCharacterPrompt(task.prompt || ''),
                  options: {
                    idempotencyKey: task.id,
                    aspect_ratio: options.aspectRatio || '1:1',
                    resolution: options.resolution || '2K',
                  },
                },
              });
            const images = characterImageUrls(result.taskInfo?.images);
            await deps.progress({
              taskId: task.id,
              upstreamId: result.taskId,
              status:
                result.taskStatus === 'success' && !images.length
                  ? 'failed'
                  : result.taskStatus,
              images,
            });
          } catch (error) {
            if (error instanceof SeeAPIError && error.definitive)
              await deps.progress({
                taskId: task.id,
                status: 'failed',
                images: [],
              });
            else
              return respErr(
                'Your character is still processing. Try again shortly.',
                { status: 503 }
              );
          }
          const saved = await deps.find(task.id);
          if (!saved) return respErr('Character not found.', { status: 404 });
          await refundFailedTask(saved, deps);
          return respData(publicCharacterResult(saved), privateResponse);
        }
        if (Date.now() - task.createdAt.getTime() > MAX_TASK_AGE_MS) {
          await deps.progress({
            taskId: task.id,
            status: 'failed',
            images: [],
          });
          const failed = await deps.find(task.id);
          if (failed) {
            await refundFailedTask(failed, deps);
            task = failed;
          }
        }
        return respData(publicCharacterResult(task), privateResponse);
      }
      const configs = await deps.configs();
      const key =
        task.provider === 'seeapi'
          ? configs.seeapi_api_key
          : task.provider === 'fal'
            ? configs.fal_api_key
            : configs.replicate_api_token;
      if (!key)
        return respErr(
          'This character is still waiting. Please try again later.',
          { status: 503 }
        );
      try {
        const provider = deps.provider({
          name: task.provider as CharacterProviderSelection['name'],
          model: task.model,
          key,
          baseUrl: configs.seeapi_base_url,
        });
        if (!provider.query) throw new Error('Polling unavailable');
        const result = await provider.query({
          taskId: task.taskId,
          model: task.model,
          mediaType: AIMediaType.IMAGE,
        });
        const images = characterImageUrls(result.taskInfo?.images);
        const status =
          result.taskStatus === 'success' && images.length === 0
            ? 'failed'
            : result.taskStatus;
        await deps.progress({ taskId: task.id, status, images });
        const saved = await deps.find(task.id);
        if (!saved) return respErr('Character not found.', { status: 404 });
        await refundFailedTask(saved, deps);
        return respData(publicCharacterResult(saved), privateResponse);
      } catch (error) {
        // Fal returns a model failure as 400/422 when fetching a completed
        // queue result, rather than returning a FAILED status object.
        if (
          task.provider === 'fal' &&
          error instanceof Error &&
          /^request failed with status: (400|410|422)$/.test(error.message)
        ) {
          await deps.progress({
            taskId: task.id,
            status: 'failed',
            images: [],
          });
          const failed = await deps.find(task.id);
          if (failed) {
            await refundFailedTask(failed, deps);
            return respData(publicCharacterResult(failed), privateResponse);
          }
        }
        // A transient query error is not a terminal provider failure, so it
        // neither refunds a running generation nor submits another one.
        return respErr(
          'Your character is still processing. Please try again shortly.',
          { status: 503 }
        );
      }
    },
  };
}

export const characterHandlers = createCharacterHandlers();

export async function characterResponse(run: () => Promise<Response>) {
  try {
    return await run();
  } catch {
    return respErr(
      'Character generation is temporarily unavailable. Please try again.',
      { status: 503 }
    );
  }
}
