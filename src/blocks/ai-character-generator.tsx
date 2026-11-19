import { useEffect, useRef, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ChevronDown,
  Download,
  ImagePlus,
  LoaderCircle,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { z } from 'zod';

import { useSession } from '@/core/auth/client';
import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import {
  DEFAULT_CHARACTER_RESOLUTION,
  generationCreditShortfall,
  type CharacterResolution,
} from '@/lib/character-pricing';
import { invalidateCharacterCreditQueries } from '@/lib/character-query-cache';
import { m } from '@/paraglide/messages.js';
import { useCharacterAccess } from '@/hooks/use-character-access';
import { useCharacterCapabilities } from '@/hooks/use-character-capabilities';

type Generation = {
  taskId: string;
  status: string;
  images: string[];
  error?: string;
};
type ReferenceImage = {
  data: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};
const c = (key: string) => tDynamic(`maker.ai.${key}`);
const latestCharacterKey = (userId: string | undefined) => [
  'character-latest',
  userId,
];

export function AICharacterGenerator({
  initialPrompt = '',
  initialPhoto = false,
  initialResolution = DEFAULT_CHARACTER_RESOLUTION,
  initialRatio = '1:1',
}: {
  initialPrompt?: string;
  initialPhoto?: boolean;
  initialResolution?: CharacterResolution;
  initialRatio?: '1:1' | '3:4';
}) {
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();
  const [photoMode, setPhotoMode] = useState(initialPhoto);
  const [image, setImage] = useState<ReferenceImage>();
  const [imagePreview, setImagePreview] = useState('');
  const [submittedPhoto, setSubmittedPhoto] = useState<{
    taskId: string;
    url: string;
  }>();
  const [fileError, setFileError] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const [resolution, setResolution] =
    useState<CharacterResolution>(initialResolution);
  const balance = useQuery({
    queryKey: ['character-balance', session?.user?.id],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: !!session?.user,
  });
  const config = useCharacterCapabilities();
  const access = useCharacterAccess(userId);
  const freeGeneration = access.data?.freeGenerationAvailable === true;
  const generation = useMutation({
    mutationFn: ({
      userId: _userId,
      ...value
    }: {
      userId: string;
      prompt: string;
      aspectRatio: '1:1' | '3:4';
      resolution: CharacterResolution;
      image?: ReferenceImage;
    }) =>
      apiPost<Generation>('/api/characters/generate', {
        ...value,
      }),
    onSuccess: async (result, submitted) => {
      const queryKey = latestCharacterKey(submitted.userId);
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData(queryKey, result);
      if (submitted.image) {
        setSubmittedPhoto({
          taskId: result.taskId,
          url: `data:${submitted.image.mimeType};base64,${submitted.image.data}`,
        });
      }
      void invalidateCharacterCreditQueries(queryClient);
    },
  });
  const task = useQuery({
    queryKey: latestCharacterKey(userId),
    queryFn: ({ signal }) =>
      apiGet<Generation | null>('/api/characters/latest', {
        signal,
      }),
    enabled: !!userId && !generation.isPending,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      ['pending', 'processing'].includes(query.state.data?.status ?? '')
        ? 4000
        : false,
  });
  const result = generation.isPending ? undefined : task.data;
  const busy =
    generation.isPending ||
    ['pending', 'processing'].includes(result?.status ?? '');
  const referenceForResult =
    submittedPhoto && submittedPhoto.taskId === result?.taskId
      ? submittedPhoto.url
      : '';
  useEffect(() => {
    generation.reset();
    setSubmittedPhoto(undefined);
  }, [userId]);
  useEffect(() => {
    if (['success', 'failed', 'canceled'].includes(result?.status ?? '')) {
      void invalidateCharacterCreditQueries(queryClient);
    }
  }, [result?.taskId, result?.status, queryClient]);
  const resolutionOptions = photoMode
    ? (config.data?.photoResolutions ?? [])
    : (config.data?.resolutions ?? []);
  const selectedCost =
    resolutionOptions.find((item) => item.resolution === resolution)
      ?.costCredits ??
    (photoMode ? config.data?.photoCostCredits : config.data?.costCredits);
  const shortfall = generationCreditShortfall(
    balance.data?.balance,
    selectedCost
  );
  const insufficient =
    !!session?.user &&
    !freeGeneration &&
    !access.isPending &&
    shortfall !== undefined &&
    shortfall > 0;
  const showsRatio = !photoMode || !!config.data?.photoResolutions?.length;
  const generationDisabled =
    busy ||
    insufficient ||
    !config.data?.enabled ||
    (photoMode && (!image || !config.data?.photoEnabled)) ||
    sessionPending ||
    (!!userId &&
      (balance.isPending ||
        task.isPending ||
        access.isPending ||
        access.isError));
  const resultImage =
    result?.status === 'success' ? result.images[0] : undefined;
  const generationError =
    generation.error?.message ||
    (['failed', 'canceled'].includes(result?.status ?? '')
      ? result?.error || c('failed')
      : undefined);
  const form = useForm({
    defaultValues: {
      prompt: initialPrompt,
      aspectRatio: initialRatio,
    },
    validators: {
      onSubmit: z.object({
        prompt: z
          .string()
          .trim()
          .max(1500)
          .refine(
            (value) => value.length >= 3 || (photoMode && !!image),
            c('prompt_required')
          ),
        aspectRatio: z.enum(['1:1', '3:4']),
      }),
    },
    onSubmit: ({ value }) => {
      if (!userId || busy || task.isPending) return;
      setSubmittedPhoto(undefined);
      generation.mutate({ ...value, userId, resolution, image });
    },
  });
  useEffect(
    () => () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview]
  );
  async function chooseFile(file?: File) {
    setFileError('');
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      !file.size ||
      file.size > 3 * 1024 * 1024
    ) {
      setFileError(c('file_error'));
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('read'));
        reader.readAsDataURL(file);
      });
      setImage({ data, mimeType: file.type as ReferenceImage['mimeType'] });
      setImagePreview(URL.createObjectURL(file));
    } catch {
      setFileError(c('file_error'));
    }
  }
  return (
    <div className="maker-ai-wrap">
      <div className="maker-ai-layout">
        <div className="maker-ai-form">
          <h2 className="atelier-form-title">{c('form_title')}</h2>
          <div
            className="maker-input-modes"
            role="group"
            aria-label={c('input_mode')}
          >
            <button
              type="button"
              aria-pressed={!photoMode}
              disabled={busy}
              onClick={() => {
                setPhotoMode(false);
                setImage(undefined);
                setImagePreview('');
                setFileError('');
              }}
            >
              {c('text_mode')}
            </button>
            <button
              type="button"
              aria-pressed={photoMode}
              disabled={busy || !config.data?.photoEnabled}
              onClick={() => setPhotoMode(true)}
            >
              {c('photo_mode')}
            </button>
          </div>
          {config.isPending ? (
            <p className="maker-ai-message" role="status">
              <LoaderCircle className="inline animate-spin" size={16} />{' '}
              {c('loading')}
            </p>
          ) : config.isError ? (
            <div className="maker-ai-message" role="alert">
              <p>{c('config_error')}</p>
              <button
                type="button"
                className="maker-button maker-button-outline mt-3"
                onClick={() => void config.refetch()}
              >
                {c('retry')}
              </button>
            </div>
          ) : !config.data?.enabled ? (
            <div className="maker-ai-message">
              <h2>{c('unavailable_title')}</h2>
              <p>{c('unavailable_description')}</p>
              <Link href="/create">{c('try_builder')} →</Link>
            </div>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (userId && !generationDisabled) void form.handleSubmit();
            }}
          >
            {initialPhoto &&
              config.data?.enabled &&
              !config.data.photoEnabled && (
                <p className="maker-ai-message">{c('photo_unavailable')}</p>
              )}
            {photoMode && config.data?.photoEnabled && (
              <div className="maker-ai-field">
                <div className="maker-ai-upload">
                  <button
                    type="button"
                    className="maker-ai-photo-picker"
                    aria-label={c(
                      imagePreview ? 'change_photo' : 'choose_photo'
                    )}
                    aria-describedby="character-photo-hint"
                    disabled={
                      busy || !session?.user || !config.data?.photoEnabled
                    }
                    onClick={() => photoInput.current?.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="" />
                    ) : (
                      <ImagePlus
                        size={20}
                        strokeWidth={1.3}
                        aria-hidden="true"
                      />
                    )}
                    <span className="maker-ai-upload-copy">
                      <strong>
                        {c(imagePreview ? 'change_photo' : 'choose_photo')}
                      </strong>
                      <small
                        id="character-photo-hint"
                        className="maker-ai-upload-hint"
                      >
                        {c(userId ? 'photo_hint' : 'photo_sign_in_hint')}
                      </small>
                    </span>
                  </button>
                  <input
                    ref={photoInput}
                    id="character-photo"
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      busy || !session?.user || !config.data?.photoEnabled
                    }
                    onChange={(event) => {
                      void chooseFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      className="maker-ai-remove-photo"
                      aria-label={c('remove_photo')}
                      onClick={() => {
                        setImage(undefined);
                        setImagePreview('');
                        setFileError('');
                      }}
                      disabled={busy}
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {userId && (
                  <p className="maker-ai-note">{c('photo_privacy_note')}</p>
                )}
                {fileError && (
                  <p className="maker-ai-note" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            <div
              className="maker-ai-field maker-ai-prompt"
              data-photo={photoMode}
            >
              <form.Field name="prompt">
                {(field) => (
                  <>
                    <label htmlFor="character-prompt">
                      {c(photoMode ? 'photo_prompt_label' : 'prompt_label')}
                    </label>
                    <textarea
                      id="character-prompt"
                      name="prompt"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder={c(
                        photoMode ? 'photo_prompt_placeholder' : 'placeholder'
                      )}
                      maxLength={1500}
                      disabled={busy}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-required={!photoMode}
                      aria-describedby={
                        field.state.meta.errors.length
                          ? 'character-prompt-error'
                          : undefined
                      }
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p
                        id="character-prompt-error"
                        className="atelier-prompt-helper"
                        role="alert"
                      >
                        {c('prompt_required')}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
            </div>
            {(showsRatio || !!resolutionOptions.length) && (
              <details className="maker-ai-options">
                <summary>
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  <span>{c('options')}</span>
                  <form.Subscribe
                    selector={(state) => state.values.aspectRatio}
                  >
                    {(ratio) => (
                      <span className="maker-ai-options-value">
                        {[
                          showsRatio ? ratio : '',
                          resolutionOptions.length ? resolution : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </form.Subscribe>
                  <ChevronDown
                    className="maker-ai-options-chevron"
                    size={16}
                    aria-hidden="true"
                  />
                </summary>
                <div className="maker-ai-options-fields">
                  {showsRatio && (
                    <div className="maker-ai-field">
                      <form.Field name="aspectRatio">
                        {(field) => (
                          <>
                            <label htmlFor="character-ratio">
                              {c('ratio_label')}
                            </label>
                            <select
                              id="character-ratio"
                              value={field.state.value}
                              disabled={busy}
                              onChange={(event) =>
                                field.handleChange(
                                  event.target.value as '1:1' | '3:4'
                                )
                              }
                            >
                              <option value="1:1">{c('ratio_square')}</option>
                              <option value="3:4">{c('ratio_portrait')}</option>
                            </select>
                          </>
                        )}
                      </form.Field>
                    </div>
                  )}
                  {!!resolutionOptions.length && (
                    <div className="maker-ai-field">
                      <label htmlFor="character-resolution">
                        {c('resolution_label')}
                      </label>
                      <select
                        id="character-resolution"
                        value={resolution}
                        onChange={(event) =>
                          setResolution(
                            event.target.value as CharacterResolution
                          )
                        }
                        disabled={busy}
                      >
                        {resolutionOptions.map((item) => (
                          <option key={item.resolution} value={item.resolution}>
                            {item.resolution}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </details>
            )}
            <div className="maker-ai-submit">
              <div className="maker-ai-credit-line">
                <span>
                  {freeGeneration
                    ? c('free_generation_cost')
                    : selectedCost !== undefined &&
                      m['maker.ai.credit_cost']({
                        count: String(selectedCost),
                      })}
                </span>
                {balance.data && !balance.isError && (
                  <span>
                    {m['maker.ai.balance']({
                      count: String(balance.data.balance),
                    })}
                  </span>
                )}
              </div>
              {insufficient && (
                <p className="maker-ai-message" role="status">
                  {m['maker.ai.insufficient_credits']({
                    count: String(shortfall),
                  })}{' '}
                  <Link href="/pricing">{c('buy_credits')}</Link>
                </p>
              )}
              {session?.user && balance.isError && (
                <div className="maker-ai-message" role="alert">
                  <p>{c('balance_error')}</p>
                  <button
                    type="button"
                    className="maker-text-link"
                    onClick={() => void balance.refetch()}
                  >
                    {c('retry')}
                  </button>
                </div>
              )}
              {config.data?.enabled && !sessionPending && !session?.user ? (
                <form.Subscribe
                  selector={(state) => ({
                    prompt: state.values.prompt,
                    ratio: state.values.aspectRatio,
                  })}
                >
                  {({ prompt, ratio }) => (
                    <Link
                      className="maker-button maker-button-primary w-full"
                      href={`/sign-in?callbackUrl=${encodeURIComponent(`/create?mode=ai${photoMode ? '&photo=1' : ''}&prompt=${encodeURIComponent(prompt)}&resolution=${resolution}&ratio=${encodeURIComponent(ratio)}`)}`}
                    >
                      {c('sign_in')}
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </form.Subscribe>
              ) : (
                <button
                  type="submit"
                  className="maker-button maker-button-primary w-full"
                  disabled={generationDisabled}
                >
                  {busy ? (
                    <LoaderCircle
                      size={16}
                      className="motion-safe:animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {c(
                    busy
                      ? 'generating'
                      : freeGeneration
                        ? 'generate_free'
                        : 'generate'
                  )}
                </button>
              )}
            </div>
            <p className="maker-ai-note">{c('trial_download_note')}</p>
            {access.isError && (
              <div className="maker-ai-message" role="alert">
                <p>{c('access_error')}</p>
                <button
                  type="button"
                  className="maker-text-link"
                  onClick={() => void access.refetch()}
                >
                  {c('retry')}
                </button>
              </div>
            )}
            {task.isError && (
              <div className="maker-ai-message">
                <p>{c('load_result_error')}</p>
                <button
                  type="button"
                  className="maker-text-link"
                  onClick={() => void task.refetch()}
                  disabled={task.isFetching}
                >
                  {c('check_progress')}
                </button>
              </div>
            )}
            {generationError && (
              <div className="maker-ai-message" role="alert">
                {generationError}
              </div>
            )}
          </form>
        </div>
        <section
          className="maker-ai-result"
          aria-labelledby="ai-result-heading"
        >
          <div className="maker-ai-result-heading">
            <h2
              id="ai-result-heading"
              className="atelier-form-title"
              aria-live="polite"
            >
              {c(resultImage ? 'photo_result' : 'preview_title')}
            </h2>
            {!resultImage && !busy && (
              <span className="maker-ai-example-label">
                {c('example_preview')}
              </span>
            )}
            {referenceForResult && (
              <div className="maker-ai-reference">
                <img src={referenceForResult} alt={c('reference_alt')} />
                <span>{c('uploaded_photo')}</span>
              </div>
            )}
          </div>
          <div className="maker-ai-stage" aria-busy={busy}>
            {busy ? (
              <div className="maker-ai-stage-status" role="status">
                <LoaderCircle
                  className="motion-safe:animate-spin"
                  size={24}
                  aria-hidden="true"
                />
                <strong>{c('creating_title')}</strong>
                <p>{c('creating_description')}</p>
              </div>
            ) : (
              <img
                src={
                  resultImage ??
                  '/imgs/generated/seedream-character-example.jpg'
                }
                alt={resultImage ? c('result_alt') : ''}
              />
            )}
          </div>
          {result && resultImage && (
            <div className="maker-ai-image-actions">
              {access.data?.downloadUnlocked ? (
                <a
                  className="maker-button maker-button-outline"
                  href={`/api/characters/${encodeURIComponent(result.taskId)}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download size={16} aria-hidden="true" />
                  {c('download_image')}
                </a>
              ) : (
                <Link
                  className="maker-button maker-button-primary"
                  href="/pricing"
                >
                  <Download size={16} aria-hidden="true" />
                  {c('unlock_download')}
                </Link>
              )}
              {!access.data?.downloadUnlocked && (
                <p className="maker-ai-note">{c('preview_download_note')}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
