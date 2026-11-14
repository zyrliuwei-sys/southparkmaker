import { envConfigs } from '@/config';

export function privatePageHead(title: string) {
  return {
    meta: [
      { title: `${title} | ${envConfigs.app_name}` },
      { name: 'robots', content: 'noindex, follow' },
    ],
  };
}
