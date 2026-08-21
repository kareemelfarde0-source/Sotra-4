import React from "react";
import { Truck, ShieldCheck, Sparkles } from "lucide-react";

interface AnnouncementBarProps {
  lang: "ar" | "en";
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ lang }) => {
  return (
    <div className="bg-[#0a0a0a] text-white text-xs md:text-sm font-bold tracking-wider py-2.5 px-4 text-center select-none overflow-hidden border-b border-neutral-800">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 md:gap-4 uppercase font-brand">
        <Truck className="w-3.5 h-3.5 text-neutral-300 animate-bounce" />
        <span className="tracking-widest">
          {lang === "ar"
            ? "📦 شحن سريع وضمان استبدال واسترجاع مجاني لكافة المحافظات"
            : "GUARANTEED RETURNS & EXCHANGES! • FREE SHIPPING OVER 1500 LE"}
        </span>
        <span className="hidden sm:inline text-neutral-400">|</span>
        <span className="hidden sm:flex items-center gap-1 text-neutral-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {lang === "ar" ? "دفع عند الاستلام بعد المعاينة" : "CASH ON DELIVERY"}
        </span>
      </div>
    </div>
  );
};
