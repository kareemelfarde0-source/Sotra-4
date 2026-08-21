import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Tag,
  ShoppingBag,
  FileText,
  Trash2,
  Save,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  FolderArchive,
} from "lucide-react";
import { AdminData, Order, Product, Category, BannerSlide, OfferCategory, PromoCode, FooterConfig, SplashScreenConfig } from "../types";
import {
  exportFullBackupJSON,
  exportProductsToCSV,
  exportOrdersToCSV,
  exportProductsToExcel,
  exportOrdersToExcel,
  exportProductsExcelTemplate,
  exportSelectiveEntities,
  parseBackupFile,
  BackupPayload,
  getLocalSnapshots,
  saveLocalSnapshot,
  deleteLocalSnapshot,
  LocalSnapshot,
  downloadFile,
} from "../utils/backupRestore";
import { syncAllStoreDataToFirebase, saveAdminData } from "../utils/storage";

interface AdminBackupRestoreProps {
  adminData: AdminData;
  orders: Order[];
  onUpdateAdminData: (newData: AdminData) => void;
  onUpdateOrders: (newOrders: Order[]) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminBackupRestore: React.FC<AdminBackupRestoreProps> = ({
  adminData,
  orders,
  onUpdateAdminData,
  onUpdateOrders,
  showToast,
  lang,
}) => {
  // Snapshot State
  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>([]);
  const [newSnapshotName, setNewSnapshotName] = useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // File Upload & Preview State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedBackup, setUploadedBackup] = useState<BackupPayload | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Entities Selection for Import
  const [importOptions, setImportOptions] = useState({
    products: true,
    categories: true,
    offerCategories: true,
    banners: true,
    coupons: true,
    governorates: true,
    paymentConfig: true,
    footerConfig: true,
    splashScreenConfig: true,
    orders: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load snapshots on mount
  useEffect(() => {
    setSnapshots(getLocalSnapshots());
  }, []);

  // Handle Snapshot Creation
  const handleTakeSnapshot = () => {
    if (!newSnapshotName.trim() && !confirm("إنشاء نقطة استعادة بالتاريخ والوقت الحالي؟")) return;
    const snap = saveLocalSnapshot(newSnapshotName, adminData, orders);
    setSnapshots(getLocalSnapshots());
    setNewSnapshotName("");
    setIsCreatingSnapshot(false);
    showToast(`✅ تم إنشاء نقطة الاستعادة بنجاح: "${snap.name}"`);
  };

  const handleDeleteSnapshot = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف نقطة الاستعادة هذه؟")) return;
    const updated = deleteLocalSnapshot(id);
    setSnapshots(updated);
    showToast("تم حذف نقطة الاستعادة");
  };

  const handleRestoreSnapshot = (snap: LocalSnapshot) => {
    if (
      !confirm(
        `⚠️ هل أنت متأكد من رغبتك في استعادة المتجر إلى حالة "${snap.name}" (${snap.createdAt})؟\n\nسيتم تحديث كافة المنتجات والأقسام والإعدادات على الفور.`
      )
    ) {
      return;
    }

    const snapData = snap.payload.data;
    const restoredAdminData: AdminData = {
      products: snapData.products || [],
      categories: snapData.categories || [],
      offerCategories: snapData.offerCategories || [],
      banners: snapData.banners || [],
      coupons: snapData.coupons || [],
      governorates: snapData.governorates || adminData.governorates,
      paymentConfig: snapData.paymentConfig || adminData.paymentConfig,
      footerConfig: snapData.footerConfig || adminData.footerConfig,
      splashScreenConfig: snapData.splashScreenConfig || adminData.splashScreenConfig,
      updatedAt: Date.now(),
    };

    onUpdateAdminData(restoredAdminData);
    saveAdminData(restoredAdminData);
    syncAllStoreDataToFirebase(restoredAdminData).catch((e) => console.warn(e));
    if (snapData.orders && snapData.orders.length > 0) {
      onUpdateOrders(snapData.orders);
    }
    showToast(`✅ تمت استعادة المتجر ومزامنته مع قاعدة البيانات السحابية من النقطة "${snap.name}"`);
  };

  // Handle File Selection and Parsing
  const handleFile = async (file: File) => {
    setParseError(null);
    setIsProcessingFile(true);
    setUploadedFileName(file.name);

    const result = await parseBackupFile(file);
    setIsProcessingFile(false);

    if (!result.success || !result.payload) {
      setParseError(result.error || "تعذر قراءة ملف النسخة الاحتياطية.");
      setUploadedBackup(null);
      return;
    }

    setUploadedBackup(result.payload);
    showToast("✅ تم فحص ملف النسخة الاحتياطية بنجاح! راجع التفاصيل بالأسفل واختر طريقة الاستيراد.");
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Execute Restore: Clean Overwrite vs Merge
  const handleExecuteRestore = (mode: "overwrite" | "merge") => {
    if (!uploadedBackup) return;

    const data = uploadedBackup.data;
    const isOverwrite = mode === "overwrite";

    const promptText = isOverwrite
      ? "⚠️ تحذير: الاستبدال الشامل سيمسح البيانات الحالية ويستبدلها بالكامل ببيانات ملف النسخة الاحتياطية.\n\nهل أنت متأكد من المتابعة؟"
      : "ℹ️ سيتم دمج العناصر الجديدة من ملف النسخة الاحتياطية وتحديث العناصر الموجودة دون حذف العناصر الأخرى.\n\nهل تريد المتابعة؟";

    if (!confirm(promptText)) return;

    let newProducts: Product[] = isOverwrite ? [] : [...adminData.products];
    if (importOptions.products && data.products) {
      if (isOverwrite) {
        newProducts = data.products;
      } else {
        const prodMap = new Map<string, Product>();
        newProducts.forEach((p) => prodMap.set(p.id, p));
        data.products.forEach((p) => prodMap.set(p.id, p));
        newProducts = Array.from(prodMap.values());
      }
    }

    let newCategories: Category[] = isOverwrite ? [] : [...adminData.categories];
    if (importOptions.categories && data.categories) {
      if (isOverwrite) {
        newCategories = data.categories;
      } else {
        const catMap = new Map<string, Category>();
        newCategories.forEach((c) => catMap.set(c.id, c));
        data.categories.forEach((c) => catMap.set(c.id, c));
        newCategories = Array.from(catMap.values());
      }
    }

    let newOfferCategories: OfferCategory[] = isOverwrite ? [] : [...adminData.offerCategories];
    if (importOptions.offerCategories && data.offerCategories) {
      if (isOverwrite) {
        newOfferCategories = data.offerCategories;
      } else {
        const oCatMap = new Map<string, OfferCategory>();
        newOfferCategories.forEach((c) => oCatMap.set(c.id, c));
        data.offerCategories.forEach((c) => oCatMap.set(c.id, c));
        newOfferCategories = Array.from(oCatMap.values());
      }
    }

    let newBanners: BannerSlide[] = isOverwrite ? [] : [...adminData.banners];
    if (importOptions.banners && data.banners) {
      if (isOverwrite) {
        newBanners = data.banners;
      } else {
        const banMap = new Map<string, BannerSlide>();
        newBanners.forEach((b) => banMap.set(String(b.id), b));
        data.banners.forEach((b) => banMap.set(String(b.id), b));
        newBanners = Array.from(banMap.values());
      }
    }

    let newCoupons: PromoCode[] = isOverwrite ? [] : [...(adminData.coupons || [])];
    if (importOptions.coupons && data.coupons) {
      if (isOverwrite) {
        newCoupons = data.coupons;
      } else {
        const coupMap = new Map<string, PromoCode>();
        newCoupons.forEach((cp) => coupMap.set(cp.id, cp));
        data.coupons.forEach((cp) => coupMap.set(cp.id, cp));
        newCoupons = Array.from(coupMap.values());
      }
    }

    let newGovernorates = adminData.governorates;
    if (importOptions.governorates && data.governorates && data.governorates.length > 0) {
      newGovernorates = data.governorates;
    }

    let newPaymentConfig = adminData.paymentConfig;
    if (importOptions.paymentConfig && data.paymentConfig) {
      newPaymentConfig = { ...adminData.paymentConfig, ...data.paymentConfig };
    }

    const newFooterConfig =
      importOptions.footerConfig && data.footerConfig ? data.footerConfig : adminData.footerConfig;

    const newSplashScreenConfig =
      importOptions.splashScreenConfig && data.splashScreenConfig
        ? data.splashScreenConfig
        : adminData.splashScreenConfig;

    const finalAdminData: AdminData = {
      products: newProducts,
      categories: newCategories,
      offerCategories: newOfferCategories,
      banners: newBanners,
      coupons: newCoupons,
      governorates: newGovernorates,
      paymentConfig: newPaymentConfig,
      footerConfig: newFooterConfig,
      splashScreenConfig: newSplashScreenConfig,
      updatedAt: Date.now(),
    };

    onUpdateAdminData(finalAdminData);
    saveAdminData(finalAdminData);
    syncAllStoreDataToFirebase(finalAdminData).catch((e) => console.warn(e));

    if (importOptions.orders && data.orders && data.orders.length > 0) {
      if (isOverwrite) {
        onUpdateOrders(data.orders);
      } else {
        const ordMap = new Map<string, Order>();
        orders.forEach((o) => ordMap.set(o.orderId, o));
        data.orders.forEach((o) => ordMap.set(o.orderId, o));
        onUpdateOrders(Array.from(ordMap.values()));
      }
    }

    setUploadedBackup(null);
    showToast(
      isOverwrite
        ? "✅ تم استبدال واستعادة كافة بيانات المتجر ومزامنتها في قاعدة البيانات السحابية!"
        : "✅ تم دمج البيانات وتحديث المتجر في قاعدة البيانات السحابية بنجاح!"
    );
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const handleForceCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await syncAllStoreDataToFirebase(adminData);
      if (res.success) {
        showToast("✅ تم رفع ومزامنة كامل محتويات المتجر إلى قاعدة البيانات بنجاح!");
      } else {
        showToast(`❌ ${res.message}`);
      }
    } catch (e: any) {
      showToast(`❌ خطأ أثناء المزامنة: ${e?.message || "فشلت المزامنة"}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  return (
    <div id="admin-backup-restore-dashboard" className="space-y-6 text-start font-arabic">
      {/* Top Banner Overview */}
      <div className="bg-neutral-950 text-white p-6 rounded-2xl border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#d4af37]" />
            <h2 className="text-lg sm:text-xl font-black font-brand tracking-wide">
              مركز النسخ الاحتياطي والمزامنة السحابية
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            بياناتك وموقعك متصلان بقاعدة البيانات السحابية مباشرة. يمكنك في أي وقت تنزيل نسخة احتياطية أو استعادة متجرك أو تصدير شيت Excel وتعديله وإعادة رفعه.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={handleForceCloudSync}
            disabled={isSyncingCloud}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            title="مزامنة فورية لكل المنتجات والأقسام والإعدادات مع قاعدة البيانات السحابية لتظهر فوراً على كافة الأجهزة"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingCloud ? "animate-spin" : ""}`} />
            <span>{isSyncingCloud ? "جاري المزامنة..." : "مزامنة سحابية فورية (Cloud Sync)"}</span>
          </button>

          <button
            onClick={() => exportProductsToExcel(adminData.products, adminData.categories)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            title="تصدير شيت إكسيل لجميع المنتجات (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => exportFullBackupJSON(adminData, orders)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            title="تنزيل ملف JSON شامل لكافة بيانات المتجر"
          >
            <Download className="w-4 h-4" />
            <span>نسخة شاملة (JSON)</span>
          </button>

          <button
            onClick={() => setIsCreatingSnapshot(!isCreatingSnapshot)}
            className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl border border-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="إنشاء نقطة استعادة سريعة في المتصفح"
          >
            <Clock className="w-4 h-4 text-neutral-300" />
            <span>نقطة استعادة</span>
          </button>
        </div>
      </div>

      {/* Snapshot Creation Modal / Form */}
      {isCreatingSnapshot && (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl space-y-3 animate-fade-in text-neutral-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-black">إنشاء نقطة استعادة فورية (Snapshot)</h3>
            </div>
            <button
              onClick={() => setIsCreatingSnapshot(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
          <p className="text-xs text-neutral-600">
            تتيح لك نقطة الاستعادة الرجوع فوراً لهذه الحالة في أي وقت قبل إجراء تعديلات كبرى على المنتجات أو الأقسام.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder="مثال: قبل تعديل تشكيلة الصيف أو قبل إضافة 50 منتج..."
              className="flex-1 px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleTakeSnapshot}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
            >
              حفظ النقطة الآن
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: SMART IMPORT & RESTORE ZONE */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-neutral-200 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">استيراد واستعادة البيانات والمنتجات</h3>
              <p className="text-[11px] text-neutral-500">
                اسحب وأفلت ملف إكسيل (.xlsx / .csv) أو ملف نسخة احتياطية (.json) أو اضغط للاختيار
              </p>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>اختر ملفاً (Excel / JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
              : "border-neutral-200 hover:border-neutral-400 bg-neutral-50/60"
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-neutral-200 mx-auto flex items-center justify-center text-neutral-600">
              <FileJson className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-black text-neutral-800">
                {isProcessingFile ? "جاري فحص وقراءة الملف..." : "اسحب ملف النسخة الاحتياطية هنا أو اضغط للاختيار"}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">يدعم ملفات النسخ الاحتياطي بصيغة JSON</p>
            </div>
          </div>
        </div>

        {/* Parse Error Box */}
        {parseError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">فشل قراءة الملف:</p>
              <p className="mt-0.5 text-red-600">{parseError}</p>
            </div>
          </div>
        )}

        {/* Uploaded File Inspection & Confirmation Box */}
        {uploadedBackup && (
          <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4 animate-fade-in text-neutral-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-600 text-white rounded-md">
                  معاينة الملف
                </span>
                <h4 className="text-sm font-black text-neutral-900 mt-1 font-mono">{uploadedFileName}</h4>
                <p className="text-[11px] text-neutral-600">
                  تاريخ النسخة: {new Date(uploadedBackup.timestamp || uploadedBackup.exportedAt).toLocaleString("ar-EG")} | الإصدار: {uploadedBackup.version}
                </p>
              </div>

              <button
                onClick={() => setUploadedBackup(null)}
                className="text-xs text-neutral-500 hover:text-red-600 cursor-pointer"
              >
                إلغاء واختيار ملف آخر
              </button>
            </div>

            {/* Counts Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">المنتجات</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.productsCount} منتج
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">الأقسام الرئيسية</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.categoriesCount} قسم
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">أقسام العروض</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.offerCategoriesCount} عرض
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">البنرات الإعلانية</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.bannersCount} بانر
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">أكواد الخصم</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.couponsCount} كود
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">إعدادات الدفع وفودافون كاش</span>
                <span className="text-xs font-black text-neutral-900">
                  {uploadedBackup.stats.hasPaymentConfig ? "متوفرة بالملف ✅" : "غير موجودة ❌"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">المحافظات وأسعار الشحن</span>
                <span className="text-xs font-black text-neutral-900">
                  {uploadedBackup.stats.hasGovernorates ? "متوفرة بالملف ✅" : "غير موجودة ❌"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">إعدادات الفوتر</span>
                <span className="text-xs font-black text-neutral-900">
                  {uploadedBackup.stats.hasFooterConfig ? "متوفرة بالملف ✅" : "غير موجودة ❌"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">شاشة البداية Splash</span>
                <span className="text-xs font-black text-neutral-900">
                  {uploadedBackup.stats.hasSplashScreenConfig ? "متوفرة بالملف ✅" : "غير موجودة ❌"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[10px] text-neutral-500 font-bold block">الطلبات المسجلة</span>
                <span className="text-lg font-black text-neutral-900 font-brand">
                  {uploadedBackup.stats.ordersCount} طلب
                </span>
              </div>
            </div>

            {/* Checkboxes for Entities to Import */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-neutral-700 block">حدد البيانات التي ترغب في استيرادها:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.products}
                    onChange={(e) => setImportOptions({ ...importOptions, products: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>المنتجات ({uploadedBackup.stats.productsCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.categories}
                    onChange={(e) => setImportOptions({ ...importOptions, categories: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>الأقسام ({uploadedBackup.stats.categoriesCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.offerCategories}
                    onChange={(e) => setImportOptions({ ...importOptions, offerCategories: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>أقسام العروض ({uploadedBackup.stats.offerCategoriesCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.banners}
                    onChange={(e) => setImportOptions({ ...importOptions, banners: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>البنرات ({uploadedBackup.stats.bannersCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.coupons}
                    onChange={(e) => setImportOptions({ ...importOptions, coupons: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>الكوبونات ({uploadedBackup.stats.couponsCount})</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.paymentConfig}
                    onChange={(e) => setImportOptions({ ...importOptions, paymentConfig: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>إعدادات الدفع وفودافون كاش</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.governorates}
                    onChange={(e) => setImportOptions({ ...importOptions, governorates: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>المحافظات والشحن</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.footerConfig}
                    onChange={(e) => setImportOptions({ ...importOptions, footerConfig: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>إعدادات الفوتر والضمانات</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.splashScreenConfig}
                    onChange={(e) => setImportOptions({ ...importOptions, splashScreenConfig: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>شاشة البداية Splash</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.orders}
                    onChange={(e) => setImportOptions({ ...importOptions, orders: e.target.checked })}
                    className="accent-blue-600 rounded"
                  />
                  <span>سجل الطلبات ({uploadedBackup.stats.ordersCount})</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
              <button
                onClick={() => handleExecuteRestore("merge")}
                className="w-full sm:w-auto px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>دمج وتحديث البيانات (Merge)</span>
              </button>

              <button
                onClick={() => handleExecuteRestore("overwrite")}
                className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>استبدال شامل واستعادة كاملة (Clean Overwrite)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: EXPORT HUB (CARDS FOR FULL & SELECTIVE EXPORTS) */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">تصدير مخصص ومتقدم</h3>
              <p className="text-[11px] text-neutral-500">تصدير المنتجات أو الطلبات أو الأقسام بصيغ JSON و Excel/CSV</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Products Excel XLSX */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-black">شيت المنتجات (Excel XLSX)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير جدول المنتجات بالكامل كملف Excel احترافي مع كافة المقاسات، الألوان، الأسعار وتفاصيل المخزون للتعديل الجماعي وإعادة الرفع.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  exportProductsToExcel(adminData.products, adminData.categories);
                  showToast("✅ تم تصدير شيت Excel للمنتجات بنجاح!");
                }}
                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل ملف Excel (.xlsx) ({adminData.products.length} منتج)</span>
              </button>
              <button
                onClick={() => {
                  exportProductsExcelTemplate();
                  showToast("✅ تم تحميل نموذج إكسيل فارغ جاهز!");
                }}
                className="w-full px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span>تحميل نموذج Excel فارغ مع أمثلة</span>
              </button>
            </div>
          </div>

          {/* Card 2: Orders Excel XLSX */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-800">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h4 className="text-xs font-black">سجل الطلبات (Excel XLSX)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير كشف حساب كامل بطلبات العملاء، أرقام الهواتف، المحافظات، الإجماليات، وحالات الشحن في جدول Excel منسق.
              </p>
            </div>
            <button
              onClick={() => {
                exportOrdersToExcel(orders);
                showToast("✅ تم تصدير شيت الطلبات إلى Excel بنجاح!");
              }}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل شيت الطلبات Excel ({orders.length} طلب)</span>
            </button>
          </div>

          {/* Card 3: Products JSON */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-800">
                <ShoppingBag className="w-5 h-5 text-neutral-700" />
                <h4 className="text-xs font-black">المنتجات فقط (JSON)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير بيانات المنتجات فقط مع الألوان، المقاسات، هوامش الربح، والمخزون بصيغة JSON.
              </p>
            </div>
            <button
              onClick={() => exportSelectiveEntities("products", adminData.products)}
              className="w-full px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير المنتجات ({adminData.products.length})</span>
            </button>
          </div>

          {/* Card 4: Categories & Banners JSON */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-800">
                <Layers className="w-5 h-5 text-purple-600" />
                <h4 className="text-xs font-black">الأقسام والبنرات (JSON)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير الأقسام الرئيسية، أقسام العروض الموسمية، وشرائح البانر الإعلاني وروابطها.
              </p>
            </div>
            <button
              onClick={() =>
                exportSelectiveEntities("categories_and_banners", {
                  categories: adminData.categories,
                  offerCategories: adminData.offerCategories,
                  banners: adminData.banners,
                })
              }
              className="w-full px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الأقسام والبنرات</span>
            </button>
          </div>

          {/* Card 5: Coupons & Promo Codes */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-800">
                <Tag className="w-5 h-5 text-amber-600" />
                <h4 className="text-xs font-black">أكواد الخصم والكوبونات (JSON)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير أكواد الخصم والبرومو كود ونسب الخصم والحد الأدنى للطلبات.
              </p>
            </div>
            <button
              onClick={() => exportSelectiveEntities("coupons", adminData.coupons || [])}
              className="w-full px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الكوبونات ({adminData.coupons?.length || 0})</span>
            </button>
          </div>

          {/* Card 6: Store Settings (Footer & Splash Screen) */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-neutral-800">
                <Sparkles className="w-5 h-5 text-[#aa8010]" />
                <h4 className="text-xs font-black">إعدادات الفوتر وشاشة البداية (JSON)</h4>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                تصدير تخصيصات الفوتر، الضمانات، طرق الدفع، وألوان وثيم شاشة البداية.
              </p>
            </div>
            <button
              onClick={() =>
                exportSelectiveEntities("store_customization", {
                  footerConfig: adminData.footerConfig,
                  splashScreenConfig: adminData.splashScreenConfig,
                })
              }
              className="w-full px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير الإعدادات المخصصة</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: INSTANT LOCAL SNAPSHOTS */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-neutral-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">نقاط الاستعادة المحفوظة (Snapshots)</h3>
              <p className="text-[11px] text-neutral-500">
                سجل النقاط المحفوظة محلياً في المتصفح للرجوع السريع لأي حالة سابقة
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreatingSnapshot(true)}
            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نقطة جديدة</span>
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-neutral-600">لا توجد نقاط استعادة محفوظة حتى الآن</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              يمكنك إنشاء نقطة استعادة بضغطة زر لحفظ حالة متجرك قبل إجراء تعديلات كبيرة.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <h4 className="text-xs font-black text-neutral-900">{s.name}</h4>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {s.createdAt} | {s.stats.productsCount} منتج | {s.stats.categoriesCount} قسم | {s.stats.ordersCount} طلب
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleRestoreSnapshot(s)}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="استعادة المتجر إلى هذه الحالة فوراً"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>استعادة الآن</span>
                  </button>

                  <button
                    onClick={() =>
                      downloadFile(
                        JSON.stringify(s.payload, null, 2),
                        `sotra_snapshot_${s.id}.json`,
                        "application/json"
                      )
                    }
                    className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 cursor-pointer"
                    title="تنزيل كملف JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteSnapshot(s.id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                    title="حذف هذه النقطة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
