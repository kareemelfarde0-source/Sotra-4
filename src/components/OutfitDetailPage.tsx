import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  RefreshCw,
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
} from "lucide-react";
import { Product, OutfitBundle, ColorVariant } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER, sanitizeImageUrl, getVariantStock } from "../utils/storage";

interface OutfitDetailPageProps {
  outfit: OutfitBundle;
  allProducts: Product[];
  onBack: () => void;
  onAddToCart: (items: { product: Product; color: ColorVariant; size: string; discountedPrice: number }[]) => void;
  onFastCheckoutOutfit?: (items: { product: Product; color: ColorVariant; size: string; discountedPrice: number }[]) => void;
  onOpenProductModal?: (product: Product, selectedColorIndex: number) => void;
  lang: "ar" | "en";
}

export const OutfitDetailPage: React.FC<OutfitDetailPageProps> = ({
  outfit,
  allProducts,
  onBack,
  onAddToCart,
  onFastCheckoutOutfit,
  onOpenProductModal,
  lang,
}) => {
  // Resolve products in this outfit
  const outfitProducts = useMemo(() => {
    return (outfit.productIds || [])
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [outfit, allProducts]);

  // Selections for each product: { [productId]: { colorIndex: number, size: string } }
  const [selections, setSelections] = useState<Record<string, { colorIndex: number; size: string }>>(() => {
    const initial: Record<string, { colorIndex: number; size: string }> = {};
    outfitProducts.forEach((p) => {
      initial[p.id] = {
        colorIndex: 0,
        size: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "L",
      };
    });
    return initial;
  });

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // Financial calculations
  const { totalOriginalPrice, totalRegularPrice, totalDiscountedPrice, totalSavings, discountRate } = useMemo(() => {
    const origSum = outfitProducts.reduce(
      (sum, p) => sum + (p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price),
      0
    );
    const regularSum = outfitProducts.reduce((sum, p) => sum + p.price, 0);

    const rate = (outfit.discountPercent || 15) / 100;
    const discountedSum = Math.round(regularSum * (1 - rate));
    const savings = origSum - discountedSum;

    return {
      totalOriginalPrice: origSum,
      totalRegularPrice: regularSum,
      totalDiscountedPrice: discountedSum,
      totalSavings: savings > 0 ? savings : origSum - discountedSum,
      discountRate: rate,
    };
  }, [outfitProducts, outfit.discountPercent]);

  // Build gallery images: outfit main image + current selected color image of each product
  const galleryImages = useMemo(() => {
    const list: { url: string; title: string; subtitle?: string }[] = [];
    if (outfit.image) {
      list.push({
        url: sanitizeImageUrl(outfit.image, SOTRA_PRODUCT_PLACEHOLDER),
        title: lang === "ar" ? "الإطلالة الكاملة" : "Full Look",
        subtitle: outfit.titleAr,
      });
    }

    outfitProducts.forEach((p) => {
      const sel = selections[p.id] || { colorIndex: 0 };
      const color = p.colors?.[sel.colorIndex] || p.colors?.[0];
      const img = color?.image || color?.backImage || (p.colors && p.colors[0]?.image) || "";
      if (img) {
        list.push({
          url: sanitizeImageUrl(img, SOTRA_PRODUCT_PLACEHOLDER),
          title: lang === "ar" ? p.titleAr : p.title,
          subtitle: color?.nameAr || color?.name,
        });
      }
    });

    return list;
  }, [outfit, outfitProducts, selections, lang]);

  const activeImage = galleryImages[activeGalleryIndex]?.url || sanitizeImageUrl(outfit.image, SOTRA_PRODUCT_PLACEHOLDER);

  const handleColorChange = (productId: string, colorIdx: number) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        colorIndex: colorIdx,
      },
    }));
  };

  const handleSizeChange = (productId: string, size: string) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        size,
      },
    }));
  };

  const getBundlePayload = () => {
    return outfitProducts.map((prod) => {
      const sel = selections[prod.id] || { colorIndex: 0, size: prod.sizes?.[0] || "L" };
      const color = prod.colors?.[sel.colorIndex] || prod.colors?.[0] || {
        name: "Default",
        nameAr: "افتراضي",
        hex: "#000",
        image: "",
      };
      const discountedItemPrice = Math.round(prod.price * (1 - discountRate));

      return {
        product: prod,
        color,
        size: sel.size,
        discountedPrice: discountedItemPrice,
      };
    });
  };

  const handleAddToCart = () => {
    const payload = getBundlePayload();
    onAddToCart(payload);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2000);
  };

  const handleFastOrder = () => {
    if (onFastCheckoutOutfit) {
      const payload = getBundlePayload();
      onFastCheckoutOutfit(payload);
    } else {
      handleAddToCart();
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-24 text-start animate-fadeIn">
      {/* Top Header / Breadcrumb */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black transition-colors cursor-pointer group"
          >
            {lang === "ar" ? (
              <>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>الرئيسية / نسّق إطلالتك</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Home / Shop The Look</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-black rounded-lg font-mono">
              خصم {outfit.discountPercent || 15}%
            </span>
            <span className="text-xs font-bold text-neutral-500 hidden sm:inline">
              ({outfitProducts.length} {lang === "ar" ? "قطع متناسقة" : "matching pieces"})
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {/* Main Grid: Gallery & Look Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left Column: Interactive Outfit Visual Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Main Stage Image */}
            <div className="relative aspect-3/4 w-full bg-neutral-100 rounded-3xl overflow-hidden shadow-lg border border-neutral-200 group">
              <img
                src={activeImage}
                alt={outfit.titleAr}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-all duration-500"
              />

              {/* Top Badges */}
              <div className="absolute top-3.5 right-3.5 z-10 flex flex-col items-end gap-1.5">
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-xl shadow-md font-mono">
                  خصم الطقم {outfit.discountPercent || 15}%
                </span>
                {outfit.badgeAr && (
                  <span className="px-2.5 py-1 bg-neutral-950/90 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg border border-white/20">
                    {outfit.badgeAr}
                  </span>
                )}
              </div>

              {/* Pieces Count Pill */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="px-3 py-1 bg-black/75 backdrop-blur-xs text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-300" />
                  <span>
                    {outfitProducts.length} {lang === "ar" ? "قطع كاملة" : "pieces"}
                  </span>
                </span>
              </div>

              {/* Image Info Caption */}
              {galleryImages[activeGalleryIndex] && (
                <div className="absolute bottom-3 inset-x-3 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-neutral-200/80 text-center shadow-md">
                  <p className="text-xs font-black text-neutral-950 font-brand">
                    {galleryImages[activeGalleryIndex].title}
                  </p>
                  {galleryImages[activeGalleryIndex].subtitle && (
                    <p className="text-[11px] text-neutral-500 font-medium">
                      {galleryImages[activeGalleryIndex].subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                {galleryImages.map((imgItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`relative w-16 sm:w-20 aspect-3/4 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-neutral-100 shrink-0 ${
                      activeGalleryIndex === idx
                        ? "border-neutral-950 shadow-md scale-105"
                        : "border-neutral-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={imgItem.url} alt={imgItem.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Title, Pricing & Configuration */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            {/* Header Box */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-5 bg-red-600 rounded-full" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
                  {lang === "ar" ? "تنسيق طقم كامل متطابق" : "COMPLETE MATCHING OUTFIT"}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-neutral-950 font-brand tracking-tight">
                {lang === "ar" ? outfit.titleAr : outfit.titleEn || outfit.titleAr}
              </h1>

              {outfit.subtitleAr && (
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
                  {outfit.subtitleAr}
                </p>
              )}

              {outfit.descriptionAr && (
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mt-3 pt-3 border-t border-neutral-100">
                  {outfit.descriptionAr}
                </p>
              )}

              {/* Big Financial Summary Box */}
              <div className="mt-5 p-4 sm:p-5 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-neutral-400 block line-through font-mono">
                    {totalOriginalPrice} {lang === "ar" ? "ج.م السعر قبل الخصم" : "LE Regular Price"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono">
                      {totalDiscountedPrice}
                    </span>
                    <span className="text-xs font-bold text-neutral-800">
                      {lang === "ar" ? "ج.م سعر الطقم الكامل" : "LE Bundle Price"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl border border-emerald-300 shadow-2xs font-mono">
                    {lang === "ar" ? `وفرت ${totalSavings} ج.م` : `Save ${totalSavings} LE`}
                  </span>
                  <span className="text-[11px] text-neutral-500 font-bold">
                    {lang === "ar" ? `خصم خاص ${outfit.discountPercent || 15}% على جميع القطع` : `Includes extra bundle discount`}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Piece Customizers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm sm:text-base font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "تخصيص المقاس واللون لكل قطعة:" : "Configure Each Piece:"}
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  {outfitProducts.length} {lang === "ar" ? "قطع مطلوب تحديد مقاساتها" : "pieces to select"}
                </span>
              </div>

              {outfitProducts.map((prod, pIdx) => {
                const sel = selections[prod.id] || {
                  colorIndex: 0,
                  size: prod.sizes?.[0] || "L",
                };
                const safeColors =
                  Array.isArray(prod.colors) && prod.colors.length > 0
                    ? prod.colors
                    : [{ name: "Default", nameAr: "افتراضي", hex: "#000000", image: "" }];
                const safeSizes =
                  Array.isArray(prod.sizes) && prod.sizes.length > 0
                    ? prod.sizes
                    : ["M", "L", "XL", "2XL"];

                const currentColor = safeColors[sel.colorIndex] || safeColors[0];
                const pieceDiscountedPrice = Math.round(prod.price * (1 - discountRate));
                const pieceImage = sanitizeImageUrl(
                  currentColor.image || currentColor.backImage || (prod.colors && prod.colors[0]?.image),
                  SOTRA_PRODUCT_PLACEHOLDER
                );

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200 shadow-xs transition-all hover:border-neutral-400"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Thumbnail */}
                      <div className="relative w-20 sm:w-24 aspect-3/4 bg-neutral-100 rounded-2xl overflow-hidden shrink-0 border border-neutral-200 shadow-inner">
                        <img
                          src={pieceImage}
                          alt={prod.titleAr}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono">
                          #{pIdx + 1}
                        </span>
                      </div>

                      {/* Product Info & Selectors */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              {prod.category}
                            </span>
                            <h4 className="text-xs sm:text-sm font-black text-neutral-900 line-clamp-1 font-brand">
                              {lang === "ar" ? prod.titleAr : prod.title}
                            </h4>
                          </div>

                          <div className="text-end shrink-0">
                            <span className="text-xs sm:text-sm font-black text-red-600 font-mono block">
                              {pieceDiscountedPrice} {lang === "ar" ? "ج.م" : "LE"}
                            </span>
                            <span className="text-[10px] text-neutral-400 line-through font-mono">
                              {prod.price} {lang === "ar" ? "ج.م" : "LE"}
                            </span>
                          </div>
                        </div>

                        {/* Color Selector */}
                        {safeColors.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 mb-1.5">
                              <span>{lang === "ar" ? "اللون المختار:" : "Color:"}</span>
                              <span className="text-neutral-900 font-black">
                                {currentColor.nameAr || currentColor.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {safeColors.map((col, cIdx) => (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => handleColorChange(prod.id, cIdx)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    sel.colorIndex === cIdx
                                      ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                      : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                  }`}
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                                    style={{ backgroundColor: col.hex || (col as any).colorCode || "#000" }}
                                  />
                                  <span className="text-[11px]">{col.nameAr || col.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Size Selector */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 mb-1.5">
                            <span>{lang === "ar" ? "المقاس:" : "Size:"}</span>
                            <span className="text-neutral-900 font-mono font-black">{sel.size}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {safeSizes.map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleSizeChange(prod.id, sz)}
                                className={`min-w-10 h-8 px-2 rounded-xl text-xs font-black font-mono border transition-all cursor-pointer ${
                                  sel.size === sz
                                    ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                    : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons & Guarantees */}
            <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs space-y-3 sticky bottom-3 z-20">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 pb-2 border-b border-neutral-100">
                <span>{lang === "ar" ? "إجمالي الطقم الكامل بعد الخصم:" : "Total Outfit Price:"}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-xl font-black text-red-600 font-mono">
                    {totalDiscountedPrice} {lang === "ar" ? "ج.م" : "LE"}
                  </span>
                  <span className="text-[11px] text-neutral-400 line-through font-mono">
                    {totalOriginalPrice} ج.م
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    isAddedSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isAddedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{lang === "ar" ? "تمت إضافة الطقم للسلة ✓" : "Outfit Added to Cart ✓"}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{lang === "ar" ? "أضف الطقم بالكامل للسلة" : "Add Full Outfit to Cart"}</span>
                    </>
                  )}
                </button>

                {onFastCheckoutOutfit && (
                  <button
                    type="button"
                    onClick={handleFastOrder}
                    className="w-full sm:w-auto py-3.5 px-6 bg-neutral-950 hover:bg-black text-white rounded-2xl text-xs sm:text-sm font-black transition-colors cursor-pointer whitespace-nowrap shadow-md flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>{lang === "ar" ? "شراء فوري مباشر للطقم" : "Fast Buy Outfit"}</span>
                  </button>
                )}
              </div>

              {/* Trust Guarantees */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-neutral-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{lang === "ar" ? "معاينة مجانية عند الاستلام" : "Inspect before receiving"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-800 shrink-0" />
                  <span>{lang === "ar" ? "شحن سريع لجميع المحافظات" : "Fast shipping"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
