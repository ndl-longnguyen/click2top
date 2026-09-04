import type { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clicker2top.vercel.app';
  const now = new Date();

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Dynamic player profile routes from Supabase or top demo players
  try {
    const supabase = createServerSupabaseClient();
    if (supabase) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('username, updated_at')
        .limit(100);

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          if (p.username) {
            routes.push({
              url: `${baseUrl}/player/${encodeURIComponent(p.username)}`,
              lastModified: p.updated_at ? new Date(p.updated_at) : now,
              changeFrequency: 'weekly',
              priority: 0.8,
            });
          }
        }
      }
    }
  } catch {
    // If DB is unreachable during build, fallback gracefully
  }

  // Include top prominent seed player URLs if no DB profiles
  if (routes.length === 1) {
    const seedPlayers = ['NDL_KING', 'CyberClicker', 'GoldenTap', 'SolarPulse', 'HyperSpeed'];
    for (const username of seedPlayers) {
      routes.push({
        url: `${baseUrl}/player/${encodeURIComponent(username)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return routes;
}
