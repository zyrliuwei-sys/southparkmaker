import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Download, Eye, ImageOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { matchPermission } from '@/core/auth/rbac';
import {
  apiDownloadImage,
  apiGet,
  pageQuery,
  type PageResult,
} from '@/lib/api-client';
import {
  type GeneratedImage,
  type GeneratedImageStatus,
} from '@/lib/generated-images';
import { formatDateTime } from '@/lib/time';
import { m } from '@/paraglide/messages.js';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 20;

function ImagePreview({
  src,
  alt,
  unavailable,
  large = false,
}: {
  src: string;
  alt: string;
  unavailable: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="text-muted-foreground flex min-h-28 flex-col items-center justify-center gap-2 p-4 text-center text-xs"
      role="img"
      aria-label={unavailable}
    >
      <ImageOff className="size-6" aria-hidden="true" />
      <span>{unavailable}</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading={large ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={
        large ? 'max-h-[55vh] w-full object-contain' : 'size-28 object-contain'
      }
    />
  );
}

export function AdminGeneratedImages({ userId }: { userId?: string }) {
  const permissions = useUserPermissions();
  const codes = permissions.data?.permissions ?? [];
  const canRead = matchPermission('admin.images.read', codes);
  const canDownload = matchPermission('admin.images.download', codes);
  const [filter, setFilter] = useState({
    search: '',
    status: 'success' as GeneratedImageStatus | 'all',
    page: 1,
  });
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<GeneratedImage | null>(null);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilter((current) =>
          current.search === input
            ? current
            : { ...current, search: input, page: 1 }
        ),
      300
    );
    return () => clearTimeout(timer);
  }, [input]);

  const query = useQuery({
    queryKey: ['admin-generated-images', filter, userId],
    enabled: canRead,
    queryFn: () => {
      let url = pageQuery('/api/admin/images', {
        page: filter.page,
        pageSize: PAGE_SIZE,
        search: filter.search,
      });
      if (filter.status !== 'all') url += `&status=${filter.status}`;
      if (userId) url += `&userId=${encodeURIComponent(userId)}`;
      return apiGet<PageResult<GeneratedImage>>(url);
    },
    placeholderData: keepPreviousData,
  });
  const download = useMutation({
    mutationFn: (image: GeneratedImage) =>
      apiDownloadImage(
        `/api/admin/images/${encodeURIComponent(image.id)}/download`,
        `character-${image.id}`
      ),
    onSuccess: () => toast.success(m['admin.images.download_success']()),
    onError: () => toast.error(m['admin.images.download_error']()),
  });
  const statuses = [
    { value: 'all', label: m['admin.images.status_all']() },
    { value: 'success', label: m['admin.images.status_success']() },
    { value: 'pending', label: m['admin.images.status_pending']() },
    { value: 'processing', label: m['admin.images.status_processing']() },
    { value: 'failed', label: m['admin.images.status_failed']() },
    { value: 'canceled', label: m['admin.images.status_canceled']() },
  ];
  function downloadButton(image: GeneratedImage) {
    if (!canDownload) return null;
    const downloading =
      download.isPending && download.variables?.id === image.id;
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={!image.imageUrl || download.isPending}
        onClick={() => download.mutate(image)}
      >
        {downloading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-4" aria-hidden="true" />
        )}
        {downloading
          ? m['admin.images.downloading']()
          : m['admin.images.download']()}
      </Button>
    );
  }
  const columns: Column<GeneratedImage>[] = [
    {
      header: m['admin.images.image'](),
      cell: (image) => (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {image.imageUrl ? (
              <button
                type="button"
                className="bg-muted focus-visible:ring-ring block w-28 shrink-0 overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
                aria-label={m['admin.images.preview_label']({
                  name: image.userName,
                })}
                onClick={() => setPreview(image)}
              >
                <ImagePreview
                  key={image.imageUrl}
                  src={image.imageUrl}
                  alt={image.prompt}
                  unavailable={m['admin.images.unavailable']()}
                />
              </button>
            ) : (
              <div className="bg-muted text-muted-foreground flex size-28 shrink-0 flex-col items-center justify-center gap-2 rounded-xl p-3 text-center text-xs">
                <ImageOff className="size-5" aria-hidden="true" />
                {m['admin.images.no_result']()}
              </div>
            )}
            <div className="min-w-0 space-y-1 whitespace-normal md:hidden">
              <p className="text-sm font-medium break-words">
                {image.userName}
              </p>
              <p className="text-muted-foreground text-xs break-all">
                {image.userEmail}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(image.createdAt)}
              </p>
              <Badge variant="secondary">
                {statuses.find((status) => status.value === image.status)
                  ?.label ?? image.status}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setPreview(image)}>
              <Eye className="size-4" aria-hidden="true" />
              {m['admin.images.view']()}
            </Button>
            {downloadButton(image)}
          </div>
        </div>
      ),
    },
    {
      header: m['admin.images.user'](),
      className: 'hidden md:table-cell',
      cell: (image) => (
        <div className="max-w-56 min-w-36 space-y-1 break-words whitespace-normal">
          <p className="font-medium">{image.userName}</p>
          <p className="text-muted-foreground text-xs">{image.userEmail}</p>
        </div>
      ),
    },
    {
      header: m['admin.images.details'](),
      className: 'hidden md:table-cell',
      cell: (image) => (
        <div className="w-52 space-y-2 sm:w-64">
          <p className="line-clamp-3 text-sm break-words whitespace-normal">
            {image.prompt}
          </p>
          <p className="text-muted-foreground text-xs">
            {image.provider} · {image.model}
          </p>
          <Badge
            variant={
              ['failed', 'canceled'].includes(image.status)
                ? 'destructive'
                : 'secondary'
            }
          >
            {statuses.find((status) => status.value === image.status)?.label ??
              image.status}
          </Badge>
        </div>
      ),
    },
    {
      header: m['admin.images.created_at'](),
      className: 'hidden md:table-cell',
      cell: (image) => (
        <span className="text-muted-foreground text-xs">
          {formatDateTime(image.createdAt)}
        </span>
      ),
    },
    {
      header: m['admin.images.actions'](),
      className: 'hidden md:table-cell',
      cell: (image) => (
        <div className="flex flex-col items-start gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreview(image)}>
            <Eye className="size-4" aria-hidden="true" />
            {m['admin.images.view']()}
          </Button>
          {downloadButton(image)}
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m['admin.images.title']()}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {m['admin.images.description']()}
        </p>
      </div>
      {!permissions.isPending && !canRead ? (
        <p role="alert" className="text-destructive text-sm">
          {m['admin.images.forbidden']()}
        </p>
      ) : (
        <Card className="min-w-0">
          <CardContent className="min-w-0">
            <DataTable
              columns={columns}
              toolbarClassName="flex-wrap [&>div:first-child]:min-w-48 [&>div:first-child]:flex-1"
              data={query.data?.items ?? []}
              total={query.data?.total ?? 0}
              page={filter.page}
              pageSize={PAGE_SIZE}
              onPageChange={(page) =>
                setFilter((current) => ({ ...current, page }))
              }
              rowKey={(image) => image.id}
              search={input}
              onSearchChange={setInput}
              searchPlaceholder={m['admin.images.search_placeholder']()}
              emptyText={m['admin.images.empty']()}
              loading={permissions.isPending || query.isFetching}
              errorMessage={
                query.isError ? m['admin.images.load_error']() : undefined
              }
              onRefresh={() => query.refetch()}
              toolbar={
                <Select
                  value={filter.status}
                  onValueChange={(status) => {
                    if (status)
                      setFilter((current) => ({
                        ...current,
                        status: status as typeof filter.status,
                        page: 1,
                      }));
                  }}
                >
                  <SelectTrigger
                    className="w-36 shrink-0"
                    aria-label={m['admin.images.status_filter']()}
                  >
                    <SelectValue>
                      {statuses.find((s) => s.value === filter.status)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
          </CardContent>
        </Card>
      )}
      <p className="text-muted-foreground text-xs leading-relaxed">
        {m['admin.images.note']()}
      </p>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {m['admin.images.preview_label']({ name: preview.userName })}
                </DialogTitle>
                <DialogDescription className="break-words">
                  {preview.userEmail} · {formatDateTime(preview.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted overflow-hidden rounded-xl">
                {preview.imageUrl ? (
                  <ImagePreview
                    key={preview.imageUrl}
                    src={preview.imageUrl}
                    alt={preview.prompt}
                    unavailable={m['admin.images.unavailable']()}
                    large
                  />
                ) : (
                  <p className="text-muted-foreground p-10 text-center text-sm">
                    {m['admin.images.no_result']()}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-medium">
                  {m['admin.images.prompt']()}
                </h2>
                <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
                  {preview.prompt}
                </p>
                <p className="text-muted-foreground text-xs">
                  {preview.provider} · {preview.model} ·{' '}
                  {statuses.find((status) => status.value === preview.status)
                    ?.label ?? preview.status}
                </p>
                <p className="text-muted-foreground text-xs break-all">
                  {m['admin.images.task_id']()}: {preview.id}
                </p>
              </div>
              <div className="flex justify-end">{downloadButton(preview)}</div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
