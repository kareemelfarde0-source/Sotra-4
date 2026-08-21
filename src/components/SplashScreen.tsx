import React, { useEffect, useState } from "react";
import { SplashScreenConfig } from "../types";
import { DEFAULT_SPLASH_CONFIG } from "../utils/storage";

interface SplashScreenProps {
  isLoading: boolean;
  onFinishLoading?: () => void;
  splashConfig?: SplashScreenConfig;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  onFinishLoading,
  splashConfig,
}) => {
  const config = splashConfig || DEFAULT_SPLASH_CONFIG;

  const [minTimePassed, setMinTimePassed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isCompletelyHidden, setIsCompletelyHidden] = useState(false);

  const duration = config.minDurationMs > 0 ? config.minDurationMs : 1000;

  useEffect(() => {
    if (!config.isEnabled) {
      setIsCompletelyHidden(true);
      if (onFinishLoading) onFinishLoading();
      return;
    }

    const timer = setTimeout(() => {
      setMinTimePassed(true);
    }, duration);
    return () => clearTimeout(timer);
  }, [config.isEnabled, duration, onFinishLoading]);

  // When both minTime has passed and Firestore finished initial fetch
  useEffect(() => {
    if (!config.isEnabled) return;
    if (!isLoading && minTimePassed && !isFadingOut) {
      setIsFadingOut(true);
      const hideTimer = setTimeout(() => {
        setIsCompletelyHidden(true);
        if (onFinishLoading) {
          onFinishLoading();
        }
      }, 600);
      return () => clearTimeout(hideTimer);
    }
  }, [isLoading, minTimePassed, isFadingOut, onFinishLoading, config.isEnabled]);

  if (isCompletelyHidden || !config.isEnabled) {
    return null;
  }

  const isWhite = config.theme !== "dark";
  const showOnlyLogo = config.showOnlyLogo !== false;

  return (
    <div
      id="sotra-luxury-splash-screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center px-4 select-none transition-all duration-700 ease-out ${
        isWhite ? "bg-[#ffffff] text-neutral-900" : "bg-[#070707] text-white"
      } ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background ambient lighting effects */}
      {isWhite ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12)_0%,rgba(250,250,250,0.85)_65%,rgba(255,255,255,1)_100%)] pointer-events-none" />
          <div className="absolute inset-x-6 sm:inset-x-16 top-6 sm:top-12 bottom-6 sm:bottom-12 border border-[#d4af37]/30 rounded-3xl pointer-events-none shadow-xs" />
          <div className="absolute inset-x-8 sm:inset-x-20 top-8 sm:top-14 bottom-8 sm:bottom-14 border border-neutral-200/50 rounded-2xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18)_0%,rgba(10,10,10,0.95)_70%,rgba(5,5,5,1)_100%)] pointer-events-none" />
          <div className="absolute inset-x-8 sm:inset-x-20 top-8 sm:top-14 bottom-8 sm:bottom-14 border border-[#d4af37]/20 rounded-3xl pointer-events-none" />
        </>
      )}

      {/* Main Content Box - Centered Pure Logo */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md mx-auto space-y-5 animate-scale-in">
        {/* Custom Logo Image OR Luxury Emblem */}
        {config.customLogoUrl ? (
          <div className="relative flex items-center justify-center p-3 rounded-2xl max-w-[220px] sm:max-w-[300px] mx-auto animate-scale-in">
            <img
              src={config.customLogoUrl}
              alt={config.brandName || "Brand Logo"}
              className="max-h-28 sm:max-h-40 w-auto object-contain drop-shadow-lg"
            />
          </div>
        ) : (
          /* Luxury SOTRA Emblem with Golden Shimmer Ring */
          <div
            className={`relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-transform duration-700 ${
              isWhite ? "bg-white/95" : "bg-neutral-900/90"
            } ${config.glowEffect ? "animate-pulse" : ""}`}
          >
            <div className="absolute inset-2 rounded-full border border-[#d4af37]/40 border-dashed animate-spin-slow" />
            <span
              className={`text-5xl sm:text-7xl font-black tracking-widest font-brand ${
                isWhite
                  ? "text-neutral-950 drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]"
                  : "text-transparent bg-clip-text bg-gradient-to-br from-[#fbf4db] via-[#d4af37] to-[#aa8010]"
              }`}
            >
              {config.logoLetter || "S"}
            </span>
          </div>
        )}

        {/* Clean Brand Typography (Rendered when showOnlyLogo is false or when explicitly custom) */}
        {!showOnlyLogo && (
          <div className="space-y-1.5 flex flex-col items-center animate-fade-in">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`font-brand font-black text-3xl sm:text-5xl md:text-6xl tracking-[0.25em] uppercase leading-none ${
                  isWhite
                    ? "text-neutral-950"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-white via-[#f7e7c4] to-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                } ${config.glowEffect ? "animate-pulse" : ""}`}
              >
                {config.brandName || "SOTRA"}
              </span>
            </div>

            <span className="text-[10px] sm:text-xs font-black tracking-[0.45em] text-[#dc2626] uppercase">
              FASHION
            </span>

            <div
              className={`h-[2px] w-28 sm:w-44 mx-auto rounded-full mt-2 ${
                isWhite
                  ? "bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_8px_#d4af37]"
                  : "bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_10px_#d4af37]"
              }`}
            />
          </div>
        )}

        {/* Optional Subtitles (Only rendered if showOnlyLogo is false) */}
        {!showOnlyLogo && config.subtitleAr && (
          <div className="space-y-1 pt-1 animate-fade-in">
            <p className={`text-base sm:text-lg font-bold font-arabic ${isWhite ? "text-[#8a6414]" : "text-[#f5e6be]"}`}>
              {config.subtitleAr}
            </p>
          </div>
        )}

        {/* Minimalist Shimmering Loading Line */}
        <div className="pt-4 w-36 sm:w-48">
          <div
            className={`w-full h-1 rounded-full overflow-hidden relative ${
              isWhite ? "bg-neutral-200/80" : "bg-neutral-800/80"
            }`}
          >
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#aa8010] via-[#f5e6be] to-[#aa8010] w-full animate-sotra-shimmer rounded-full shadow-[0_0_10px_#d4af37]" />
          </div>
        </div>
      </div>
    </div>
  );
};
