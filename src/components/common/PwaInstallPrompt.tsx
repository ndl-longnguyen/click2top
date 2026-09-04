'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'click_2_top_pwa_dismissed';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
  });
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);

    if (isStandalone) {
      return;
    }

    // 2. Check if user recently dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      return;
    }

    // 3. Register Service Worker reliably
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration note:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 4. iOS devices (Safari on iPhone / iPad)
    if (isIosDevice) {
      // iOS Safari never fires beforeinstallprompt — display custom iOS install helper
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 5. Android & Chromium beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fallback: If on mobile Android/Chrome and event hasn't fired after 4s, still provide prompt
    const isMobile = /android|webos|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
    let fallbackTimer: NodeJS.Timeout | undefined;
    if (isMobile) {
      fallbackTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isIosDevice]);

  const handleInstall = async () => {
    if (isIosDevice) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions if browser does not support programmatic prompt or is HTTP
      alert(
        "To install on your phone: Tap browser menu (⋮) at top/bottom and select 'Add to Home screen' or 'Install app'!"
      );
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 glass-panel rounded-2xl p-3.5 sm:p-4 border border-amber-500/50 shadow-2xl flex flex-col gap-2.5 animate-fade-in bg-slate-950/90 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-amber-500/40 shrink-0 bg-black/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <Image
              src="/icon-192.png"
              alt="Click 2 Top App"
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-black text-white truncate">Install Click 2 Top App</div>
            <div className="text-[11px] text-slate-300 truncate">
              {isIosDevice ? 'Fullscreen arcade with 0ms latency' : 'Play fullscreen with instant speed'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isIosDevice ? 'How to Add' : 'Install'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Specific Step-by-Step Install Guide */}
      {isIosDevice && showIosGuide && (
        <div className="pt-2 border-t border-white/10 text-xs text-slate-200 space-y-1.5 animate-fade-in bg-white/5 p-2.5 rounded-xl">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <span>Install on iPhone / iPad:</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold">1</span>
            <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> at the bottom of Safari.</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold">2</span>
            <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 mx-0.5" /> (Thêm vào MH chính).</span>
          </div>
        </div>
      )}
    </div>
  );
};
