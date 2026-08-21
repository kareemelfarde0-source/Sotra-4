import React, { useMemo } from "react";
import { Category } from "../types";

interface CategoryPillsProps {
  categories?: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  lang: "ar" | "en";
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  lang,
}) => {
  // Deduplicate and filter out 'all' to guarantee completely unique keys
  const pills = useMemo(() => {
    const seenIds = new Set<string>(["all"]);
    const list: { id: string; labelEn: string; labelAr: string }[] = [
      { id: "all", labelEn: "View All", labelAr: "الكل" },
    ];

    if (Array.isArray(categories)) {
      for (const c of categories) {
        if (c && c.id && !seenIds.has(c.id)) {
          seenIds.add(c.id);
          list.push({
            id: c.id,
            labelEn: c.name || c.id,
            labelAr: c.nameAr || c.name || c.id,
          });
        }
      }
    }
    return list;
  }, [categories]);

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2.5 sm:py-3">
          {pills.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={`cat-pill-${tab.id}`}
                id={`tab-pill-${tab.id}`}
                onClick={() => onSelectCategory(tab.id)}
                className={`text-sm sm:text-base font-bold whitespace-nowrap pb-2 pt-1 transition-all relative cursor-pointer ${
                  isActive ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {lang === "ar" ? tab.labelAr : tab.labelEn}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-neutral-950 rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
