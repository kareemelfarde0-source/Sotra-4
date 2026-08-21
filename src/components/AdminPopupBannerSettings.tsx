import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Check,
  Eye,
  Layers,
  ShoppingBag,
  Tag,
  ExternalLink,
  Save,
  RotateCcw,
  Sliders,
  Search,
  CheckSquare,
  Square,
  Package,
  X,
} from "lucide-react";
import { PopupBannerConfig, Category, OfferCategory, Product, DiscountBadgeStyle } from "../types";
import { SOTRA_BANNER_PLACEHOLDER, sanitizeImageUrl } from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { PromotionalPopupModal } from "./PromotionalPopupModal";

interface AdminPopupBannerSettingsProps {
  config?: PopupBannerConfig;
  popupConfig?: PopupBannerConfig;
  discountBadgeStyle?: DiscountBadgeStyle;
  categories: Category[];
  offerCategories: OfferCategory[];
  products: Product[];
  onSaveConfig?: (newConfig: PopupBannerConfig) => void;
  onSavePopupConfig?: (newConfig: PopupBannerConfig) => void;
  onSaveDiscountStyle?: (style: DiscountBadgeStyle) => void;
  onSaveDiscountBadgeStyle?: (style: DiscountBadgeStyle) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const DEFAULT_POPUP_CONFIG: PopupBannerConfig = {
  isEnabled: true,
  imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
  aspectRatio: "18:9",
  titleAr: "عروض الموسم الحصرية 🔥",
  titleEn: "Exclusive Season Offers 🔥",
  subtitleAr: "اكتشف أحدث تشكيلات الملابس والأزياء الفاخرة بخصومات خاصة",
  subtitleEn: "Discover latest luxury drops with exclusive discounts",
  actionType: "category",
  targetId: "",
  targetProductIds: [],
  groupTitleAr: "تشكيلة العرض الخاص",
  groupTitleEn: "Special Offer Collection",
  buttonTextAr: "تسوق العرض الآن",
  buttonTextEn: "Shop Deals Now",
  showFrequency: "once_per_session",
  delaySeconds: 1,
};

export const AdminPopupBannerSettings: React.FC<AdminPopupBannerSettingsProps> = ({
  config,
  popupConfig,
  discountBadgeStyle = "vertical_left",
  categories = [],
  offerCategories = [],
  products = [],
  onSaveConfig,
  onSavePopupConfig,
  onSaveDiscountStyle,
  onSaveDiscountBadgeStyle,
  showToast,
  lang,
}) => {
  const effectiveConfig = popupConfig || config;
  const effectiveSavePopup = onSavePopupConfig || onSaveConfig;
  const effectiveSaveBadgeStyle = onSaveDiscountBadgeStyle || onSaveDiscountStyle;

  const [localConfig, setLocalConfig] = useState<PopupBannerConfig>(() => ({
    ...DEFAULT_POPUP_CONFIG,
    ...(effectiveConfig || {}),
    aspectRatio: effectiveConfig?.aspectRatio || "18:9",
    targetProductIds: effectiveConfig?.targetProductIds || [],
  }));

  // Sync state if remote/props update from Firestore
  useEffect(() => {
    if (effectiveConfig) {
      setLocalConfig((prev) => ({
        ...DEFAULT_POPUP_CONFIG,
        ...prev,
        ...effectiveConfig,
        aspectRatio: effectiveConfig.aspectRatio || prev.aspectRatio || "18:9",
      }));
    }
  }, [effectiveConfig]);

  const [selectedBadgeStyle, setSelectedBadgeStyle] = useState<DiscountBadgeStyle>(
    discountBadgeStyle || "vertical_left"
  );

  useEffect(() => {
    if (discountBadgeStyle) {
      setSelectedBadgeStyle(discountBadgeStyle);
    }
  }, [discountBadgeStyle]);

  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const handleSavePopup = () => {
    if (effectiveSavePopup) {
      effectiveSavePopup(localConfig);
    }
    showToast("✅ تم حفظ إعدادات ومقاسات النافذة الإعلانية المنبثقة بنجاح!");
  };

  const handleSaveBadgeStyle = (style: DiscountBadgeStyle) => {
    setSelectedBadgeStyle(style);
    if (effectiveSaveBadgeStyle) {
      effectiveSaveBadgeStyle(style);
    }
    showToast("✅ تم تحديث شكل وموضع شريط الخصم لجميع منتجات المتجر!");
  };

  const toggleProductSelection = (productId: string) => {
    const current = localConfig.targetProductIds || [];
    const exists = current.includes(productId);
    const updated = exists ? current.filter((id) => id !== productId) : [...current, productId];
    setLocalConfig({ ...localConfig, targetProductIds: updated });
  };

  const selectAllProducts = () => {
    setLocalConfig({ ...localConfig, targetProductIds: products.map((p) => p.id) });
  };

  const deselectAllProducts = () => {
    setLocalConfig({ ...localConfig, targetProductIds: [] });
  };

  const filteredProductsForSelect = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        (p.titleAr && p.titleAr.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, productSearchQuery]);

  const imagePreview = sanitizeImageUrl(localConfig.imageUrl, SOTRA_BANNER_PLACEHOLDER);

  return (
    <div className="space-y-8 font-sans text-start pb-10">
      {/* SECTION 1: POPUP BANNER SETTINGS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-950 font-brand">
                {lang === "ar" ? "النافذة الإعلانية المنبثقة عند فتح الموقع (Popup Banner)" : "Promotional Popup Banner"}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                {lang === "ar"
                  ? "صورة إعلانية تظهر للزوار فور دخول الموقع مع إمكانية الربط بقسم، منتج، أو مجموعة منتجات محددة"
                  : "Welcome modal popup shown on store entry linking to category, offer, single product, or curated products group"}
              </p>
            </div>
          </div>

          {/* Toggle Enable & Test Button */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-300"
              title="تجربة فتح النافذة المنبثقة الآن"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "تجربة النافذة الحية" : "Test Live Popup"}</span>
            </button>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.isEnabled}
                onChange={(e) => setLocalConfig({ ...localConfig, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-950"></div>
              <span className="ms-2 text-xs font-black text-neutral-900 font-brand">
                {localConfig.isEnabled ? (lang === "ar" ? "مفعل ومتاح للزوار" : "Active") : (lang === "ar" ? "معطل حالياً" : "Disabled")}
              </span>
            </label>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Configuration Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Banner Image URL & Aspect Ratio Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "رابط صورة الإعلان المنبثق *" : "Popup Banner Image URL *"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localConfig.imageUrl || ""}
                    onChange={(e) => setLocalConfig({ ...localConfig, imageUrl: e.target.value })}
                    placeholder="https://... أو أدخل رابط الصورة"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-mono"
                  />
                </div>
              </div>

              {/* Aspect Ratio Selector (18:9, 4:3, etc.) */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                <label className="block text-xs font-black text-neutral-900 mb-2 font-brand">
                  {lang === "ar" ? "📐 مقاس وأبعاد صورة النافذة المنبثقة:" : "📐 Popup Image Aspect Ratio:"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "18:9", labelAr: "18:9 عريض حديث", labelEn: "18:9 Panoramic" },
                    { id: "4:3", labelAr: "4:3 قياسي متناسق", labelEn: "4:3 Standard" },
                    { id: "16:9", labelAr: "16:9 شاشة عريضة", labelEn: "16:9 Widescreen" },
                    { id: "1:1", labelAr: "1:1 مربع متساوي", labelEn: "1:1 Square" },
                    { id: "3:4", labelAr: "3:4 طولي أنيق", labelEn: "3:4 Portrait" },
                    { id: "9:16", labelAr: "9:16 ستوري طولي", labelEn: "9:16 Reel/Story" },
                    { id: "auto", labelAr: "تلقائي حسب أبعاد الصورة", labelEn: "Auto / Natural" },
                  ].map((ratioOpt) => {
                    const isSelected = (localConfig.aspectRatio || "18:9") === ratioOpt.id;
                    return (
                      <button
                        key={ratioOpt.id}
                        type="button"
                        onClick={() => setLocalConfig({ ...localConfig, aspectRatio: ratioOpt.id as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-start flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                            : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                        }`}
                      >
                        <span className="truncate">{lang === "ar" ? ratioOpt.labelAr : ratioOpt.labelEn}</span>
                        {isSelected && <span className="text-[10px] text-amber-400 font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-neutral-500 font-medium">
                  {lang === "ar"
                    ? "💡 يمكنك التبديل بين مقاس 18:9 أو 4:3 وغيرهما بكل سهولة ليظهر الإعلان بالشكل المثالي للعملاء."
                    : "💡 Toggle between 18:9, 4:3, or other ratios to perfectly fit your promotional creatives."}
                </p>
              </div>
            </div>

            {/* Title (Ar & En) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "عنوان الإعلان (بالعربي)" : "Title (Arabic)"}
                </label>
                <input
                  type="text"
                  value={localConfig.titleAr || ""}
                  onChange={(e) => setLocalConfig({ ...localConfig, titleAr: e.target.value })}
                  placeholder="مثال: عروض الموسم الحصرية 🔥"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "عنوان الإعلان (English)" : "Title (English)"}
                </label>
                <input
                  type="text"
                  value={localConfig.titleEn || ""}
                  onChange={(e) => setLocalConfig({ ...localConfig, titleEn: e.target.value })}
                  placeholder="e.g. Exclusive Season Offers 🔥"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                />
              </div>
            </div>

            {/* Subtitle / Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "النص التوضيحي (بالعربي)" : "Subtitle (Arabic)"}
                </label>
                <textarea
                  rows={2}
                  value={localConfig.subtitleAr || ""}
                  onChange={(e) => setLocalConfig({ ...localConfig, subtitleAr: e.target.value })}
                  placeholder="تفاصيل العرض ونسبة الخصم..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "النص التوضيحي (English)" : "Subtitle (English)"}
                </label>
                <textarea
                  rows={2}
                  value={localConfig.subtitleEn || ""}
                  onChange={(e) => setLocalConfig({ ...localConfig, subtitleEn: e.target.value })}
                  placeholder="Offer details and discount rate..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                />
              </div>
            </div>

            {/* Action Redirection Type & Target */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wide font-brand">
                  {lang === "ar" ? "🎯 وجهة التحويل والربط عند النقر على الإعلان" : "🎯 Click Action & Target Destination"}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    {lang === "ar" ? "نوع الربط / التحويل" : "Action Type"}
                  </label>
                  <select
                    value={localConfig.actionType || "none"}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        actionType: e.target.value as any,
                        targetId: "",
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white cursor-pointer font-bold"
                  >
                    <option value="none">{lang === "ar" ? "بدون تحويل (عرض فقط)" : "Display Only (No Redirection)"}</option>
                    <option value="category">{lang === "ar" ? "📁 تحويل إلى قسم رئيسي" : "Link to Main Category"}</option>
                    <option value="offer_category">{lang === "ar" ? "🏷️ تحويل إلى قسم عروض" : "Link to Offer Category"}</option>
                    <option value="product">{lang === "ar" ? "👕 تحويل إلى منتج محدد" : "Link to Specific Product"}</option>
                    <option value="products_group">{lang === "ar" ? "✨ تحويل إلى مجموعة منتجات محددة (تشكيلة عروض)" : "Link to Curated Products Group"}</option>
                    <option value="custom_url">{lang === "ar" ? "🔗 رابط مخصص أو خارجي" : "Custom URL"}</option>
                  </select>
                </div>

                {/* Target Selector for Category */}
                {localConfig.actionType === "category" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "اختر القسم المستهدف" : "Select Category"}
                    </label>
                    <select
                      value={localConfig.targetId || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, targetId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white cursor-pointer font-medium"
                    >
                      <option value="">{lang === "ar" ? "-- اختر قسماً --" : "-- Select a Category --"}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Selector for Offer Category */}
                {localConfig.actionType === "offer_category" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "اختر قسم العروض" : "Select Offer Category"}
                    </label>
                    <select
                      value={localConfig.targetId || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, targetId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white cursor-pointer font-medium"
                    >
                      <option value="">{lang === "ar" ? "-- اختر قسم عروض --" : "-- Select an Offer Category --"}</option>
                      {offerCategories.map((oc) => (
                        <option key={oc.id} value={oc.id}>
                          🏷️ {oc.nameAr || oc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Selector for Single Product */}
                {localConfig.actionType === "product" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "اختر المنتج المراد عرضه" : "Select Product"}
                    </label>
                    <select
                      value={localConfig.targetId || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, targetId: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white cursor-pointer font-medium"
                    >
                      <option value="">{lang === "ar" ? "-- اختر منتجاً --" : "-- Select a Product --"}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titleAr || p.title} ({p.price} ج.م)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Target Selector for Custom URL */}
                {localConfig.actionType === "custom_url" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "الرابط المخصص" : "Custom URL"}
                    </label>
                    <input
                      type="url"
                      value={localConfig.customUrl || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, customUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* SPECIAL SECTION: MULTI-PRODUCT SELECTION FOR "products_group" */}
              {localConfig.actionType === "products_group" && (
                <div className="p-4 bg-white rounded-xl border border-neutral-300 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black text-neutral-950 font-brand flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-500" />
                        <span>{lang === "ar" ? "تحديد المنتجات المضمنة في مجموعة العرض" : "Select Group Products"}</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        {lang === "ar"
                          ? `تم تحديد (${localConfig.targetProductIds?.length || 0}) منتجات من إجمالي ${products.length}`
                          : `Selected (${localConfig.targetProductIds?.length || 0}) of ${products.length} products`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllProducts}
                        className="px-2.5 py-1 text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer transition-colors"
                      >
                        {lang === "ar" ? "تحديد الكل" : "Select All"}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllProducts}
                        className="px-2.5 py-1 text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-red-600 rounded-lg cursor-pointer transition-colors"
                      >
                        {lang === "ar" ? "إلغاء التحديد" : "Clear All"}
                      </button>
                    </div>
                  </div>

                  {/* Group Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        {lang === "ar" ? "اسم التشكيلة / المجموعة (بالعربي)" : "Group Title (Arabic)"}
                      </label>
                      <input
                        type="text"
                        value={localConfig.groupTitleAr || ""}
                        onChange={(e) => setLocalConfig({ ...localConfig, groupTitleAr: e.target.value })}
                        placeholder="مثال: تشكيلة العرض الخاص"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-neutral-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        {lang === "ar" ? "اسم التشكيلة / المجموعة (English)" : "Group Title (English)"}
                      </label>
                      <input
                        type="text"
                        value={localConfig.groupTitleEn || ""}
                        onChange={(e) => setLocalConfig({ ...localConfig, groupTitleEn: e.target.value })}
                        placeholder="e.g. Special Offer Collection"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                      />
                    </div>
                  </div>

                  {/* Product Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder={lang === "ar" ? "ابحث عن منتج بالاسم لإضافته للمجموعة..." : "Search products to add..."}
                      className="w-full ps-8 pe-3 py-1.5 text-xs rounded-lg border border-neutral-300 outline-none focus:border-neutral-950"
                    />
                  </div>

                  {/* Scrollable Visual Product Selector Grid */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 border border-neutral-200 rounded-xl bg-neutral-50/50">
                    {filteredProductsForSelect.length === 0 ? (
                      <p className="text-center text-xs text-neutral-400 py-4">
                        {lang === "ar" ? "لا توجد منتجات مطابقة للبحث" : "No products found"}
                      </p>
                    ) : (
                      filteredProductsForSelect.map((p) => {
                        const isSelected = (localConfig.targetProductIds || []).includes(p.id);
                        const thumb = p.colors?.[0]?.images?.[0] || p.colors?.[0]?.image || SOTRA_BANNER_PLACEHOLDER;

                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={sanitizeImageUrl(thumb, SOTRA_BANNER_PLACEHOLDER)}
                                alt={p.titleAr || p.title}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-lg object-cover bg-neutral-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-black truncate font-brand">
                                  {p.titleAr || p.title}
                                </p>
                                <p className={`text-[10px] ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                                  {p.price} ج.م • {p.category}
                                </p>
                              </div>
                            </div>

                            <div className="flex-shrink-0 ms-2">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md border-2 border-neutral-300 flex items-center justify-center" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Button Text */}
              {localConfig.actionType && localConfig.actionType !== "none" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "نص الزر (بالعربي)" : "Button Text (Arabic)"}
                    </label>
                    <input
                      type="text"
                      value={localConfig.buttonTextAr || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, buttonTextAr: e.target.value })}
                      placeholder="تسوق العرض الآن"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {lang === "ar" ? "نص الزر (English)" : "Button Text (English)"}
                    </label>
                    <input
                      type="text"
                      value={localConfig.buttonTextEn || ""}
                      onChange={(e) => setLocalConfig({ ...localConfig, buttonTextEn: e.target.value })}
                      placeholder="Shop Deal Now"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Display Frequency & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "تكرار ظهور الإعلان للزائر" : "Display Frequency"}
                </label>
                <select
                  value={localConfig.showFrequency || "once_per_session"}
                  onChange={(e) => setLocalConfig({ ...localConfig, showFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white cursor-pointer font-bold"
                >
                  <option value="once_per_session">
                    {lang === "ar" ? "مرة واحدة لكل جلسة تصفح (موصى به)" : "Once per Session (Recommended)"}
                  </option>
                  <option value="always">{lang === "ar" ? "في كل مرة يفتح فيها الموقع" : "Always on every open"}</option>
                  <option value="once_per_day">{lang === "ar" ? "مرة واحدة يومياً (كل 24 ساعة)" : "Once per Day"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {lang === "ar" ? "الظهور بعد ثوانٍ من الفتح" : "Delay before popup (seconds)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={localConfig.delaySeconds ?? 1}
                  onChange={(e) => setLocalConfig({ ...localConfig, delaySeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-bold"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={handleSavePopup}
                className="px-6 py-3 rounded-xl bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99] font-brand"
              >
                <Save className="w-4 h-4" />
                <span>{lang === "ar" ? "حفظ إعدادات الإعلان المنبثق" : "Save Popup Settings"}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Modal Visual Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full">
              <span className="block text-xs font-bold text-neutral-500 mb-2">
                {lang === "ar" ? "👁️ معاينة مباشرة للنافذة المنبثقة بالمقاس المختار:" : "👁️ Live Popup Preview with Chosen Ratio:"}
              </span>
              <div className="bg-neutral-100 p-6 rounded-3xl border border-neutral-200 flex flex-col items-center justify-center min-h-[300px]">
                <div
                  className={`relative w-full ${
                    localConfig.aspectRatio === "18:9"
                      ? "max-w-sm aspect-[18/9]"
                      : localConfig.aspectRatio === "4:3"
                      ? "max-w-xs aspect-[4/3]"
                      : localConfig.aspectRatio === "16:9"
                      ? "max-w-sm aspect-[16/9]"
                      : localConfig.aspectRatio === "1:1"
                      ? "max-w-xs aspect-square"
                      : localConfig.aspectRatio === "3:4"
                      ? "max-w-[220px] aspect-[3/4]"
                      : localConfig.aspectRatio === "9:16"
                      ? "max-w-[180px] aspect-[9/16]"
                      : "max-w-xs h-auto"
                  } rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-neutral-300 group transition-all duration-300`}
                >
                  {/* Floating close button */}
                  <div className="absolute top-2 end-2 z-20 w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/30 text-xs shadow-md">
                    <X className="w-3.5 h-3.5" />
                  </div>

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={`w-full ${
                      localConfig.aspectRatio && localConfig.aspectRatio !== "auto"
                        ? "h-full object-cover"
                        : "h-auto max-h-[320px] object-cover"
                    } object-center`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = SOTRA_BANNER_PLACEHOLDER;
                    }}
                  />
                </div>

                {/* Ratio & Target Redirection Info Pill */}
                <div className="mt-3.5 flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[11px] font-black text-neutral-800 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full shadow-2xs font-mono">
                    المقاس المطبق: {localConfig.aspectRatio || "18:9"}
                  </span>
                  <div className="text-[11px] text-neutral-700 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-2xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {localConfig.actionType === "category" && (lang === "ar" ? "النقر على الصورة يفتح القسم: " : "Clicks open category: ") + (categories.find(c => c.id === localConfig.targetId)?.nameAr || "القسم")}
                      {localConfig.actionType === "offer_category" && (lang === "ar" ? "النقر على الصورة يفتح قسم العروض: " : "Clicks open offer: ") + (offerCategories.find(o => o.id === localConfig.targetId)?.nameAr || "العروض")}
                      {localConfig.actionType === "product" && (lang === "ar" ? "النقر على الصورة يفتح المنتج: " : "Clicks open product: ") + (products.find(p => p.id === localConfig.targetId)?.titleAr || "المنتج")}
                      {localConfig.actionType === "products_group" && (lang === "ar" ? `النقر يفتح تشكيلة خاصة (${localConfig.targetProductIds?.length || 0} منتجات)` : `Clicks open collection (${localConfig.targetProductIds?.length || 0} items)`)}
                      {localConfig.actionType === "custom_url" && (lang === "ar" ? "النقر يفتح الرابط الخارجي" : "Clicks open custom URL")}
                      {(!localConfig.actionType || localConfig.actionType === "none") && (lang === "ar" ? "عرض الصورة فقط (بدون تحويل عند النقر)" : "Pure Image Display (No Redirection)")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Modal Rendered for Admin Testing */}
      {isTestModalOpen && (
        <PromotionalPopupModal
          config={localConfig}
          isOpen={true}
          onClose={() => setIsTestModalOpen(false)}
          categories={categories}
          offerCategories={offerCategories}
          products={products}
          onNavigateCategory={(catId) => {
            setIsTestModalOpen(false);
            showToast(`🚀 تم اختبار التحويل للقسم: ${catId}`);
          }}
          onNavigateOfferCategory={(offerCatId) => {
            setIsTestModalOpen(false);
            showToast(`🚀 تم اختبار التحويل لقسم العروض: ${offerCatId}`);
          }}
          onNavigateProduct={(prodId) => {
            setIsTestModalOpen(false);
            showToast(`🚀 تم اختبار التحويل للمنتج: ${prodId}`);
          }}
          onNavigateProductsGroup={(pIds, titleAr) => {
            setIsTestModalOpen(false);
            showToast(`🚀 تم اختبار التحويل لمجموعة المنتجات: ${titleAr} (${pIds.length} منتج)`);
          }}
          lang={lang}
        />
      )}

      {/* SECTION 2: DISCOUNT RIBBON STYLE OPTIONS */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 shadow-xs p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-sm">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-950 font-brand">
              {lang === "ar" ? "خيارات ومواضع شريط الخصم لمنتجات المتجر ودولاب العروض" : "Discount Ribbon & Badge Styles"}
            </h2>
            <p className="text-xs text-neutral-500 font-medium">
              {lang === "ar"
                ? "حدد شكل وموضع شريط نسبة الخصم المفضل لك ليظهر تلقائياً على بطاقات المنتجات ودولاب العروض"
                : "Choose how discount percentages and ribbons appear across product cards and offer carousels"}
            </p>
          </div>
        </div>

        {/* Interactive Visual Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* OPTION 1: VERTICAL RIBBON ON RIGHT */}
          <div
            onClick={() => handleSaveBadgeStyle("vertical_right")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "vertical_right"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📌 شريط رأسي (جهة اليمين)" : "Vertical Right Ribbon"}
                </span>
                {selectedBadgeStyle === "vertical_right" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط أحمر نازل رأسياً جهة اليمين بتأثير الشعلة النارية على الصورة"
                  : "Hanging vertical bookmark ribbon on the right edge of product image"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="vertical_right" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 2: VERTICAL RIBBON ON LEFT */}
          <div
            onClick={() => handleSaveBadgeStyle("vertical_left")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "vertical_left"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📌 شريط رأسي (جهة اليسار)" : "Vertical Left Ribbon"}
                </span>
                {selectedBadgeStyle === "vertical_left" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط أحمر نازل رأسياً جهة اليسار بتأثير الشعلة النارية على الصورة"
                  : "Hanging vertical bookmark ribbon on the left edge of product image"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="vertical_left" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 3: DIAGONAL CORNER RIGHT */}
          <div
            onClick={() => handleSaveBadgeStyle("diagonal_corner_right")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "diagonal_corner_right" || selectedBadgeStyle === "diagonal_corner"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📐 شريط مائل بالزاوية اليمنى" : "Diagonal Right Ribbon"}
                </span>
                {(selectedBadgeStyle === "diagonal_corner_right" || selectedBadgeStyle === "diagonal_corner") && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط كلاسيكي مائل بالزاوية العلوية اليمنى للكارت"
                  : "Classic diagonal corner sash ribbon in the upper right corner"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="diagonal_corner_right" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 4: DIAGONAL CORNER LEFT */}
          <div
            onClick={() => handleSaveBadgeStyle("diagonal_corner_left")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "diagonal_corner_left"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📐 شريط مائل بالزاوية اليسرى" : "Diagonal Left Ribbon"}
                </span>
                {selectedBadgeStyle === "diagonal_corner_left" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط كلاسيكي مائل بالزاوية العلوية اليسرى للكارت"
                  : "Classic diagonal corner sash ribbon in the upper left corner"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="diagonal_corner_left" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 5: HORIZONTAL RIBBON BAR */}
          <div
            onClick={() => handleSaveBadgeStyle("horizontal_bar")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "horizontal_bar"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📌 شريط أفقي عريض" : "Horizontal Ribbon Bar"}
                </span>
                {selectedBadgeStyle === "horizontal_bar" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط عريض يمتد بعرض الصورة يبرز قيمة التوفير والخصم بوضوح تام"
                  : "Full horizontal sash ribbon across the bottom edge of image"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="horizontal_bar" lang={lang} />
              <div className="absolute top-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 6: ABOVE PRODUCT TITLE */}
          <div
            onClick={() => handleSaveBadgeStyle("above_title")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "above_title"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "📌 شريط أعلى اسم المنتج" : "Above Product Title"}
                </span>
                {selectedBadgeStyle === "above_title" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شارة بارزة مباشرة أعلى عنوان المنتج مع إظهار السعر قبل الخصم بوضوح"
                  : "Prominent discount highlight badge placed directly above product title"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-100 rounded-xl p-3 flex flex-col justify-end border border-neutral-300">
              <DiscountBadge discountPercent={35} originalPrice={800} price={520} style="above_title" lang={lang} />
              <div className="text-xs font-black text-neutral-950">تيشرت أوفر سايز</div>
              <div className="text-xs font-bold text-neutral-900">520 ج.م</div>
            </div>
          </div>

          {/* OPTION 7: PILL CORNER RIGHT */}
          <div
            onClick={() => handleSaveBadgeStyle("pill_corner_right")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "pill_corner_right"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "💊 كبسولة أعلى اليمين" : "Pill Corner Right"}
                </span>
                {selectedBadgeStyle === "pill_corner_right" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "كبسولة دائرية عصرية مع نسبة الخصم بالزاوية العلوية اليمنى"
                  : "Modern round badge pill in top right corner"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="pill_corner_right" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>

          {/* OPTION 8: BANNER RIBBON */}
          <div
            onClick={() => handleSaveBadgeStyle("banner_ribbon")}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              selectedBadgeStyle === "banner_ribbon"
                ? "border-neutral-950 bg-neutral-50 shadow-md ring-2 ring-neutral-950/10"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-neutral-950 font-brand">
                  {lang === "ar" ? "🚩 شريط عريض أعلى الصورة" : "Top Banner Ribbon"}
                </span>
                {selectedBadgeStyle === "banner_ribbon" && (
                  <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500">
                {lang === "ar"
                  ? "شريط ترويجي أحمر عريض يمتد بعرض الصورة العلوي بالكامل"
                  : "Full-width promotional header banner across image top"}
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] bg-neutral-200 rounded-xl overflow-hidden border border-neutral-300">
              <DiscountBadge discountPercent={35} style="banner_ribbon" lang={lang} />
              <div className="absolute bottom-2 start-2 end-2 bg-white/90 backdrop-blur-xs p-1.5 rounded-lg text-[10px] font-bold">
                تيشرت أوفر سايز
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
