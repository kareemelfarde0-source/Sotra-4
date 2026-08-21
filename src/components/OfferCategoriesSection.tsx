import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, LayoutGrid } from "lucide-react";
import { OfferCategory, Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { ProductCard } from "./ProductCard";
import { OfferShowcaseSlider } from "./OfferShowcaseSlider";
import { sanitizeImageUrl, SOTRA_OFFER_PLACEHOLDER } from "../utils/storage";

interface OfferCategoriesSectionProps {
  offerCategories?: OfferCategory[];
  products?: Product[];
  onOpenProductModal?: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd?: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow?: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onSelectOfferCategory?: (catId: string) => void;
  onOpenOfferCategoryPage?: (catId: string) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const OfferCategoriesSection: React.FC<OfferCategoriesSectionProps> = ({
  offerCategories = [],
  products = [],
  onOpenProductModal = () => {},
  onQuickAdd = () => {},
  onQuickOrderNow = () => {},
  onSelectOfferCategory,
  onOpenOfferCategoryPage,
  onOpenLightbox,
  lang,
  globalDiscountStyle,
}) => {
  const [viewMode, setViewMode] = useState<"slider" | "grid">("slider");
  const stripRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSelectOffer = (catId: string) => {
    if (onSelectOfferCategory) onSelectOfferCategory(catId);
    if (onOpenOfferCategoryPage) onOpenOfferCategoryPage(catId);
  };

  const scrollStrip = (direction: "left" | "right") => {
    if (stripRef.current) {
      const scrollAmount = typeof window !== "undefined" && window.innerWidth < 640 ? 220 : 300;
      stripRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollRow = (catId: string, direction: "left" | "right") => {
    const el = sectionRefs.current[catId];
    if (el) {
      const scrollAmount = typeof window !== "undefined" && window.innerWidth < 640 ? 190 : 260;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const safeOffers = (Array.isArray(offerCategories) ? offerCategories : []).filter(
    (c) => c && c.isVisible !== false
  );
  const safeProducts = Array.isArray(products) ? products : [];

  if (safeOffers.length === 0) return null;

  return (
    <div className="pb-4 select-none">
      {/* Modern Premium Offer Showcase Slider */}
      {viewMode === "slider" ? (
        <div className="relative">
          <OfferShowcaseSlider
            offerCategories={safeOffers}
            products={safeProducts}
            onSelectOfferCategory={onSelectOfferCategory}
            onOpenOfferCategoryPage={onOpenOfferCategoryPage}
            onOpenProductModal={onOpenProductModal}
            onQuickAdd={onQuickAdd}
            onQuickOrderNow={onQuickOrderNow}
            onOpenLightbox={onOpenLightbox}
            lang={lang}
            globalDiscountStyle={globalDiscountStyle}
          />
        </div>
      ) : null}

      {/* Horizontal Cards of Offer Categories */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-2">
        <div className="mb-3 flex items-center justify-between gap-2 text-start">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-neutral-950 rounded-full" />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-950 font-brand">
              {lang === "ar" ? "أقسام وتصنيفات العروض" : "Offer Categories & Deals"}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollStrip(lang === "ar" ? "right" : "left")}
              aria-label="Previous offers"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollStrip(lang === "ar" ? "left" : "right")}
              aria-label="Next offers"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={stripRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth py-1"
        >
          {safeOffers.map((cat, idx) => (
            <button
              key={`offer-strip-item-${cat.id}-${idx}`}
              onClick={() => handleSelectOffer(cat.id)}
              className="relative flex-shrink-0 w-[145px] sm:w-[195px] h-[200px] sm:h-[250px] rounded-2xl overflow-hidden snap-start cursor-pointer shadow-xl border-2 border-white/80 hover:border-neutral-400 transition-all bg-neutral-900 group"
            >
              <img
                src={sanitizeImageUrl(cat.image, SOTRA_OFFER_PLACEHOLDER)}
                alt={lang === "ar" ? cat.nameAr : cat.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = SOTRA_OFFER_PLACEHOLDER;
                }}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
              <div className="absolute bottom-2.5 inset-x-2 bg-white/95 backdrop-blur-sm py-2 px-2 rounded-xl text-center shadow-md border border-neutral-100">
                <span className="text-xs sm:text-sm font-black text-neutral-950 uppercase tracking-tight block leading-snug break-words font-brand">
                  {lang === "ar" ? cat.nameAr : cat.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Row of Products for each Offer Category */}
      {safeOffers.map((cat, idx) => {
        const catProducts = safeProducts.filter((p) => p && String(p.offerCategory || "").trim() === String(cat.id).trim());
        if (catProducts.length === 0) return null;

        return (
          <div key={`offer-row-section-${cat.id}-${idx}`} className="max-w-7xl mx-auto px-3 sm:px-6 py-4 scroll-mt-20">
            <div className="mb-3 flex items-center justify-between gap-2 text-start">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-950 font-brand">
                {lang === "ar" ? cat.nameAr : cat.name}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollRow(cat.id, lang === "ar" ? "right" : "left")}
                  aria-label="Scroll previous"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollRow(cat.id, lang === "ar" ? "left" : "right")}
                  aria-label="Scroll next"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-900 shadow-xs border border-neutral-200 hover:bg-black hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1"
            >
              {catProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[145px] sm:w-[195px] snap-start">
                  <ProductCard
                    product={product}
                    onOpenProductModal={onOpenProductModal}
                    onQuickAdd={onQuickAdd}
                    onQuickOrderNow={onQuickOrderNow}
                    onOpenLightbox={onOpenLightbox}
                    layoutCols={2}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
