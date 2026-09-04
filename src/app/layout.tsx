import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Coin Clicker — Fast Competitive Arcade Game',
  description: 'Tap coins, avoid dangerous booms, unlock powerful generators, and dominate the global leaderboard!',
  keywords: ['coin clicker', 'clicker game', 'arcade', 'incremental game', 'leaderboard', 'pwa'],
  authors: [{ name: 'Coin Clicker Team' }],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Coin Clicker — Competitive Arcade',
    description: 'Can you reach #1? Tap coins, avoid booms, level up factories and climb to the top!',
    images: ['/icon-512.png'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f59e0b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#070a12] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
