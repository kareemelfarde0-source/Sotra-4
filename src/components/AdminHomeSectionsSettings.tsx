import React, { useState } from "react";
import {
  LayoutTemplate,
  Eye,
  EyeOff,
  Sliders,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  Sparkles,
  Save,
  Check,
  Zap,
  Tag,
  ShoppingBag,
  Flame,
  Shirt,
  Grid,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { HomeSectionsConfig, PromoBannerStyleConfig, BannerSlide } from "../types";
import { DEFAULT_HOME_SECTIONS_CONFIG } from "../firebase";
import { sanitizeImageUrl, SOTRA_BANNER_PLACEHOLDER } from "../utils/storage";

interface AdminHomeSectionsSettingsProps {
  config?: HomeSectionsConfig;
  banners?: BannerSlide[];
  onSave: (newConfig: HomeSectionsConfig) => void;
  onNavigateTab?: (tabId: string) => void;
  lang?: "ar" | "en";
}

export const AdminHomeSectionsSettings: React.FC<AdminHomeSectionsSettingsProps> = ({
  config = DEFAULT_HOME_SECTIONS_CONFIG,
  banners = [],
  onSave,
  onNavigateTab,
  lang = "ar",
}) => {
  const [form, setForm] = useState<HomeSectionsConfig>(() => ({
    showAnnouncementBar: config.showAnnouncementBar ?? true,
    showPromoBanner: config.showPromoBanner ?? true,
    showHeroCategoriesSlider: config.showHeroCategoriesSlider ?? true,
    showFlashSale: config.showFlashSale ?? true,
    showOutfits: config.showOutfits ?? true,
    showOfferCategories: config.showOfferCategories ?? true,
    showCategoryPills: config.showCategoryPills ?? true,
    showFilterBar: config.showFilterBar ?? true,
    showProductsGrid: config.showProductsGrid ?? true,
    showFooter: config.showFooter ?? true,
    promoBannerStyle: {
      heightMobile: config.promoBannerStyle?.heightMobile ?? 260,
      heightDesktop: config.promoBannerStyle?.heightDesktop ?? 480,
      customHeightText: config.promoBannerStyle?.customHeightText || "480",
      aspectRatio: config.promoBannerStyle?.aspectRatio || "custom",
      objectFit: config.promoBannerStyle?.objectFit || "cover",
      borderRadius: config.promoBannerStyle?.borderRadius ?? 16,
      fullWidth: config.promoBannerStyle?.fullWidth ?? false,
    },
  }));

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaved, setIsSaved] = useState(false);

  // Toggle specific section
  const handleToggleSection = (key: keyof Omit<HomeSectionsConfig, "promoBannerStyle">) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Update banner style fields
  const handleBannerStyleChange = (updates: Partial<PromoBannerStyleConfig>) => {
    setForm((prev) => ({
      ...prev,
      promoBannerStyle: {
        ...(prev.promoBannerStyle || {
          heightMobile: 260,
          heightDesktop: 480,
          customHeightText: "480",
          aspectRatio: "custom",
          objectFit: "cover",
          borderRadius: 16,
          fullWidth: false,
        }),
        ...updates,
      },
    }));
  };

  // Quick preset sizes
  const applyPreset = (desktopH: number, mobileH: number, label: string) => {
    handleBannerStyleChange({
      heightDesktop: desktopH,
      heightMobile: mobileH,
      customHeightText: `${desktopH}`,
      aspectRatio: "custom",
    });
  };

  // Enable / Disable all
  const setAllSections = (val: boolean) => {
    setForm((prev) => ({
      ...prev,
      showAnnouncementBar: val,
      showPromoBanner: val,
      showHeroCategoriesSlider: val,
      showFlashSale: val,
      showOutfits: val,
      showOfferCategories: val,
      showCategoryPills: val,
      showFilterBar: val,
      showProductsGrid: true, // Keep products grid active
      showFooter: val,
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Sections definitions list for display
  const sectionsList: Array<{
    key: keyof Omit<HomeSectionsConfig, "promoBannerStyle">;
    titleAr: string;
    titleEn: string;
    descAr: string;
    icon: React.ReactNode;
    badgeColor: string;
    linkedTab?: string;
    tabLabel?: string;
  }> = [
    {
      key: "showAnnouncementBar",
      titleAr: "شريط الإعلانات والتنبيهات العلوي",
      titleEn: "Top Announcement Bar",
      descAr: "الشريط المتحرك أعلى المتجر لعرض رسائل الشحن المجاني والتخفيضات وكود الخصم.",
      icon: <Megaphone className="w-5 h-5 text-amber-500" />,
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "showPromoBanner",
      titleAr: "البنر الإعلاني الرئيسي المتحرك",
      titleEn: "Main Promo Banner Carousel",
      descAr: "سلايدر العروض الكبرى في أعلى الصفحة الرئيسية مع إمكانية توجيه الزبون بنقرة واحدة.",
      icon: <Layers className="w-5 h-5 text-red-500" />,
      badgeColor: "bg-red-50 text-red-700 border-red-200",
      linkedTab: "banners",
      tabLabel: "تعديل شرائح البنر",
    },
    {
      key: "showHeroCategoriesSlider",
      titleAr: "دولاب / التمرير الجانبي للأقسام",
      titleEn: "Hero Categories Carousel / Slider",
      descAr: "شريط التمرير الدائري للأقسام وتصنيفات الملابس في الواجهة (الدولاب الأفقي).",
      icon: <LayoutTemplate className="w-5 h-5 text-blue-500" />,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      linkedTab: "categories",
      tabLabel: "إدارة الأقسام",
    },
    {
      key: "showFlashSale",
      titleAr: "عروض الفلاش سيل والخصومات السريعة",
      titleEn: "Flash Sale Countdown Section",
      descAr: "قسم العروض المؤقتة مع عداد تنازلي وشريط نسبة الكمية المباعة وأسعار مخفضة.",
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      linkedTab: "flashSale",
      tabLabel: "إعدادات الفلاش سيل",
    },
    {
      key: "showOutfits",
      titleAr: "قسم نسّق إطلالتك (الأطقم المتكاملة)",
      titleEn: "Outfits / Shop The Look",
      descAr: "كرت العرض الفاخر لتنسيق الأطقم مع الصور المصغرة المتحركة والخصم المجمع وتحويل لصفحة الطقم.",
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      linkedTab: "outfits",
      tabLabel: "إدارة الأطقم",
    },
    {
      key: "showOfferCategories",
      titleAr: "أقسام وتصنيفات العروض الحصرية",
      titleEn: "Offer Categories Showcase",
      descAr: "بطاقات العروض المميزة مع شارات الخصومات وأسعار التصفية.",
      icon: <Tag className="w-5 h-5 text-emerald-500" />,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      linkedTab: "offerCategories",
      tabLabel: "أقسام العروض",
    },
    {
      key: "showCategoryPills",
      titleAr: "شريط أزرار الأقسام السريعة",
      titleEn: "Quick Category Tabs / Pills",
      descAr: "أزرار التصفح السريع بين الأقسام (الكل، بليزرات، شيميزات، قمصان، أحذية...).",
      icon: <Shirt className="w-5 h-5 text-indigo-500" />,
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      key: "showFilterBar",
      titleAr: "شريط الفرز والترتيب ونمط العرض",
      titleEn: "Filter, Sort & Grid Layout Bar",
      descAr: "شريط الفلاتر، البحث السريع، خيارات الترتيب حسب السعر والخصم، وتبديل شبكة العرض.",
      icon: <Sliders className="w-5 h-5 text-cyan-500" />,
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
    {
      key: "showProductsGrid",
      titleAr: "شبكة عرض المنتجات الأساسية",
      titleEn: "Products Catalog Grid",
      descAr: "عرض كروت المنتجات والأسعار وإضافتها للسلة والمقاسات والألوان.",
      icon: <Grid className="w-5 h-5 text-neutral-800" />,
      badgeColor: "bg-neutral-100 text-neutral-800 border-neutral-300",
      linkedTab: "products",
      tabLabel: "إدارة المنتجات",
    },
    {
      key: "showFooter",
      titleAr: "شريط التذييل والضمانات وروابط المتجر",
      titleEn: "Footer, Guarantees & Social Links",
      descAr: "فوتر المتجر السفلي مع بطاقات الضمان (شحن سريع، استبدال، دفع آمن) وروابط السوشيال ميديا.",
      icon: <ShieldCheck className="w-5 h-5 text-slate-700" />,
      badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
      linkedTab: "footer",
      tabLabel: "تخصيص الفوتر",
    },
  ];

  // Calculated banner height preview
  const currentBannerStyle = form.promoBannerStyle || {
    heightDesktop: 480,
    heightMobile: 260,
    customHeightText: "480",
    objectFit: "cover",
    borderRadius: 16,
    fullWidth: false,
  };

  const previewBannerH =
    previewDevice === "desktop"
      ? currentBannerStyle.heightDesktop || 480
      : currentBannerStyle.heightMobile || 260;

  const sampleBannerImage =
    banners.length > 0 && banners[0].image
      ? sanitizeImageUrl(banners[0].image, SOTRA_BANNER_PLACEHOLDER)
      : SOTRA_BANNER_PLACEHOLDER;

  return (
    <div className="space-y-8 font-arabic pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-5 sm:p-6 rounded-3xl border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
              <LayoutTemplate className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-wide">
              تخصيص الشاشة الرئيسية والتحكم بالأقسام وحجم البنر
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              تحكم فوري مباشر
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            يمكنك إظهار أو إخفاء أي قسم من أقسام المتجر (الفلاش سيل، الأطقم، الدولاب، أقسام العروض، الفوتر...) بنقرة زر واحدة، والتحكم الدقيق بارتفاع وأبعاد صورة البنر الإعلاني بالكتابة المباشرة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 w-full md:w-auto ${
              isSaved
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم حفظ وتطبيق التغييرات!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق على المتجر</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PART 1: BANNER DIMENSIONS & WRITTEN SIZE CONTROLS */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                <Maximize2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-neutral-950">
                التحكم بحجم وارتفاع صورة البنر الإعلاني (كتابة وتخصيص)
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              اكتب الارتفاع المرغوب بالبكسل للكمبيوتر والهاتف مع معاينة فورية لكيفية ظهور وتناسق الصور.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500">معاينة الجهاز:</span>
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewDevice === "desktop"
                    ? "bg-white text-neutral-950 shadow-xs font-black"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>شاشة كبيرة (كمبيوتر)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  previewDevice === "mobile"
                    ? "bg-white text-neutral-950 shadow-xs font-black"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>هاتف محمول</span>
              </button>
            </div>
          </div>
        </div>

        {/* Height Text Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Desktop Height Manual Text Input */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
            <label className="block text-xs font-black text-neutral-800">
              🖥️ ارتفاع البنر على الكمبيوتر (Desktop Height)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="180"
                max="900"
                step="10"
                value={currentBannerStyle.heightDesktop || 480}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 480;
                  handleBannerStyleChange({
                    heightDesktop: val,
                    customHeightText: `${val}`,
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 focus:border-red-600 outline-none"
              />
              <span className="text-xs font-bold text-neutral-500 bg-neutral-200/70 px-2.5 py-2.5 rounded-xl">
                px
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal">
              الارتفاع الموصى به للشاشات الكبيرة: بين <strong>420px</strong> إلى <strong>540px</strong>
            </p>
          </div>

          {/* Mobile Height Manual Text Input */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
            <label className="block text-xs font-black text-neutral-800">
              📱 ارتفاع البنر على الهاتف (Mobile Height)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="140"
                max="600"
                step="10"
                value={currentBannerStyle.heightMobile || 260}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 260;
                  handleBannerStyleChange({
                    heightMobile: val,
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-black text-neutral-900 focus:border-red-600 outline-none"
              />
              <span className="text-xs font-bold text-neutral-500 bg-neutral-200/70 px-2.5 py-2.5 rounded-xl">
                px
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal">
              الارتفاع الموصى به للهواتف: بين <strong>220px</strong> إلى <strong>300px</strong>
            </p>
          </div>

          {/* Object Fit Control */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
            <label className="block text-xs font-black text-neutral-800">
              🖼️ طريقة ملاءمة الصورة (Object Fit)
            </label>
            <select
              value={currentBannerStyle.objectFit || "cover"}
              onChange={(e) =>
                handleBannerStyleChange({
                  objectFit: e.target.value as any,
                })
              }
              className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:border-red-600 outline-none cursor-pointer"
            >
              <option value="cover">قص وتغطية ذكية (Cover - الموصى به)</option>
              <option value="contain">احتواء كامل بدون قص (Contain)</option>
              <option value="fill">تمدد كامل لملء الإطار (Fill)</option>
            </select>
            <p className="text-[11px] text-neutral-500 leading-normal">
              {currentBannerStyle.objectFit === "contain"
                ? "يضمن إظهار كامل تفاصيل الصورة الإعلانية بدون اقتصاص أطرافها."
                : "يملأ المساحة بالكامل لمظهر عصري ومرتب كالمتاجر العالمية."}
            </p>
          </div>

          {/* Border Radius & Full Width */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
            <label className="block text-xs font-black text-neutral-800">
              🔘 استدارة الحواف ونمط العرض
            </label>
            <div className="flex items-center gap-2">
              <select
                value={currentBannerStyle.borderRadius ?? 16}
                onChange={(e) =>
                  handleBannerStyleChange({
                    borderRadius: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:border-red-600 outline-none cursor-pointer"
              >
                <option value={0}>حواف حادة مستقيمة (0px)</option>
                <option value={8}>استدارة خفيفة (8px)</option>
                <option value={16}>استدارة قياسية ناعمة (16px)</option>
                <option value={24}>استدارة بارزة فاخرة (24px)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(currentBannerStyle.fullWidth)}
                onChange={(e) =>
                  handleBannerStyleChange({
                    fullWidth: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-neutral-700">
                تمدد لكامل عرض الشاشة (Full Width)
              </span>
            </label>
          </div>
        </div>

        {/* Quick Height Presets Bar */}
        <div className="flex items-center gap-2 flex-wrap bg-neutral-100/70 p-3 rounded-2xl border border-neutral-200">
          <span className="text-xs font-black text-neutral-700 flex items-center gap-1.5 px-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            أحجام سريعة جاهزة:
          </span>
          <button
            type="button"
            onClick={() => applyPreset(540, 300, "large")}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 cursor-pointer transition-colors shadow-2xs"
          >
            🌟 عريض وفاخر (540px / 300px)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(480, 260, "standard")}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 cursor-pointer transition-colors shadow-2xs"
          >
            📐 القياسي الموصى به (480px / 260px)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(380, 200, "compact")}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 cursor-pointer transition-colors shadow-2xs"
          >
            📱 مدمج وسريع (380px / 200px)
          </button>
          <button
            type="button"
            onClick={() => applyPreset(600, 340, "extra")}
            className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl border border-neutral-200 cursor-pointer transition-colors shadow-2xs"
          >
            🎬 سينمائي كبير (600px / 340px)
          </button>
        </div>

        {/* Real-time Interactive Live Preview Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-red-500" />
              معاينة حية لشكل البنر بالارتفاع المكتوب حالياً (
              <strong className="text-neutral-900">{previewBannerH}px</strong> على{" "}
              {previewDevice === "desktop" ? "الكمبيوتر" : "الهاتف"}):
            </span>
            {banners.length > 0 && onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("banners")}
                className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>إدارة وتغيير صور البنر</span>
                <ArrowRight className="w-3 h-3 rotate-180" />
              </button>
            )}
          </div>

          <div
            className={`mx-auto transition-all duration-300 overflow-hidden bg-neutral-950 p-2 sm:p-3 rounded-2xl border border-neutral-800 ${
              previewDevice === "mobile" ? "max-w-sm" : "w-full"
            }`}
          >
            <div
              style={{
                height: `${previewBannerH}px`,
                borderRadius: `${currentBannerStyle.borderRadius ?? 16}px`,
              }}
              className="relative w-full overflow-hidden bg-neutral-900 border border-neutral-700 flex items-center justify-center transition-all duration-300"
            >
              <img
                src={sampleBannerImage}
                alt="Banner Preview"
                className={`w-full h-full ${
                  currentBannerStyle.objectFit === "contain"
                    ? "object-contain"
                    : currentBannerStyle.objectFit === "fill"
                    ? "object-fill"
                    : "object-cover"
                }`}
              />

              <div className="absolute top-3 start-3 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                📏 ارتفاع المعاينة: {previewBannerH}px | {currentBannerStyle.objectFit || "cover"}
              </div>

              {banners.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-4 text-center">
                  <p className="text-xs font-bold">نموذج صورة افتراضية للبنر</p>
                  <p className="text-[11px] text-neutral-300">
                    يمكنك إضافة صور البنرات الخاصة بك من تبويب البنر الإعلاني
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PART 2: HOME SCREEN SECTIONS SHOW / HIDE CONTROLS */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-neutral-950">
                التحكم في إظهار وإخفاء أقسام الشاشة الرئيسية
              </h3>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              تحكم بظهور الأقسام في واجهة المتجر الرئيسية بنقرة واحدة (تفعيل/إلغاء التفعيل فوراً).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllSections(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              إظهار وتفعيل الكل
            </button>
            <button
              type="button"
              onClick={() => setAllSections(false)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              إخفاء الكل (وضع بسيط)
            </button>
          </div>
        </div>

        {/* Sections Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionsList.map((sec) => {
            const isVisible = Boolean(form[sec.key]);

            return (
              <div
                key={sec.key}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                  isVisible
                    ? "bg-white border-neutral-300 shadow-xs hover:border-neutral-400"
                    : "bg-neutral-50/80 border-neutral-200 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-neutral-100 border border-neutral-200 shrink-0">
                      {sec.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-neutral-950">
                          {sec.titleAr}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            isVisible
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-neutral-200/80 text-neutral-600 border-neutral-300"
                          }`}
                        >
                          {isVisible ? "🟢 معروض بالمتجر" : "⚪ مخفي حالياً"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {sec.descAr}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(sec.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isVisible ? "bg-emerald-600" : "bg-neutral-300"
                    }`}
                    role="switch"
                    aria-checked={isVisible}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isVisible ? "-translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {sec.titleEn}
                  </span>

                  {sec.linkedTab && onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab(sec.linkedTab!)}
                      className="text-neutral-700 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{sec.tabLabel || "إدارة المحتوى"}</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Save Action Bar */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              يتم حفظ التغييرات فورياً وتطبيقها على جميع زوار المتجر مع المزامنة السحابية.
            </span>
          </p>

          <button
            type="button"
            onClick={handleSave}
            className={`px-6 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 w-full sm:w-auto ${
              isSaved
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : "bg-neutral-950 hover:bg-neutral-800 text-white"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>تم الحفظ والتطبيق بنجاح!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التخصيص والمظهر</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
