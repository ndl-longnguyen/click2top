import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config/site';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
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

  return routes;
}
