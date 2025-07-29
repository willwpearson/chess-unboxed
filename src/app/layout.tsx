import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Chess Optim Boo - Multiplayer Chess Game',
  description: 'Play chess online with friends, bots, or in endless mode. Built with Next.js and real-time multiplayer support.',
  keywords: ['chess', 'multiplayer', 'online', 'game', 'strategy'],
  authors: [{ name: 'Chess Optim Boo Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
