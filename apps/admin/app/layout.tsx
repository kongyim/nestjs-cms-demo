import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import '@nestjs-cms/admin/styles.css';

export const metadata: Metadata = {
  title: 'CMS Admin',
  description: 'Manage pages, categories, roles, and users.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
