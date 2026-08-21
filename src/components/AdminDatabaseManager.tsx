import React, { useState, useEffect } from "react";
import {
  Trash2,
  AlertTriangle,
  Database,
  RefreshCw,
  Download,
  CheckCircle2,
  ShieldAlert,
  Layers,
  ShoppingBag,
  Tag,
  Clock,
  Sparkles,
  Users,
  CreditCard,
  RotateCcw,
  Check,
  X,
  FileJson,
  Info,
} from "lucide-react";
import { AdminData, Order } from "../types";
import {
  wipeEntireStoreDatabase,
  wipeSelectiveStoreCollection,
  resetDemoDataToFirebase,
  saveAdminData,
  STORAGE_KEYS,
} from "../utils/storage";
import {
  exportFullBackupJSON,
  getLocalSnapshots,
  clearAllLocalSnapshots,
  saveLocalSnapshot,
} from "../utils/backupRestore";

interface AdminDatabaseManagerProps {
  adminData: AdminData;
  orders: Order[];
  onUpdateAdminData: (newData: AdminData) => void;
  onUpdateOrders: (newOrders: Order[]) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminDatabaseManager: React.FC<AdminDatabaseManagerProps> = ({
  adminData,
  orders,
  onUpdateAdminData,
  onUpdateOrders,
  showToast,
  lang,
}) => {
  // Full wipe options state
  const [wipeOptions, setWipeOptions] = useState({
    products: true,
    categories: true,
    offerCategories: true,
    banners: true,
    coupons: true,
    orders: true,
    customers: true,
    snapshots: true,
    resetConfigs: false,
  });

  // Safety options
  const [autoBackupBeforeWipe, setAutoBackupBeforeWipe] = useState(true);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isWiping, setIsWiping] = useState(false);
  const [wipeProgressMessage, setWipeProgressMessage] = useState("");

  // Selective wipe loading states
  const [selectiveLoading, setSelectiveLoading] = useState<string | null>(null);

  // Snapshots count
  const [snapshotsCount, setSnapshotsCount] = useState(0);

  useEffect(() => {
    setSnapshotsCount(getLocalSnapshots().length);
  }, []);

  const CONFIRMATION_KEYWORD = "مسح";

  const isConfirmationValid =
    confirmationInput.trim() === CONFIRMATION_KEYWORD ||
    confirmationInput.trim().toUpperCase() === "DELETE" ||
    confirmationInput.trim() === "تأكيد";

  // Calculate total entities count
  const totalEntitiesCount =
    (wipeOptions.products ? adminData.products.length : 0) +
    (wipeOptions.categories ? adminData.categories.length : 0) +
    (wipeOptions.offerCategories ? adminData.offerCategories.length : 0) +
    (wipeOptions.banners ? adminData.banners.length : 0) +
    (wipeOptions.coupons ? adminData.coupons?.length || 0 : 0) +
    (wipeOptions.orders ? orders.length : 0) +
    (wipeOptions.snapshots ? snapshotsCount : 0);

  // EXECUTE FULL WIPE
  const handleExecuteFullWipe = async () => {
    if (!isConfirmationValid) {
      alert(`يرجى كتابة كلمة "${CONFIRMATION_KEYWORD}" في حقل التأكيد للمتابعة.`);
      return;
    }

    if (
      !confirm(
        `🚨 تحذير أخير وحاسم!\n\nأنت على وشك مسح وتفريغ قاعدة البيانات وحذف العناصر المحددة نهائياً من Firebase والمتجر.\n\nهل أنت متأكد تماماً من رغبتك في المتابعة؟`
      )
    ) {
      return;
    }

    setIsWiping(true);
    setWipeProgressMessage("⏳ جاري بدء عملية المسح الشامل...");

    try {
      // 1. Auto Backup if enabled
      if (autoBackupBeforeWipe) {
        setWipeProgressMessage("📦 جاري حفظ وتنزيل نسخة احتياطية فورية تلقائياً...");
        saveLocalSnapshot("نسخة ما قبل المسح الشامل", adminData, orders);
        exportFullBackupJSON(adminData, orders);
        await new Promise((r) => setTimeout(r, 600));
      }

      // 2. Wipe Firestore Database
      setWipeProgressMessage("🔥 جاري مسح وتفريغ مجموعات Firebase Firestore السحابية...");
      const wipeResult = await wipeEntireStoreDatabase(
        {
          clearProducts: wipeOptions.products,
          clearCategories: wipeOptions.categories,
          clearOfferCategories: wipeOptions.offerCategories,
          clearBanners: wipeOptions.banners,
          clearCoupons: wipeOptions.coupons,
          clearOrders: wipeOptions.orders,
          clearCustomers: wipeOptions.customers,
          resetConfigs: wipeOptions.resetConfigs,
        },
        adminData
      );

      // 3. Clear Local Snapshots if chosen
      if (wipeOptions.snapshots) {
        setWipeProgressMessage("🧹 جاري مسح نقاط الاستعادة المحفوظة محلياً...");
        clearAllLocalSnapshots();
        setSnapshotsCount(0);
      }

      // 4. Update orders state if cleared
      if (wipeOptions.orders) {
        onUpdateOrders([]);
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
      }

      // 5. Update admin data state and local storage
      onUpdateAdminData(wipeResult.updatedAdminData);
      saveAdminData(wipeResult.updatedAdminData);

      setWipeProgressMessage("✅ تم تفريغ ومسح قاعدة البيانات بنجاح!");
      await new Promise((r) => setTimeout(r, 800));

      setConfirmationInput("");
      showToast("✅ تم مسح وتفريغ قاعدة البيانات بنجاح، المتجر الآن نظيف وجاهز لإضافة بياناتك.");
    } catch (err: any) {
      console.error("Wipe failed:", err);
      showToast(`❌ فشل مسح قاعدة البيانات: ${err?.message || "خطأ غير متوقع"}`);
    } finally {
      setIsWiping(false);
      setWipeProgressMessage("");
    }
  };

  // SELECTIVE WIPE HANDLER
  const handleSelectiveWipe = async (
    target: "products" | "categories" | "offerCategories" | "banners" | "coupons" | "orders" | "customers" | "snapshots",
    titleAr: string,
    count: number
  ) => {
    if (count === 0) {
      showToast(`ℹ️ لا توجد بيانات في ${titleAr} لمسحها.`);
      return;
    }

    if (
      !confirm(
        `⚠️ هل أنت متأكد من مسح كافة بيانات "${titleAr}" (${count} عنصر)؟\n\nسيتم حذفها نهائياً من قاعدة بيانات Firebase والمتصفح.`
      )
    ) {
      return;
    }

    setSelectiveLoading(target);

    try {
      if (target === "snapshots") {
        clearAllLocalSnapshots();
        setSnapshotsCount(0);
        showToast("✅ تم مسح كافة نقاط الاستعادة المحفوظة محلياً.");
      } else if (target === "orders") {
        await wipeSelectiveStoreCollection("orders", adminData);
        onUpdateOrders([]);
        localStorage.removeItem(STORAGE_KEYS.ORDERS);
        showToast("✅ تم مسح كافة سجلات الطلبات من قاعدة البيانات.");
      } else if (target === "customers") {
        await wipeSelectiveStoreCollection("customers", adminData);
        showToast("✅ تم مسح كافة سجلات العملاء من قاعدة البيانات.");
      } else {
        const res = await wipeSelectiveStoreCollection(target, adminData);
        if (res.success && res.updatedAdminData) {
          onUpdateAdminData(res.updatedAdminData);
          saveAdminData(res.updatedAdminData);
          showToast(`✅ تم مسح وتفريغ ${titleAr} بنجاح من قاعدة البيانات.`);
        }
      }
    } catch (e: any) {
      showToast(`❌ حدث خطأ أثناء المسح: ${e?.message}`);
    } finally {
      setSelectiveLoading(null);
    }
  };

  // SEED DEMO DATA
  const handleSeedDemoData = async () => {
    if (
      !confirm(
        "🔄 هل تريد استعادة وتوليد البيانات التجريبية الافتراضية النموذجية (منتجات وأقسام وبانرات وكوبونات) في قاعدة بيانات Firebase والمتجر؟"
      )
    ) {
      return;
    }

    setSelectiveLoading("demo_seed");
    try {
      const res = await resetDemoDataToFirebase();
      if (res.success) {
        onUpdateAdminData(res.data);
        saveAdminData(res.data);
        showToast("✅ تم استعادة وتوليد البيانات التجريبية في قاعدة البيانات بنجاح!");
      }
    } catch (e: any) {
      showToast(`❌ فشل توليد البيانات التجريبية: ${e?.message}`);
    } finally {
      setSelectiveLoading(null);
    }
  };

  return (
    <div className="space-y-6 text-start font-arabic animate-fade-in">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-red-950 via-neutral-950 to-neutral-900 text-white p-6 rounded-2xl border border-red-900/40 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg text-xs font-black flex items-center gap-1.5 font-mono">
                <Trash2 className="w-3.5 h-3.5" />
                DATABASE WIPE & RESET
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                قاعدة البيانات: متصلة ونشطة
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              مسح وتفريغ قاعدة البيانات (Database Wipe)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              أداة الإدارة الشاملة لتنظيف وتفريغ المتجر من المنتجات التجريبية أو مسح سجلات الطلبات والعملاء بالكامل للبدء بمتجر حقيقي نظيف، مع حماية متقدمة ونسخ احتياطي تلقائي.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedDemoData}
              disabled={selectiveLoading === "demo_seed" || isWiping}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="توليد واستعادة بيانات تجريبية نموذجية"
            >
              {selectiveLoading === "demo_seed" ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <RotateCcw className="w-4 h-4 text-amber-400" />
              )}
              <span>استعادة البيانات النموذجية</span>
            </button>
          </div>
        </div>
      </div>

      {/* LIVE DATABASE STATS OVERVIEW */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-neutral-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-900">
            <Database className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-black">حجم البيانات الحالية المخزنة في قاعدة البيانات</h3>
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            إجمالي العناصر: {adminData.products.length + adminData.categories.length + orders.length} سجل
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-blue-600" /> المنتجات
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {adminData.products.length} منتج
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-600" /> الأقسام
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {adminData.categories.length} قسم
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> أقسام العروض
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {adminData.offerCategories.length} عرض
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" /> البانرات
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {adminData.banners.length} بانر
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600" /> الكوبونات
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {adminData.coupons?.length || 0} كود
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-rose-600" /> الطلبات
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {orders.length} طلب
            </span>
          </div>

          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
            <span className="text-[10px] text-neutral-500 font-bold block flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" /> نقاط الاستعادة
            </span>
            <span className="text-base font-black text-neutral-900 font-brand mt-0.5 block">
              {snapshotsCount} نقطة
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: FULL WIPE (PRIMARY DESTRUCTIVE ACTION) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border-2 border-red-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-red-950 flex items-center gap-2">
                <span>المسح الشامل وتفريغ قاعدة البيانات السحابية</span>
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                  إجراء حاسم
                </span>
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                حذف شامل لكافة البيانات المحددة من جداول Firebase Firestore والمخزن المحلي لتهيئة المتجر للإنتاج الحقيقي
              </p>
            </div>
          </div>
        </div>

        {/* Warning Alert Box */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-amber-950">تنبيه هام وملاحظة أمان:</p>
            <p className="leading-relaxed text-amber-900">
              عند تنفيذ المسح، سيتم حذف المستندات المحددة نهائياً ولن يمكن التراجع إلا إذا قمت بتحميل نسخة احتياطية مسبقاً. نوصي بالإبقاء على خيار النسخ الاحتياطي التلقائي مفعلاً أدناه.
            </p>
          </div>
        </div>

        {/* Entity Selection Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-neutral-900">
              اختر البيانات المراد مسحها وتفريغها:
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setWipeOptions({
                    products: true,
                    categories: true,
                    offerCategories: true,
                    banners: true,
                    coupons: true,
                    orders: true,
                    customers: true,
                    snapshots: true,
                    resetConfigs: true,
                  })
                }
                className="text-blue-600 hover:underline cursor-pointer font-bold"
              >
                تحديد الكل
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={() =>
                  setWipeOptions({
                    products: false,
                    categories: false,
                    offerCategories: false,
                    banners: false,
                    coupons: false,
                    orders: false,
                    customers: false,
                    snapshots: false,
                    resetConfigs: false,
                  })
                }
                className="text-neutral-500 hover:underline cursor-pointer font-bold"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Products */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.products
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.products}
                onChange={(e) => setWipeOptions({ ...wipeOptions, products: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح جميع المنتجات والمخزون</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم حذف ({adminData.products.length}) منتج مع كافة الألوان والمقاسات
                </span>
              </div>
            </label>

            {/* Categories */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.categories
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.categories}
                onChange={(e) => setWipeOptions({ ...wipeOptions, categories: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح الأقسام الرئيسية</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم تفريغ ({adminData.categories.length}) قسم رئيسي
                </span>
              </div>
            </label>

            {/* Offer Categories */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.offerCategories
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.offerCategories}
                onChange={(e) => setWipeOptions({ ...wipeOptions, offerCategories: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح أقسام العروض الموسمية</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم تفريغ ({adminData.offerCategories.length}) قسم عروض
                </span>
              </div>
            </label>

            {/* Banners */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.banners
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.banners}
                onChange={(e) => setWipeOptions({ ...wipeOptions, banners: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح شرائح البانر الإعلاني</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم حذف ({adminData.banners.length}) بانر إعلاني
                </span>
              </div>
            </label>

            {/* Coupons */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.coupons
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.coupons}
                onChange={(e) => setWipeOptions({ ...wipeOptions, coupons: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح أكواد الخصم والبرومو كود</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم حذف ({adminData.coupons?.length || 0}) كود خصم
                </span>
              </div>
            </label>

            {/* Orders */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.orders
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.orders}
                onChange={(e) => setWipeOptions({ ...wipeOptions, orders: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح جميع طلبات الشراء المسجلة</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم تفريغ ({orders.length}) طلب مسجل
                </span>
              </div>
            </label>

            {/* Customers */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.customers
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.customers}
                onChange={(e) => setWipeOptions({ ...wipeOptions, customers: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح قاعدة بيانات العملاء (CRM)</span>
                <span className="text-[11px] opacity-80 block">
                  حذف سجلات أرقام الهواتف وعناوين العملاء
                </span>
              </div>
            </label>

            {/* Snapshots */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.snapshots
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.snapshots}
                onChange={(e) => setWipeOptions({ ...wipeOptions, snapshots: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">مسح نقاط الاستعادة المحفوظة</span>
                <span className="text-[11px] opacity-80 block">
                  سيتم مسح ({snapshotsCount}) نقطة استعادة محلية
                </span>
              </div>
            </label>

            {/* Reset Configs */}
            <label
              className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                wipeOptions.resetConfigs
                  ? "bg-red-50/70 border-red-300 text-red-950"
                  : "bg-neutral-50 border-neutral-200 text-neutral-600"
              }`}
            >
              <input
                type="checkbox"
                checked={wipeOptions.resetConfigs}
                onChange={(e) => setWipeOptions({ ...wipeOptions, resetConfigs: e.target.checked })}
                className="mt-0.5 accent-red-600 w-4 h-4 rounded"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-black block">إعادة تعيين إعدادات الدفع والفوتر</span>
                <span className="text-[11px] opacity-80 block">
                  استرجاع رسوم الشحن وإعدادات الكاش والسبلاش الافتراضية
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Auto Backup & Security Confirmation Box */}
        <div className="p-5 bg-neutral-900 text-white rounded-xl space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoBackupBeforeWipe}
              onChange={(e) => setAutoBackupBeforeWipe(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
            <div>
              <span className="text-xs font-bold text-white block">
                🛡️ أخذ نسخة احتياطية وتنزيل ملف JSON تلقائياً قبل المسح (موصى به جداً)
              </span>
              <span className="text-[11px] text-neutral-400 block">
                يحفظ ملف النسخة الكاملة على جهازك لتتمكن من استعادة البيانات بأي وقت إذا أردت الرجوع.
              </span>
            </div>
          </label>

          <div className="border-t border-neutral-800 pt-3 space-y-2">
            <label className="block text-xs font-bold text-neutral-300">
              لإتمام العملية، يرجى كتابة كلمة <span className="text-red-400 font-mono font-black text-sm px-1.5 py-0.5 bg-red-950/80 rounded border border-red-800">مسح</span> في المربع أدناه:
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="اكتب كلمة: مسح"
                disabled={isWiping}
                className="px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-xs font-bold font-mono outline-none focus:border-red-500 flex-1"
              />

              <button
                type="button"
                onClick={handleExecuteFullWipe}
                disabled={!isConfirmationValid || isWiping || totalEntitiesCount === 0}
                className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 ${
                  isConfirmationValid && !isWiping && totalEntitiesCount > 0
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60"
                }`}
              >
                {isWiping ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>جاري المسح...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تنفيذ المسح النهائي لقاعدة البيانات</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Message */}
            {isWiping && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-red-400 flex-shrink-0" />
                <span>{wipeProgressMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: QUICK SELECTIVE WIPES */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-neutral-200 space-y-4">
        <div className="flex items-center gap-2.5 border-b pb-3 text-neutral-900">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <div>
            <h3 className="text-sm font-black">المسح الانتقائي السريع (مسح قسم محدد فقط)</h3>
            <p className="text-[11px] text-neutral-500">
              يمكنك تفريغ وحذف قسم معين فقط دون التأثير على باقي أقسام المتجر
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Selective 1: Products */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black">المنتجات فقط</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح وتفريغ قائمة المنتجات والمخزون ({adminData.products.length} منتج)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("products", "المنتجات", adminData.products.length)}
              disabled={selectiveLoading === "products" || adminData.products.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "products" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح المنتجات ({adminData.products.length})</span>
            </button>
          </div>

          {/* Selective 2: Orders */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <ShoppingBag className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black">سجل الطلبات فقط</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح جميع طلبات الشراء المسجلة ({orders.length} طلب)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("orders", "سجل الطلبات", orders.length)}
              disabled={selectiveLoading === "orders" || orders.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "orders" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح الطلبات ({orders.length})</span>
            </button>
          </div>

          {/* Selective 3: Customers CRM */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black">سجل العملاء CRM</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                تفريغ سجلات العملاء وعناوين الشحن السابقة من Firebase
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("customers", "سجل العملاء CRM", 1)}
              disabled={selectiveLoading === "customers"}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "customers" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح سجل العملاء</span>
            </button>
          </div>

          {/* Selective 4: Categories */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Layers className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black">الأقسام الرئيسية</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح كافة الأقسام الرئيسية ({adminData.categories.length} قسم)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("categories", "الأقسام الرئيسية", adminData.categories.length)}
              disabled={selectiveLoading === "categories" || adminData.categories.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "categories" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح الأقسام ({adminData.categories.length})</span>
            </button>
          </div>

          {/* Selective 5: Offer Categories */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black">أقسام العروض</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح أقسام العروض الموسمية ({adminData.offerCategories.length} عرض)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("offerCategories", "أقسام العروض", adminData.offerCategories.length)}
              disabled={selectiveLoading === "offerCategories" || adminData.offerCategories.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "offerCategories" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح العروض ({adminData.offerCategories.length})</span>
            </button>
          </div>

          {/* Selective 6: Banners */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black">البانرات الإعلانية</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح شرائح البانر العلوي ({adminData.banners.length} بانر)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("banners", "البانرات الإعلانية", adminData.banners.length)}
              disabled={selectiveLoading === "banners" || adminData.banners.length === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "banners" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح البانرات ({adminData.banners.length})</span>
            </button>
          </div>

          {/* Selective 7: Coupons */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Tag className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black">أكواد الخصم</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح أكواد الخصم والكوبونات ({adminData.coupons?.length || 0} كود)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("coupons", "أكواد الخصم", adminData.coupons?.length || 0)}
              disabled={selectiveLoading === "coupons" || (adminData.coupons?.length || 0) === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "coupons" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح الكوبونات ({adminData.coupons?.length || 0})</span>
            </button>
          </div>

          {/* Selective 8: Snapshots */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-900">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black">نقاط الاستعادة</h4>
              </div>
              <p className="text-[11px] text-neutral-500">
                مسح نقاط الاستعادة المحفوظة محلياً ({snapshotsCount} نقطة)
              </p>
            </div>
            <button
              onClick={() => handleSelectiveWipe("snapshots", "نقاط الاستعادة", snapshotsCount)}
              disabled={selectiveLoading === "snapshots" || snapshotsCount === 0}
              className="w-full py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-neutral-200 hover:border-red-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
            >
              {selectiveLoading === "snapshots" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>مسح نقاط الاستعادة ({snapshotsCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
