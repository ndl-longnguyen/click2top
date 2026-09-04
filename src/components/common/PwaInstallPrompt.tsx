'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Share, PlusSquare, Download, Monitor, Smartphone, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'click_2_top_pwa_dismissed';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect device platform
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) && !('MSStream' in window);
    const isAndroid = /android/i.test(ua);

    if (isIos) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 2. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone === true);

    if (isStandalone) {
      return;
    }

    // 3. Check if user recently dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      return;
    }

    // 4. Register Service Worker reliably
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

    // 5. iOS devices (Safari on iPhone / iPad)
    if (isIos) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 6. Android & Chromium beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fallback: If event hasn't fired after 3.5s, display prompt with manual instructions
    const fallbackTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 3500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch {
        setShowGuide(true);
      }
    } else {
      // Toggle step-by-step installation instructions
      setShowGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowGuide(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 glass-panel rounded-2xl p-3.5 sm:p-4 border border-amber-500/50 shadow-2xl flex flex-col gap-2.5 animate-fade-in bg-slate-950/95 backdrop-blur-xl">
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
            <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
              <span>Install Click 2 Top</span>
              {deviceType === 'desktop' ? (
                <Monitor className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {deviceType === 'ios'
                ? 'Play fullscreen arcade with 0ms touch latency'
                : deviceType === 'android'
                ? 'Fast 1-tap launcher & offline support on Chrome'
                : 'Desktop windowed mode with high FPS performance'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{deferredPrompt ? 'Install App' : showGuide ? 'Hide Guide' : 'How to Install'}</span>
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

      {/* Step-by-Step Installation Guide (Tailored to Device / Browser) */}
      {showGuide && (
        <div className="pt-2 border-t border-white/10 text-xs text-slate-200 space-y-2 animate-fade-in bg-white/5 p-3 rounded-xl">
          {deviceType === 'ios' && (
            <>
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <span>Install on iPhone / iPad (Safari):</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> at the bottom bar of Safari.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">2</span>
                <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-amber-400 mx-0.5" />.</span>
              </div>
            </>
          )}

          {deviceType === 'android' && (
            <>
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <span>Install on Android (Google Chrome):</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>3-dots menu</strong> <MoreVertical className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> in the top-right corner of Chrome.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">2</span>
                <span>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</span>
              </div>
            </>
          )}

          {deviceType === 'desktop' && (
            <>
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <span>Install on Desktop (Chrome / Edge):</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">1</span>
                <span>In Chrome&apos;s address bar, click the <strong>Install App icon</strong> <Download className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> on the right side.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-slate-300">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-white font-bold shrink-0 mt-0.5">2</span>
                <span>Or click Chrome menu <MoreVertical className="w-3.5 h-3.5 inline text-slate-400 mx-0.5" /> ➔ <strong>&quot;Save and share&quot;</strong> ➔ <strong>&quot;Install Click 2 Top&quot;</strong>.</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
