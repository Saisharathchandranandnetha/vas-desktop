import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'VAS Desktop',
  description: 'Universal AI Runtime — Manage providers, models, agents, and MCP servers from a single desktop application.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-primary font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
