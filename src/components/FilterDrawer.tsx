import React, { useMemo } from "react";
import { X, RotateCcw, Check, Sparkles } from "lucide-react";
import { FilterState, Product } from "../types";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilters: (f: FilterState) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  products?: Product[];
  lang: "ar" | "en";
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  totalFilteredCount,
  products = [],
  lang,
}) => {
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  // 1. DYNAMIC COLORS (Strictly from actual products with count > 0)
  const dynamicColors = useMemo(() => {
    const colorMap = new Map<string, { name: string; nameAr: string; hex: string; count: number }>();

    safeProducts.forEach((p) => {
      if (Array.isArray(p.colors) && p.colors.length > 0) {
        p.colors.forEach((c) => {
          if (!c || !c.name || !c.name.trim()) return;
          const key = c.name.trim().toLowerCase();
          const existing = colorMap.get(key);
          if (existing) {
            existing.count += 1;
            if (c.hex && (!existing.hex || existing.hex === "#000000")) {
              existing.hex = c.hex;
            }
            if (c.nameAr && !existing.nameAr) {
              existing.nameAr = c.nameAr;
            }
          } else {
            colorMap.set(key, {
              name: c.name.trim(),
              nameAr: c.nameAr?.trim() || c.name.trim(),
              hex: c.hex?.trim() || "#111111",
              count: 1,
            });
          }
        });
      }
    });

    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }, [safeProducts]);

  // 2. DYNAMIC SIZES (Strictly from actual products)
  const dynamicSizes = useMemo(() => {
    const sizesMap = new Map<string, number>();

    safeProducts.forEach((p) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((sz) => {
          if (sz && String(sz).trim()) {
            const cleanSz = String(sz).trim();
            sizesMap.set(cleanSz, (sizesMap.get(cleanSz) || 0) + 1);
          }
        });
      }
    });

    // Custom order preference for common clothing sizes if present
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "4XL", "5XL", "Free Size", "One Size"];
    const allFoundSizes = Array.from(sizesMap.keys());

    return allFoundSizes.sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    }).map((sz) => ({
      size: sz,
      count: sizesMap.get(sz) || 0,
    }));
  }, [safeProducts]);

  // 3. DYNAMIC FITS / SILHOUETTES (Strictly from actual products)
  const dynamicFits = useMemo(() => {
    const fitsMap = new Map<string, { id: string; nameAr: string; count: number }>();

    safeProducts.forEach((p) => {
      if (p.fit && p.fit.trim()) {
        const fitKey = p.fit.trim();
        const existing = fitsMap.get(fitKey);
        if (existing) {
          existing.count += 1;
        } else {
          fitsMap.set(fitKey, {
            id: fitKey,
            nameAr: p.fitAr?.trim() || fitKey,
            count: 1,
          });
        }
      }
    });

    return Array.from(fitsMap.values()).sort((a, b) => b.count - a.count);
  }, [safeProducts]);

  // 4. DYNAMIC PRICE BOUNDS (Strictly based on actual product prices)
  const { minProductPrice, maxProductPrice } = useMemo(() => {
    if (safeProducts.length === 0) {
      return { minProductPrice: 0, maxProductPrice: 1500 };
    }
    const prices = safeProducts.map((p) => Number(p.price) || 0);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    return {
      minProductPrice: Math.floor(minP),
      maxProductPrice: Math.ceil(maxP) > minP ? Math.ceil(maxP) : minP + 100,
    };
  }, [safeProducts]);

  if (!isOpen) return null;

  const toggleSize = (size: string) => {
    const exists = filters.sizes.includes(size);
    const updated = exists ? filters.sizes.filter((s) => s !== size) : [...filters.sizes, size];
    onUpdateFilters({ ...filters, sizes: updated });
  };

  const toggleColor = (colorName: string) => {
    const target = colorName.trim().toLowerCase();
    const exists = filters.colors.some((c) => c.trim().toLowerCase() === target);
    const updated = exists
      ? filters.colors.filter((c) => c.trim().toLowerCase() !== target)
      : [...filters.colors, colorName];
    onUpdateFilters({ ...filters, colors: updated });
  };

  const toggleFit = (fitName: string) => {
    const exists = filters.fit.includes(fitName);
    const updated = exists ? filters.fit.filter((f) => f !== fitName) : [...filters.fit, fitName];
    onUpdateFilters({ ...filters, fit: updated });
  };

  // Current slider value should clamp to dynamic max
  const currentSliderPrice =
    typeof filters.maxPrice === "number" && filters.maxPrice >= minProductPrice
      ? Math.min(filters.maxPrice, maxProductPrice)
      : maxProductPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-neutral-950 font-brand">
                {lang === "ar" ? "الفلاتر والترتيب" : "Filter & Sort"}
              </h2>
              <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-full font-bold">
                {totalFilteredCount} {lang === "ar" ? "منتج" : "items"}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close filter drawer"
              className="p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 text-start">
            {/* Sort options */}
            <div>
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5">
                {lang === "ar" ? "ترتيب المنتجات" : "Sort By"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "featured", labelEn: "Featured", labelAr: "المقترح والأكثر طلباً" },
                  { id: "newest", labelEn: "New Drops", labelAr: "أحدث المنتجات" },
                  { id: "price-asc", labelEn: "Price: Low to High", labelAr: "السعر: الأقل أولاً" },
                  { id: "price-desc", labelEn: "Price: High to Low", labelAr: "السعر: الأعلى أولاً" },
                  { id: "discount", labelEn: "Biggest Discount", labelAr: "أعلى نسبة خصم" },
                ].map((sort) => (
                  <button
                    key={sort.id}
                    onClick={() => onUpdateFilters({ ...filters, sortBy: sort.id as any })}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-start transition-all cursor-pointer ${
                      filters.sortBy === sort.id
                        ? "bg-neutral-950 text-white border-neutral-950 shadow-xs font-black"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {lang === "ar" ? sort.labelAr : sort.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Colors Section - ONLY rendered if colors exist in products */}
            {dynamicColors.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {lang === "ar" ? "الألوان المتوفرة بالموقع" : "Available Colors"}
                    </h3>
                    {filters.colors.length > 0 && (
                      <button
                        onClick={() => onUpdateFilters({ ...filters, colors: [] })}
                        className="text-[11px] font-bold text-neutral-500 hover:text-neutral-950 cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء التحديد" : "Clear"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dynamicColors.map((col) => {
                      const isSelected = filters.colors.some(
                        (c) =>
                          c.trim().toLowerCase() === col.name.trim().toLowerCase() ||
                          c.trim().toLowerCase() === col.nameAr.trim().toLowerCase()
                      );
                      const isLightColor =
                        col.hex &&
                        ["#ffffff", "#fff", "#f8fafc", "#f1f5f9", "#ffffff"].includes(col.hex.toLowerCase());

                      return (
                        <button
                          key={`filter-col-${col.name}`}
                          onClick={() => toggleColor(col.name)}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                              : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                                isLightColor ? "border border-neutral-300" : ""
                              }`}
                              style={{ backgroundColor: col.hex }}
                            >
                              {isSelected && (
                                <Check className={`w-2.5 h-2.5 ${isLightColor ? "text-neutral-950" : "text-white"}`} />
                              )}
                            </span>
                            <span className="truncate text-[11px]">
                              {lang === "ar" ? col.nameAr : col.name}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                              isSelected ? "bg-neutral-800 text-neutral-200" : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {col.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <hr className="border-neutral-100" />
              </>
            )}

            {/* Sizes Section - ONLY rendered if sizes exist in products */}
            {dynamicSizes.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {lang === "ar" ? "المقاسات المتوفرة بالموقع" : "Available Sizes"}
                    </h3>
                    {filters.sizes.length > 0 && (
                      <button
                        onClick={() => onUpdateFilters({ ...filters, sizes: [] })}
                        className="text-[11px] font-bold text-neutral-500 hover:text-neutral-950 cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء التحديد" : "Clear"}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dynamicSizes.map((item) => {
                      const isSelected = filters.sizes.includes(item.size);
                      return (
                        <button
                          key={`sz-filter-${item.size}`}
                          onClick={() => toggleSize(item.size)}
                          className={`px-3 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                              : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          <span>{item.size}</span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded ${
                              isSelected ? "bg-neutral-800 text-neutral-200" : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <hr className="border-neutral-100" />
              </>
            )}

            {/* Fits Section - ONLY rendered if fits actually exist on products */}
            {dynamicFits.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      {lang === "ar" ? "نوع القصة / الموديل" : "Fit & Silhouette"}
                    </h3>
                    {filters.fit.length > 0 && (
                      <button
                        onClick={() => onUpdateFilters({ ...filters, fit: [] })}
                        className="text-[11px] font-bold text-neutral-500 hover:text-neutral-950 cursor-pointer"
                      >
                        {lang === "ar" ? "إلغاء التحديد" : "Clear"}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dynamicFits.map((fit) => {
                      const isSelected = filters.fit.includes(fit.id);
                      return (
                        <button
                          key={fit.id}
                          onClick={() => toggleFit(fit.id)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-xs font-bold"
                              : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          <span>{lang === "ar" ? fit.nameAr : fit.id}</span>
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded ${
                              isSelected ? "bg-neutral-800 text-neutral-200" : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {fit.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <hr className="border-neutral-100" />
              </>
            )}

            {/* Dynamic Price Range synchronized with catalog */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {lang === "ar" ? "مستوى الأسعار الأقصى" : "Max Price"}
                </h3>
                <span className="text-xs font-extrabold text-neutral-950 font-brand">
                  {currentSliderPrice} {lang === "ar" ? "ج.م" : "EGP"}
                </span>
              </div>
              <input
                type="range"
                min={minProductPrice}
                max={maxProductPrice}
                step={Math.max(1, Math.round((maxProductPrice - minProductPrice) / 40))}
                value={currentSliderPrice}
                onChange={(e) => onUpdateFilters({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-neutral-950 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-neutral-500 mt-1 font-brand">
                <span>{minProductPrice} {lang === "ar" ? "ج.م" : "EGP"}</span>
                <span>{maxProductPrice} {lang === "ar" ? "ج.م" : "EGP"}</span>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-neutral-50 border border-neutral-100">
                <span className="text-xs sm:text-sm font-bold text-neutral-800">
                  {lang === "ar" ? "العروض والتخفيضات فقط" : "Discounted items only"}
                </span>
                <input
                  type="checkbox"
                  checked={filters.onlyDiscounted}
                  onChange={(e) => onUpdateFilters({ ...filters, onlyDiscounted: e.target.checked })}
                  className="w-4 h-4 rounded text-neutral-950 accent-neutral-950 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl hover:bg-neutral-50 border border-neutral-100">
                <span className="text-xs sm:text-sm font-bold text-neutral-800">
                  {lang === "ar" ? "المنتجات المتوفرة بالمخزون فقط" : "In-stock only"}
                </span>
                <input
                  type="checkbox"
                  checked={filters.onlyInStock}
                  onChange={(e) => onUpdateFilters({ ...filters, onlyInStock: e.target.checked })}
                  className="w-4 h-4 rounded text-neutral-950 accent-neutral-950 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-3">
            <button
              onClick={() => {
                onResetFilters();
                onUpdateFilters({
                  ...filters,
                  sizes: [],
                  colors: [],
                  fit: [],
                  maxPrice: maxProductPrice,
                  onlyDiscounted: false,
                  onlyInStock: false,
                });
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "إعادة ضبط" : "Reset"}</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-950 hover:bg-black text-white rounded-xl text-sm font-extrabold tracking-wide uppercase transition-all shadow-md active:scale-[0.99] cursor-pointer font-brand"
            >
              {lang === "ar" ? `عرض النتائج (${totalFilteredCount})` : `Apply Filters (${totalFilteredCount})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
