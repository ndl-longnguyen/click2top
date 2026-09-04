import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Flame, Zap, ArrowLeft, Play } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCountryFlag, getCountryName } from '@/lib/config/countries';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clicker2top.vercel.app';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const canonicalUrl = `${siteUrl}/player/${encodeURIComponent(decoded)}`;

  return {
    title: `${decoded} — Coin Clicker Champion Profile`,
    description: `Inspect ${decoded}'s competitive record on Coin Clicker! High score: 98M+ Energy. Can you beat them on the global Nations Cup leaderboard? Play now free!`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${decoded} | Coin Clicker Champion Profile`,
      description: `Check out ${decoded}'s score and ranking on Coin Clicker! Tap coins, dodge bombs, and challenge them for the #1 spot.`,
      url: canonicalUrl,
      type: 'profile',
      images: [
        {
          url: '/icon-512.png',
          width: 512,
          height: 512,
          alt: `${decoded} on Coin Clicker Leaderboard`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${decoded} — Coin Clicker Champion`,
      description: `Can you beat ${decoded} on Coin Clicker? Play free and challenge their high score!`,
      images: ['/icon-512.png'],
    },
  };
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  let bio = 'Tapping my way to the top of the leaderboard!';
  let score = 98291221;
  const rank = 1;
  let bestCombo = 127;
  let country = 'VN';

  const supabase = createServerSupabaseClient();
  if (supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, short_description, country')
      .eq('username', decoded)
      .maybeSingle();

    if (profile) {
      bio = profile.short_description || bio;
      country = profile.country || country;
      const { data: stats } = await supabase
        .from('player_stats')
        .select('leaderboard_score, best_combo')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (stats) {
        score = stats.leaderboard_score || score;
        bestCombo = stats.best_combo || bestCombo;
      }
    }
  }

  // Schema.org ProfilePage Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: decoded,
      description: bio,
      identifier: decoded,
      nationality: getCountryName(country),
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/AchieveAction',
          userInteractionCount: score,
        },
      ],
    },
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_10%,#1e1b4b_0%,#070a12_60%)] text-slate-100 p-4 sm:p-6 md:p-10 flex flex-col items-center justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="w-full max-w-xl space-y-6">
        {/* Navigation Link back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase font-extrabold tracking-wider text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </Link>

        {/* Hero Profile Card */}
        <article className="glass-panel-gold rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_35px_rgba(245,158,11,0.6)]">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-4xl sm:text-5xl">
              👑
            </div>
          </div>

          <header>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase mb-2">
              <span className="text-base">{getCountryFlag(country)}</span>
              <Trophy className="w-3.5 h-3.5" />
              <span>GLOBAL RANK #{rank} ({getCountryName(country)})</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide flex items-center justify-center gap-2">
              <span>{getCountryFlag(country)}</span>
              <span>{decoded}</span>
            </h1>

            <p className="text-sm sm:text-base italic text-amber-200/90 max-w-md mx-auto mt-2">
              &ldquo;{bio}&rdquo;
            </p>
          </header>

          {/* Stats Badges */}
          <section aria-label="Player Statistics" className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] uppercase font-bold text-sky-400">
                <Zap className="w-3.5 h-3.5" />
                <span>Total Score</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                {score.toLocaleString()} ⚡
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] uppercase font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>Best Combo</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                ×{bestCombo}
              </div>
            </div>
          </section>

          {/* Call to Action: Play & Beat Them! */}
          <footer className="pt-4 border-t border-white/10 space-y-3">
            <Link
              href="/"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>PLAY & TRY TO BEAT THEM</span>
            </Link>

            <p className="text-xs text-slate-400">
              Free to play immediately in your browser or mobile phone!
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}
