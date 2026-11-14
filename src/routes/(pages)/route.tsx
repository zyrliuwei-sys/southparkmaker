import { createFileRoute, Outlet } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';

import { MakerLegal } from '@/blocks/maker-legal';
import { mdxComponents } from '@/components/mdx-components';

export const Route = createFileRoute('/(pages)')({ component: PagesLayout });

function PagesLayout() {
  return (
    <MakerLegal>
      <MDXProvider components={mdxComponents}>
        <Outlet />
      </MDXProvider>
    </MakerLegal>
  );
}
