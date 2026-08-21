import React from "react";
import { Columns, Grid2X2, LayoutGrid, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { FilterState } from "../types";

interface FilterBarProps {
  productsCount: number;
  layoutCols: number;
  onChangeLayout: (cols: number) => void;
  onOpenFilterDrawer: () => void;
  activeFiltersCount: number;
  filters: FilterState;
  onSortChange: (sortBy: FilterState["sortBy"]) => void;
  lang: "ar" | "en";
}

export const FilterBar: React.FC<FilterBarProps> = ({
  layoutCols,
  onChangeLayout,
  onOpenFilterDrawer,
  activeFiltersCount,
  filters,
  onSortChange,
  lang,
}) => {
  return (
    <div className="border-b border-neutral-200 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between">
        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-neutral-200 shadow-2xs">
          <button
            onClick={() => onChangeLayout(1)}
            aria-label="1 column view"
            title={lang === "ar" ? "عرض عمود واحد" : "Single column"}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layoutCols === 1
                ? "bg-neutral-950 text-white"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Columns className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => onChangeLayout(2)}
            aria-label="2 columns view"
            title={lang === "ar" ? "عرض عمودين" : "2 columns"}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layoutCols === 2
                ? "bg-neutral-950 text-white"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onChangeLayout(3)}
            aria-label="3 columns view"
            title={lang === "ar" ? "عرض 3 أعمدة" : "3 columns"}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              layoutCols === 3
                ? "bg-neutral-950 text-white"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Sort actions */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-800">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={filters.sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent border-none outline-none cursor-pointer text-xs font-bold font-arabic"
            >
              <option value="featured">{lang === "ar" ? "المقترح والأكثر طلباً" : "Featured"}</option>
              <option value="newest">{lang === "ar" ? "أحدث المنتجات" : "Newest Drops"}</option>
              <option value="price-asc">{lang === "ar" ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
              <option value="price-desc">{lang === "ar" ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
              <option value="discount">{lang === "ar" ? "أعلى نسبة خصم" : "Highest Discount"}</option>
            </select>
          </div>

          <button
            id="btn-open-filter-sort"
            onClick={onOpenFilterDrawer}
            className="flex items-center gap-2 bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-300 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-neutral-900 shadow-2xs transition-all cursor-pointer"
          >
            <span>{lang === "ar" ? "الفلاتر والترتيب" : "Filter & Sort"}</span>
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-950 text-[10px] font-bold text-white font-brand">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
