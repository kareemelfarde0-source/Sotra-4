import React, { useState } from "react";
import { Truck, ShieldCheck, RefreshCw, MessageSquare, Plus, Trash2, Save, RotateCcw, CheckCircle2, Phone, MapPin, Sparkles } from "lucide-react";
import { FooterConfig, GuaranteeItem, PaymentMethodItem } from "../types";
import { DEFAULT_FOOTER_CONFIG } from "../utils/storage";

interface AdminFooterSettingsProps {
  footerConfig?: FooterConfig;
  onSave: (config: FooterConfig) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminFooterSettings: React.FC<AdminFooterSettingsProps> = ({
  footerConfig,
  onSave,
  showToast,
  lang,
}) => {
  const [config, setConfig] = useState<FooterConfig>(() => ({
    ...DEFAULT_FOOTER_CONFIG,
    ...(footerConfig || {}),
  }));

  // Sync state if remote/props update from Firestore
  React.useEffect(() => {
    if (footerConfig) {
      setConfig((prev) => ({
        ...DEFAULT_FOOTER_CONFIG,
        ...prev,
        ...footerConfig,
      }));
    }
  }, [footerConfig]);

  const handleReset = () => {
    if (confirm("هل تريد استعادة الإعدادات الافتراضية للفوتر؟")) {
      setConfig({ ...DEFAULT_FOOTER_CONFIG });
      onSave({ ...DEFAULT_FOOTER_CONFIG });
      showToast("تمت استعادة الإعدادات الافتراضية للفوتر بنجاح");
    }
  };

  const handleSave = () => {
    onSave(config);
    showToast("تم حفظ إعدادات الفوتر بنجاح في قاعدة البيانات");
  };

  // Guarantee items helpers
  const handleAddGuarantee = () => {
    const newItem: GuaranteeItem = {
      id: "g_" + Date.now(),
      icon: "truck",
      titleAr: "ميزة أو ضمان جديد",
      titleEn: "New Guarantee",
      descAr: "وصف توضيحي للميزة",
      descEn: "Feature explanation description",
    };
    setConfig({
      ...config,
      guarantees: [...config.guarantees, newItem],
    });
  };

  const handleUpdateGuarantee = (idx: number, patch: Partial<GuaranteeItem>) => {
    const updated = [...config.guarantees];
    updated[idx] = { ...updated[idx], ...patch };
    setConfig({ ...config, guarantees: updated });
  };

  const handleDeleteGuarantee = (idx: number) => {
    const updated = config.guarantees.filter((_, i) => i !== idx);
    setConfig({ ...config, guarantees: updated });
  };

  // Payment methods helpers
  const handleAddPaymentMethod = () => {
    const newItem: PaymentMethodItem = {
      id: "pm_" + Date.now(),
      nameAr: "طريقة دفع جديدة",
      nameEn: "New Payment Method",
      colorDot: "#3b82f6",
    };
    setConfig({
      ...config,
      paymentMethods: [...config.paymentMethods, newItem],
    });
  };

  const handleUpdatePaymentMethod = (idx: number, patch: Partial<PaymentMethodItem>) => {
    const updated = [...config.paymentMethods];
    updated[idx] = { ...updated[idx], ...patch };
    setConfig({ ...config, paymentMethods: updated });
  };

  const handleDeletePaymentMethod = (idx: number) => {
    const updated = config.paymentMethods.filter((_, i) => i !== idx);
    setConfig({ ...config, paymentMethods: updated });
  };

  return (
    <div className="space-y-6 text-start">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-900 flex items-center gap-2">
            <span>🦶 تخصيص وتعديل الفوتر والضمانات</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            تعديل معلومات المتجر، أرقام التواصل، العنوان، بنود الضمانات والشحن، وطرق الدفع والتأكيد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-neutral-950 hover:bg-red-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات الفوتر</span>
          </button>
        </div>
      </div>

      {/* Main Form Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Store Info & Contact */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-neutral-900 border-b pb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-red-500" />
            <span>بيانات التواصل والعنوان</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">رقم خدمة العملاء والواتساب</label>
              <input
                type="text"
                value={config.phoneNumber}
                onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
                placeholder="مثال: 0100000000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">عنوان المتجر والفرع (عربي)</label>
              <input
                type="text"
                value={config.storeAddressAr}
                onChange={(e) => setConfig({ ...config, storeAddressAr: e.target.value })}
                placeholder="مثال: مرسي مطروح بجوار فرع بين سبورت"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">عنوان المتجر والفرع (English)</label>
              <input
                type="text"
                value={config.storeAddressEn || ""}
                onChange={(e) => setConfig({ ...config, storeAddressEn: e.target.value })}
                placeholder="e.g. Marsa Matrouh, Next to beIN Sports"
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">نبذة عن المتجر (عربي)</label>
              <textarea
                rows={3}
                value={config.aboutTextAr}
                onChange={(e) => setConfig({ ...config, aboutTextAr: e.target.value })}
                placeholder="نبذة تعريفية بالمتجر والخامات الفاخرة..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">حقوق الملكية والنشر (Copyright Text)</label>
              <input
                type="text"
                value={config.copyrightAr}
                onChange={(e) => setConfig({ ...config, copyrightAr: e.target.value })}
                placeholder="© 2026 SOTRA FASHION MEN. All Rights Reserved."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Payment Methods */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>طرق الدفع والتأكيد</span>
            </h3>
            <button
              type="button"
              onClick={handleAddPaymentMethod}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة طريقة دفع</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {(config.paymentMethods || []).map((pm, idx) => (
              <div
                key={pm.id || idx}
                className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center gap-2.5"
              >
                <input
                  type="color"
                  value={pm.colorDot || "#ef4444"}
                  onChange={(e) => handleUpdatePaymentMethod(idx, { colorDot: e.target.value })}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer flex-shrink-0 bg-transparent"
                  title="لون النقطة المميزة"
                />

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={pm.nameAr}
                    onChange={(e) => handleUpdatePaymentMethod(idx, { nameAr: e.target.value })}
                    placeholder="الاسم بالعربي (مثال: فودافون كاش)"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none"
                  />
                  <input
                    type="text"
                    value={pm.nameEn || ""}
                    onChange={(e) => handleUpdatePaymentMethod(idx, { nameEn: e.target.value })}
                    placeholder="English Name (Optional)"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none font-brand"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePaymentMethod(idx)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Guarantees and Features Strip */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-sm font-black text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>شريط المميزات والضمانات بالأعلى</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              الشريط الذي يظهر بأعلى الفوتر (شحن سريع، معاينة واستبدال، خامات عالمية، دعم واتساب).
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddGuarantee}
            className="px-3 py-1.5 bg-neutral-950 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة بند ضمان</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(config.guarantees || []).map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-3 relative group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-neutral-700">الأيقونة:</label>
                  <select
                    value={item.icon}
                    onChange={(e) => handleUpdateGuarantee(idx, { icon: e.target.value as any })}
                    className="px-2 py-1 text-xs rounded-lg border border-neutral-300 bg-white cursor-pointer font-bold"
                  >
                    <option value="truck">🚚 شحن وتوصيل (Truck)</option>
                    <option value="refresh">🔄 استبدال ومعاينة (Refresh)</option>
                    <option value="shield">🛡️ جودة وخامات (Shield)</option>
                    <option value="message">💬 دعم وخدمة عملاء (Message)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteGuarantee(idx)}
                  className="p-1 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="حذف هذا البند"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">العنوان الرئيسي (عربي)</label>
                  <input
                    type="text"
                    value={item.titleAr}
                    onChange={(e) => handleUpdateGuarantee(idx, { titleAr: e.target.value })}
                    placeholder="مثال: شحن سريع لكافة المحافظات"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-0.5">الوصف التوضيحي (عربي)</label>
                  <input
                    type="text"
                    value={item.descAr}
                    onChange={(e) => handleUpdateGuarantee(idx, { descAr: e.target.value })}
                    placeholder="مثال: توصيل خلال 24 - 72 ساعة لباب بيتك"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-700"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save bar at bottom */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 bg-neutral-950 hover:bg-red-600 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ جميع إعدادات الفوتر السحابية</span>
        </button>
      </div>
    </div>
  );
};
