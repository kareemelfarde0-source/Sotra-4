import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerSlide, PromoBannerStyleConfig } from "../types";
import { sanitizeImageUrl, SOTRA_BANNER_PLACEHOLDER } from "../utils/storage";

interface PromoBannerProps {
  banners: BannerSlide[];
  lang: "ar" | "en";
  styleConfig?: PromoBannerStyleConfig;
  onBannerClick?: (banner: BannerSlide) => void;
  onExploreCategory?: (catId: string) => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({
  banners,
  lang,
  styleConfig,
  onBannerClick,
  onExploreCategory,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const currentItem = banners[currentSlide] || banners[0];

  const handleSlideClick = () => {
    if (onBannerClick) {
      onBannerClick(currentItem);
    } else if (currentItem.targetCategory) {
      onExploreCategory?.(currentItem.targetCategory);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Determine heights and aspect ratio styles
  const parsedCustom = styleConfig?.customHeightText
    ? parseInt(styleConfig.customHeightText.replace(/[^0-9]/g, ""), 10)
    : NaN;

  const desktopH = !isNaN(parsedCustom) && parsedCustom > 100
    ? parsedCustom
    : styleConfig?.heightDesktop || 480;

  const mobileH = styleConfig?.heightMobile
    ? styleConfig.heightMobile
    : Math.max(180, Math.round(desktopH * 0.55));

  const objectFitClass =
    styleConfig?.objectFit === "contain"
      ? "object-contain bg-neutral-950"
      : styleConfig?.objectFit === "fill"
      ? "object-fill"
      : "object-cover";

  const isFullWidth = Boolean(styleConfig?.fullWidth);
  const borderRadius =
    styleConfig?.borderRadius !== undefined
      ? `${styleConfig.borderRadius}px`
      : undefined;

  return (
    <section
      className={`select-none transition-all duration-300 ${
        isFullWidth ? "w-full px-0 pt-0 pb-3" : "max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-3"
      }`}
    >
      <div
        id="sotra-promo-banner"
        onClick={handleSlideClick}
        style={{
          borderRadius: isFullWidth ? "0px" : borderRadius,
        }}
        className={`relative overflow-hidden shadow-lg border border-neutral-200 bg-neutral-900 cursor-pointer group w-full ${
          isFullWidth ? "rounded-none" : "rounded-2xl"
        }`}
      >
        {/* Dynamic Responsive Height Container */}
        <div
          style={{
            height: "var(--banner-h, 260px)",
          }}
          className="w-full relative flex items-center justify-center overflow-hidden banner-responsive-box"
        >
          <style>{`
            .banner-responsive-box {
              height: ${mobileH}px !important;
            }
            @media (min-width: 640px) {
              .banner-responsive-box {
                height: ${Math.round((mobileH + desktopH) / 2)}px !important;
              }
            }
            @media (min-width: 1024px) {
              .banner-responsive-box {
                height: ${desktopH}px !important;
              }
            }
          `}</style>

          <img
            key={currentItem.id}
            src={sanitizeImageUrl(currentItem.image, SOTRA_BANNER_PLACEHOLDER)}
            alt={currentItem.titleAr || currentItem.title || "SOTRA Fashion Offer"}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = SOTRA_BANNER_PLACEHOLDER;
            }}
            className={`w-full h-full object-center transition-all duration-700 group-hover:scale-102 ${objectFitClass}`}
          />
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={lang === "ar" ? handleNext : handlePrev}
              aria-label="Previous slide"
              className="absolute top-1/2 -translate-y-1/2 start-3.5 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-white text-neutral-950 shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={lang === "ar" ? handlePrev : handleNext}
              aria-label="Next slide"
              className="absolute top-1/2 -translate-y-1/2 end-3.5 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-white text-neutral-950 shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 px-3.5 py-1.5 rounded-full backdrop-blur-xs z-10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === idx ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

