import React, { useState } from "react";
import { Flame, Clock, Plus, Trash2, Check, Zap, Save, AlertCircle, Sparkles } from "lucide-react";
import { FlashSaleConfig, FlashSaleItem, Product } from "../types";
import { DEFAULT_FLASH_SALE_CONFIG } from "../firebase";
import { SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";

interface AdminFlashSaleSettingsProps {
  config?: FlashSaleConfig;
  allProducts: Product[];
  onSave: (newConfig: FlashSaleConfig) => void;
  lang: "ar" | "en";
}

export function AdminFlashSaleSettings({
  config = DEFAULT_FLASH_SALE_CONFIG,
  allProducts,
  onSave,
  lang,
}: AdminFlashSaleSettingsProps) {
  const [form, setForm] = useState<FlashSaleConfig>(() => ({
    isEnabled: config.isEnabled ?? false,
    titleAr: config.titleAr || "عروض الفلاش سيل الحصرية 🔥",
    titleEn: config.titleEn || "Exclusive Flash Sale Deals",
    subtitleAr: config.subtitleAr || "تخفيضات استثنائية لفترة محدودة جداً - تنتهي بانتهاء الوقت",
    subtitleEn: config.subtitleEn || "Limited-time deals with extra urgency discounts",
    endDate: config.endDate || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    bannerImage: config.bannerImage || "",
    badgeTextAr: config.badgeTextAr || "فلاش ديل",
    themeColor: config.themeColor || "#dc2626",
    items: config.items ? [...config.items] : [],
  }));

  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);

  // Format date for datetime-local input
  const formatForInput = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      const offset = d.getTimezoneOffset() * 60000;
      const local = new Date(d.getTime() - offset);
      return local.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const handleDateChange = (val: string) => {
    if (!val) return;
    try {
      const d = new Date(val);
      setForm((prev) => ({ ...prev, endDate: d.toISOString() }));
    } catch (e) {
      console.warn("Invalid date", e);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductIdToAdd) return;
    const prod = allProducts.find((p) => p.id === selectedProductIdToAdd);
    if (!prod) return;

    if (form.items.some((i) => i.productId === prod.id)) {
      alert("هذا المنتج مضاف بالفعل في عروض الفلاش سيل!");
      return;
    }

    const defaultFlashPrice = Math.round(prod.price * 0.75); // 25% discount default
    const newItem: FlashSaleItem = {
      productId: prod.id,
      flashPrice: defaultFlashPrice,
      discountPercent: 25,
      soldPercentage: 70,
      customBadgeAr: "خصم فوري",
    };

    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedProductIdToAdd("");
  };

  const handleRemoveItem = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.productId !== productId),
    }));
  };

  const handleItemChange = (productId: string, updates: Partial<FlashSaleItem>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.productId === productId ? { ...i, ...updates } : i)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-start">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6 fill-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-neutral-900 font-brand">
              إدارة عروض الفلاش سيل المحدودة بالوقت (Flash Sale)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              تحكم في ظهور قسم الفلاش سيل، توقيت الانتهاء، والمنتجات والخصومات المطبقة عليه.
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200 hover:bg-neutral-100 transition-colors">
          <span className="text-xs font-black text-neutral-800">
            {form.isEnabled ? "🟢 الفلاش سيل مفعّل وظاهر بالمتجر" : "⚪ الفلاش سيل معطّل ومخفي"}
          </span>
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(e) => setForm((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            className="w-5 h-5 accent-red-600 rounded-md cursor-pointer"
          />
        </label>
      </div>

      {/* Basic Settings Card */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
        <h4 className="text-sm font-black text-neutral-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-red-600" />
          <span>توقيت ونصوص الفلاش سيل</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              عنوان الفلاش سيل (عربي):
            </label>
            <input
              type="text"
              value={form.titleAr}
              onChange={(e) => setForm((prev) => ({ ...prev, titleAr: e.target.value }))}
              placeholder="عروض الفلاش سيل الحصرية 🔥"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              العنوان بالإنجليزية (اختياري):
            </label>
            <input
              type="text"
              value={form.titleEn || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, titleEn: e.target.value }))}
              placeholder="Flash Sale Exclusive Deals"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              الوصف الفرعي (عربي):
            </label>
            <input
              type="text"
              value={form.subtitleAr || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitleAr: e.target.value }))}
              placeholder="تخفيضات استثنائية لفترة محدودة جداً - تنتهي بانتهاء الوقت"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-medium text-neutral-900 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              تاريخ ووقت انتهاء العرض (ينتهي ويختفي تلقائياً بعد هذا الوقت):
            </label>
            <input
              type="datetime-local"
              value={formatForInput(form.endDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              نص الشارة العلوية:
            </label>
            <input
              type="text"
              value={form.badgeTextAr || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, badgeTextAr: e.target.value }))}
              placeholder="فلاش ديل حصري"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-red-600"
            />
          </div>
        </div>
      </div>

      {/* Products Selection & Customization */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>المنتجات المشمولة في الفلاش سيل ({form.items.length})</span>
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              حدد المنتجات التي ترغب بظهورها في قسم الفلاش سيل وحدد سعر الخصم المخصص لكل منتج.
            </p>
          </div>

          {/* Add product dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedProductIdToAdd}
              onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
              className="flex-1 sm:w-64 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-neutral-900"
            >
              <option value="">-- اختر منتجاً لإضافته --</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titleAr} ({p.price} ج.م)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedProductIdToAdd}
              className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة للفلاش</span>
            </button>
          </div>
        </div>

        {/* Selected Products List */}
        {form.items.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
            <Flame className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-neutral-500">
              لم تقم بإضافة منتجات لعروض الفلاش سيل حتى الآن. اختر منتجاً من القائمة أعلاه لإضافته.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {form.items.map((item, idx) => {
              const product = allProducts.find((p) => p.id === item.productId);
              if (!product) return null;

              const firstColor = product.colors?.[0] || { image: "" };
              const originalPrice = product.originalPrice && product.originalPrice > product.price ? product.originalPrice : product.price;

              return (
                <div
                  key={item.productId}
                  className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-neutral-400 w-5">#{idx + 1}</span>
                    <div className="w-12 h-14 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300">
                      <img
                        src={firstColor.image || SOTRA_PRODUCT_PLACEHOLDER}
                        alt={product.titleAr}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-neutral-900">{product.titleAr}</h5>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                        <span>السعر الأصلي: <span className="font-mono font-bold">{originalPrice} ج.م</span></span>
                        <span>•</span>
                        <span>سعر المتجر العادي: <span className="font-mono font-bold">{product.price} ج.م</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Settings fields for this item */}
                  <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                        سعر الفلاش سيل (ج.م):
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.flashPrice || Math.round(product.price * 0.75)}
                        onChange={(e) =>
                          handleItemChange(item.productId, { flashPrice: Number(e.target.value) || product.price })
                        }
                        className="w-24 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-red-600 focus:outline-hidden focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                        نسبة المباع (شريط الإلحاح %):
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={98}
                        value={item.soldPercentage || 70}
                        onChange={(e) =>
                          handleItemChange(item.productId, { soldPercentage: Number(e.target.value) || 70 })
                        }
                        className="w-20 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1">
                        شارة مخصصة:
                      </label>
                      <input
                        type="text"
                        value={item.customBadgeAr || ""}
                        onChange={(e) => handleItemChange(item.productId, { customBadgeAr: e.target.value })}
                        placeholder="خصم فوري"
                        className="w-24 bg-white border border-neutral-300 rounded-lg px-2 py-1 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer self-end mb-0.5"
                      title="حذف من الفلاش سيل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          className={`px-8 py-3.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
            isSaved ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30"
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" />
              <span>تم حفظ إعدادات الفلاش سيل بنجاح في قاعدة البيانات!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ وتحديث إعدادات الفلاش سيل في قاعدة البيانات</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
