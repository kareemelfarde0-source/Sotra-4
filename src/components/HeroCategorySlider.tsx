import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Category } from "../types";
import { sanitizeImageUrl, SOTRA_CATEGORY_PLACEHOLDER } from "../utils/storage";

interface HeroCategorySliderProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  totalProducts: number;
  lang: "ar" | "en";
}

export const HeroCategorySlider: React.FC<HeroCategorySliderProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  lang,
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = safeCategories.findIndex((c) => c.id === selectedCategory);
    return idx >= 0 ? idx : 0;
  });
  const [isAutoSpin, setIsAutoSpin] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const idx = safeCategories.findIndex((c) => c.id === selectedCategory);
    if (idx >= 0 && idx !== activeIndex) {
      setActiveIndex(idx);
    }
  }, [selectedCategory, safeCategories]);

  useEffect(() => {
    if (!isAutoSpin || safeCategories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeCategories.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoSpin, safeCategories.length]);

  const handlePrev = () => {
    if (safeCategories.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + safeCategories.length) % safeCategories.length);
  };

  const handleNext = () => {
    if (safeCategories.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % safeCategories.length);
  };

  const handleSelectCard = (index: number, catId: string) => {
    setActiveIndex(index);
    onSelectCategory(catId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      lang === "ar" ? handlePrev() : handleNext();
    } else if (diff < -40) {
      lang === "ar" ? handleNext() : handlePrev();
    }
    touchStartX.current = null;
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="pt-4 pb-6 px-3 sm:px-6 max-w-7xl mx-auto select-none">
      <div className="mb-3 flex items-center justify-between gap-2 text-start">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 font-brand">
          {lang === "ar" ? "أقسام التشكيلات" : "Collections"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isAutoSpin
                ? "bg-amber-400 text-neutral-950 border-amber-500 shadow-xs"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
            }`}
            title={lang === "ar" ? "تشغيل الدوران التلقائي" : "Toggle Auto-spin"}
          >
            <RotateCcw className={`w-3 h-3 ${isAutoSpin ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {lang === "ar" ? (isAutoSpin ? "إيقاف الدوران" : "دوران تلقائي") : isAutoSpin ? "Spinning..." : "Auto Spin"}
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={lang === "ar" ? handleNext : handlePrev}
              aria-label="Previous category"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={lang === "ar" ? handlePrev : handleNext}
              aria-label="Next category"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="relative w-full h-[250px] sm:h-[290px] flex items-center justify-center overflow-hidden py-1"
        style={{ perspective: "1100px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
          {safeCategories.map((cat, idx) => {
            const count = safeCategories.length;
            let offset = idx - activeIndex;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            const isVisible = Math.abs(offset) <= 3;
            if (!isVisible) return null;

            const isCenter = offset === 0;
            const isSelected = selectedCategory === cat.id;
            const rotateY = offset * -28;
            const translateX = offset * (typeof window !== "undefined" && window.innerWidth < 640 ? 115 : 170);
            const translateZ =
              -Math.abs(offset) * (typeof window !== "undefined" && window.innerWidth < 640 ? 80 : 110) +
              (isCenter ? 30 : 0);
            const scale = Math.max(0.65, 1 - Math.abs(offset) * 0.16);
            const opacity = Math.max(0.25, 1 - Math.abs(offset) * 0.28);
            const zIndex = 50 - Math.abs(offset) * 10;

            return (
              <div
                key={`cat-slider-${cat.id}-${idx}`}
                onClick={() => handleSelectCard(idx, cat.id)}
                id={`cat-card-${cat.id}`}
                style={{
                  transform: `translateY(-50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.45s ease",
                }}
                className={`absolute top-1/2 w-[145px] sm:w-[195px] h-[200px] sm:h-[250px] rounded-2xl overflow-hidden cursor-pointer shadow-xl border-2 transition-all ${
                  isCenter
                    ? "border-neutral-950 ring-4 ring-neutral-950/15 shadow-2xl"
                    : isSelected
                    ? "border-neutral-900 shadow-md"
                    : "border-white/80 hover:border-neutral-400"
                } bg-neutral-900 group`}
              >
                <img
                  src={sanitizeImageUrl(cat.image, SOTRA_CATEGORY_PLACEHOLDER)}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = SOTRA_CATEGORY_PLACEHOLDER;
                  }}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
                    isCenter
                      ? "from-black/75 via-black/10 to-transparent"
                      : "from-black/85 via-black/40 to-black/20"
                  }`}
                />
                <div className="absolute bottom-2.5 inset-x-2 bg-white/95 backdrop-blur-sm py-2 px-2 rounded-xl text-center shadow-md border border-neutral-100">
                  <span className="text-xs sm:text-sm font-black text-neutral-950 uppercase tracking-tight block leading-snug break-words font-brand">
                    {lang === "ar" ? cat.nameAr : cat.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-1 mb-6">
        {safeCategories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => handleSelectCard(idx, cat.id)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              activeIndex === idx ? "w-6 h-2 bg-neutral-950 shadow-xs" : "w-2 h-2 bg-neutral-300 hover:bg-neutral-500"
            }`}
            aria-label={`Category ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
