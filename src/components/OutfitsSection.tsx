import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Layers, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Product, OutfitBundle, ColorVariant } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER, sanitizeImageUrl } from "../utils/storage";

interface OutfitsSectionProps {
  outfits?: OutfitBundle[];
  products: Product[];
  onSelectOutfit: (outfit: OutfitBundle) => void;
  lang: "ar" | "en";
}

interface OutfitCardProps {
  outfit: OutfitBundle;
  products: Product[];
  onSelectOutfit: (outfit: OutfitBundle) => void;
  lang: "ar" | "en";
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, products, onSelectOutfit, lang }) => {
  const outfitProducts = useMemo(() => {
    return (outfit.productIds || [])
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [outfit.productIds, products]);

  // Collect all preview slides: main outfit image + product images
  const slides = useMemo(() => {
    const list: { url: string; label?: string }[] = [];
    if (outfit.image) {
      list.push({
        url: sanitizeImageUrl(outfit.image, SOTRA_PRODUCT_PLACEHOLDER),
        label: lang === "ar" ? "الإطلالة كاملة" : "Full Look",
      });
    }
    outfitProducts.forEach((p) => {
      const img = p.colors?.[0]?.image || p.colors?.[0]?.backImage || "";
      if (img) {
        list.push({
          url: sanitizeImageUrl(img, SOTRA_PRODUCT_PLACEHOLDER),
          label: lang === "ar" ? p.titleAr : p.title,
        });
      }
    });
    return list.length > 0
      ? list
      : [{ url: SOTRA_PRODUCT_PLACEHOLDER, label: outfit.titleAr }];
  }, [outfit, outfitProducts, lang]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slideshow effect every 2.8 seconds
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 2800);

    return () => clearInterval(timer);
  }, [slides.length]);

  const regularSum = outfitProducts.reduce((sum, p) => sum + p.price, 0);
  const discountPct = outfit.discountPercent || 15;
  const discountedSum = Math.round(regularSum * (1 - discountPct / 100));

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      onClick={() => onSelectOutfit(outfit)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 w-[215px] sm:w-[270px] md:w-[300px] h-[330px] sm:h-[400px] md:h-[430px] rounded-3xl overflow-hidden snap-start cursor-pointer shadow-md hover:shadow-2xl border-2 border-white/90 hover:border-neutral-900 transition-all duration-500 bg-neutral-900 group flex flex-col justify-between"
    >
      {/* Background Slideshow Image with subtle zoom on hover */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950">
        <img
          src={currentSlide.url}
          alt={outfit.titleAr}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
          }}
          className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-105"
        />

        {/* Sophisticated Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
      </div>

      {/* Top Badges Bar */}
      <div className="relative z-10 p-3 flex items-start justify-between gap-2">
        {/* Pieces Count Pill */}
        <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-white text-[11px] font-black rounded-xl border border-white/20 flex items-center gap-1 shadow-sm">
          <Layers className="w-3.5 h-3.5 text-neutral-300" />
          <span>
            {outfitProducts.length} {lang === "ar" ? "قطع" : "items"}
          </span>
        </span>

        {/* Discount & Special Badges */}
        <div className="flex flex-col items-end gap-1">
          <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-black rounded-xl shadow-md font-mono">
            خصم {discountPct}%
          </span>
          {outfit.badgeAr && (
            <span className="px-2 py-0.5 bg-neutral-950/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg border border-neutral-700">
              {outfit.badgeAr}
            </span>
          )}
        </div>
      </div>

      {/* Slide / Product Label Pill in Middle (Shows name of currently previewed piece) */}
      <div className="relative z-10 px-3 flex justify-center">
        {currentSlide.label && (
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold rounded-full border border-white/15 max-w-[85%] truncate transition-all">
            {currentSlide.label}
          </span>
        )}
      </div>

      {/* Bottom Container: Thumbnails Bar + Price + CTA */}
      <div className="relative z-10 p-3 sm:p-4 space-y-2.5">
        {/* Auto-changing Mini Thumbnails Strip for Outfit Pieces */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-fit mx-auto">
            {slides.map((sl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIndex(idx);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-neutral-900 ${
                  currentSlideIndex === idx
                    ? "border-red-500 scale-110 shadow-sm"
                    : "border-white/30 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={sl.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Bottom Card White Pill */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-lg border border-neutral-200 group-hover:bg-white transition-all">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-neutral-950 uppercase tracking-tight font-brand truncate">
                {lang === "ar" ? outfit.titleAr : outfit.titleEn || outfit.titleAr}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                {lang === "ar"
                  ? `طقم كامل (${outfitProducts.length} قطع متناسقة)`
                  : `Matching bundle (${outfitProducts.length} pieces)`}
              </p>
            </div>

            {/* Price Box */}
            <div className="text-end shrink-0">
              <div className="text-xs sm:text-sm font-black text-red-600 font-mono">
                {discountedSum} <span className="text-[10px] font-sans">{lang === "ar" ? "ج.م" : "LE"}</span>
              </div>
              <div className="text-[10px] text-neutral-400 line-through font-mono">
                {regularSum} {lang === "ar" ? "ج.م" : "LE"}
              </div>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-neutral-950 group-hover:text-red-600 transition-colors">
            <span className="text-[11px] sm:text-xs font-black font-brand">
              {lang === "ar" ? "تنسيق واختيار المقاسات" : "Customize & Shop Look"}
            </span>
            {lang === "ar" ? (
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OutfitsSection({
  outfits,
  products,
  onSelectOutfit,
  lang,
}: OutfitsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter active outfits that have at least 1 product
  const activeOutfits = (outfits || []).filter((o) => {
    if (o.isActive === false) return false;
    const hasItems = (o.productIds || []).some((id) => products.some((p) => p.id === id));
    return hasItems;
  });

  if (activeOutfits.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = typeof window !== "undefined" && window.innerWidth < 640 ? 240 : 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 my-8 text-start select-none">
      {/* Section Header with clean title & navigation buttons */}
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-5 bg-neutral-950 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-neutral-950 font-brand">
                {lang === "ar" ? "نسّق إطلالتك الاحترافية" : "SHOP THE LOOK"}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-neutral-100 text-neutral-800 uppercase">
                {activeOutfits.length} {lang === "ar" ? "أطقم" : "outfits"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {lang === "ar"
                ? "أطقم كاملة منسقة بعناية مع صور حية وخصم خاص على الطقم الكامل"
                : "Curated matching sets with live previews and bundle discounts"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll(lang === "ar" ? "right" : "left")}
            aria-label="Previous outfits"
            className="w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(lang === "ar" ? "left" : "right")}
            aria-label="Next outfits"
            className="w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Strip of Enlarged & Auto-Changing Outfit Cards */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-2"
      >
        {activeOutfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            products={products}
            onSelectOutfit={onSelectOutfit}
            lang={lang}
          />
        ))}
      </div>
    </section>
  );
}
