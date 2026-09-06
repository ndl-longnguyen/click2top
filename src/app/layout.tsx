import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { SITE_URL } from '@/lib/config/site';
import './globals.css';

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Click 2 Top — Fast Competitive Arcade & Nations Cup Championship',
    template: '%s | Click 2 Top',
  },
  description:
    'Play Click 2 Top online for free! Tap coins, dodge dangerous bombs, unlock passive power generators, and compete in the global Nations Cup leaderboard. Fast-paced arcade action with instant play.',
  keywords: [
    'click 2 top',
    'clicker 2 top',
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
  authors: [{ name: 'Click 2 Top Team' }],
  creator: 'Click 2 Top Team',
  publisher: 'Click 2 Top',
  category: 'games',
  classification: 'Competitive Arcade Game, Incremental Game',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Click 2 Top',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
      { url: '/icon-192.png', sizes: '192x192' },
      { url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Click 2 Top — Fast Competitive Arcade & Nations Cup Championship',
    description:
      'Tap coins, dodge bombs, level up factories, and lead your country to #1 on the global Nations Cup leaderboard! Play free in your browser.',
    url: siteUrl,
    siteName: 'Click 2 Top',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Click 2 Top — Competitive Arcade & Nations Cup Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Click 2 Top — Fast Competitive Arcade & Nations Cup Championship',
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
  verification: {
    google: '2n_hKWDM5r9dlRixMDRAsSCW6hbadPKFb5ccKFfG3i0',
  },
  other: {
    'google-adsense-account': 'ca-pub-9166964727480227',
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
    name: 'Click 2 Top',
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
      name: 'Click 2 Top Team',
      url: siteUrl,
    },
  };

  return (
    <html lang="en" className="dark h-full">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9166964727480227"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <meta name="google-adsense-account" content="ca-pub-9166964727480227" />
        <meta name="google-site-verification" content="2n_hKWDM5r9dlRixMDRAsSCW6hbadPKFb5ccKFfG3i0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Click 2 Top" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
