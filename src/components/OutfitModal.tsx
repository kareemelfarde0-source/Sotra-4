import React, { useState, useMemo } from "react";
import { X, ShoppingBag, Check, ArrowRight, ShieldCheck, Tag, Layers } from "lucide-react";
import { Product, OutfitBundle, ColorVariant, CartItem } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER, sanitizeImageUrl } from "../utils/storage";

interface OutfitModalProps {
  outfit: OutfitBundle | null;
  allProducts: Product[];
  onClose: () => void;
  onAddOutfitToCart: (items: { product: Product; color: ColorVariant; size: string; discountedPrice: number }[]) => void;
  onFastCheckoutOutfit?: (items: { product: Product; color: ColorVariant; size: string; discountedPrice: number }[]) => void;
  lang: "ar" | "en";
}

export function OutfitModal({
  outfit,
  allProducts,
  onClose,
  onAddOutfitToCart,
  onFastCheckoutOutfit,
  lang,
}: OutfitModalProps) {
  if (!outfit) return null;

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

  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // Financial calculations
  const { totalOriginalPrice, totalDiscountedPrice, totalSavings } = useMemo(() => {
    const origSum = outfitProducts.reduce((sum, p) => sum + (p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price), 0);
    const regularSum = outfitProducts.reduce((sum, p) => sum + p.price, 0);

    const discountRate = (outfit.discountPercent || 15) / 100;
    const discountedSum = Math.round(regularSum * (1 - discountRate));
    const savings = origSum - discountedSum;

    return {
      totalOriginalPrice: origSum,
      totalDiscountedPrice: discountedSum,
      totalSavings: savings > 0 ? savings : origSum - discountedSum,
    };
  }, [outfitProducts, outfit.discountPercent]);

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
    const discountRate = (outfit.discountPercent || 15) / 100;
    return outfitProducts.map((prod) => {
      const sel = selections[prod.id] || { colorIndex: 0, size: prod.sizes?.[0] || "L" };
      const color = prod.colors?.[sel.colorIndex] || prod.colors?.[0] || { name: "Default", nameAr: "افتراضي", hex: "#000", image: "" };
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
    onAddOutfitToCart(payload);
    setIsAddedSuccess(true);
    setTimeout(() => {
      setIsAddedSuccess(false);
      onClose();
    }, 1500);
  };

  const handleFastOrder = () => {
    if (onFastCheckoutOutfit) {
      const payload = getBundlePayload();
      onFastCheckoutOutfit(payload);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-neutral-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-950 text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-neutral-900 font-brand">
                  {lang === "ar" ? outfit.titleAr : outfit.titleEn || outfit.titleAr}
                </h3>
                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-black rounded-md border border-red-200">
                  {outfit.badgeAr || `خصم إضافي ${outfit.discountPercent}%`}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {lang === "ar"
                  ? "قم بتحديد المقاس واللون المفضل لكل قطعة في الطقم"
                  : "Customize sizes & colors for each outfit piece"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Main Look Banner / Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200">
            {outfit.image && (
              <div className="lg:col-span-4 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shadow-inner">
                <img
                  src={sanitizeImageUrl(outfit.image, SOTRA_PRODUCT_PLACEHOLDER)}
                  alt={outfit.titleAr}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            <div className={`${outfit.image ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg">
                    {lang === "ar" ? `عرض الطقم الكامل (يشمل ${outfitProducts.length} قطع متناسقة)` : `Full Outfit Bundle (${outfitProducts.length} pieces)`}
                  </span>
                </div>
                <h4 className="text-lg font-black text-neutral-900 mb-1">
                  {outfit.titleAr}
                </h4>
                {outfit.descriptionAr && (
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {outfit.descriptionAr}
                  </p>
                )}

                {/* Price summary callout */}
                <div className="mt-4 p-3.5 bg-white rounded-xl border border-neutral-200/80 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-neutral-500 font-medium">مجموع سعر القطع منفردة:</span>
                    <span className="text-xs font-bold text-neutral-400 line-through font-mono">
                      {totalOriginalPrice} ج.م
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-amber-700 font-bold">خصم الطقم المتناسق ({outfit.discountPercent}%):</span>
                    <span className="text-xs font-bold text-amber-700 font-mono">
                      - {totalSavings} ج.م
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-sm font-black text-neutral-900">سعر الطقم الكامل بعد الخصم:</span>
                    <span className="text-xl font-black text-emerald-600 font-mono">
                      {totalDiscountedPrice} <span className="text-xs font-bold">ج.م</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Piece-by-Piece Customizer */}
          <div>
            <h4 className="text-sm font-black text-neutral-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-neutral-500" />
              <span>قطع الطقم المشمولة ({outfitProducts.length} قطع)</span>
            </h4>

            <div className="space-y-4">
              {outfitProducts.map((product, idx) => {
                const sel = selections[product.id] || { colorIndex: 0, size: product.sizes?.[0] || "L" };
                const activeColor = product.colors?.[sel.colorIndex] || product.colors?.[0];
                const itemDiscounted = Math.round(product.price * (1 - (outfit.discountPercent || 15) / 100));

                return (
                  <div
                    key={product.id}
                    className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Product thumbnail */}
                      <div className="w-20 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 self-start">
                        <img
                          src={activeColor?.image || SOTRA_PRODUCT_PLACEHOLDER}
                          alt={product.titleAr}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>

                      {/* Details & Selectors */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              القطعة رقم {idx + 1}
                            </span>
                            <h5 className="text-sm font-bold text-neutral-900">{product.titleAr}</h5>
                            <span className="text-xs text-neutral-500">{product.fabricAr || "قطن مصري ناعم"}</span>
                          </div>
                          <div className="text-end">
                            <span className="text-sm font-black text-neutral-900 font-mono">
                              {itemDiscounted} ج.م
                            </span>
                            {product.price > itemDiscounted && (
                              <span className="block text-[11px] text-neutral-400 line-through font-mono">
                                {product.price} ج.م
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Colors */}
                        {product.colors && product.colors.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-neutral-700">اللون المختار:</span>
                              <span className="font-bold text-neutral-900">{activeColor?.nameAr || activeColor?.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {product.colors.map((col, colIdx) => (
                                <button
                                  key={colIdx}
                                  type="button"
                                  onClick={() => handleColorChange(product.id, colIdx)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    sel.colorIndex === colIdx
                                      ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                      : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                  }`}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full border border-neutral-300 shadow-2xs"
                                    style={{ backgroundColor: col.hex }}
                                  />
                                  <span>{col.nameAr || col.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold text-neutral-700">المقاس:</span>
                              <span className="font-bold text-neutral-900">{sel.size}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {product.sizes.map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => handleSizeChange(product.id, sz)}
                                  className={`min-w-9 h-8 px-2 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer ${
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
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-neutral-950 font-mono">
                {totalDiscountedPrice} <span className="text-xs font-bold">ج.م</span>
              </span>
              <span className="text-xs text-neutral-400 line-through font-mono">
                {totalOriginalPrice} ج.م
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                وفرت {totalSavings} ج.م
              </span>
            </div>
            <span className="text-[11px] text-neutral-500">سعر الطقم الكامل بعد خصم {outfit.discountPercent}%</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleAddToCart}
              className={`flex-1 sm:flex-none px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAddedSuccess
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-neutral-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-lg"
              }`}
            >
              {isAddedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تمت إضافة الطقم بنجاح!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>أضف الطقم كاملاً للسلة</span>
                </>
              )}
            </button>

            {onFastCheckoutOutfit && (
              <button
                onClick={handleFastOrder}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-2xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                {lang === "ar" ? "طلب الطقم الآن" : "Order Outfit Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
