import { useEffect, useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ImagePlus, LoaderCircle, Sparkles, X } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [image, setImage] = useState<ReferenceImage>();
  const [imagePreview, setImagePreview] = useState('');
  const [fileError, setFileError] = useState('');
  const [taskId, setTaskId] = useState('');
  const [resolution, setResolution] =
    useState<CharacterResolution>(initialResolution);
  const balance = useQuery({
    queryKey: ['character-balance', session?.user?.id],
    queryFn: () => apiGet<{ balance: number }>('/api/credits'),
    enabled: !!session?.user,
  });
  const config = useCharacterCapabilities();
  const generation = useMutation({
    mutationFn: (value: { prompt: string; aspectRatio: '1:1' | '3:4' }) =>
      apiPost<Generation>('/api/characters/generate', {
        ...value,
        resolution,
        ...(image ? { image } : {}),
      }),
    onSuccess: (result) => {
      setTaskId(result.taskId);
      void invalidateCharacterCreditQueries(queryClient);
    },
  });
  const task = useQuery({
    queryKey: ['character-task', session?.user?.id, taskId],
    queryFn: ({ signal }) =>
      apiGet<Generation>(`/api/characters/${encodeURIComponent(taskId)}`, {
        signal,
      }),
    enabled:
      !!session?.user &&
      !!taskId &&
      !['success', 'failed', 'canceled'].includes(
        generation.data?.status ?? ''
      ),
    refetchInterval: (query) =>
      ['success', 'failed', 'canceled'].includes(query.state.data?.status ?? '')
        ? false
        : 4000,
    retry: 1,
  });
  const result = task.data ?? generation.data;
  const busy =
    generation.isPending ||
    (!!taskId &&
      !['success', 'failed', 'canceled'].includes(result?.status ?? ''));
  const storageKey = session?.user?.id
    ? `character-active:${session.user.id}`
    : '';
  useEffect(() => {
    setTaskId('');
    generation.reset();
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && /^[a-f0-9-]{36}$/i.test(saved)) setTaskId(saved);
    } catch {}
  }, [storageKey]);
  useEffect(() => {
    if (task.error?.message !== 'Character not found.') return;
    setTaskId('');
    try {
      if (storageKey) localStorage.removeItem(storageKey);
    } catch {}
  }, [task.error, storageKey]);
  useEffect(() => {
    if (!storageKey || !taskId) return;
    try {
      if (['success', 'failed', 'canceled'].includes(result?.status ?? '')) {
        localStorage.removeItem(storageKey);
        void invalidateCharacterCreditQueries(queryClient);
      } else localStorage.setItem(storageKey, taskId);
    } catch {}
  }, [storageKey, taskId, result?.status, queryClient]);
  const cost =
    config.data?.resolutions?.find((item) => item.resolution === resolution)
      ?.costCredits ?? config.data?.costCredits;
  const selectedCost = image ? config.data?.photoCostCredits : cost;
  const shortfall = generationCreditShortfall(
    balance.data?.balance,
    selectedCost
  );
  const insufficient =
    !!session?.user && shortfall !== undefined && shortfall > 0;
  const form = useForm({
    defaultValues: {
      prompt: initialPrompt,
      aspectRatio: initialRatio,
    },
    validators: {
      onSubmit: z.object({
        prompt: z.string().trim().min(3, c('prompt_required')).max(1500),
        aspectRatio: z.enum(['1:1', '3:4']),
      }),
    },
    onSubmit: ({ value }) => {
      setTaskId('');
      generation.mutate(value);
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
          {config.data?.enabled && !sessionPending && !session?.user && (
            <p className="maker-ai-message">{c('sign_in_note')}</p>
          )}
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
              if (
                !busy &&
                !insufficient &&
                config.data?.enabled &&
                session?.user
              )
                void form.handleSubmit();
            }}
          >
            {initialPhoto &&
              config.data?.enabled &&
              !config.data.photoEnabled && (
                <p className="maker-ai-message">{c('photo_unavailable')}</p>
              )}
            <div className="maker-ai-field">
              <form.Field name="prompt">
                {(field) => (
                  <>
                    <label htmlFor="character-prompt">
                      {c('prompt_label')}
                    </label>
                    <span className="atelier-prompt-count" aria-hidden="true">
                      {field.state.value.length} / 1500
                    </span>
                    <textarea
                      id="character-prompt"
                      name="prompt"
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder={c('placeholder')}
                      maxLength={1500}
                      disabled={busy}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-required="true"
                      aria-describedby={
                        field.state.meta.errors.length
                          ? 'character-prompt-error'
                          : 'character-prompt-hint'
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
                    {!field.state.meta.errors.length && (
                      <p
                        id="character-prompt-hint"
                        className="atelier-prompt-helper"
                      >
                        {c('prompt_hint')}
                      </p>
                    )}
                  </>
                )}
              </form.Field>
            </div>
            <div
              className="atelier-prompt-examples"
              role="group"
              aria-label={c('examples_label')}
            >
              {[1, 2, 3].map((index) => (
                <button
                  key={index}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    form.setFieldValue('prompt', c(`example_prompt_${index}`))
                  }
                >
                  {c(`example_${index}`)}
                </button>
              ))}
            </div>
            {config.data?.photoEnabled && (
              <div className="maker-ai-field">
                <label htmlFor="character-photo">{c('photo_label')}</label>
                <div className="maker-ai-upload">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt={c('reference_alt')} />
                      <button
                        type="button"
                        className="maker-button maker-button-outline"
                        onClick={() => {
                          setImage(undefined);
                          setImagePreview('');
                        }}
                        disabled={busy}
                      >
                        <X size={14} />
                        {c('remove_photo')}
                      </button>
                    </>
                  ) : (
                    <ImagePlus size={28} strokeWidth={1.3} />
                  )}
                  <input
                    id="character-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={
                      busy || !session?.user || !config.data?.photoEnabled
                    }
                    onChange={(event) => {
                      void chooseFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <p>
                    {config.data?.photoEnabled
                      ? c('photo_hint')
                      : c('photo_unavailable')}
                  </p>
                </div>
                {fileError && (
                  <p className="maker-ai-note" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            {!image && (
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
            {!!config.data?.resolutions?.length && !image && (
              <div className="maker-ai-field">
                <label htmlFor="character-resolution">
                  {c('resolution_label')}
                </label>
                <select
                  id="character-resolution"
                  value={resolution}
                  onChange={(event) =>
                    setResolution(event.target.value as CharacterResolution)
                  }
                  disabled={busy}
                >
                  {config.data.resolutions.map((item) => (
                    <option key={item.resolution} value={item.resolution}>
                      {item.resolution} ·{' '}
                      {m['maker.ai.credit_cost']({
                        count: String(item.costCredits),
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="maker-ai-credit-line">
              <span>
                {selectedCost !== undefined &&
                  m['maker.ai.credit_cost']({
                    count: String(selectedCost),
                  })}
                {balance.data && (
                  <>
                    <br />
                    {m['maker.ai.balance']({
                      count: String(balance.data.balance),
                    })}
                  </>
                )}
              </span>
              <Link href="/pricing">{c('buy_credits')}</Link>
            </div>
            {insufficient && (
              <p className="maker-ai-message" role="status">
                {m['maker.ai.insufficient_credits']({
                  count: String(shortfall),
                })}
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
                    href={`/sign-in?callbackUrl=${encodeURIComponent(`/create?mode=ai&prompt=${encodeURIComponent(prompt)}&resolution=${resolution}&ratio=${encodeURIComponent(ratio)}`)}`}
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
                disabled={
                  busy ||
                  insufficient ||
                  !config.data?.enabled ||
                  sessionPending ||
                  (!!session?.user && balance.isPending)
                }
              >
                {busy ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {busy ? c('generating') : c('generate')}
              </button>
            )}
            <p className="maker-ai-note">{c('credit_note')}</p>
            {taskId && task.isError && (
              <div className="maker-ai-message">
                <p>{c('resume_note')}</p>
                <button
                  type="button"
                  className="maker-button maker-button-outline"
                  onClick={() => void task.refetch()}
                  disabled={task.isFetching}
                >
                  {c('check_progress')}
                </button>
              </div>
            )}
            {(generation.error ||
              task.error ||
              result?.status === 'failed' ||
              result?.status === 'canceled') && (
              <div className="maker-ai-message" role="alert">
                {generation.error?.message ||
                  task.error?.message ||
                  result?.error ||
                  c('failed')}
              </div>
            )}
          </form>
        </div>
        {result?.images?.length ? (
          <figure className="maker-ai-result">
            <img
              src={result.images[0]}
              alt={c('result_alt')}
              width="2048"
              height="2048"
            />
            <figcaption>
              <span>{c('result_title')}</span>
              <a
                className="maker-button maker-button-outline"
                href={result.images[0]}
                target="_blank"
                rel="noopener noreferrer"
              >
                {c('open_image')}
                <ArrowRight size={15} />
              </a>
            </figcaption>
          </figure>
        ) : (
          <div className="maker-ai-result maker-ai-empty" aria-live="polite">
            <img
              src="/imgs/generated/seedream-character-example.jpg"
              alt=""
              width="1400"
              height="1400"
            />
            <h2>
              {busy && (
                <LoaderCircle className="mr-2 inline animate-spin" size={20} />
              )}{' '}
              {busy ? c('creating_title') : c('empty_title')}
            </h2>
            <p>{busy ? c('creating_description') : c('empty_description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
