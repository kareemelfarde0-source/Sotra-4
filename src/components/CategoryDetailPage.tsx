import React, { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, ArrowUpDown, LayoutList, Grid2X2, Grid3X3, Check } from "lucide-react";
import { Category, Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { ProductCard } from "./ProductCard";

interface CategoryDetailPageProps {
  category: Category;
  allCategories: Category[];
  products: Product[];
  onSelectCategory: (catId: string) => void;
  onOpenProductModal: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onBackToHome: () => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  category,
  allCategories,
  products,
  onSelectCategory,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  onBackToHome,
  onOpenLightbox,
  lang,
  globalDiscountStyle,
}) => {
  const [layoutCols, setLayoutCols] = useState(2);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColor, setSelectedColor] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Products belonging to this category
  const baseCategoryProducts = useMemo(() => {
    return products.filter((p) => category.id === "all" || p.category === category.id);
  }, [products, category.id]);

  // Dynamically extract real available colors in this category
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, { name: string; nameAr: string; hex: string; count: number }>();
    baseCategoryProducts.forEach((p) => {
      if (Array.isArray(p.colors) && p.colors.length > 0) {
        p.colors.forEach((c) => {
          if (!c || !c.name) return;
          const key = c.name.trim().toLowerCase();
          const existing = colorMap.get(key);
          if (existing) {
            existing.count += 1;
            if (c.hex && (!existing.hex || existing.hex === "#000000")) existing.hex = c.hex;
            if (c.nameAr && !existing.nameAr) existing.nameAr = c.nameAr;
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
  }, [baseCategoryProducts]);

  // Dynamically extract available sizes in this category (only existing ones)
  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    baseCategoryProducts.forEach((p) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((sz) => {
          if (sz && String(sz).trim()) sizesSet.add(String(sz).trim());
        });
      }
    });
    const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "4XL", "5XL", "Free Size"];
    return Array.from(sizesSet).sort((a, b) => {
      const idxA = sizeOrder.indexOf(a);
      const idxB = sizeOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [baseCategoryProducts]);

  const filteredProducts = useMemo(() => {
    let result = baseCategoryProducts.filter((p) => {
      if (selectedSize !== "all" && !p.sizes.includes(selectedSize)) return false;
      if (selectedColor !== "all") {
        const matchesColor = p.colors?.some(
          (c) =>
            c.name.trim().toLowerCase() === selectedColor.trim().toLowerCase() ||
            (c.nameAr && c.nameAr.trim().toLowerCase() === selectedColor.trim().toLowerCase())
        );
        if (!matchesColor) return false;
      }
      if (inStockOnly && !p.inStock) return false;
      return true;
    });

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }
    return result;
  }, [baseCategoryProducts, selectedSize, selectedColor, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16 animate-fade-in text-start">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black transition-colors group cursor-pointer"
          >
            {lang === "ar" ? (
              <>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>الرئيسية / الأقسام</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Home / Categories</span>
              </>
            )}
          </button>
          <span className="text-xs font-black uppercase text-neutral-900 tracking-wider font-brand">
            {lang === "ar" ? category.nameAr : category.name}
          </span>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="bg-white border-b border-neutral-200 py-2.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {allCategories.map((cat, idx) => {
            const isSelected = cat.id === category.id;
            return (
              <button
                key={`cat-detail-strip-${cat.id}-${idx}`}
                onClick={() => {
                  setSelectedSize("all");
                  setSelectedColor("all");
                  onSelectCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase whitespace-nowrap transition-all font-brand cursor-pointer ${
                  isSelected
                    ? "bg-neutral-950 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-black"
                }`}
              >
                {lang === "ar" ? cat.nameAr : cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Quick Sort Toolbar with Dynamic Color & Size Sync */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 pb-2">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/90 shadow-xs space-y-3">
          {/* Top Row: Sort and Layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-neutral-950 uppercase font-brand">
                {filteredProducts.length} {lang === "ar" ? "منتج متاح" : "items available"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-neutral-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer font-arabic"
                >
                  <option value="featured">{lang === "ar" ? "المقترح والمميز" : "Featured"}</option>
                  <option value="price-asc">{lang === "ar" ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
                  <option value="price-desc">{lang === "ar" ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
                  <option value="newest">{lang === "ar" ? "أحدث الإضافات" : "Newest"}</option>
                </select>
              </div>

              <div className="hidden sm:flex items-center gap-1 border border-neutral-200 p-0.5 rounded-xl bg-neutral-50">
                <button
                  onClick={() => setLayoutCols(1)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    layoutCols === 1 ? "bg-white shadow-xs text-black" : "text-neutral-400 hover:text-black"
                  }`}
                  title="Single column"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutCols(2)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    layoutCols === 2 ? "bg-white shadow-xs text-black" : "text-neutral-400 hover:text-black"
                  }`}
                  title="2 columns"
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayoutCols(3)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    layoutCols === 3 ? "bg-white shadow-xs text-black" : "text-neutral-400 hover:text-black"
                  }`}
                  title="3 columns"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Color & Size Dynamic Sync Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Color Filter Swatches */}
            {availableColors.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-xs font-bold text-neutral-500 flex-shrink-0 me-1">
                  {lang === "ar" ? "اللون:" : "Color:"}
                </span>
                <button
                  onClick={() => setSelectedColor("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    selectedColor === "all"
                      ? "bg-neutral-950 text-white shadow-xs font-black"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {lang === "ar" ? "كل الألوان" : "All Colors"}
                </button>
                {availableColors.map((col) => {
                  const isSelected =
                    selectedColor.toLowerCase() === col.name.toLowerCase() ||
                    selectedColor.toLowerCase() === col.nameAr.toLowerCase();
                  const isLight =
                    col.hex && ["#ffffff", "#fff", "#f8fafc", "#f1f5f9"].includes(col.hex.toLowerCase());

                  return (
                    <button
                      key={`cat-col-${col.name}`}
                      onClick={() => setSelectedColor(isSelected ? "all" : col.name)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 border ${
                        isSelected
                          ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                          : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center ${
                          isLight ? "border border-neutral-300" : ""
                        }`}
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && <Check className={`w-2 h-2 ${isLight ? "text-neutral-950" : "text-white"}`} />}
                      </span>
                      <span className="text-[11px]">{lang === "ar" ? col.nameAr : col.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Size Filter */}
            {availableSizes.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-xs font-bold text-neutral-500 flex-shrink-0 me-1">
                  {lang === "ar" ? "المقاس:" : "Size:"}
                </span>
                <button
                  onClick={() => setSelectedSize("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    selectedSize === "all"
                      ? "bg-neutral-950 text-white shadow-xs font-black"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {lang === "ar" ? "الكل" : "All"}
                </button>
                {availableSizes.map((sz) => (
                  <button
                    key={`cat-sz-${sz}`}
                    onClick={() => setSelectedSize(sz === selectedSize ? "all" : sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      selectedSize === sz
                        ? "bg-neutral-950 text-white shadow-xs font-black"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Products */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 my-8">
            <h3 className="text-lg font-bold text-neutral-800">
              {lang === "ar" ? "لا توجد منتجات تطابق هذه الفلاتر" : "No products match your filters"}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {lang === "ar" ? "جرب تغيير خيارات اللون أو المقاس" : "Try adjusting color or size filters"}
            </p>
            <button
              onClick={() => {
                setSelectedSize("all");
                setSelectedColor("all");
                setSortBy("featured");
              }}
              className="mt-4 px-4 py-2 bg-neutral-950 text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer"
            >
              {lang === "ar" ? "إعادة ضبط الفلاتر" : "Reset Filters"}
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-6 ${
              layoutCols === 1
                ? "grid-cols-1 max-w-2xl mx-auto"
                : layoutCols === 2
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProductModal={onOpenProductModal}
                onQuickAdd={onQuickAdd}
                onQuickOrderNow={onQuickOrderNow}
                onOpenLightbox={onOpenLightbox}
                layoutCols={layoutCols}
                lang={lang}
                globalDiscountStyle={globalDiscountStyle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
