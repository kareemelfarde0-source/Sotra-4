import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Zap, Eye, Check, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { getVariantStock, isLowStock, isOutOfStock, sanitizeImageUrl, SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { getEffectiveProductDiscount } from "../utils/discount";

interface ProductModalProps {
  product: Product | null;
  initialColorIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onBuyNow: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  initialColorIndex = 0,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
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

      // Find first in-stock size
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

  // Filter colors with at least 1 in-stock size if inventory is defined
  const availableColors = safeColors.filter((col) => {
    if (!product.inventory || Object.keys(product.inventory).length === 0) return true;
    return safeSizes.some((sz) => getVariantStock(product, col, sz) > 0);
  });
  const validColors = availableColors.length > 0 ? availableColors : safeColors;
  const currentColor = validColors[selectedColorIndex] || validColors[0] || safeColors[0];

  // Available sizes for this color (hides out of stock sizes: "واذا لا يوجد بالمخزن اخفي المقاس او اللون تلقائي")
  const matchedSizes = safeSizes.filter((sz) => getVariantStock(product, currentColor, sz) > 0);
  const availableSizesForColor = matchedSizes.length > 0 ? matchedSizes : (product.inStock !== false ? safeSizes : []);

  const currentStock = getVariantStock(product, currentColor, selectedSize);
  const isSelectedLowStock = isLowStock(currentStock);
  const isSelectedOutOfStock = product.inStock === false || isOutOfStock(currentStock);

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

  const calculatedDiscount =
    product.discountPercent && product.discountPercent > 0
      ? product.discountPercent
      : product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const effectiveDiscount = getEffectiveProductDiscount(product, globalDiscountStyle);
  const isDiscountActive = effectiveDiscount.isActive;
  const discountStyle = effectiveDiscount.style;
  const timeRemaining = lang === "ar" ? effectiveDiscount.timeRemainingAr : effectiveDiscount.timeRemainingEn;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-scale-in text-start">
          <button
            onClick={onClose}
            aria-label="Close product modal"
            className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-black hover:text-white rounded-full shadow-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Preview Side */}
            <div className="bg-neutral-100 p-4 sm:p-6 flex flex-col justify-between">
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-200 shadow-inner group">
                <img
                  src={images[activeImageIndex] || currentColor.image || SOTRA_PRODUCT_PLACEHOLDER}
                  alt={product.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                  }}
                  onClick={() => handleOpenZoom(activeImageIndex)}
                  className="w-full h-full object-cover object-top cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                />

                {/* Discount Badge on Image */}
                {isDiscountActive && discountStyle !== "above_title" && (
                  <DiscountBadge
                    discountPercent={effectiveDiscount.percent}
                    originalPrice={product.originalPrice}
                    price={product.price}
                    style={discountStyle}
                    lang={lang}
                    timeRemainingText={timeRemaining}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleOpenZoom(activeImageIndex)}
                  className="sotra-zoom-badge cursor-pointer"
                  style={{ bottom: "10px", insetInlineEnd: "10px" }}
                  title={lang === "ar" ? "تكبير الصورة" : "Zoom image"}
                >
                  <Eye className="w-4 h-4 text-neutral-900" />
                </button>

                {product.badge && (product.badge.textAr || product.badge.text) && (
                  <div className="absolute top-3 start-3 z-10 pointer-events-none">
                    <span
                      className={`inline-block text-xs font-black px-3 py-1 rounded-md shadow-xs uppercase tracking-wider font-brand select-none ${
                        product.badge.type === "new"
                          ? "bg-emerald-600 text-white"
                          : product.badge.type === "discount"
                          ? "bg-red-600 text-white"
                          : product.badge.type === "featured" || product.badge.type === "bestseller"
                          ? "bg-amber-500 text-neutral-950"
                          : product.badge.type === "exclusive"
                          ? "bg-purple-700 text-white"
                          : product.badge.type === "limited"
                          ? "bg-rose-700 text-white"
                          : product.badge.type === "restocked"
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-950 text-white"
                      }`}
                      style={{
                        backgroundColor: product.badge.colorBg || undefined,
                        color: product.badge.colorText || undefined,
                      }}
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
                      className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === i ? "border-black ring-2 ring-black/20" : "border-neutral-300 opacity-70"
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Side */}
            <div className="p-5 sm:p-8 flex flex-col justify-between space-y-5">
              <div>
                {/* Above title badge if style selected */}
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

                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-brand">
                  SOTRA FASHION • {lang === "ar" ? product.fitAr : product.fit}
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-neutral-950 font-brand mt-1">
                  {lang === "ar" ? product.titleAr : product.title}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-950 font-brand">
                    LE {Number(product.price || 0).toFixed(2)}
                  </span>
                  {isDiscountActive && product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-base font-semibold text-neutral-400 line-through font-brand">
                        LE {Number(product.originalPrice || 0).toFixed(2)}
                      </span>
                      <span className="text-xs font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-brand">
                        {lang === "ar"
                          ? `وفر ${Number(product.originalPrice || 0) - Number(product.price || 0)} ج.م`
                          : `SAVE ${effectiveDiscount.percent}%`}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 mt-3 leading-relaxed">
                  {lang === "ar" ? product.descriptionAr : product.description}
                </p>

                {/* Colors */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-neutral-800">
                      {lang === "ar" ? "اللون المحدد:" : "Color:"}{" "}
                      <span className="text-neutral-500 font-normal">
                        {lang === "ar" ? currentColor.nameAr : currentColor.name}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {validColors.map((col, idx) => (
                      <button
                        key={col.name}
                        onClick={() => handleColorChange(idx)}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                          selectedColorIndex === idx ? "ring-2 ring-neutral-950 ring-offset-2 scale-110" : "hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: col.hex,
                          border: col.hex === "#ffffff" ? "1px solid #d1d5db" : "none",
                        }}
                      >
                        {selectedColorIndex === idx && (
                          <Check
                            className={`w-4 h-4 ${col.hex === "#ffffff" ? "text-black" : "text-white"}`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-neutral-800">
                      {lang === "ar" ? "المقاس المتوفر:" : "Available Size:"}
                    </span>
                  </div>

                  {availableSizesForColor.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {availableSizesForColor.map((sz) => {
                        const stock = getVariantStock(product, currentColor, sz);
                        const isSingle = isLowStock(stock);
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2.5 text-xs font-extrabold rounded-xl border transition-all cursor-pointer relative ${
                              isSelected
                                ? "bg-neutral-950 text-white border-neutral-950 shadow-md ring-2 ring-neutral-950/20"
                                : isSingle
                                ? "bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500"
                                : "bg-neutral-50 text-neutral-800 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {sz}
                            {isSingle && (
                              <span className="block text-[9px] text-red-600 font-bold -mt-0.5">
                                {lang === "ar" ? "آخر قطعة" : "1 left"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-red-600 font-bold p-2 bg-red-50 rounded-lg">
                      {lang === "ar" ? "نفدت جميع مقاسات هذا اللون حالياً." : "Out of stock for this color."}
                    </p>
                  )}
                </div>

                {/* LOW STOCK ALERT (قريب النفاذ) */}
                {isSelectedLowStock && (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      {lang === "ar"
                        ? "⚠️ تنبيه: قريب النفاذ - متبقي قطعة واحدة فقط في المخزن لهذا المقاس واللون!"
                        : "⚠️ Low stock: Only 1 piece left in warehouse for this size and color!"}
                    </span>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-700">
                    {lang === "ar" ? "الكمية:" : "Qty:"}
                  </span>
                  <div className="flex items-center border border-neutral-300 rounded-lg bg-neutral-50 overflow-hidden">
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
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <button
                  onClick={handleDirectBuy}
                  disabled={isSelectedOutOfStock}
                  className="w-full py-3.5 bg-[#dc2626] hover:bg-[#b91c1c] disabled:bg-neutral-400 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-xl font-extrabold text-sm tracking-wide uppercase shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-brand"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>
                    {lang === "ar" ? "طلب فوري الآن (الدفع عند الاستلام)" : "BUY NOW - 1 CLICK CHECKOUT"}
                  </span>
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSelectedOutOfStock}
                  className="w-full py-3 bg-neutral-950 hover:bg-black disabled:bg-neutral-400 disabled:cursor-not-allowed active:scale-[0.99] text-white rounded-xl font-extrabold text-xs sm:text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-brand"
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
