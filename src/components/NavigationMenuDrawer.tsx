import React from "react";
import { X, ArrowRight, ArrowLeft, Tag, User, Search, ShoppingBag, MessageSquare, Globe, Check } from "lucide-react";
import { Category, OfferCategory } from "../types";

interface NavigationMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  offerCategories: OfferCategory[];
  onSelectCategory: (catId: string) => void;
  onSelectOfferCategory: (catId: string) => void;
  onOpenProfile: () => void;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  lang: "ar" | "en";
  onToggleLang: () => void;
}

export const NavigationMenuDrawer: React.FC<NavigationMenuDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  offerCategories,
  onSelectCategory,
  onSelectOfferCategory,
  onOpenProfile,
  onOpenCart,
  onOpenSearch,
  lang,
  onToggleLang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between text-start">
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-brand font-black text-lg text-neutral-950">SOTRA</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded">
                MEN
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Language Selector in Drawer */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-neutral-700 font-brand">
                <Globe className="w-3.5 h-3.5 text-neutral-500" />
                <span>{lang === "ar" ? "لغة التطبيق / Language" : "App Language"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (lang !== "ar") onToggleLang();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-brand ${
                    lang === "ar"
                      ? "bg-neutral-950 text-white shadow-xs"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {lang === "ar" && <Check className="w-3.5 h-3.5" />}
                  <span>العربية (AR)</span>
                </button>

                <button
                  onClick={() => {
                    if (lang !== "en") onToggleLang();
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer font-brand ${
                    lang === "en"
                      ? "bg-neutral-950 text-white shadow-xs"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {lang === "en" && <Check className="w-3.5 h-3.5" />}
                  <span>English (EN)</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-neutral-800" />
                <p className="text-[11px] font-black text-neutral-900 font-brand">
                  {lang === "ar" ? "حسابي" : "Account"}
                </p>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-neutral-800" />
                <p className="text-[11px] font-black text-neutral-900 font-brand">
                  {lang === "ar" ? "السلة" : "Cart"}
                </p>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 text-center flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4 text-neutral-800" />
                <p className="text-[11px] font-black text-neutral-900 font-brand">
                  {lang === "ar" ? "البحث" : "Search"}
                </p>
              </button>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                {lang === "ar" ? "أقسام الملابس الرجالية" : "Men's Apparel Categories"}
              </h3>
              <div className="space-y-1">
                {categories.map((cat, idx) => (
                  <button
                    key={`nav-drawer-cat-${cat.id}-${idx}`}
                    onClick={() => {
                      onClose();
                      onSelectCategory(cat.id);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 text-xs font-extrabold text-neutral-900 transition-colors cursor-pointer group"
                  >
                    <span>{lang === "ar" ? cat.nameAr : cat.name}</span>
                    {lang === "ar" ? (
                      <ArrowLeft className="w-4 h-4 text-neutral-400 group-hover:-translate-x-1 transition-transform" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Offer Categories */}
            {offerCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
                  {lang === "ar" ? "العروض والتخفيضات المميزة" : "Special Offers"}
                </h3>
                <div className="space-y-1">
                  {offerCategories.map((oc, idx) => (
                    <button
                      key={`nav-drawer-oc-${oc.id}-${idx}`}
                      onClick={() => {
                        onClose();
                        onSelectOfferCategory(oc.id);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-50/50 hover:bg-red-50 text-xs font-black text-red-900 border border-red-100 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-red-600" />
                        {lang === "ar" ? oc.nameAr : oc.name}
                      </span>
                      <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">عروض</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer inside drawer */}
          <div className="p-4 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-600 space-y-2.5">
            <div className="flex items-center justify-between">
              <span>{lang === "ar" ? "خدمة عملاء واتساب:" : "Customer Care:"}</span>
              <a
                href="https://wa.me/201000000000"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1 font-sans"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                0100000000
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

