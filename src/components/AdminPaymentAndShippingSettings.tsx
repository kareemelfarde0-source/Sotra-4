import React, { useState } from "react";
import {
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  DollarSign,
  Search,
  ArrowRight,
  Info,
} from "lucide-react";
import { PaymentConfig, Governorate } from "../types";
import { DEFAULT_PAYMENT_CONFIG, EGYPTIAN_GOVERNORATES } from "../data/defaultData";
import { savePaymentConfigToFirestore, saveGovernoratesToFirestore } from "../firebase";

interface AdminPaymentAndShippingSettingsProps {
  paymentConfig?: PaymentConfig;
  governorates?: Governorate[];
  onSavePaymentConfig: (config: PaymentConfig) => void;
  onSaveGovernorates: (govs: Governorate[]) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminPaymentAndShippingSettings: React.FC<AdminPaymentAndShippingSettingsProps> = ({
  paymentConfig = DEFAULT_PAYMENT_CONFIG,
  governorates = EGYPTIAN_GOVERNORATES,
  onSavePaymentConfig,
  onSaveGovernorates,
  showToast,
  lang,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"payment" | "shipping">("payment");

  // Payment Form State
  const [config, setConfig] = useState<PaymentConfig>({
    vodafoneCashEnabled: paymentConfig.vodafoneCashEnabled ?? true,
    vodafoneCashNumber: paymentConfig.vodafoneCashNumber || "0100000000",
    vodafoneCashAccountName: paymentConfig.vodafoneCashAccountName || "Sotra Fashion",
    vodafoneCashInstructionsAr:
      paymentConfig.vodafoneCashInstructionsAr ||
      "يرجى تحويل رسوم الشحن فقط إلى رقم فودافون كاش أعلاه، ثم كتابة رقم المحفظة المحول منها لتأكيد الطلب وشحنه فوراً.",

    instaPayEnabled: paymentConfig.instaPayEnabled ?? true,
    instaPayId: paymentConfig.instaPayId || "sotra@instapay",
    instaPayAccountName: paymentConfig.instaPayAccountName || "Sotra Fashion",
    instaPayInstructionsAr:
      paymentConfig.instaPayInstructionsAr ||
      "يرجى تحويل رسوم الشحن فقط إلى عنوان إنستاباي أعلاه، ثم كتابة معرف الحساب أو رقم المرجع لتأكيد الطلب.",
    instaPayQrImage: paymentConfig.instaPayQrImage || "",

    advanceShippingFeeOnly: true,
  });

  // Shipping Rates State
  const [govList, setGovList] = useState<Governorate[]>(
    governorates && governorates.length > 0 ? governorates : EGYPTIAN_GOVERNORATES
  );
  const [govSearch, setGovSearch] = useState("");
  const [editingGov, setEditingGov] = useState<Governorate | null>(null);
  const [isGovModalOpen, setIsGovModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedConfig: PaymentConfig = {
        ...config,
        advanceShippingFeeOnly: true, // Always enforced as per business requirement
      };
      onSavePaymentConfig(updatedConfig);
      await savePaymentConfigToFirestore(updatedConfig);
      showToast("تم حفظ وتحديث بيانات الدفع (فودافون كاش وإنستاباي) في قاعدة البيانات بنجاح");
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء حفظ إعدادات الدفع");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGovList = async (newList: Governorate[]) => {
    setGovList(newList);
    onSaveGovernorates(newList);
    await saveGovernoratesToFirestore(newList);
    showToast("تم تحديث وحفظ أسعار شحن المحافظات في قاعدة البيانات");
  };

  const handleUpdateGovPrice = (id: string, newCost: number) => {
    const updated = govList.map((g) => (g.id === id ? { ...g, shippingCost: Math.max(0, newCost) } : g));
    handleSaveGovList(updated);
  };

  const handleSaveGovModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGov) return;

    let updated = [...govList];
    const idx = updated.findIndex((g) => g.id === editingGov.id);
    if (idx >= 0) {
      updated[idx] = editingGov;
    } else {
      updated.push(editingGov);
    }
    handleSaveGovList(updated);
    setIsGovModalOpen(false);
    setEditingGov(null);
  };

  const handleDeleteGov = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحافظة من قائمة الشحن؟")) return;
    const updated = govList.filter((g) => g.id !== id);
    handleSaveGovList(updated);
  };

  const handleResetGovsToDefault = () => {
    if (!confirm("هل تريد استعادة قائمة وأسعار المحافظات الافتراضية؟")) return;
    handleSaveGovList(EGYPTIAN_GOVERNORATES);
  };

  const filteredGovs = govList.filter(
    (g) =>
      g.nameAr.toLowerCase().includes(govSearch.toLowerCase()) ||
      g.nameEn.toLowerCase().includes(govSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 text-start">
      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        <button
          onClick={() => setActiveSubTab("payment")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === "payment"
              ? "bg-neutral-950 text-white shadow-md"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>إعدادات الدفع الإلكتروني (فودافون كاش & إنستاباي)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("shipping")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === "shipping"
              ? "bg-neutral-950 text-white shadow-md"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-500" />
          <span>أسعار شحن المحافظات ({govList.length} محافظة)</span>
        </button>
      </div>

      {/* 1. PAYMENT CONFIGURATION TAB */}
      {activeSubTab === "payment" && (
        <form onSubmit={handleSavePaymentConfig} className="space-y-6 animate-fade-in">
          {/* Business Rule Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 mb-1">
                نظام الدفع المعتمد: دفع رسوم الشحن مقدماً + دفع قيمة المنتجات عند الاستلام
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                وفقاً لطلبك، تم إلغاء الدفع عند الاستلام الكامل وتفعيل إلزامية دفع رسوم الشحن فقط مقدماً (عبر فودافون كاش أو إنستاباي) لتأكيد وجدية حجز الأوردر، بينما يدفع العميل باقي ثمن المنتجات نقداً لمندوب التوصيل عند استلام ومعاينة الشحنة.
              </p>
            </div>
          </div>

          {/* VODAFONE CASH SECTION */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">
                  VF
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">فودافون كاش (Vodafone Cash)</h3>
                  <p className="text-xs text-neutral-500">استقبال رسوم الشحن المسبقة عبر محفظة فودافون كاش</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.vodafoneCashEnabled}
                  onChange={(e) => setConfig({ ...config, vodafoneCashEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  رقم محفظة فودافون كاش لاستقبال التحويلات <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required={config.vodafoneCashEnabled}
                  value={config.vodafoneCashNumber}
                  onChange={(e) => setConfig({ ...config, vodafoneCashNumber: e.target.value })}
                  placeholder="مثال: 01012345678"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  اسم صاحب الحساب / المحفظة (اختياري للتأكيد)
                </label>
                <input
                  type="text"
                  value={config.vodafoneCashAccountName || ""}
                  onChange={(e) => setConfig({ ...config, vodafoneCashAccountName: e.target.value })}
                  placeholder="مثال: Sotra Fashion Store"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                تعليمات التحويل للعميل (تظهر في صفحة تأكيد الطلب)
              </label>
              <textarea
                rows={2}
                value={config.vodafoneCashInstructionsAr || ""}
                onChange={(e) => setConfig({ ...config, vodafoneCashInstructionsAr: e.target.value })}
                placeholder="اكتب التعليمات التي يراها العميل عند اختيار فودافون كاش..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* INSTAPAY SECTION */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                  IP
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">إنستاباي (InstaPay)</h3>
                  <p className="text-xs text-neutral-500">استقبال التحويلات اللحظية عبر تطبيق إنستاباي</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.instaPayEnabled}
                  onChange={(e) => setConfig({ ...config, instaPayEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  عنوان الدفع اللحظي (InstaPay IPA / Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={config.instaPayEnabled}
                  value={config.instaPayId}
                  onChange={(e) => setConfig({ ...config, instaPayId: e.target.value })}
                  placeholder="مثال: sotra@instapay أو 01012345678@instapay"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  اسم الحساب البنكي / المستفيد في إنستاباي
                </label>
                <input
                  type="text"
                  value={config.instaPayAccountName || ""}
                  onChange={(e) => setConfig({ ...config, instaPayAccountName: e.target.value })}
                  placeholder="مثال: متجر سترة فاشون"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                تعليمات التحويل للعميل عبر إنستاباي
              </label>
              <textarea
                rows={2}
                value={config.instaPayInstructionsAr || ""}
                onChange={(e) => setConfig({ ...config, instaPayInstructionsAr: e.target.value })}
                placeholder="اكتب التعليمات التي يراها العميل عند اختيار إنستاباي..."
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-neutral-950 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-neutral-800 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span>حفظ إعدادات وسائل الدفع في قاعدة البيانات</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. GOVERNORATES SHIPPING RATES TAB */}
      {activeSubTab === "shipping" && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={govSearch}
                onChange={(e) => setGovSearch(e.target.value)}
                placeholder="بحث عن محافظة..."
                className="w-full pr-9 pl-4 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-neutral-900 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetGovsToDefault}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                استعادة الافتراضي
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingGov({
                    id: "gov_" + Date.now(),
                    nameAr: "",
                    nameEn: "",
                    shippingCost: 60,
                    deliveryDays: "2-3 أيام عمل",
                  });
                  setIsGovModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة محافظة جديدة</span>
              </button>
            </div>
          </div>

          {/* Pricing Rule Note */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              <strong>ملاحظة هامة:</strong> لا تظهر تكلفة الشحن للعميل في المتجر والسلة إلا بعد أن يختار محافظته من القائمة، وتصبح هذه القيمة هي رسوم التحويل الإجبارية لتأكيد الطلب.
            </span>
          </div>

          {/* Governorates Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-start">اسم المحافظة</th>
                    <th className="px-4 py-3 text-start">الاسم بالإنجليزي</th>
                    <th className="px-4 py-3 text-start">مدة التوصيل المتوقعة</th>
                    <th className="px-4 py-3 text-start">سعر الشحن (ج.م)</th>
                    <th className="px-4 py-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredGovs.map((gov) => (
                    <tr key={gov.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-neutral-900">{gov.nameAr}</td>
                      <td className="px-4 py-3 text-neutral-500 font-mono">{gov.nameEn}</td>
                      <td className="px-4 py-3 text-neutral-600">{gov.deliveryDays}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 w-28">
                          <input
                            type="number"
                            min="0"
                            value={gov.shippingCost}
                            onChange={(e) => handleUpdateGovPrice(gov.id, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 font-bold text-neutral-900 focus:ring-2 focus:ring-neutral-950 outline-hidden font-mono"
                          />
                          <span className="text-neutral-500 text-[11px] shrink-0 font-bold">ج.م</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingGov(gov);
                              setIsGovModalOpen(true);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGov(gov.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredGovs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 font-medium">
                        لم يتم العثور على محافظات مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Governorate Modal */}
      {isGovModalOpen && editingGov && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div onClick={() => setIsGovModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 animate-scale-in text-start">
              <h3 className="text-base font-black text-neutral-950 mb-4">
                {editingGov.nameAr ? `تعديل محافظة: ${editingGov.nameAr}` : "إضافة محافظة جديدة"}
              </h3>

              <form onSubmit={handleSaveGovModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المحافظة بالعربي *</label>
                  <input
                    type="text"
                    required
                    value={editingGov.nameAr}
                    onChange={(e) => setEditingGov({ ...editingGov, nameAr: e.target.value })}
                    placeholder="مثال: مرسى مطروح"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-neutral-950 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المحافظة بالإنجليزي</label>
                  <input
                    type="text"
                    value={editingGov.nameEn}
                    onChange={(e) => setEditingGov({ ...editingGov, nameEn: e.target.value })}
                    placeholder="e.g. Marsa Matrouh"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-neutral-950 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">سعر الشحن (ج.م) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingGov.shippingCost}
                      onChange={(e) => setEditingGov({ ...editingGov, shippingCost: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-neutral-950 outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">مدة التوصيل</label>
                    <input
                      type="text"
                      value={editingGov.deliveryDays}
                      onChange={(e) => setEditingGov({ ...editingGov, deliveryDays: e.target.value })}
                      placeholder="مثال: 2-3 أيام عمل"
                      className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-neutral-950 outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsGovModalOpen(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    حفظ التعديل
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
