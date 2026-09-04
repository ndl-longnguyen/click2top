import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Coin Clicker — Competitive Arcade',
    short_name: 'CoinClicker',
    description: 'Fast-paced competitive clicker game. Click coins, dodge booms, level up generators, and conquer the leaderboard!',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#f59e0b',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
