import React, { useState } from "react";
import { ShoppingBag, Eye, AlertTriangle, Zap, Check, ZoomIn } from "lucide-react";
import { motion } from "motion/react";
import { Product, ColorVariant, DiscountBadgeStyle } from "../types";
import {
  getVariantStock,
  isLowStock,
  isOutOfStock,
  isProductModelOutOfStock,
  isColorVariantOutOfStock,
  getOutOfStockMessage,
  sanitizeImageUrl,
  SOTRA_PRODUCT_PLACEHOLDER,
} from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { getEffectiveProductDiscount } from "../utils/discount";

interface ProductCardProps {
  product: Product;
  onOpenProductModal: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickView?: (product: Product, selectedColorIndex: number) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  layoutCols: number;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  onQuickView,
  onOpenLightbox,
  layoutCols,
  lang,
  globalDiscountStyle = "vertical_left",
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickSizes, setShowQuickSizes] = useState(false);

  // Compute effective scheduled discount and style
  const effectiveDiscount = getEffectiveProductDiscount(product, globalDiscountStyle);
  const discountStyle: DiscountBadgeStyle = effectiveDiscount.style;
  const isDiscountActive = effectiveDiscount.isActive;
  const timeRemaining = lang === "ar" ? effectiveDiscount.timeRemainingAr : effectiveDiscount.timeRemainingEn;

  const safeColors = Array.isArray(product?.colors) && product.colors.length > 0 ? product.colors : [
    { name: "Black", nameAr: "أسود", colorCode: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }
  ];
  const safeSizes = Array.isArray(product?.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL", "XXL"];

  // Available colors (filter out colors that have 0 total stock across all sizes if inventory is set)
  const availableColors = safeColors.filter((col) => {
    if (!product?.inventory || Object.keys(product.inventory).length === 0) return true;
    const hasAnyStock = safeSizes.some((sz) => getVariantStock(product, col, sz) > 0);
    return hasAnyStock;
  });

  const validColors = availableColors.length > 0 ? availableColors : safeColors;
  const currentColor = validColors[selectedColorIndex] || validColors[0] || safeColors[0];

  // Available sizes for the currently selected color
  const matchedSizes = safeSizes.filter((sz) => getVariantStock(product, currentColor, sz) > 0);
  const availableSizesForColor = matchedSizes.length > 0 ? matchedSizes : (product.inStock !== false ? safeSizes : []);

  const rawImage = isHovered && currentColor.backImage ? currentColor.backImage : currentColor.image;
  const displayImage = sanitizeImageUrl(rawImage, SOTRA_PRODUCT_PLACEHOLDER);

  // Check overall stock for the current color and model
  const totalStockForCurrentColor = safeSizes.reduce(
    (acc, sz) => acc + getVariantStock(product, currentColor, sz),
    0
  );
  const isColorLowStock = totalStockForCurrentColor === 1;
  const isModelOutOfStock = isProductModelOutOfStock(product);
  const isColorOutOfStock = isColorVariantOutOfStock(product, currentColor) || (totalStockForCurrentColor <= 0 && availableSizesForColor.length === 0);
  const isEntirelyOutOfStock = isModelOutOfStock || isColorOutOfStock;

  const handleColorClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setSelectedColorIndex(index);
  };

  const handleQuickBagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEntirelyOutOfStock) return;
    setShowQuickSizes(!showQuickSizes);
  };

  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    onQuickAdd(product, currentColor, size);
    setShowQuickSizes(false);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const imgs = [currentColor.image, ...(currentColor.backImage ? [currentColor.backImage] : [])];
    if (onOpenLightbox) {
      onOpenLightbox(imgs, 0);
    } else if (typeof window !== "undefined" && (window as any).openSotraLightbox) {
      (window as any).openSotraLightbox(imgs, 0);
    }
  };

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onOpenProductModal(product, selectedColorIndex)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickSizes(false);
      }}
      className={`group relative flex flex-col bg-white rounded-none overflow-hidden cursor-pointer transition-all duration-300 ${
        layoutCols === 1
          ? "sm:flex-row sm:h-72 border border-neutral-200 p-3 sm:p-4 gap-4 shadow-xs hover:shadow-md hover:border-neutral-400"
          : "border border-neutral-200/90 hover:border-neutral-950 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {/* Product Image Stage */}
      <div
        className={`relative overflow-hidden bg-neutral-100/90 rounded-none ${
          layoutCols === 1 ? "w-full sm:w-56 h-72 sm:h-full rounded-none flex-shrink-0" : "w-full aspect-[3/4]"
        }`}
      >
        <img
          src={displayImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
          }}
          className={`w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 ${
            isEntirelyOutOfStock ? "grayscale-[35%] opacity-90" : ""
          }`}
        />

        {/* Out Of Stock Ribbon Stripe Overlay on Image */}
        {isEntirelyOutOfStock && (
          <div className="absolute inset-0 z-15 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none p-2">
            <div className="w-[125%] bg-neutral-950/95 py-2 border-y-2 border-red-600 shadow-2xl transform -rotate-12 flex flex-col items-center justify-center">
              <span className="text-white text-[11px] sm:text-xs font-black uppercase tracking-widest font-brand drop-shadow-md text-center px-2">
                {isModelOutOfStock
                  ? lang === "ar"
                    ? "نفدت المقاسات بهذا الموديل"
                    : "OUT OF STOCK"
                  : lang === "ar"
                  ? "نفدت المقاسات الخاصة بهذا اللون"
                  : "COLOR OUT OF STOCK"}
              </span>
              <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider font-brand">
                OUT OF STOCK
              </span>
            </div>
          </div>
        )}

        {/* Discount Ribbon Badge based on selected style */}
        {isDiscountActive && !isEntirelyOutOfStock && discountStyle !== "above_title" && (
          <DiscountBadge
            discountPercent={effectiveDiscount.percent}
            originalPrice={product.originalPrice}
            price={product.price}
            style={discountStyle}
            lang={lang}
            timeRemainingText={timeRemaining}
          />
        )}

        {/* Badges / Low Stock Alert / Top Badges */}
        <div className="absolute top-2.5 start-2.5 z-10 flex flex-col gap-1.5 items-start max-w-[75%] pointer-events-none">
          {isModelOutOfStock ? (
            <span className="inline-block bg-neutral-900/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-none shadow-xs uppercase tracking-wider font-brand border border-white/20">
              {lang === "ar" ? "نفدت المقاسات بهذا الموديل" : "OUT OF STOCK"}
            </span>
          ) : isColorOutOfStock ? (
            <span className="inline-block bg-neutral-900/90 backdrop-blur-xs text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-none shadow-xs uppercase tracking-wider font-brand border border-white/20">
              {lang === "ar" ? "نفدت المقاسات الخاصة بهذا اللون" : "COLOR OUT OF STOCK"}
            </span>
          ) : isColorLowStock ? (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-neutral-950 text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-none shadow-md tracking-wide font-arabic animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {lang === "ar" ? "آخر قطعة متوفرة!" : "1 Piece Left"}
            </span>
          ) : null}

          {product.badge && (product.badge.textAr || product.badge.text) ? (
            <span
              className={`inline-block text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-none shadow-sm uppercase tracking-wider font-brand select-none backdrop-blur-xs ${
                product.badge.type === "new"
                  ? "bg-emerald-600/95 text-white"
                  : product.badge.type === "discount"
                  ? "bg-[#dc2626]/95 text-white"
                  : product.badge.type === "featured" || product.badge.type === "bestseller"
                  ? "bg-amber-400 text-neutral-950"
                  : product.badge.type === "exclusive"
                  ? "bg-indigo-700/95 text-white"
                  : product.badge.type === "limited"
                  ? "bg-rose-700/95 text-white"
                  : product.badge.type === "restocked"
                  ? "bg-sky-600/95 text-white"
                  : "bg-neutral-950/95 text-white"
              }`}
              style={{
                backgroundColor: product.badge.colorBg || undefined,
                color: product.badge.colorText || undefined,
              }}
            >
              {lang === "ar" ? product.badge.textAr || product.badge.text : product.badge.text || product.badge.textAr}
            </span>
          ) : null}
        </div>

        {/* Quick Actions overlay buttons */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-20 flex items-center justify-between pointer-events-auto">
          {/* Left: Quick View / Fabric Texture Zoom */}
          <div className="flex items-center gap-1.5">
            <button
              id={`btn-quick-view-${product.id}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickView) {
                  onQuickView(product, selectedColorIndex);
                } else {
                  handleQuickViewClick(e);
                }
              }}
              aria-label={lang === "ar" ? "معاينة وشراء سريع" : "Quick View"}
              title={lang === "ar" ? "معاينة واختيار المقاس فوراً" : "Quick View"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-white/95 hover:bg-neutral-950 text-neutral-900 hover:text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 border border-neutral-300 cursor-pointer backdrop-blur-xs group/btn"
            >
              <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </button>

            <button
              id={`btn-details-zoom-${product.id}`}
              onClick={handleQuickViewClick}
              aria-label={lang === "ar" ? "معاينة وتكبير تفاصيل المنتج" : "Inspect product details"}
              title={lang === "ar" ? "معاينة تفاصيل المنتج (2.5x)" : "Inspect Product Details (2.5x)"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-white/95 hover:bg-neutral-950 text-neutral-900 hover:text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 border border-neutral-300 cursor-pointer backdrop-blur-xs group/zoom"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-800 group-hover/zoom:text-white stroke-[2.2]" />
            </button>
          </div>

          {/* Right: Quick Bag */}
          {!isEntirelyOutOfStock && (
            <button
              id={`btn-quick-bag-${product.id}`}
              onClick={handleQuickBagClick}
              aria-label="Quick add to bag"
              title={lang === "ar" ? "إضافة سريعة للسلة" : "Quick Add"}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-white/95 hover:bg-neutral-950 text-neutral-900 hover:text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-90 border border-neutral-300 cursor-pointer backdrop-blur-xs"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </button>
          )}
        </div>

        {/* Quick Sizes Selector Popup */}
        {showQuickSizes && availableSizesForColor.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-2 bottom-14 z-30 bg-white/98 backdrop-blur-md p-3 rounded-none shadow-2xl border border-neutral-300 animate-scale-in text-center"
          >
            <p className="text-[11px] font-bold text-neutral-700 mb-2 uppercase">
              {lang === "ar" ? "اختر المقاس المطلوب" : "Select Size"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {availableSizesForColor.map((sz) => {
                const stock = getVariantStock(product, currentColor, sz);
                const isSingleLeft = isLowStock(stock);
                return (
                  <button
                    key={sz}
                    onClick={(e) => handleSizeSelect(e, sz)}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-none border transition-all cursor-pointer ${
                      isSingleLeft
                        ? "bg-amber-50 text-amber-900 border-amber-400 hover:bg-amber-500 hover:text-white"
                        : "bg-neutral-100/90 hover:bg-neutral-950 hover:text-white text-neutral-900 border-neutral-300"
                    }`}
                    title={isSingleLeft ? (lang === "ar" ? "متبقي قطعة واحدة فقط!" : "1 left in stock!") : ""}
                  >
                    {sz}
                    {isSingleLeft && <span className="ms-0.5 text-[9px] text-red-600 font-black">•</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={`p-3.5 sm:p-4 flex flex-col justify-between flex-1 text-start ${layoutCols === 1 ? "sm:py-2" : ""}`}>
        <div>
          {/* Color Switcher */}
          {validColors.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto no-scrollbar py-0.5">
              {validColors.map((color, idx) => {
                const isSelected = idx === selectedColorIndex;
                return (
                  <button
                    key={color.name}
                    onClick={(e) => handleColorClick(e, idx)}
                    title={lang === "ar" ? color.nameAr : color.name}
                    className={`relative w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full transition-transform flex items-center justify-center cursor-pointer shadow-2xs ${
                      isSelected ? "ring-2 ring-neutral-950 ring-offset-1.5 scale-110" : "hover:scale-110 opacity-80 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      border: color.hex === "#ffffff" || color.hex === "#f8fafc" ? "1px solid #d4d4d8" : "none",
                    }}
                  >
                    {isSelected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          color.hex === "#ffffff" || color.hex === "#f8fafc" ? "bg-black" : "bg-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Discount Badge Above Title (if style selected) */}
          {isDiscountActive && discountStyle === "above_title" && (
            <DiscountBadge
              discountPercent={effectiveDiscount.percent}
              originalPrice={product.originalPrice}
              price={product.price}
              style="above_title"
              lang={lang}
              timeRemainingText={timeRemaining}
            />
          )}

          {/* Title */}
          <h3 className="font-bold text-[13px] sm:text-[14px] text-neutral-950 group-hover:text-neutral-700 transition-colors break-words leading-relaxed">
            {lang === "ar" ? product.titleAr : product.title}
          </h3>

          {/* Available Sizes Pills */}
          {availableSizesForColor.length > 0 ? (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-neutral-400 me-0.5">
                {lang === "ar" ? "المقاس:" : "Size:"}
              </span>
              {availableSizesForColor.map((sz) => {
                const stock = getVariantStock(product, currentColor, sz);
                const isSingle = isLowStock(stock);
                return (
                  <button
                    key={sz}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAdd(product, currentColor, sz);
                    }}
                    title={
                      isSingle
                        ? lang === "ar"
                          ? `مقاس ${sz}: متبقي قطعة واحدة فقط!`
                          : `Size ${sz}: Only 1 piece left!`
                        : lang === "ar"
                        ? `إضافة مقاس ${sz} للسلة`
                        : `Add size ${sz}`
                    }
                    className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-extrabold rounded-md border transition-all duration-150 active:scale-95 cursor-pointer ${
                      isSingle
                        ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-500 hover:text-white"
                        : "bg-neutral-100/90 hover:bg-neutral-950 hover:text-white text-neutral-800 border-neutral-200/90"
                    }`}
                  >
                    {sz}
                    {isSingle && <span className="ms-0.5 text-[9px] text-red-600 font-black">!</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2.5 text-[11px] font-black text-red-600">
              {isModelOutOfStock
                ? lang === "ar"
                  ? "نفدت المقاسات بهذا الموديل"
                  : "Out of stock for this model"
                : lang === "ar"
                ? "نفدت المقاسات الخاصة بهذا اللون"
                : "Out of stock for this color"}
            </p>
          )}
        </div>

        {/* Pricing */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2 flex-wrap">
            {isDiscountActive && product.originalPrice && product.originalPrice > product.price ? (
              <>
                <span className="text-[11px] sm:text-xs text-neutral-400 line-through font-semibold font-brand">
                  LE {Number(product.originalPrice || 0).toFixed(2)}
                </span>
                <span className="text-sm sm:text-[15px] font-black text-[#dc2626] font-brand">
                  LE {Number(product.price || 0).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-[15px] font-black text-neutral-950 font-brand">
                LE {Number(product.price || 0).toFixed(2)}
              </span>
            )}
          </div>

          {layoutCols === 1 && !isEntirelyOutOfStock && (
            <div className="flex items-center justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickOrderNow(product, currentColor, availableSizesForColor[0] || product.sizes[0] || "L");
                }}
                className="text-xs font-bold text-white bg-neutral-950 hover:bg-[#dc2626] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{lang === "ar" ? "طلب فوري" : "Quick Buy"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
