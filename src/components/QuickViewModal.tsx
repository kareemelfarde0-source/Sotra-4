import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Zap, Eye, Check, AlertTriangle, ZoomIn, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
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

interface QuickViewModalProps {
  product: Product | null;
  initialColorIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onBuyNow: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onOpenProductDetail?: (product: Product, colorIndex: number) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  initialColorIndex = 0,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  onOpenProductDetail,
  onOpenLightbox,
  lang,
  globalDiscountStyle = "vertical_left",
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(initialColorIndex);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (product) {
      setSelectedColorIndex(initialColorIndex || 0);
      setActiveImageIndex(0);
      setQuantity(1);

      const colorsArr = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : [
        { name: "Black", nameAr: "أسود", colorCode: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }
      ];
      const sizesArr = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL", "XXL"];

      const col = colorsArr[initialColorIndex || 0] || colorsArr[0];
      const inStockSize = sizesArr.find((sz) => getVariantStock(product, col, sz) > 0) || sizesArr[0] || "L";
      setSelectedSize(inStockSize);
    }
  }, [product, initialColorIndex]);

  if (!isOpen || !product) return null;

  const safeColors = Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : [
    { name: "Black", nameAr: "أسود", colorCode: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }
  ];
  const safeSizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL", "XXL"];

  const availableColors = safeColors.filter((col) => {
    if (!product.inventory || Object.keys(product.inventory).length === 0) return true;
    return safeSizes.some((sz) => getVariantStock(product, col, sz) > 0);
  });
  const validColors = availableColors.length > 0 ? availableColors : safeColors;
  const currentColor = validColors[selectedColorIndex] || validColors[0] || safeColors[0];

  const matchedSizes = safeSizes.filter((sz) => getVariantStock(product, currentColor, sz) > 0);
  const availableSizesForColor = matchedSizes.length > 0 ? matchedSizes : (product.inStock !== false ? safeSizes : []);

  const isModelOutOfStock = isProductModelOutOfStock(product);
  const isColorOutOfStock = isColorVariantOutOfStock(product, currentColor) || (availableSizesForColor.length === 0);

  const currentStock = getVariantStock(product, currentColor, selectedSize);
  const isSelectedLowStock = isLowStock(currentStock);
  const isSelectedOutOfStock = isModelOutOfStock || isColorOutOfStock || isOutOfStock(currentStock);

  const images = [
    sanitizeImageUrl(currentColor.image, SOTRA_PRODUCT_PLACEHOLDER),
    ...(currentColor.backImage ? [sanitizeImageUrl(currentColor.backImage, SOTRA_PRODUCT_PLACEHOLDER)] : []),
  ];

  const handleColorChange = (idx: number) => {
    setSelectedColorIndex(idx);
    setActiveImageIndex(0);
    const newCol = validColors[idx] || product.colors[0];
    const newAvailableSizes = product.sizes.filter((sz) => {
      if (!product.inventory || Object.keys(product.inventory).length === 0) return true;
      return getVariantStock(product, newCol, sz) > 0;
    });
    if (!newAvailableSizes.includes(selectedSize) && newAvailableSizes.length > 0) {
      setSelectedSize(newAvailableSizes[0]);
    }
  };

  const handleAdd = () => {
    if (isSelectedOutOfStock) return;
    onAddToCart(product, currentColor, selectedSize, quantity);
  };

  const handleDirectBuy = () => {
    if (isSelectedOutOfStock) return;
    if (typeof onBuyNow === "function") {
      onBuyNow(product, currentColor, selectedSize, quantity);
    } else if (typeof onAddToCart === "function") {
      onAddToCart(product, currentColor, selectedSize, quantity);
    }
  };

  const handleOpenZoom = (i: number) => {
    if (onOpenLightbox) {
      onOpenLightbox(images, i);
    } else if (typeof window !== "undefined" && (window as any).openSotraLightbox) {
      (window as any).openSotraLightbox(images, i);
    }
  };

  const handleGoToFullPage = () => {
    onClose();
    if (onOpenProductDetail) {
      onOpenProductDetail(product, selectedColorIndex);
    }
  };

  const effectiveDiscount = getEffectiveProductDiscount(product, globalDiscountStyle);
  const isDiscountActive = effectiveDiscount.isActive;
  const discountStyle = effectiveDiscount.style;
  const timeRemaining = lang === "ar" ? effectiveDiscount.timeRemainingAr : effectiveDiscount.timeRemainingEn;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white rounded-none shadow-2xl overflow-hidden border border-neutral-300 animate-scale-in text-start">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 z-20 p-2 bg-white/95 hover:bg-neutral-950 hover:text-white rounded-none border border-neutral-200 shadow-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Image Preview Side */}
            <div className="md:col-span-6 bg-neutral-100 p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-200">
              <div className="relative aspect-[3/4] w-full rounded-none overflow-hidden bg-neutral-200 shadow-inner group">
                <img
                  src={images[activeImageIndex] || currentColor.image || SOTRA_PRODUCT_PLACEHOLDER}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                  }}
                  onClick={() => handleOpenZoom(activeImageIndex)}
                  className={`w-full h-full object-cover object-top cursor-zoom-in transition-transform duration-500 group-hover:scale-105 ${
                    isModelOutOfStock || isColorOutOfStock ? "grayscale-[35%] opacity-90" : ""
                  }`}
                />

                {/* Out Of Stock Ribbon Stripe Overlay on Image */}
                {(isModelOutOfStock || isColorOutOfStock) && (
                  <div className="absolute inset-0 z-15 bg-black/40 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none p-2">
                    <div className="w-[125%] bg-neutral-950/95 py-2.5 border-y-2 border-red-600 shadow-2xl transform -rotate-12 flex flex-col items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-black uppercase tracking-widest font-brand drop-shadow-md text-center px-2">
                        {isModelOutOfStock
                          ? lang === "ar"
                            ? "نفدت المقاسات بهذا الموديل"
                            : "OUT OF STOCK"
                          : lang === "ar"
                          ? "نفدت المقاسات الخاصة بهذا اللون"
                          : "COLOR OUT OF STOCK"}
                      </span>
                      <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider font-brand">
                        OUT OF STOCK
                      </span>
                    </div>
                  </div>
                )}

                {/* Discount Badge on Image */}
                {isDiscountActive && !isModelOutOfStock && !isColorOutOfStock && discountStyle !== "above_title" && (
                  <DiscountBadge
                    discountPercent={effectiveDiscount.percent}
                    originalPrice={product.originalPrice}
                    price={product.price}
                    style={discountStyle}
                    lang={lang}
                    timeRemainingText={timeRemaining}
                  />
                )}

                {/* Inspect Product Details Button */}
                <button
                  type="button"
                  onClick={() => handleOpenZoom(activeImageIndex)}
                  className="absolute bottom-3 left-3 z-10 px-2.5 py-1.5 bg-white/95 hover:bg-neutral-950 text-neutral-950 hover:text-white border border-neutral-300 rounded-none shadow-md text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer font-brand group/btn"
                  title={lang === "ar" ? "معاينة وتكبير تفاصيل المنتج" : "Inspect Product Details"}
                >
                  <ZoomIn className="w-3.5 h-3.5 text-neutral-800 group-hover/btn:text-white stroke-[2.2]" />
                  <span>{lang === "ar" ? "معاينة تفاصيل المنتج" : "Product Details"}</span>
                </button>

                {product.badge && (product.badge.textAr || product.badge.text) && (
                  <div className="absolute top-3 start-3 z-10 pointer-events-none">
                    <span
                      className={`inline-block text-[11px] font-black px-2.5 py-1 rounded-none shadow-xs uppercase tracking-wider font-brand select-none ${
                        product.badge.type === "new"
                          ? "bg-emerald-600 text-white"
                          : product.badge.type === "discount"
                          ? "bg-red-600 text-white"
                          : product.badge.type === "featured" || product.badge.type === "bestseller"
                          ? "bg-amber-400 text-neutral-950"
                          : "bg-neutral-950 text-white"
                      }`}
                    >
                      {lang === "ar" ? product.badge.textAr || product.badge.text : product.badge.text || product.badge.textAr}
                    </span>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`w-14 h-18 rounded-none overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === i ? "border-neutral-950 ring-2 ring-neutral-950/20" : "border-neutral-300 opacity-70"
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover object-top" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Side */}
            <div className="md:col-span-6 p-4 sm:p-7 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest font-brand">
                    SOTRA • {lang === "ar" ? product.fitAr : product.fit}
                  </span>
                  <button
                    onClick={handleGoToFullPage}
                    className="text-xs font-bold text-neutral-600 hover:text-neutral-950 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{lang === "ar" ? "الصفحة الكاملة للمنتج" : "Full Details"}</span>
                    {lang === "ar" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-black uppercase text-neutral-950 font-brand mt-1 leading-snug">
                  {lang === "ar" ? product.titleAr : product.title}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-2.5">
                  <span className="text-xl sm:text-2xl font-black text-neutral-950 font-brand">
                    LE {Number(product.price || 0).toFixed(2)}
                  </span>
                  {isDiscountActive && product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-sm font-semibold text-neutral-400 line-through font-brand">
                        LE {Number(product.originalPrice || 0).toFixed(2)}
                      </span>
                      <span className="text-xs font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-none font-brand">
                        {lang === "ar"
                          ? `وفر ${Number(product.originalPrice || 0) - Number(product.price || 0)} ج.م`
                          : `SAVE LE ${Number(product.originalPrice || 0) - Number(product.price || 0)}`}
                      </span>
                    </>
                  )}
                </div>

                {/* Colors */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-700">
                      {lang === "ar" ? "اللون المختار:" : "Color:"}{" "}
                      <span className="font-extrabold text-neutral-950">
                        {lang === "ar" ? currentColor.nameAr : currentColor.name}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {validColors.map((color, idx) => {
                      const isSelected = selectedColorIndex === idx;
                      return (
                        <button
                          key={color.name}
                          onClick={() => handleColorChange(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "border-neutral-950 bg-neutral-950 text-white shadow-xs"
                              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                            style={{ backgroundColor: color.colorCode }}
                          />
                          <span>{lang === "ar" ? color.nameAr : color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-700">
                      {lang === "ar" ? "المقاس:" : "Size:"}{" "}
                      <span className="font-extrabold text-neutral-950">{selectedSize}</span>
                    </span>
                  </div>
                  {safeSizes.length > 0 && !isColorOutOfStock ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {safeSizes.map((sz) => {
                        const isSelected = selectedSize === sz;
                        const stock = getVariantStock(product, currentColor, sz);
                        const isSingle = isLowStock(stock);
                        const isSizeOut = isOutOfStock(stock);

                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2 text-xs font-black rounded-none border transition-all cursor-pointer text-center relative ${
                              isSelected
                                ? isSizeOut
                                  ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                                  : "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                                : isSizeOut
                                ? "border-neutral-200 bg-neutral-100/70 text-neutral-400 line-through hover:border-red-300"
                                : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-500"
                            }`}
                          >
                            {sz}
                            {isSingle && (
                              <span className="block text-[9px] text-red-600 font-bold -mt-0.5">
                                {lang === "ar" ? "آخر قطعة" : "1 left"}
                              </span>
                            )}
                            {isSizeOut && (
                              <span className="block text-[8px] text-red-500 font-bold no-underline -mt-0.5">
                                {lang === "ar" ? "نفد" : "Out"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Out of Stock Context Message */}
                  {isModelOutOfStock ? (
                    <p className="mt-2 text-xs text-red-600 font-bold p-2 bg-red-50 rounded-none border border-red-200">
                      {lang === "ar" ? "نفدت المقاسات بهذا الموديل" : "Out of stock for this model."}
                    </p>
                  ) : isColorOutOfStock ? (
                    <p className="mt-2 text-xs text-red-600 font-bold p-2 bg-red-50 rounded-none border border-red-200">
                      {lang === "ar" ? "نفدت المقاسات الخاصة بهذا اللون" : "Out of stock for this color."}
                    </p>
                  ) : isSelectedOutOfStock ? (
                    <p className="mt-2 text-xs text-red-600 font-bold p-2 bg-red-50 rounded-none border border-red-200">
                      {lang === "ar" ? "نفدت الكمية الخاصة بهذا المقاس" : "Out of stock for this size."}
                    </p>
                  ) : null}
                </div>

                {/* Low Stock Alert */}
                {isSelectedLowStock && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-none flex items-center gap-2 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      {lang === "ar"
                        ? "⚠️ تنبيه: متبقي قطعة واحدة فقط في المخزن لهذا المقاس واللون!"
                        : "⚠️ Low stock: Only 1 piece left in warehouse!"}
                    </span>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-700">
                    {lang === "ar" ? "الكمية:" : "Qty:"}
                  </span>
                  <div className="flex items-center border border-neutral-300 rounded-none bg-neutral-50 overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 text-neutral-600 hover:bg-neutral-200 font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold font-brand">{quantity}</span>
                    <button
                      onClick={() => {
                        if (currentStock > 0 && quantity >= currentStock) return;
                        setQuantity(quantity + 1);
                      }}
                      className="px-3 py-1 text-neutral-600 hover:bg-neutral-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-neutral-200">
                <button
                  onClick={handleDirectBuy}
                  disabled={isSelectedOutOfStock}
                  className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-neutral-400 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-none font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer font-brand"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>
                    {lang === "ar" ? "طلب فوري الآن (الدفع عند الاستلام)" : "BUY NOW - 1 CLICK CHECKOUT"}
                  </span>
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSelectedOutOfStock}
                  className="w-full py-2.5 bg-neutral-950 hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-none font-extrabold text-xs sm:text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-brand border border-neutral-950"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === "ar" ? "إضافة إلى حقيبة التسوق" : "ADD TO BAG"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
