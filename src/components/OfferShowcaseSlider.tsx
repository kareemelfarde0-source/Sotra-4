import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Eye,
  Tag,
  ArrowRight,
  Layers,
} from "lucide-react";
import { OfferCategory, Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { sanitizeImageUrl, SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { getEffectiveProductDiscount } from "../utils/discount";

interface OfferShowcaseSliderProps {
  offerCategories: OfferCategory[];
  products: Product[];
  activeCategoryId?: string;
  onOpenProductModal?: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd?: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow?: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onSelectOfferCategory?: (catId: string) => void;
  onOpenOfferCategoryPage?: (catId: string) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const OfferShowcaseSlider: React.FC<OfferShowcaseSliderProps> = ({
  offerCategories = [],
  products = [],
  activeCategoryId,
  onOpenProductModal,
  onOpenLightbox,
  onOpenOfferCategoryPage,
  lang,
  globalDiscountStyle = "vertical_left",
}) => {
  const safeOffers = useMemo(
    () => (Array.isArray(offerCategories) ? offerCategories : []).filter((c) => c && c.isVisible !== false),
    [offerCategories]
  );
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  // Selected Offer Category tab ("all" or offer category id)
  const [selectedOfferTab, setSelectedOfferTab] = useState<string>(() => {
    if (activeCategoryId) return activeCategoryId;
    return safeOffers.length > 0 ? safeOffers[0].id : "all";
  });

  // Keep selectedOfferTab synced if activeCategoryId changes
  useEffect(() => {
    if (activeCategoryId) {
      setSelectedOfferTab(activeCategoryId);
    }
  }, [activeCategoryId]);

  // Keep selectedOfferTab synced if categories change
  useEffect(() => {
    if (safeOffers.length > 0 && selectedOfferTab !== "all" && !safeOffers.some((o) => o.id === selectedOfferTab)) {
      setSelectedOfferTab(safeOffers[0].id);
    }
  }, [safeOffers, selectedOfferTab]);

  // Products filtered by selected offer category
  const filteredOfferProducts = useMemo(() => {
    if (selectedOfferTab === "all") {
      const offerCatIds = new Set(safeOffers.map((o) => o.id));
      return safeProducts.filter(
        (p) =>
          (p.offerCategory && offerCatIds.has(p.offerCategory)) ||
          (p.originalPrice && p.originalPrice > p.price) ||
          (p.discountPercent && p.discountPercent > 0)
      );
    }
    return safeProducts.filter((p) => p && String(p.offerCategory || "").trim() === String(selectedOfferTab).trim());
  }, [safeProducts, selectedOfferTab, safeOffers]);

  // Active Card Index in Slider
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoSpin, setIsAutoSpin] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  // Keep active index in bounds
  const safeIndex = useMemo(() => {
    if (filteredOfferProducts.length === 0) return 0;
    return Math.min(Math.max(0, activeIndex), filteredOfferProducts.length - 1);
  }, [filteredOfferProducts.length, activeIndex]);

  // Reset active index when category tab changes
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedOfferTab]);

  // Auto-spin logic
  useEffect(() => {
    if (!isAutoSpin || filteredOfferProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredOfferProducts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoSpin, filteredOfferProducts.length]);

  const handlePrev = () => {
    if (filteredOfferProducts.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + filteredOfferProducts.length) % filteredOfferProducts.length);
  };

  const handleNext = () => {
    if (filteredOfferProducts.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % filteredOfferProducts.length);
  };

  const handleCardClick = (product: Product, index: number) => {
    if (index !== safeIndex) {
      setActiveIndex(index);
    } else {
      if (onOpenProductModal) {
        onOpenProductModal(product, 0);
      }
    }
  };

  const handleEyeClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const imgs: string[] = [];
    if (product.colors && product.colors.length > 0) {
      product.colors.forEach((c) => {
        if (c.image) imgs.push(sanitizeImageUrl(c.image, SOTRA_PRODUCT_PLACEHOLDER));
        if (c.backImage) imgs.push(sanitizeImageUrl(c.backImage, SOTRA_PRODUCT_PLACEHOLDER));
      });
    }
    const finalImgs = imgs.length > 0 ? imgs : [sanitizeImageUrl(product.colors?.[0]?.image, SOTRA_PRODUCT_PLACEHOLDER)];
    if (onOpenLightbox) {
      onOpenLightbox(finalImgs, 0);
    }
  };

  const handleCartClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (onOpenProductModal) {
      onOpenProductModal(product, 0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !isDragging.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      lang === "ar" ? handlePrev() : handleNext();
    } else if (diff < -45) {
      lang === "ar" ? handleNext() : handlePrev();
    }
    touchStartX.current = null;
    isDragging.current = false;
  };

  if (safeOffers.length === 0 && safeProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-4 px-3 sm:px-6 max-w-7xl mx-auto select-none font-sans">
      {/* CLEAN WHITE HEADER WITH BLACK TEXT & TABS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-neutral-950 border border-neutral-200/90 shadow-xs mb-4">
        {/* Top Line: Simple Title + Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5 text-start">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 text-neutral-950 flex items-center justify-center border border-neutral-200">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-tight font-brand">
                  {lang === "ar" ? "العروض والمنتجات" : "OFFERS & PRODUCTS"}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-neutral-100 text-neutral-800 uppercase">
                  {filteredOfferProducts.length} {lang === "ar" ? "عرض" : "deals"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Auto-spin + Navigation */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsAutoSpin(!isAutoSpin)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isAutoSpin
                  ? "bg-neutral-950 text-white border-neutral-950 shadow-xs font-black"
                  : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
              }`}
              title={lang === "ar" ? "تشغيل / إيقاف التمرير التلقائي" : "Toggle auto rotation"}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isAutoSpin ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {lang === "ar" ? "تلقائي" : "Auto"}
              </span>
            </button>

            <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-xl border border-neutral-200">
              <button
                onClick={lang === "ar" ? handleNext : handlePrev}
                disabled={filteredOfferProducts.length <= 1}
                aria-label="Previous card"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-neutral-950 hover:text-white text-neutral-800 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90 border border-neutral-200 shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-1.5 text-neutral-600">
                {filteredOfferProducts.length > 0
                  ? `${String(safeIndex + 1).padStart(2, "0")}/${String(filteredOfferProducts.length).padStart(2, "0")}`
                  : "00/00"}
              </span>
              <button
                onClick={lang === "ar" ? handlePrev : handleNext}
                disabled={filteredOfferProducts.length <= 1}
                aria-label="Next card"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-neutral-950 hover:text-white text-neutral-800 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90 border border-neutral-200 shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedOfferTab !== "all" && onOpenOfferCategoryPage && (
              <button
                onClick={() => onOpenOfferCategoryPage(selectedOfferTab)}
                className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 transition-all cursor-pointer font-brand"
              >
                <span>{lang === "ar" ? "عرض الكل" : "View All"}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Selection Tabs (White background, Black text) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedOfferTab("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-none text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 border font-brand ${
              selectedOfferTab === "all"
                ? "bg-white text-neutral-950 border-2 border-neutral-950 font-black shadow-xs ring-1 ring-neutral-950/10"
                : "bg-white text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 border-neutral-200"
            }`}
          >
            <span>{lang === "ar" ? "كل العروض" : "All Deals"}</span>
          </button>

          {safeOffers.map((offerCat) => {
            const catProdCount = safeProducts.filter(
              (p) => p && String(p.offerCategory || "").trim() === String(offerCat.id).trim()
            ).length;

            const isSelected = selectedOfferTab === offerCat.id;

            return (
              <button
                key={offerCat.id}
                onClick={() => setSelectedOfferTab(offerCat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-none text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 border font-brand ${
                  isSelected
                    ? "bg-white text-neutral-950 border-2 border-neutral-950 font-black shadow-xs ring-1 ring-neutral-950/10"
                    : "bg-white text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 border-neutral-200"
                }`}
              >
                <span>{lang === "ar" ? offerCat.nameAr : offerCat.name}</span>
                {catProdCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold ${
                      isSelected ? "bg-neutral-200 text-neutral-950 font-black" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {catProdCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D PRODUCTS SLIDER WITH CLEAN WHITE CARDS */}
      {filteredOfferProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200 shadow-2xs my-3">
          <Tag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-neutral-800">
            {lang === "ar" ? "لا توجد منتجات في هذا التبويب حالياً" : "No products in this tab"}
          </h3>
        </div>
      ) : (
        <div className="relative">
          {/* Main 3D Carousel Viewport */}
          <div
            className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] flex items-center justify-center overflow-hidden py-2"
            style={{ perspective: "1200px" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
              {filteredOfferProducts.map((product, idx) => {
                const total = filteredOfferProducts.length;
                let offset = idx - safeIndex;

                if (total > 2) {
                  if (offset > total / 2) offset -= total;
                  if (offset < -total / 2) offset += total;
                }

                const isCenter = offset === 0;
                const isVisible = Math.abs(offset) <= 3;
                if (!isVisible) return null;

                // 3D Geometry
                const rotateY = offset * -22;
                const translateX =
                  offset * (typeof window !== "undefined" && window.innerWidth < 640 ? 130 : 195);
                const translateZ =
                  -Math.abs(offset) * (typeof window !== "undefined" && window.innerWidth < 640 ? 80 : 120) +
                  (isCenter ? 30 : 0);
                const scale = Math.max(0.7, 1 - Math.abs(offset) * 0.12);
                const opacity = Math.max(0.3, 1 - Math.abs(offset) * 0.22);
                const zIndex = 60 - Math.abs(offset) * 10;

                const prodTitle = lang === "ar" ? product.titleAr || product.title : product.title || product.titleAr;
                const prodImg = sanitizeImageUrl(
                  product.colors?.[0]?.image || (product as any).image,
                  SOTRA_PRODUCT_PLACEHOLDER
                );

                const effectiveDiscount = getEffectiveProductDiscount(product, globalDiscountStyle);
                const isDiscountActive = effectiveDiscount.isActive;
                const cardDiscountStyle: DiscountBadgeStyle = effectiveDiscount.style;
                const timeRemaining = lang === "ar" ? effectiveDiscount.timeRemainingAr : effectiveDiscount.timeRemainingEn;

                return (
                  <div
                    key={`offer-prod-${product.id}-${idx}`}
                    onClick={() => handleCardClick(product, idx)}
                    id={`offer-card-${product.id}`}
                    style={{
                      transform: `translateY(-50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                      opacity,
                      zIndex,
                      transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease",
                    }}
                    className={`absolute top-1/2 w-[180px] sm:w-[230px] md:w-[260px] rounded-none overflow-hidden cursor-pointer transition-all group bg-white border ${
                      isCenter
                        ? "border-neutral-950 ring-4 ring-neutral-950/15 shadow-2xl scale-100"
                        : "border-neutral-200 shadow-md hover:border-neutral-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Card Image */}
                    <div className="relative w-full aspect-[3/4] bg-neutral-100 overflow-hidden rounded-none">
                      <img
                        src={prodImg}
                        alt={prodTitle}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                        }}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Discount Badge on Image */}
                      {isDiscountActive && cardDiscountStyle !== "above_title" && (
                        <DiscountBadge
                          discountPercent={effectiveDiscount.percent}
                          originalPrice={product.originalPrice}
                          price={product.price}
                          style={cardDiscountStyle}
                          lang={lang}
                          timeRemainingText={timeRemaining}
                        />
                      )}

                      {/* Out of stock badge if applicable */}
                      {product.inStock === false && (
                        <div className="absolute top-2.5 end-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-none bg-neutral-900 text-white text-[10px] font-bold shadow-xs">
                            {lang === "ar" ? "نفد" : "Out"}
                          </span>
                        </div>
                      )}

                      {/* EYE & CART ACTIONS */}
                      <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between z-20">
                        {/* Eye Button for Zoom */}
                        <button
                          onClick={(e) => handleEyeClick(e, product)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-white/95 hover:bg-neutral-950 text-neutral-900 hover:text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 border border-neutral-200/90 cursor-pointer backdrop-blur-xs"
                          title={lang === "ar" ? "معاينة وتكبير صورة المنتج" : "Preview image"}
                          aria-label="View product image"
                        >
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        </button>

                        {/* Cart Button to Open Modal */}
                        <button
                          onClick={(e) => handleCartClick(e, product)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-none bg-neutral-950 hover:bg-black text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 border border-neutral-800 cursor-pointer"
                          title={lang === "ar" ? "طلب واختيار المقاس واللون" : "Order & Choose Options"}
                          aria-label="Add to cart / Order"
                        >
                          <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3 text-start bg-white border-t border-neutral-100">
                      {/* Discount Badge Above Title (if configured) */}
                      {isDiscountActive && cardDiscountStyle === "above_title" && (
                        <DiscountBadge
                          discountPercent={effectiveDiscount.percent}
                          originalPrice={product.originalPrice}
                          price={product.price}
                          style="above_title"
                          lang={lang}
                          timeRemainingText={timeRemaining}
                        />
                      )}

                      <h4 className="text-xs sm:text-sm font-black text-neutral-950 line-clamp-1 font-brand">
                        {prodTitle}
                      </h4>

                      <div className="flex items-baseline justify-between gap-1 mt-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-black text-neutral-950 font-brand">
                            {product.price} {lang === "ar" ? "ج.م" : "EGP"}
                          </span>
                          {isDiscountActive && product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-[10px] sm:text-xs line-through text-neutral-400 font-brand">
                              {product.originalPrice}
                            </span>
                          )}
                        </div>

                        {/* Color Dots */}
                        {product.colors && product.colors.length > 1 && (
                          <div className="flex items-center gap-1">
                            {product.colors.slice(0, 3).map((col, cIdx) => (
                              <span
                                key={`col-dot-${cIdx}`}
                                className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-[9px] text-neutral-500 font-bold">
                                +{product.colors.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold text-neutral-600 group-hover:text-neutral-950">
                        <span>{lang === "ar" ? "المقاسات والطلب" : "Details & Order"}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-1">
            {filteredOfferProducts.map((_, idx) => (
              <button
                key={`dot-offer-${idx}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  safeIndex === idx
                    ? "w-6 h-1.5 bg-neutral-950 shadow-2xs"
                    : "w-1.5 h-1.5 bg-neutral-300 hover:bg-neutral-500"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
