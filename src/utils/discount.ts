import { DiscountBadgeStyle, Product } from "../types";

export interface EffectiveDiscountInfo {
  isActive: boolean;
  percent: number | null;
  style: DiscountBadgeStyle;
  status: "active" | "scheduled_future" | "expired" | "no_discount";
  scheduleStatus: "active" | "scheduled" | "expired" | "none";
  statusTextAr: string;
  statusTextEn: string;
  startDate?: string;
  endDate?: string;
  timeRemainingAr?: string;
  timeRemainingEn?: string;
  savingsAmount: number;
}

export interface DiscountBadgeMetaItem {
  id: DiscountBadgeStyle | "default";
  nameAr: string;
  nameEn: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  iconName: string;
  side: "left" | "right" | "bottom" | "top" | "inline";
}

export const DISCOUNT_BADGE_STYLES_LIST: DiscountBadgeMetaItem[] = [
  {
    id: "default",
    nameAr: "تلقائي (حسب إعداد المتجر العام)",
    nameEn: "Default (Inherit Store Setting)",
    labelAr: "تلقائي (حسب إعداد المتجر)",
    labelEn: "Default (Inherit Store)",
    descAr: "يتبع موضع وشكل شريط الخصم المعتمد في إعدادات المتجر",
    iconName: "Settings",
    side: "inline",
  },
  {
    id: "vertical_right",
    nameAr: "شريط رأسي جهة اليمين (الجانب الأيمن)",
    nameEn: "Vertical Right Ribbon",
    labelAr: "شريط رأسي (جهة اليمين)",
    labelEn: "Vertical Right",
    descAr: "شريط أحمر نازل رأسياً جهة اليمين بتأثير الشعلة النارية",
    iconName: "Flame",
    side: "right",
  },
  {
    id: "vertical_left",
    nameAr: "شريط رأسي جهة اليسار (الجانب الأيسر)",
    nameEn: "Vertical Left Ribbon",
    labelAr: "شريط رأسي (جهة اليسار)",
    labelEn: "Vertical Left",
    descAr: "شريط أحمر نازل رأسياً جهة اليسار بتأثير الشعلة النارية",
    iconName: "Flame",
    side: "left",
  },
  {
    id: "diagonal_corner_right",
    nameAr: "شريط مائل بالزاوية اليمنى (Top-Right Corner)",
    nameEn: "Diagonal Top-Right Ribbon",
    labelAr: "شريط مائل (الزاوية اليمنى)",
    labelEn: "Diagonal Right",
    descAr: "شريط أحمر كلاسيكي مائل بزاوية الكارت العليا جهة اليمين",
    iconName: "Sparkles",
    side: "right",
  },
  {
    id: "diagonal_corner_left",
    nameAr: "شريط مائل بالزاوية اليسرى (Top-Left Corner)",
    nameEn: "Diagonal Top-Left Ribbon",
    labelAr: "شريط مائل (الزاوية اليسرى)",
    labelEn: "Diagonal Left",
    descAr: "شريط أحمر كلاسيكي مائل بزاوية الكارت العليا جهة اليسار",
    iconName: "Sparkles",
    side: "left",
  },
  {
    id: "horizontal_bar",
    nameAr: "شريط أفقي عريض (أسفل الصورة)",
    nameEn: "Horizontal Bottom Banner Bar",
    labelAr: "شريط أفقي أسفل الصورة",
    labelEn: "Horizontal Bottom",
    descAr: "شريط أفقي عريض بتدرج ناري وعبارة وفر الآن عبر كامل العرض",
    iconName: "Zap",
    side: "bottom",
  },
  {
    id: "horizontal_top_right",
    nameAr: "شريط أفقي أعلى اليمين (Top Right Badge)",
    nameEn: "Top Right Corner Badge",
    labelAr: "شريط أفقي أعلى اليمين",
    labelEn: "Top Right Badge",
    descAr: "شارة مدمجة أعلى يمين المنتج",
    iconName: "Tag",
    side: "right",
  },
  {
    id: "horizontal_top_left",
    nameAr: "شريط أفقي أعلى اليسار (Top Left Badge)",
    nameEn: "Top Left Corner Badge",
    labelAr: "شريط أفقي أعلى اليسار",
    labelEn: "Top Left Badge",
    descAr: "شارة مدمجة أعلى يسار المنتج",
    iconName: "Tag",
    side: "left",
  },
  {
    id: "pill_corner_right",
    nameAr: "كبسولة دائرية أعلى اليمين",
    nameEn: "Pill Corner Right",
    labelAr: "كبسولة دائرية أعلى اليمين",
    labelEn: "Pill Right",
    descAr: "كبسولة دائرية عصرية بنسبة الخصم أعلى اليمين",
    iconName: "Sparkles",
    side: "right",
  },
  {
    id: "pill_corner_left",
    nameAr: "كبسولة دائرية أعلى اليسار",
    nameEn: "Pill Corner Left",
    labelAr: "كبسولة دائرية أعلى اليسار",
    labelEn: "Pill Left",
    descAr: "كبسولة دائرية عصرية بنسبة الخصم أعلى اليسار",
    iconName: "Sparkles",
    side: "left",
  },
  {
    id: "banner_ribbon",
    nameAr: "شريط عريض يغطي أعلى الصورة بالكامل",
    nameEn: "Top Banner Ribbon",
    labelAr: "شريط عريض أعلى الصورة",
    labelEn: "Top Banner",
    descAr: "شريط ترويجي يمتد بعرض الصورة العلوي بالكامل",
    iconName: "Zap",
    side: "top",
  },
  {
    id: "above_title",
    nameAr: "شارة أنيقة فوق اسم وسعر المنتج",
    nameEn: "Badge Above Title",
    labelAr: "شارة أنيقة فوق الاسم",
    labelEn: "Above Title",
    descAr: "شارة مدمجة خفيفة ومحايدة تظهر فوق عنوان المنتج مباشرة",
    iconName: "Tag",
    side: "inline",
  },
];

// Map lookup for fast metadata
export const DISCOUNT_BADGE_STYLES_MAP: Record<string, DiscountBadgeMetaItem> = DISCOUNT_BADGE_STYLES_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, DiscountBadgeMetaItem>
);

// Alias fallback for legacy names
DISCOUNT_BADGE_STYLES_MAP["diagonal_corner"] = DISCOUNT_BADGE_STYLES_MAP["diagonal_corner_right"] || DISCOUNT_BADGE_STYLES_LIST[3];
DISCOUNT_BADGE_STYLES_MAP["pill_corner"] = DISCOUNT_BADGE_STYLES_MAP["pill_corner_left"] || DISCOUNT_BADGE_STYLES_LIST[9];

export const DISCOUNT_BADGE_STYLES_META: any = new Proxy(DISCOUNT_BADGE_STYLES_LIST, {
  get(target, prop) {
    if (typeof prop === "string" && prop in DISCOUNT_BADGE_STYLES_MAP) {
      return DISCOUNT_BADGE_STYLES_MAP[prop];
    }
    return (target as any)[prop];
  },
});

/**
 * Formats a clean human-readable countdown or remaining duration
 */
export function formatDiscountTimeRemaining(endDateStr?: string, lang: "ar" | "en" = "ar"): string | undefined {
  if (!endDateStr) return undefined;
  const target = new Date(endDateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return lang === "ar" ? "انتهى العرض" : "Deal Expired";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (lang === "ar") {
    if (days > 2) return `ينتهي خلال ${days} أيام`;
    if (days === 2) return "ينتهي خلال يومين";
    if (days === 1) return `ينتهي خلال يوم و ${hours} ساعة`;
    if (hours > 0) return `ينتهي خلال ${hours} ساعة و ${mins} دقيقة`;
    return `ينتهي خلال ${mins} دقيقة`;
  } else {
    if (days > 1) return `Ends in ${days} days`;
    if (days === 1) return `Ends in 1 day ${hours}h`;
    if (hours > 0) return `Ends in ${hours}h ${mins}m`;
    return `Ends in ${mins} mins`;
  }
}

/**
 * Calculates whether a product discount is active, scheduled for future, or expired,
 * along with the effective badge style and percentages.
 */
export function getEffectiveProductDiscount(
  product: Product,
  globalStyle?: DiscountBadgeStyle | string
): EffectiveDiscountInfo {
  const price = Number(product?.price) || 0;
  const originalPrice = product?.originalPrice ? Number(product.originalPrice) : null;
  const rawDiscountPercent = product?.discountPercent ? Number(product.discountPercent) : null;

  // Resolve percentage
  let percent: number | null = null;
  if (rawDiscountPercent && rawDiscountPercent > 0) {
    percent = rawDiscountPercent;
  } else if (originalPrice && originalPrice > price && price > 0) {
    percent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  const savingsAmount = originalPrice && originalPrice > price ? originalPrice - price : 0;

  // Resolve style: if specific override is set on product and not 'default', use it; else fallback to global
  let resolvedStyle: DiscountBadgeStyle = (globalStyle as DiscountBadgeStyle) || "vertical_right";
  if (
    product?.discountBadgeStyle &&
    product.discountBadgeStyle !== ("default" as any) &&
    product.discountBadgeStyle !== ("inherit" as any)
  ) {
    resolvedStyle = product.discountBadgeStyle as DiscountBadgeStyle;
  }

  // If no discount exists
  if (!percent || percent <= 0) {
    return {
      isActive: false,
      percent: null,
      style: resolvedStyle,
      status: "no_discount",
      scheduleStatus: "none",
      statusTextAr: "لا يوجد خصم",
      statusTextEn: "No Discount",
      savingsAmount: 0,
    };
  }

  // Check schedule if enabled
  if (product?.discountScheduleEnabled) {
    const now = Date.now();
    const startDate = product.discountStartDate ? new Date(product.discountStartDate).getTime() : null;
    const endDate = product.discountEndDate ? new Date(product.discountEndDate).getTime() : null;

    if (startDate && now < startDate) {
      const startsIn = formatDiscountTimeRemaining(product.discountStartDate, "ar");
      return {
        isActive: false,
        percent,
        style: resolvedStyle,
        status: "scheduled_future",
        scheduleStatus: "scheduled",
        statusTextAr: `سيبدأ الخصم (${new Date(product.discountStartDate).toLocaleDateString("ar-EG")})`,
        statusTextEn: `Starts soon (${new Date(product.discountStartDate).toLocaleDateString()})`,
        startDate: product.discountStartDate,
        endDate: product.discountEndDate,
        timeRemainingAr: startsIn,
        savingsAmount,
      };
    }

    if (endDate && now > endDate) {
      return {
        isActive: false,
        percent,
        style: resolvedStyle,
        status: "expired",
        scheduleStatus: "expired",
        statusTextAr: "انتهت فترة الخصم",
        statusTextEn: "Discount Expired",
        startDate: product.discountStartDate,
        endDate: product.discountEndDate,
        savingsAmount,
      };
    }

    // Currently active within schedule
    const timeRemainingAr = formatDiscountTimeRemaining(product.discountEndDate, "ar");
    const timeRemainingEn = formatDiscountTimeRemaining(product.discountEndDate, "en");

    return {
      isActive: true,
      percent,
      style: resolvedStyle,
      status: "active",
      scheduleStatus: "active",
      statusTextAr: "الخصم مفعّل حالياً 🟢",
      statusTextEn: "Discount Active 🟢",
      startDate: product.discountStartDate,
      endDate: product.discountEndDate,
      timeRemainingAr,
      timeRemainingEn,
      savingsAmount,
    };
  }

  // Active without schedule
  return {
    isActive: true,
    percent,
    style: resolvedStyle,
    status: "active",
    scheduleStatus: "none",
    statusTextAr: "الخصم دائم ومفعّل 🟢",
    statusTextEn: "Active Discount 🟢",
    startDate: product?.discountStartDate,
    endDate: product?.discountEndDate,
    savingsAmount,
  };
}
