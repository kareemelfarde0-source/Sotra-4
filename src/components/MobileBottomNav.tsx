import React from "react";
import { Home, Layers, Search, ShoppingBag, User } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: "home" | "categories" | "search" | "cart" | "profile" | "admin";
  onSelectTab: (tab: "home" | "categories" | "search" | "cart" | "profile") => void;
  cartCount: number;
  lang: "ar" | "en";
  isVisible?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  lang,
  isVisible = true,
}) => {
  return (
    <div
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-lg transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={() => onSelectTab("home")}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          activeTab === "home" ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <Home className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] font-bold mt-0.5">{lang === "ar" ? "الرئيسية" : "Home"}</span>
      </button>

      <button
        onClick={() => onSelectTab("categories")}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          activeTab === "categories" ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <Layers className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] font-bold mt-0.5">{lang === "ar" ? "الأقسام" : "Categories"}</span>
      </button>

      <button
        onClick={() => onSelectTab("search")}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          activeTab === "search" ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <Search className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] font-bold mt-0.5">{lang === "ar" ? "البحث" : "Search"}</span>
      </button>

      <button
        onClick={() => onSelectTab("cart")}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors relative cursor-pointer ${
          activeTab === "cart" ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center font-brand animate-scale-in">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold mt-0.5">{lang === "ar" ? "السلة" : "Bag"}</span>
      </button>

      <button
        onClick={() => onSelectTab("profile")}
        className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors cursor-pointer ${
          activeTab === "profile" ? "text-neutral-950 font-black" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        <User className="w-5 h-5 stroke-[2]" />
        <span className="text-[10px] font-bold mt-0.5">{lang === "ar" ? "حسابي" : "Account"}</span>
      </button>
    </div>
  );
};
