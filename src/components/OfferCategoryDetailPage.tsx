import React, { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, ArrowUpDown, LayoutList, Grid2X2, Grid3X3, Sparkles } from "lucide-react";
import { OfferCategory, Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { ProductCard } from "./ProductCard";
import { OfferShowcaseSlider } from "./OfferShowcaseSlider";

interface OfferCategoryDetailPageProps {
  offerCategory: OfferCategory;
  allOfferCategories: OfferCategory[];
  products: Product[];
  onSelectOfferCategory: (catId: string) => void;
  onOpenProductModal: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onBackToHome: () => void;
  onOpenLightbox?: (images: string[], startIndex: number) => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const OfferCategoryDetailPage: React.FC<OfferCategoryDetailPageProps> = ({
  offerCategory,
  allOfferCategories,
  products,
  onSelectOfferCategory,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  onBackToHome,
  onOpenLightbox,
  lang,
  globalDiscountStyle,
}) => {
  const [showSlider, setShowSlider] = useState(true);
  const [layoutCols, setLayoutCols] = useState(2);
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p && String(p.offerCategory || "").trim() === String(offerCategory.id).trim());
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
    return result;
  }, [products, offerCategory.id, sortBy]);

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
                <span>الرئيسية / العروض</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Home / Offers</span>
              </>
            )}
          </button>
          <span className="text-xs font-black uppercase text-neutral-900 tracking-wider font-brand">
            {lang === "ar" ? offerCategory.nameAr : offerCategory.name}
          </span>
        </div>
      </div>

      {/* Offer Categories Pills Strip */}
      <div className="bg-white border-b border-neutral-200 py-2.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(allOfferCategories || []).map((cat) => {
            const isSelected = cat.id === offerCategory?.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectOfferCategory(cat.id)}
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

      {/* Modern Offer Showcase Slider */}
      {showSlider && (
        <OfferShowcaseSlider
          offerCategories={allOfferCategories}
          products={products}
          activeCategoryId={offerCategory.id}
          onSelectOfferCategory={onSelectOfferCategory}
          onOpenProductModal={onOpenProductModal}
          onQuickAdd={onQuickAdd}
          onQuickOrderNow={onQuickOrderNow}
          onOpenLightbox={onOpenLightbox}
          lang={lang}
          globalDiscountStyle={globalDiscountStyle}
        />
      )}

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Toggle Showcase */}
          <button
            onClick={() => setShowSlider(!showSlider)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showSlider
                ? "bg-neutral-950 text-white border border-neutral-950 shadow-xs font-black"
                : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>{showSlider ? (lang === "ar" ? "إخفاء العرض التفاعلي" : "Hide Showcase") : (lang === "ar" ? "إظهار العرض التفاعلي" : "Show Showcase")}</span>
          </button>

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
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 my-8">
            <h3 className="text-lg font-bold text-neutral-800">
              {lang === "ar" ? "لا توجد منتجات في هذا القسم حالياً" : "No products in this offer section"}
            </h3>
            <button
              onClick={onBackToHome}
              className="mt-4 px-4 py-2 bg-neutral-950 text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer"
            >
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
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
            {(filteredProducts || []).map((product) => (
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
