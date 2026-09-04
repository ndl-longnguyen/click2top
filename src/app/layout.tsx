import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clicker2top.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Coin Clicker — Fast Competitive Arcade & Nations Cup Championship',
    template: '%s | Coin Clicker',
  },
  description:
    'Play Coin Clicker online for free! Tap coins, dodge dangerous bombs, unlock passive power generators, and compete in the global Nations Cup leaderboard. Fast-paced arcade action with instant play.',
  keywords: [
    'coin clicker',
    'clicker game',
    'competitive clicker',
    'nations cup',
    'arcade game online',
    'incremental idle game',
    'free online games',
    'reaction game',
    'world leaderboard game',
    'fast tap game',
    'pwa game',
    'no download game',
  ],
  authors: [{ name: 'Coin Clicker Team' }],
  creator: 'Coin Clicker Team',
  publisher: 'Coin Clicker',
  category: 'games',
  classification: 'Competitive Arcade Game, Incremental Game',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192' },
      { url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Coin Clicker — Fast Competitive Arcade & Nations Cup Championship',
    description:
      'Tap coins, dodge bombs, level up factories, and lead your country to #1 on the global Nations Cup leaderboard! Play free in your browser.',
    url: siteUrl,
    siteName: 'Coin Clicker',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Coin Clicker — Competitive Arcade & Nations Cup Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coin Clicker — Fast Competitive Arcade & Nations Cup Championship',
    description:
      'Tap coins, dodge bombs, and compete on the global Nations Cup leaderboard! Play instantly in your browser.',
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
  // Schema.org Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'Coin Clicker',
    description:
      'Fast-paced competitive web arcade game. Click stationary coins, dodge tactical bombs, upgrade automated passive generators, and compete in the Nations Cup world championship leaderboard.',
    url: siteUrl,
    genre: ['Arcade Game', 'Incremental Game', 'Action Game'],
    gamePlatform: ['Web Browser', 'Mobile Browser', 'iOS', 'Android', 'Desktop'],
    applicationCategory: 'GameApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1540',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'Coin Clicker Team',
      url: siteUrl,
    },
  };

  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#070a12] text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
