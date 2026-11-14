import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { apiGet } from '@/lib/api-client';
import { privatePageHead } from '@/lib/private-page-head';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';

import { SettingsForm } from './-settings-form';

function SettingsPage() {
  const query = useQuery({
    queryKey: ['user-info'],
    queryFn: async () => {
      const data = await apiGet<{
        name?: string;
        email?: string;
        image?: string;
      }>('/api/user/info');
      return {
        name: data.name || '',
        email: data.email || '',
        image: data.image || '',
      };
    },
  });
  const user = query.data;

  if (query.isError)
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">{m['settings.profile.title']()}</h1>
        <p role="alert">{m['common.table.load_error']()}</p>
        <Button onClick={() => void query.refetch()}>
          {m['maker.ai.retry']()}
        </Button>
      </div>
    );

  if (!user) {
    return (
      <div className="text-muted-foreground p-6">
        {m['settings.profile.loading']()}
      </div>
    );
  }

  return (
    <SettingsForm name={user.name} email={user.email} image={user.image} />
  );
}

export const Route = createFileRoute('/settings/profile')({
  head: () => privatePageHead(m['settings.profile.title']()),
  component: SettingsPage,
});
