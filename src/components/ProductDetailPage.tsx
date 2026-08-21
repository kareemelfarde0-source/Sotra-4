import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Heart,
  Share2,
  Zap,
  ShoppingBag,
  RefreshCw,
  Eye,
  AlertTriangle,
  Ruler,
  Check,
} from "lucide-react";
import { Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { getVariantStock, isLowStock, isOutOfStock, sanitizeImageUrl, SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { getEffectiveProductDiscount } from "../utils/discount";

interface ProductDetailPageProps {
  product: Product;
  allProducts?: Product[];
  relatedProducts?: Product[];
  onBack: () => void;
  onSelectProduct?: (p: Product, colIdx: number) => void;
  onAddToCart: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onQuickOrderNow?: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onBuyNow?: (product: Product, selectedColor: ColorVariant, size: string, quantity: number) => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts = [],
  relatedProducts: customRelated,
  onBack,
  onSelectProduct = (_p: Product, _colIdx: number) => {},
  onAddToCart,
  onQuickOrderNow,
  onBuyNow,
  onOpenLightbox,
  lang,
  globalDiscountStyle = "vertical_left",
}) => {
  const safeColors = Array.isArray(product?.colors) && product.colors.length > 0 ? product.colors : [
    { name: "Black", nameAr: "أسود", colorCode: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }
  ];
  const safeSizes = Array.isArray(product?.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL", "XXL"];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(safeSizes[0] || "L");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Available colors
  const availableColors = safeColors.filter((col) => {
    if (!product?.inventory || Object.keys(product.inventory).length === 0) return true;
    return safeSizes.some((sz) => getVariantStock(product, col, sz) > 0);
  });
  const validColors = availableColors.length > 0 ? availableColors : safeColors;
  const currentColor = validColors[selectedColorIndex] || validColors[0] || safeColors[0];

  // Available sizes for this color
  const matchedSizes = safeSizes.filter((sz) => getVariantStock(product, currentColor, sz) > 0);
  const availableSizesForColor = matchedSizes.length > 0 ? matchedSizes : (product.inStock !== false ? safeSizes : []);

  const currentStock = getVariantStock(product, currentColor, selectedSize);
  const isSelectedLowStock = isLowStock(currentStock);
  const isSelectedOutOfStock = product.inStock === false || isOutOfStock(currentStock);

  const images = [
    sanitizeImageUrl(currentColor.image, SOTRA_PRODUCT_PLACEHOLDER),
    ...(currentColor.backImage ? [sanitizeImageUrl(currentColor.backImage, SOTRA_PRODUCT_PLACEHOLDER)] : []),
  ];
  const activeImage = images[selectedImageIndex] || sanitizeImageUrl(currentColor.image, SOTRA_PRODUCT_PLACEHOLDER);

  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    setSelectedImageIndex(0);
    const newCol = validColors[index] || safeColors[0];
    const newAvailableSizes = safeSizes.filter((sz) => {
      if (!product?.inventory || Object.keys(product.inventory).length === 0) return true;
      return getVariantStock(product, newCol, sz) > 0;
    });
    if (!newAvailableSizes.includes(selectedSize) && newAvailableSizes.length > 0) {
      setSelectedSize(newAvailableSizes[0]);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenZoom = (i: number) => {
    if (onOpenLightbox) {
      onOpenLightbox(images, i);
    }
  };

  const handleProceedOrder = () => {
    if (typeof onBuyNow === "function") {
      onBuyNow(product, currentColor, selectedSize, quantity);
    } else if (typeof onQuickOrderNow === "function") {
      onQuickOrderNow(product, currentColor, selectedSize);
    } else if (typeof onAddToCart === "function") {
      onAddToCart(product, currentColor, selectedSize, quantity);
    }
  };

  const relatedProducts = customRelated && customRelated.length > 0
    ? customRelated
    : (Array.isArray(allProducts) ? allProducts : [])
        .filter((p) => p && p.id !== product.id && (p.category === product.category || product.category === "all"))
        .slice(0, 4);

  const effectiveDiscount = getEffectiveProductDiscount(product, globalDiscountStyle);
  const isDiscountActive = effectiveDiscount.isActive;
  const discountStyle = effectiveDiscount.style;
  const timeRemaining = lang === "ar" ? effectiveDiscount.timeRemainingAr : effectiveDiscount.timeRemainingEn;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16 animate-fade-in text-start">
      {/* Breadcrumbs & Top actions */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black transition-colors group cursor-pointer"
          >
            {lang === "ar" ? (
              <>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>العودة لجميع المنتجات</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Catalog</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isFavorite ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-neutral-200 text-neutral-600 hover:text-black"
              }`}
              title={lang === "ar" ? "إضافة للمفضلة" : "Add to Wishlist"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-rose-600" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-black transition-colors relative cursor-pointer"
              title={lang === "ar" ? "مشاركة رابط المنتج" : "Share link"}
            >
              <Share2 className="w-4 h-4" />
              {isCopied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-neutral-950 text-white text-[10px] py-0.5 px-2 rounded-md whitespace-nowrap shadow-md">
                  {lang === "ar" ? "تم النسخ!" : "Copied!"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-4 sm:p-8 border border-neutral-200/80 shadow-xs">
          {/* Images */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200/90 group shadow-inner">
              <img
                src={activeImage}
                alt={product.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                }}
                onClick={() => handleOpenZoom(selectedImageIndex)}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
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
                onClick={() => handleOpenZoom(selectedImageIndex)}
                className="sotra-zoom-badge cursor-pointer"
                style={{ bottom: "14px", insetInlineEnd: "14px" }}
                title={lang === "ar" ? "تكبير وعرض الصور" : "Zoom images"}
              >
                <Eye className="w-4 h-4 text-neutral-900" />
              </button>

              {product.badge && (product.badge.textAr || product.badge.text) && (
                <div className="absolute top-4 start-4 z-10 pointer-events-none">
                  <span
                    className={`inline-block text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-lg shadow-md uppercase tracking-wider font-brand select-none ${
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
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIndex === idx ? "border-neutral-950 ring-2 ring-neutral-950/20" : "border-neutral-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
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

              <span className="text-xs font-black uppercase tracking-widest text-[#dc2626] font-brand">
                {product.fitAr || product.fit}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-neutral-950 font-brand mt-1">
                {lang === "ar" ? product.titleAr : product.title}
              </h1>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-neutral-950 font-brand">
                  LE {Number(product.price || 0).toFixed(2)}
                </span>
                {isDiscountActive && product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-base text-neutral-400 line-through font-semibold font-brand">
                      LE {Number(product.originalPrice || 0).toFixed(2)}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-black text-white bg-[#e11d48] rounded-md font-brand uppercase shadow-xs">
                      {lang === "ar"
                        ? `وفرت LE ${(Number(product.originalPrice || 0) - Number(product.price || 0)).toFixed(0)}`
                        : `Save LE ${(Number(product.originalPrice || 0) - Number(product.price || 0)).toFixed(0)}`}
                    </span>
                  </>
                )}
              </div>

              {/* Colors */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-neutral-900 uppercase">
                    {lang === "ar" ? "اللون المحدد:" : "Color:"}{" "}
                    <span className="text-neutral-600 font-bold ms-1">
                      {lang === "ar" ? currentColor.nameAr : currentColor.name}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {validColors.map((color, idx) => {
                    const isSelected = idx === selectedColorIndex;
                    return (
                      <button
                        key={color.name}
                        onClick={() => handleColorSelect(idx)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected ? "border-neutral-950 bg-neutral-950 text-white shadow-xs" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{lang === "ar" ? color.nameAr : color.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sizes */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-neutral-900 uppercase">
                    {lang === "ar" ? "اختر المقاس المتاح:" : "Select Size:"}
                  </span>
                </div>

                {availableSizesForColor.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSizesForColor.map((sz) => {
                      const stock = getVariantStock(product, currentColor, sz);
                      const isSingle = isLowStock(stock);
                      const isSelected = sz === selectedSize;
                      return (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2.5 text-xs sm:text-sm font-extrabold rounded-xl border transition-all text-center cursor-pointer ${
                            isSelected
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-md ring-2 ring-neutral-950/20"
                              : isSingle
                              ? "bg-amber-50 text-amber-900 border-amber-300 hover:border-amber-500"
                              : "bg-white text-neutral-900 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
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
                    {lang === "ar" ? "نفدت المقاسات لهذا اللون حالياً." : "Out of stock for this color."}
                  </p>
                )}
              </div>

              {/* Low Stock Warning */}
              {isSelectedLowStock && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {lang === "ar"
                      ? "⚠️ تنبيه: قريب النفاذ - متبقي قطعة واحدة فقط في المخزن لهذا المقاس واللون!"
                      : "⚠️ Low stock: Only 1 piece left in warehouse for this size and color!"}
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6 flex items-center gap-4">
                <span className="text-xs font-black text-neutral-900 uppercase">
                  {lang === "ar" ? "الكمية:" : "Quantity:"}
                </span>
                <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-sm font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-black text-neutral-950 font-brand">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (currentStock > 0 && quantity >= currentStock) return;
                      setQuantity(quantity + 1);
                    }}
                    className="px-3 py-1.5 text-sm font-bold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleProceedOrder}
                  disabled={isSelectedOutOfStock}
                  id="btn-pdp-buynow"
                  className="w-full py-3.5 sm:py-4 px-6 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm sm:text-base font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.99] font-brand cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>
                    {lang === "ar" ? "اطلب الآن فوراً (الدفع عند الاستلام)" : "BUY NOW (Cash on Delivery)"}
                  </span>
                </button>
                <button
                  onClick={() => onAddToCart(product, currentColor, selectedSize, quantity)}
                  disabled={isSelectedOutOfStock}
                  id="btn-pdp-addbag"
                  className="w-full py-3 sm:py-3.5 px-6 bg-white hover:bg-neutral-100 disabled:bg-neutral-100 text-neutral-900 border-2 border-neutral-900 text-xs sm:text-sm font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] font-brand cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === "ar" ? "إضافة إلى حقيبة التسوق" : "Add to Bag"}</span>
                </button>
              </div>

              {/* Features Guarantee */}
              <div className="mt-8 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-3">
                <div className="flex items-center gap-3 text-xs text-neutral-700">
                  <RefreshCw className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">
                      {lang === "ar" ? "استبدال واسترجاع سهل وسريع 14 يوماً" : "14-Day Easy Exchange"}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {lang === "ar"
                        ? "لو المقاس مش مظبوط، بنبدلهولك فوراً بدون تعقيد."
                        : "Wrong size? Exchange hassle-free."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="pt-6 border-t border-neutral-200 space-y-3">
              <h3 className="text-xs font-black uppercase text-neutral-900 tracking-wider font-brand">
                {lang === "ar" ? "مواصفات وتفاصيل القطعة" : "Product Specifications"}
              </h3>
              <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed list-disc list-inside">
                {((lang === "ar" ? (product.featuresAr?.length ? product.featuresAr : product.features) : (product.features?.length ? product.features : product.featuresAr)) || []).map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 pt-8 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase font-brand">
                  {lang === "ar" ? "تشكيلات مقترحة" : "MORE FROM SOTRA"}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-neutral-950 font-brand">
                  {lang === "ar" ? "منتجات قد تعجبك أيضاً" : "You May Also Like"}
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct(rel, 0)}
                  className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative">
                    <img
                      src={rel.colors?.[0]?.image || SOTRA_PRODUCT_PLACEHOLDER}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-brand font-bold text-xs uppercase tracking-tight text-neutral-950 truncate">
                      {lang === "ar" ? rel.titleAr : rel.title}
                    </h4>
                    <span className="text-xs font-black text-neutral-950 block mt-1 font-brand">
                      LE {Number(rel.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
