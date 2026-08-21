import React from "react";
import { Sparkles, Flame, Zap, Tag, Clock } from "lucide-react";
import { DiscountBadgeStyle } from "../types";

interface DiscountBadgeProps {
  discountPercent?: number | null;
  originalPrice?: number | null;
  price?: number;
  style?: DiscountBadgeStyle;
  lang?: "ar" | "en";
  className?: string;
  isOfferCarousel?: boolean;
  timeRemainingText?: string;
}

export const DiscountBadge: React.FC<DiscountBadgeProps> = ({
  discountPercent,
  originalPrice,
  price,
  style = "vertical_left",
  lang = "ar",
  className = "",
  isOfferCarousel = false,
  timeRemainingText,
}) => {
  // Calculate percentage
  let pct = discountPercent;
  if ((pct === undefined || pct === null || pct <= 0) && originalPrice && price && originalPrice > price) {
    pct = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  if (!pct || pct <= 0) return null;

  const textAr = `خصم ${pct}%`;
  const textEn = `-${pct}% OFF`;

  // 1. VERTICAL RIBBON ON LEFT (شريط رأسي يسار الكارت بالطول)
  if (style === "vertical_left") {
    return (
      <div
        className={`absolute top-0 left-2 sm:left-2.5 z-20 pointer-events-none select-none flex flex-col items-center gap-1 ${className}`}
      >
        <div
          className="bg-[#dc2626] text-white shadow-md flex flex-col items-center justify-center pt-2 pb-3 px-1.5 min-w-[26px] sm:min-w-[30px] rounded-t-xs"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 86%, 0% 100%)",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.45)",
          }}
        >
          <Flame className="w-3 h-3 text-amber-300 mb-0.5 fill-amber-300 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-black font-brand tracking-tighter leading-none [writing-mode:vertical-rl] rotate-180 uppercase">
            {lang === "ar" ? textAr : textEn}
          </span>
          <span className="h-1" />
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 2. VERTICAL RIBBON ON RIGHT (شريط رأسي يمين الكارت بالطول - الجانب الآخر)
  if (style === "vertical_right") {
    return (
      <div
        className={`absolute top-0 right-2 sm:right-2.5 z-20 pointer-events-none select-none flex flex-col items-center gap-1 ${className}`}
      >
        <div
          className="bg-[#dc2626] text-white shadow-md flex flex-col items-center justify-center pt-2 pb-3 px-1.5 min-w-[26px] sm:min-w-[30px] rounded-t-xs"
          style={{
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 86%, 0% 100%)",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.45)",
          }}
        >
          <Flame className="w-3 h-3 text-amber-300 mb-0.5 fill-amber-300 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-black font-brand tracking-tighter leading-none [writing-mode:vertical-rl] rotate-180 uppercase">
            {lang === "ar" ? textAr : textEn}
          </span>
          <span className="h-1" />
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 3. HORIZONTAL RIBBON BAR (شريط أفقي عريض أسفل الصورة)
  if (style === "horizontal_bar") {
    return (
      <div
        className={`absolute bottom-0 inset-x-0 z-20 pointer-events-none select-none bg-gradient-to-r from-neutral-950 via-[#dc2626] to-neutral-950 text-white py-1 px-2.5 flex items-center justify-between shadow-md ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span className="text-[10px] sm:text-xs font-black font-brand uppercase tracking-wider">
            {lang === "ar" ? `وفر ${pct}% الآن` : `SAVE ${pct}% NOW`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
          {timeRemainingText ? (
            <span className="text-amber-200 font-bold">⏳ {timeRemainingText}</span>
          ) : (
            <span className="opacity-90 font-mono">{lang === "ar" ? textAr : textEn}</span>
          )}
        </div>
      </div>
    );
  }

  // 4. ABOVE PRODUCT TITLE (شريط أنيق أعلى اسم وسعر المنتج)
  if (style === "above_title") {
    return (
      <div className={`flex items-center gap-1.5 mb-1.5 select-none flex-wrap ${className}`}>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-red-50 text-red-700 border border-red-200 font-brand">
          <Flame className="w-3 h-3 text-red-600 fill-red-600" />
          <span>{lang === "ar" ? textAr : textEn}</span>
        </span>
        {timeRemainingText && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            ⏳ {timeRemainingText}
          </span>
        )}
        {originalPrice && price && originalPrice > price && (
          <span className="text-[10px] text-neutral-400 font-bold line-through font-brand">
            {originalPrice} {lang === "ar" ? "ج.م" : "EGP"}
          </span>
        )}
      </div>
    );
  }

  // 5. TOP LEFT CORNER BADGE (شريط أفقي أعلى اليسار)
  if (style === "horizontal_top_left") {
    return (
      <div className={`absolute top-2.5 left-2.5 z-20 pointer-events-none select-none flex flex-col items-start gap-1 ${className}`}>
        <div className="bg-[#dc2626] text-white px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black shadow-md flex items-center gap-1 font-brand uppercase border border-red-500/50">
          <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span>{lang === "ar" ? textAr : textEn}</span>
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 6. TOP RIGHT CORNER BADGE (شريط أفقي أعلى اليمين)
  if (style === "horizontal_top_right") {
    return (
      <div className={`absolute top-2.5 right-2.5 z-20 pointer-events-none select-none flex flex-col items-end gap-1 ${className}`}>
        <div className="bg-[#dc2626] text-white px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black shadow-md flex items-center gap-1 font-brand uppercase border border-red-500/50">
          <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
          <span>{lang === "ar" ? textAr : textEn}</span>
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 7. PILL CORNER LEFT (كبسولة دائرية أعلى اليسار)
  if (style === "pill_corner" || style === "pill_corner_left") {
    return (
      <div className={`absolute top-2.5 left-2.5 z-20 pointer-events-none select-none flex flex-col items-start gap-1 ${className}`}>
        <div className="bg-[#dc2626] text-white px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-lg flex items-center gap-1 border border-white/30 font-brand">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>-{pct}%</span>
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 8. PILL CORNER RIGHT (كبسولة دائرية أعلى اليمين)
  if (style === "pill_corner_right") {
    return (
      <div className={`absolute top-2.5 right-2.5 z-20 pointer-events-none select-none flex flex-col items-end gap-1 ${className}`}>
        <div className="bg-[#dc2626] text-white px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-lg flex items-center gap-1 border border-white/30 font-brand">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>-{pct}%</span>
        </div>
        {timeRemainingText && (
          <span className="bg-black/90 backdrop-blur-xs text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            ⏳ {timeRemainingText}
          </span>
        )}
      </div>
    );
  }

  // 9. TOP BANNER RIBBON (شريط أحمر عريض أعلى الصورة)
  if (style === "banner_ribbon") {
    return (
      <div className={`absolute top-0 inset-x-0 z-20 pointer-events-none select-none bg-gradient-to-r from-[#dc2626] via-red-600 to-[#b91c1c] text-white py-1 px-2 text-center shadow-md font-brand uppercase tracking-wider flex items-center justify-center gap-1.5 ${className}`}>
        <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
        <span className="text-[10px] sm:text-xs font-black">
          {lang === "ar" ? `خصم حصري ${pct}% لفترة محدودة` : `SPECIAL OFFER -${pct}% OFF`}
        </span>
        {timeRemainingText && (
          <span className="text-amber-200 text-[9px] font-bold ms-1">({timeRemainingText})</span>
        )}
      </div>
    );
  }

  // 10. DIAGONAL CORNER LEFT (شريط مائل بالزاوية اليسرى)
  if (style === "diagonal_corner_left") {
    return (
      <div className={`absolute top-0 left-0 z-20 overflow-hidden w-16 h-16 sm:w-20 sm:h-20 pointer-events-none select-none ${className}`}>
        <div className="absolute top-[14px] -left-[24px] w-[92px] sm:w-[104px] text-center py-0.5 sm:py-1 bg-[#dc2626] text-white font-black text-[9px] sm:text-[11px] shadow-md tracking-wider font-brand uppercase transform -rotate-45 select-none border-y border-red-400/40">
          {lang === "ar" ? textAr : `-${pct}%`}
        </div>
        {timeRemainingText && (
          <div className="absolute bottom-0 left-0">
            <span className="bg-black/90 text-amber-300 text-[8px] font-bold px-1 rounded shadow-xs">
              ⏳ {timeRemainingText}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 11. DIAGONAL CORNER RIGHT (شريط مائل بالزاوية اليمنى - الافتراضي للمائل)
  return (
    <div className={`absolute top-0 right-0 z-20 overflow-hidden w-16 h-16 sm:w-20 sm:h-20 pointer-events-none select-none ${className}`}>
      <div className="absolute top-[14px] -right-[24px] w-[92px] sm:w-[104px] text-center py-0.5 sm:py-1 bg-[#dc2626] text-white font-black text-[9px] sm:text-[11px] shadow-md tracking-wider font-brand uppercase transform rotate-45 select-none border-y border-red-400/40">
        {lang === "ar" ? textAr : `-${pct}%`}
      </div>
      {timeRemainingText && (
        <div className="absolute bottom-0 right-0">
          <span className="bg-black/90 text-amber-300 text-[8px] font-bold px-1 rounded shadow-xs">
            ⏳ {timeRemainingText}
          </span>
        </div>
      )}
    </div>
  );
};
