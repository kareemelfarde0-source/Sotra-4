import React, { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, ArrowUpDown, LayoutList, Grid2X2, Grid3X3, Sparkles, Layers, Package } from "lucide-react";
import { Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { ProductCard } from "./ProductCard";

interface ProductsGroupDetailPageProps {
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  bannerImage?: string;
  productIds: string[];
  allProducts: Product[];
  onOpenProductModal: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onBackToHome: () => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const ProductsGroupDetailPage: React.FC<ProductsGroupDetailPageProps> = ({
  titleAr = "تشكيلة العرض الخاص",
  titleEn = "Special Drop Collection",
  subtitleAr = "مجموعة مختارة من أحدث وأرقى الموديلات الحصرية",
  subtitleEn = "Handpicked collection of luxury exclusive items",
  bannerImage,
  productIds = [],
  allProducts = [],
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

  const displayTitle = lang === "ar" ? titleAr || titleEn : titleEn || titleAr;
  const displaySubtitle = lang === "ar" ? subtitleAr || subtitleEn : subtitleEn || subtitleAr;

  const targetProducts = useMemo(() => {
    let list: Product[] = [];
    if (productIds.length > 0) {
      // Find products matching the specified IDs
      list = allProducts.filter((p) => productIds.includes(p.id));
    } else {
      // Fallback: show featured/discounted products
      list = allProducts.slice(0, 12);
    }

    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      list = [...list].sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    }
    return list;
  }, [allProducts, productIds, sortBy]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16 animate-fade-in text-start">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-800 hover:text-black transition-colors group cursor-pointer"
          >
            {lang === "ar" ? (
              <>
                <ArrowRight className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>الرئيسية / العروض الخاصة</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Home / Special Drops</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 text-amber-900 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{targetProducts.length} {lang === "ar" ? "منتجات في التشكيلة" : "Items"}</span>
          </div>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative bg-neutral-950 text-white overflow-hidden py-10 sm:py-14 px-4 sm:px-6 mb-6">
        {bannerImage && (
          <div className="absolute inset-0 z-0 opacity-25">
            <img
              src={bannerImage}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/10 mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
            <span>{lang === "ar" ? "مجموعة العرض الحصري" : "Exclusive Drop Bundle"}</span>
          </span>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-brand mb-2.5">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-xs sm:text-sm text-neutral-300 max-w-xl font-medium leading-relaxed">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#dc2626] rounded-full" />
            <h2 className="text-sm sm:text-base font-black text-neutral-950 font-brand">
              {lang === "ar" ? "منتجات التشكيلة" : "Collection Items"}
            </h2>
            <span className="text-xs font-bold text-neutral-400">({targetProducts.length})</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sorting */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                className="bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="featured">{lang === "ar" ? "المميزة" : "Featured"}</option>
                <option value="price-asc">{lang === "ar" ? "السعر: من الأقل" : "Price: Low to High"}</option>
                <option value="price-desc">{lang === "ar" ? "السعر: من الأعلى" : "Price: High to Low"}</option>
                <option value="newest">{lang === "ar" ? "الأحدث أولاً" : "Newest"}</option>
              </select>
            </div>

            {/* Layout Switcher */}
            <div className="hidden sm:flex items-center bg-neutral-100 rounded-xl p-1 border border-neutral-200">
              <button
                onClick={() => setLayoutCols(1)}
                aria-label="Single column view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutCols === 1 ? "bg-white text-black shadow-2xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutCols(2)}
                aria-label="Two column view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutCols === 2 ? "bg-white text-black shadow-2xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutCols(3)}
                aria-label="Three column view"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  layoutCols === 3 ? "bg-white text-black shadow-2xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {targetProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-2xs">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-800">
              {lang === "ar" ? "لا توجد منتجات مضافة لهذه التشكيلة حالياً" : "No items found in this collection"}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {lang === "ar" ? "يمكنك تصفح باقي تشكيلات المتجر من الصفحة الرئيسية" : "Explore all catalog items from home"}
            </p>
            <button
              onClick={onBackToHome}
              className="mt-4 px-5 py-2.5 bg-neutral-950 text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer hover:bg-black transition-colors"
            >
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-6 ${
              layoutCols === 1
                ? "grid-cols-1 max-w-xl mx-auto"
                : layoutCols === 2
                ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            }`}
          >
            {targetProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProductModal={() => onOpenProductModal(product, 0)}
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
