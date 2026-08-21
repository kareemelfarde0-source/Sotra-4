import React, { useRef, useEffect } from "react";
import { Search, User, ShoppingBag } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onGoHome?: () => void;
  lang: "ar" | "en";
  onToggleLang?: () => void;
  onSelectCategory?: (catId: string) => void;
  isVisible?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenSearch,
  onOpenMenu,
  onOpenProfile,
  onOpenAdmin,
  onGoHome,
  lang,
  isVisible = true,
}) => {
  const clickCountRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    clickCountRef.current += 1;
    const current = clickCountRef.current;

    // Trigger ONLY after exactly 10 clicks
    if (current >= 10) {
      clickCountRef.current = 0;
      onOpenAdmin();
    } else {
      if (current === 1) {
        onGoHome?.();
      }
      // Reset counter after 3.5 seconds of inactivity
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 3500);
    }
  };

  return (
    <header
      className={`w-full sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200/80 transition-all duration-300 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-8 h-16 sm:h-[70px] flex items-center justify-between">
        {/* Left Side: Navigation & Search */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="btn-nav-menu"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="p-2 sm:p-2.5 text-neutral-800 hover:text-black hover:bg-neutral-100/90 active:scale-95 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-neutral-200/60"
          >
            <div className="w-5 flex flex-col gap-1.5 items-start">
              <span className="w-5 h-[2px] bg-neutral-900 rounded-full transition-all" />
              <span className="w-3.5 h-[2px] bg-neutral-900 rounded-full transition-all" />
            </div>
          </button>
          <button
            id="btn-search"
            onClick={onOpenSearch}
            aria-label="Search products"
            className="p-2 sm:p-2.5 text-neutral-800 hover:text-black hover:bg-neutral-100/90 active:scale-95 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-200/60"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div className="flex items-center justify-center relative">
          <button
            id="header-brand-logo"
            onClick={handleLogoClick}
            className="flex flex-col items-center group cursor-pointer select-none relative py-1 px-3 rounded-xl hover:bg-neutral-50/80 transition-colors"
          >
            <span className="font-brand font-black text-2xl sm:text-[28px] tracking-[0.24em] text-neutral-950 group-hover:scale-[1.02] transition-transform uppercase leading-none">
              SOTRA
            </span>
            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.38em] text-[#dc2626] uppercase mt-0.5 group-hover:text-neutral-900 transition-colors">
              FASHION
            </span>
          </button>
        </div>

        {/* Right Side: Profile & Cart */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="btn-user-profile"
            onClick={onOpenProfile}
            aria-label="User account"
            className="p-2 sm:p-2.5 text-neutral-800 hover:text-black hover:bg-neutral-100/90 active:scale-95 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-200/60"
            title={lang === "ar" ? "حسابي وتتبع الطلبات" : "My Account & Orders"}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            id="btn-cart-bag"
            onClick={onOpenCart}
            aria-label="Shopping bag"
            className="relative p-2 sm:p-2.5 text-neutral-800 hover:text-black hover:bg-neutral-100/90 active:scale-95 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-200/60"
            title={lang === "ar" ? "حقيبة التسوق" : "Shopping Bag"}
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-[#dc2626] text-[10px] font-black text-white shadow-xs font-brand animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
