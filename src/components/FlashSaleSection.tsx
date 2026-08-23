import React, { useState, useEffect, useMemo, useRef } from "react";
import { Clock, ShoppingBag, Check, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Product, FlashSaleConfig, ColorVariant } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER, sanitizeImageUrl } from "../utils/storage";

interface FlashSaleSectionProps {
  config?: FlashSaleConfig;
  products: Product[];
  onOpenProductModal: (product: Product, selectedColorIndex?: number) => void;
  onQuickView?: (product: Product, colorIndex: number) => void;
  onQuickAdd: (
    product: Product,
    color: ColorVariant,
    size: string,
    quantity?: number,
    overridePrice?: number,
    overrideOriginalPrice?: number | null,
    discountNote?: string,
    isFlashSale?: boolean
  ) => void;
  onQuickOrderNow?: (
    product: Product,
    color: ColorVariant,
    size: string,
    quantity?: number,
    overridePrice?: number,
    overrideOriginalPrice?: number | null,
    discountNote?: string,
    isFlashSale?: boolean
  ) => void;
  lang: "ar" | "en";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(endDateStr?: string): TimeRemaining {
  if (!endDateStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  const end = new Date(endDateStr).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

// ----------------------------------------------------
// 1. Single Product Spotlight View (When only 1 product in Flash Sale)
// ----------------------------------------------------
interface SingleProductSpotlightProps {
  product: Product;
  flashPrice: number;
  originalPrice: number;
  discountPercent: number;
  customBadgeAr?: string;
  timeLeft: TimeRemaining;
  onOpenProductModal: (product: Product, selectedColorIndex?: number) => void;
  onQuickAdd: FlashSaleSectionProps["onQuickAdd"];
  onQuickOrderNow?: FlashSaleSectionProps["onQuickOrderNow"];
  lang: "ar" | "en";
}

function SingleProductSpotlight({
  product,
  flashPrice,
  originalPrice,
  discountPercent,
  customBadgeAr,
  timeLeft,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  lang,
}: SingleProductSpotlightProps) {
  const safeColors: ColorVariant[] =
    Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors
      : [{ name: "Default", nameAr: "افتراضي", hex: "#000000", image: "" }];

  const safeSizes: string[] =
    Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["M", "L", "XL", "2XL"];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(() => safeSizes[0] || "L");
  const [isAdded, setIsAdded] = useState(false);

  const currentColor = safeColors[selectedColorIndex] || safeColors[0];
  const displayImage = sanitizeImageUrl(currentColor.image || currentColor.backImage, SOTRA_PRODUCT_PLACEHOLDER);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickOrderNow) {
      onQuickOrderNow(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    } else {
      onQuickAdd(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-7 shadow-xs">
      {/* Header with Title & Countdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-5 bg-red-600 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-950 font-brand uppercase">
                {lang === "ar" ? "عرض فلاش سيل الحصري" : "EXCLUSIVE FLASH DEAL"}
              </h2>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-black rounded-md font-mono">
                -{discountPercent}%
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              {lang === "ar" ? "خصم خاص ومحدد بالوقت ينتهي قريباً" : "Special limited-time deal"}
            </p>
          </div>
        </div>

        {/* Minimalist Countdown Timer */}
        <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3.5 py-1.5 rounded-2xl">
          <Clock className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span className="text-xs font-bold text-neutral-600 pl-1">
            {lang === "ar" ? "ينتهي العرض خلال:" : "Ends in:"}
          </span>
          <div className="flex items-center gap-1 font-mono font-black text-xs text-neutral-900">
            {timeLeft.days > 0 && (
              <>
                <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                  {String(timeLeft.days).padStart(2, "0")} {lang === "ar" ? "ي" : "d"}
                </span>
                <span>:</span>
              </>
            )}
            <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Spotlight Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Left: Product Image with thumbnail color selector */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div
            onClick={() => onOpenProductModal(product, selectedColorIndex)}
            className="relative aspect-4/5 w-full bg-neutral-100 rounded-2xl overflow-hidden cursor-pointer border border-neutral-200 group"
          >
            <img
              src={displayImage}
              alt={product.titleAr}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2.5 py-1 bg-red-600 text-white text-xs font-black rounded-lg shadow-sm font-mono">
                خصم {discountPercent}%
              </span>
            </div>
          </div>

          {/* Color Thumbnails */}
          {safeColors.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {safeColors.map((col, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`w-12 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-neutral-100 ${
                    selectedColorIndex === idx ? "border-neutral-950 shadow-xs scale-105" : "border-neutral-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={sanitizeImageUrl(col.image || col.backImage, SOTRA_PRODUCT_PLACEHOLDER)}
                    alt={col.nameAr || col.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase">
                {product.category}
              </span>
              {customBadgeAr && (
                <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-bold rounded-md">
                  {customBadgeAr}
                </span>
              )}
            </div>

            <h3
              onClick={() => onOpenProductModal(product, selectedColorIndex)}
              className="text-lg sm:text-2xl font-black text-neutral-950 hover:text-red-600 transition-colors cursor-pointer font-brand"
            >
              {lang === "ar" ? product.titleAr : product.title}
            </h3>

            <p className="text-xs sm:text-sm text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
              {lang === "ar"
                ? product.descriptionAr || "خامة قطنية فاخرة معالجة ضد الانكماش والوبر بقصة مريحة وأنيقة."
                : product.description}
            </p>

            {/* Price Box */}
            <div className="mt-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-neutral-400 block line-through font-mono">
                  {originalPrice} {lang === "ar" ? "ج.م" : "LE"}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
                    {flashPrice}
                  </span>
                  <span className="text-xs font-bold text-neutral-700">{lang === "ar" ? "ج.م في العرض" : "LE Deal Price"}</span>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {lang === "ar" ? `وفرت ${originalPrice - flashPrice} ج.م` : `Save ${originalPrice - flashPrice} LE`}
              </span>
            </div>
          </div>

          {/* Color Selection */}
          {safeColors.length > 1 && (
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-2">
                <span>{lang === "ar" ? "اختر اللون:" : "Select Color:"}</span>
                <span className="text-neutral-900 font-bold">{currentColor.nameAr || currentColor.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {safeColors.map((col, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedColorIndex === idx
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                        : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-neutral-300"
                      style={{ backgroundColor: col.hex || (col as any).colorCode || "#000" }}
                    />
                    <span>{col.nameAr || col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-2">
              <span>{lang === "ar" ? "اختر المقاس:" : "Select Size:"}</span>
              <span className="font-mono text-neutral-900">{selectedSize}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {safeSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-11 h-9 px-2 rounded-xl text-xs font-bold font-mono border transition-all cursor-pointer ${
                    selectedSize === sz
                      ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full sm:flex-1 py-3 px-5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                isAdded ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === "ar" ? "تمت الإضافة للسلة ✓" : "Added to Cart ✓"}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === "ar" ? "أضف للسلة بسعر العرض" : "Add to Cart at Deal Price"}</span>
                </>
              )}
            </button>

            {onQuickOrderNow && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full sm:w-auto py-3 px-5 bg-neutral-950 hover:bg-black text-white rounded-2xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                {lang === "ar" ? "شراء فوري مباشر" : "Fast Buy Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. Individual Card for Multi-Product Flash Sale
// ----------------------------------------------------
interface FlashSaleCardProps {
  product: Product;
  flashPrice: number;
  originalPrice: number;
  discountPercent: number;
  customBadgeAr?: string;
  onOpenProductModal: (product: Product, selectedColorIndex?: number) => void;
  onQuickAdd: FlashSaleSectionProps["onQuickAdd"];
  onQuickOrderNow?: FlashSaleSectionProps["onQuickOrderNow"];
  lang: "ar" | "en";
}

function FlashSaleCard({
  product,
  flashPrice,
  originalPrice,
  discountPercent,
  customBadgeAr,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  lang,
}: FlashSaleCardProps) {
  const safeColors: ColorVariant[] =
    Array.isArray(product.colors) && product.colors.length > 0
      ? product.colors
      : [{ name: "Default", nameAr: "افتراضي", hex: "#000000", image: "" }];

  const safeSizes: string[] =
    Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["M", "L", "XL", "2XL"];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(() => safeSizes[0] || "L");
  const [isAdded, setIsAdded] = useState(false);

  const currentColor = safeColors[selectedColorIndex] || safeColors[0];
  const displayImage = sanitizeImageUrl(currentColor.image || currentColor.backImage, SOTRA_PRODUCT_PLACEHOLDER);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickOrderNow) {
      onQuickOrderNow(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    } else {
      onQuickAdd(product, currentColor, selectedSize, 1, flashPrice, originalPrice, "عرض فلاش سيل", true);
    }
  };

  return (
    <div className="group bg-white rounded-none border-2 border-white/80 hover:border-neutral-400 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg shrink-0 w-[165px] sm:w-[220px] h-[285px] sm:h-[350px] relative">
      {/* Product Image */}
      <div
        onClick={() => onOpenProductModal(product, selectedColorIndex)}
        className="relative aspect-4/5 w-full bg-neutral-100 overflow-hidden cursor-pointer"
      >
        <img
          src={displayImage}
          alt={product.titleAr}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 bg-red-600 text-white text-[11px] font-black rounded-md shadow-sm font-mono">
            -{discountPercent}%
          </span>
          {customBadgeAr && (
            <span className="px-1.5 py-0.5 bg-neutral-950/90 text-white text-[9px] font-bold rounded-md">
              {customBadgeAr}
            </span>
          )}
        </div>
      </div>

      {/* Details & Selectors */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2 bg-white">
        <div>
          <h3
            onClick={() => onOpenProductModal(product, selectedColorIndex)}
            className="text-xs sm:text-sm font-bold text-neutral-900 hover:text-red-600 transition-colors line-clamp-1 cursor-pointer font-brand"
            title={product.titleAr}
          >
            {product.titleAr}
          </h3>

          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xs sm:text-sm font-black text-red-600 font-mono">
              {flashPrice} <span className="text-[10px] font-bold">{lang === "ar" ? "ج.م" : "LE"}</span>
            </span>
            {originalPrice > flashPrice && (
              <span className="text-[10px] text-neutral-400 line-through font-mono">
                {originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Color Dots */}
        {safeColors.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {safeColors.map((col, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedColorIndex(idx);
                }}
                className={`w-4 h-4 rounded-full transition-all cursor-pointer border ${
                  idx === selectedColorIndex ? "ring-2 ring-neutral-950 scale-110 border-white" : "border-neutral-300"
                }`}
                style={{ backgroundColor: col.hex || (col as any).colorCode || "#000" }}
              />
            ))}
          </div>
        )}

        {/* Size Selector */}
        <div className="flex items-center gap-1 flex-wrap">
          {safeSizes.slice(0, 4).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSize(sz);
              }}
              className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold font-mono transition-all cursor-pointer ${
                sz === selectedSize
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
              }`}
            >
              {sz}
            </button>
          ))}
        </div>

        {/* Add To Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
            isAdded ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "تمت الإضافة ✓" : "Added ✓"}</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "أضف للسلة" : "Add to Cart"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. Main FlashSaleSection Component
// ----------------------------------------------------
export function FlashSaleSection({
  config,
  products,
  onOpenProductModal,
  onQuickView,
  onQuickAdd,
  onQuickOrderNow,
  lang,
}: FlashSaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeRemaining(config?.endDate));
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config?.isEnabled || !config?.endDate) return;

    setTimeLeft(calculateTimeRemaining(config.endDate));

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(config.endDate);
      setTimeLeft(remaining);
      if (remaining.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [config?.endDate, config?.isEnabled]);

  const flashSaleProducts = useMemo(() => {
    if (!config || !config.isEnabled || !config.items || config.items.length === 0) {
      return [];
    }

    const list: {
      product: Product;
      flashPrice: number;
      originalPrice: number;
      discountPercent: number;
      customBadgeAr?: string;
    }[] = [];

    config.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        let flashPrice = prod.price;
        if (item.flashPrice && item.flashPrice > 0) {
          flashPrice = item.flashPrice;
        } else if (item.discountPercent && item.discountPercent > 0) {
          flashPrice = Math.round(prod.price * (1 - item.discountPercent / 100));
        }

        const original = prod.originalPrice && prod.originalPrice > flashPrice ? prod.originalPrice : prod.price;
        const discountPct = original > flashPrice ? Math.round(((original - flashPrice) / original) * 100) : item.discountPercent || 20;

        list.push({
          product: prod,
          flashPrice,
          originalPrice: original,
          discountPercent: discountPct,
          customBadgeAr: item.customBadgeAr,
        });
      }
    });

    return list;
  }, [config, products]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = lang === "ar" ? 240 : -240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = lang === "ar" ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!config || !config.isEnabled || timeLeft.isExpired || flashSaleProducts.length === 0) {
    return null;
  }

  // If exactly 1 product, render the spotlight hero view
  if (flashSaleProducts.length === 1) {
    const single = flashSaleProducts[0];
    return (
      <section className="max-w-7xl mx-auto px-3 sm:px-6 my-6 text-start select-none">
        <SingleProductSpotlight
          product={single.product}
          flashPrice={single.flashPrice}
          originalPrice={single.originalPrice}
          discountPercent={single.discountPercent}
          customBadgeAr={single.customBadgeAr}
          timeLeft={timeLeft}
          onOpenProductModal={onOpenProductModal}
          onQuickAdd={onQuickAdd}
          onQuickOrderNow={onQuickOrderNow}
          lang={lang}
        />
      </section>
    );
  }

  const title = lang === "ar" ? config.titleAr || "عروض الفلاش سيل" : config.titleEn || "Flash Sale Deals";
  const subtitle =
    lang === "ar"
      ? config.subtitleAr || "خصومات محدودة بالوقت تنتهي بانتهاء العداد"
      : config.subtitleEn || "Limited-time deals with extra discounts";

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 my-6 text-start select-none">
      {/* Clean White Container */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-6 shadow-xs">
        {/* Header with Title & Minimalist Live Countdown */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-5 bg-red-600 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 font-brand uppercase">
                  {title}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-red-50 text-red-600 font-mono">
                  {flashSaleProducts.length} {lang === "ar" ? "عروض" : "deals"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">{subtitle}</p>
            </div>
          </div>

          {/* Minimalist Countdown Timer & Navigation Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-2xl">
              <Clock className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="text-xs font-bold text-neutral-600 pl-1">
                {lang === "ar" ? "ينتهي في:" : "Ends:"}
              </span>

              <div className="flex items-center gap-1 font-mono font-black text-xs text-neutral-900">
                {timeLeft.days > 0 && (
                  <>
                    <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                      {String(timeLeft.days).padStart(2, "0")} {lang === "ar" ? "ي" : "d"}
                    </span>
                    <span>:</span>
                  </>
                )}
                <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-2xs">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Slider Nav Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleScrollLeft}
                aria-label="Previous products"
                className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-950 hover:text-white border border-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                aria-label="Next products"
                className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-950 hover:text-white border border-neutral-200 flex items-center justify-center text-neutral-700 transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Horizontal Cards Row */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-4 px-1"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {flashSaleProducts.map(({ product, flashPrice, originalPrice, discountPercent, customBadgeAr }) => (
            <div key={product.id} style={{ scrollSnapAlign: "start" }}>
              <FlashSaleCard
                product={product}
                flashPrice={flashPrice}
                originalPrice={originalPrice}
                discountPercent={discountPercent}
                customBadgeAr={customBadgeAr}
                onOpenProductModal={onOpenProductModal}
                onQuickAdd={onQuickAdd}
                onQuickOrderNow={onQuickOrderNow}
                lang={lang}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
