import React, { useState, useMemo } from "react";
import { Search, X, ArrowRight, ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import { Product, ColorVariant, DiscountBadgeStyle } from "../types";
import { ProductCard } from "./ProductCard";

interface SearchPageProps {
  products: Product[];
  onOpenProductModal: (product: Product, selectedColorIndex: number) => void;
  onQuickAdd: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onQuickOrderNow: (product: Product, selectedColor: ColorVariant, size: string) => void;
  onOpenLightbox: (imageUrl: string) => void;
  onBackToHome: () => void;
  lang: "ar" | "en";
  globalDiscountStyle?: DiscountBadgeStyle;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  products,
  onOpenProductModal,
  onQuickAdd,
  onQuickOrderNow,
  onOpenLightbox,
  onBackToHome,
  lang,
  globalDiscountStyle,
}) => {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const popularTags = [
    { id: "all", labelAr: "الكل", labelEn: "All" },
    { id: "oversized", labelAr: "أوفر سايز", labelEn: "Oversized" },
    { id: "compression", labelAr: "كومبريشن", labelEn: "Compression" },
    { id: "tanks", labelAr: "كت وتانك", labelEn: "Tanks" },
    { id: "shorts", labelAr: "شورتات", labelEn: "Shorts" },
    { id: "pants", labelAr: "بناطيل", labelEn: "Pants" },
    { id: "sets", labelAr: "أطقم كاملة", labelEn: "Sets" },
  ];

  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedTag !== "all") {
      const t = selectedTag.toLowerCase();
      list = list.filter(
        (p) =>
          p.category.toLowerCase().includes(t) ||
          p.fit.toLowerCase().includes(t) ||
          (p.fitAr && p.fitAr.toLowerCase().includes(t)) ||
          p.title.toLowerCase().includes(t) ||
          (p.titleAr && p.titleAr.toLowerCase().includes(t))
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.titleAr && p.titleAr.toLowerCase().includes(q)) ||
          (p.descriptionAr && p.descriptionAr.toLowerCase().includes(q)) ||
          (p.fabricAr && p.fabricAr.toLowerCase().includes(q)) ||
          p.fit.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, query, selectedTag]);

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-10 animate-fade-in text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-neutral-600 hover:text-neutral-950 transition-colors font-brand cursor-pointer"
          >
            {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === "ar" ? "العودة للمتجر" : "Back to Home"}</span>
          </button>
        </div>

        {/* Page Title & Search Input Hero */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs mb-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-brand tracking-tight">
                {lang === "ar" ? "بحث عن المنتجات" : "Search Drops & Products"}
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                {lang === "ar" ? "ابحث عن أي موديل، لون، قصة، أو خامة مفضلة لديك" : "Find the exact athletic fit, drop, or style you are looking for"}
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              autoFocus
              placeholder={
                lang === "ar"
                  ? "ابحث بالاسم، القصة، الخامة، أو اللون (مثال: تيشرت أوفر سايز، أسود، كومبريشن)..."
                  : "Search by title, fit, fabric, color (e.g. Oversized Tee, Black, Compression)..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full ps-12 pe-12 py-3.5 sm:py-4 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm sm:text-base font-bold text-neutral-900 placeholder-neutral-400 outline-none focus:bg-white focus:border-neutral-950 transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 -translate-y-1/2 end-4 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-neutral-400 flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
              {lang === "ar" ? "مقترحات سريعة:" : "Quick Filter:"}
            </span>
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 font-brand ${
                  selectedTag === tag.id
                    ? "bg-neutral-950 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                {lang === "ar" ? tag.labelAr : tag.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#dc2626] rounded-full" />
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-neutral-950 font-brand">
              {lang === "ar" ? "نتائج البحث" : "Search Results"}
            </h2>
            <span className="text-xs font-bold text-neutral-400 font-brand">
              ({filteredProducts.length})
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-2xs space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Search className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="text-base font-black text-neutral-900 font-brand">
              {lang === "ar" ? "لم يتم العثور على منتجات مطابقة" : "No matching products found"}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
              {lang === "ar"
                ? "جرب البحث بكلمات عامة مثل 'تيشرت'، 'شورت'، 'أسود'، أو اضغط على أحد الأقسام المقترحة بالأعلى."
                : "Try searching with broader terms like 'Tee', 'Shorts', 'Black', or pick a category pill above."}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSelectedTag("all");
              }}
              className="px-6 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer shadow-2xs"
            >
              {lang === "ar" ? "عرض جميع المنتجات" : "View All Products"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProductModal={() => onOpenProductModal(product, 0)}
                onQuickAdd={onQuickAdd}
                onQuickOrderNow={onQuickOrderNow}
                onOpenLightbox={onOpenLightbox}
                layoutCols={3}
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
