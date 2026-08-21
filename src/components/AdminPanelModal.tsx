import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Package,
  Layers,
  Image as ImageIcon,
  Tag,
  ShoppingBag,
  Percent,
  CheckCircle2,
  Ban,
  Clock,
  Save,
  Truck,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Phone,
  MapPin,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  AdminData,
  Category,
  OfferCategory,
  Product,
  BannerSlide,
  PromoCode,
  Order,
  PromoType,
  OrderStatus,
  ColorVariant,
} from "../types";
import { getInvKey, saveAdminData, cancelOrder, updateOrderStatus } from "../utils/storage";
import { SOTRA_PRODUCT_PLACEHOLDER } from "../assets/placeholder";

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminData: AdminData;
  orders: Order[];
  onUpdateAdminData: (data: AdminData) => void;
  onUpdateOrders: (orders: Order[]) => void;
  lang: "ar" | "en";
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const BADGE_OPTIONS = [
  { type: "", text: "", textAr: "بدون شارة" },
  { type: "new", text: "NEW ARRIVAL", textAr: "جديد" },
  { type: "discount", text: "SALE", textAr: "خصم حصري" },
  { type: "exclusive", text: "EXCLUSIVE", textAr: "حصري" },
  { type: "bestseller", text: "BESTSELLER", textAr: "الأكثر مبيعاً" },
  { type: "restocked", text: "RESTOCKED", textAr: "تم التجديد" },
  { type: "limited", text: "LIMITED", textAr: "إصدار محدود" },
];

const ORDER_STATUS_FLOW: { status: OrderStatus; labelAr: string; labelEn: string; color: string }[] = [
  { status: "pending_payment", labelAr: "بانتظار الدفع", labelEn: "Pending Payment", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { status: "payment_confirmed", labelAr: "تأكيد الدفع", labelEn: "Payment Confirmed", color: "bg-blue-100 text-blue-900 border-blue-300" },
  { status: "preparing", labelAr: "تجهيز الطلب", labelEn: "Preparing Order", color: "bg-purple-100 text-purple-900 border-purple-300" },
  { status: "shipped", labelAr: "الشحن", labelEn: "Shipped", color: "bg-indigo-100 text-indigo-900 border-indigo-300" },
  { status: "delivered", labelAr: "تم التوصيل", labelEn: "Delivered", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { status: "cancelled", labelAr: "ملغي (استرجاع المخزون)", labelEn: "Cancelled", color: "bg-red-100 text-red-900 border-red-300" },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminData,
  orders,
  onUpdateAdminData,
  onUpdateOrders,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<
    "orders" | "products" | "categories" | "offerCategories" | "banners" | "inventory" | "coupons"
  >("orders");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search queries
  const [prodSearch, setProdSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");

  // Sub-modals for editing
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingOfferCat, setEditingOfferCat] = useState<OfferCategory | null>(null);
  const [isOfferCatModalOpen, setIsOfferCatModalOpen] = useState(false);

  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<PromoCode | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const [editingInvProduct, setEditingInvProduct] = useState<Product | null>(null);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // CATEGORIES CRUD
  const handleSaveCategory = (cat: Category) => {
    let updatedCats = [...adminData.categories];
    const idx = updatedCats.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      updatedCats[idx] = cat;
    } else {
      updatedCats.push(cat);
    }
    const newData = { ...adminData, categories: updatedCats };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    setIsCategoryModalOpen(false);
    showToast("تم حفظ القسم بنجاح");
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    const updatedCats = adminData.categories.filter((c) => c.id !== catId);
    const newData = { ...adminData, categories: updatedCats };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم حذف القسم");
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const updated = [...adminData.categories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    const newData = { ...adminData, categories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
  };

  // OFFER CATEGORIES CRUD
  const handleSaveOfferCategory = (cat: OfferCategory) => {
    let updated = [...adminData.offerCategories];
    const idx = updated.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      updated[idx] = cat;
    } else {
      updated.push(cat);
    }
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    setIsOfferCatModalOpen(false);
    showToast("تم حفظ قسم العروض");
  };

  const handleToggleOfferCatVisibility = (catId: string) => {
    const updated = adminData.offerCategories.map((oc) =>
      oc.id === catId ? { ...oc, isVisible: oc.isVisible === false ? true : false } : oc
    );
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم تحديث حالة ظهور قسم العروض");
  };

  const handleDeleteOfferCategory = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف قسم العروض؟")) return;
    const updated = adminData.offerCategories.filter((c) => c.id !== id);
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم حذف قسم العروض");
  };

  // BANNERS CRUD
  const handleSaveBanner = (b: BannerSlide) => {
    let updated = [...adminData.banners];
    const idx = updated.findIndex((x) => String(x.id) === String(b.id));
    if (idx >= 0) {
      updated[idx] = b;
    } else {
      updated.push(b);
    }
    const newData = { ...adminData, banners: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    setIsBannerModalOpen(false);
    showToast("تم حفظ شريحة البنر الإعلاني");
  };

  const handleDeleteBanner = (id: number | string) => {
    if (!confirm("هل أنت متأكد من حذف الشريحة؟")) return;
    const updated = adminData.banners.filter((b) => String(b.id) !== String(id));
    const newData = { ...adminData, banners: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم حذف الشريحة");
  };

  // PRODUCTS CRUD
  const handleSaveProduct = (p: Product) => {
    // Ensure inventory matrix is prepared
    const updatedInv = { ...(p.inventory || {}) };
    (p.colors || []).forEach((col) => {
      (p.sizes || []).forEach((sz) => {
        const k = getInvKey(col.nameAr, col.name, sz);
        if (!updatedInv[k]) {
          updatedInv[k] = {
            qty: 10,
            wholesalePrice: Math.round(p.price * 0.6),
            salePrice: p.price,
          };
        }
      });
    });
    const productToSave: Product = {
      ...p,
      inventory: updatedInv,
      inStock: Object.values(updatedInv).some((v) => Number(v.qty) > 0),
    };

    let updated = [...adminData.products];
    const idx = updated.findIndex((x) => x.id === productToSave.id);
    if (idx >= 0) {
      updated[idx] = productToSave;
    } else {
      updated.push(productToSave);
    }
    const newData = { ...adminData, products: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    setIsProductModalOpen(false);
    showToast("تم حفظ بيانات المنتج وتحديث المخزون بنجاح");
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) return;
    const updated = adminData.products.filter((p) => p.id !== id);
    const newData = { ...adminData, products: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم حذف المنتج");
  };

  // COUPONS CRUD
  const handleSaveCoupon = (c: PromoCode) => {
    const existing = adminData.coupons || [];
    let updated = [...existing];
    const idx = updated.findIndex((x) => x.id === c.id || x.code.toUpperCase() === c.code.toUpperCase());
    if (idx >= 0) {
      updated[idx] = c;
    } else {
      updated.push(c);
    }
    const newData = { ...adminData, coupons: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    setIsCouponModalOpen(false);
    showToast("تم حفظ كود الخصم بنجاح");
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    const existing = adminData.coupons || [];
    const updated = existing.filter((c) => c.id !== id);
    const newData = { ...adminData, coupons: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    showToast("تم حذف الكوبون");
  };

  // ORDER STATUS CHANGE & SYNCHRONIZATION
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const res = updateOrderStatus(orderId, newStatus, orders);
    if (res.success && res.updatedOrders.length > 0) {
      onUpdateOrders(res.updatedOrders);
    } else {
      const fallbackList = orders.map((o) =>
        o.orderId === orderId ? { ...o, trackingStatus: newStatus, updatedAt: new Date().toISOString() } : o
      );
      onUpdateOrders(fallbackList);
    }

    const statusObj = ORDER_STATUS_FLOW.find((s) => s.status === newStatus);
    showToast(
      newStatus === "cancelled"
        ? "تم إلغاء الطلب وإرجاع المنتجات للمخزون"
        : `تم تحديث حالة الطلب إلى: ${statusObj?.labelAr || newStatus}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      <div className="min-h-full flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-scale-in text-start flex flex-col max-h-[92vh]">
          {/* Top Header */}
          <div className="px-5 py-4 bg-neutral-950 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#dc2626] flex items-center justify-center font-black font-brand text-sm text-white shadow-md">
                S
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase font-brand flex items-center gap-2">
                  <span>SOTRA FASHION</span>
                  <span className="text-xs bg-red-600 px-2 py-0.5 rounded text-white font-mono">ADMIN CONTROL</span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  لوحة تحكم المتجر، تتبع وتحديث الطلبات، إدارة المنتجات، الأقسام، العروض والبانر
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-neutral-100 p-1.5 border-b border-neutral-200 overflow-x-auto no-scrollbar gap-1 flex-shrink-0">
            {[
              { id: "orders", label: "📋 تتبع وإدارة الطلبات", count: orders.length },
              { id: "products", label: "👕 المنتجات وتفاصيلها", count: adminData.products.length },
              { id: "categories", label: "🗂️ الأقسام الرئيسية", count: adminData.categories.length },
              { id: "offerCategories", label: "🏷️ أقسام العروض (إظهار/إخفاء)", count: adminData.offerCategories.length },
              { id: "banners", label: "📣 البانر الإعلاني والروابط", count: adminData.banners.length },
              { id: "inventory", label: "📦 المخزون وهوامش الربح", count: adminData.products.length },
              { id: "coupons", label: "🎟️ البرومو كود والخصومات", count: adminData.coupons?.length || 0 },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer font-arabic ${
                  activeTab === t.id
                    ? "bg-neutral-950 text-white shadow-xs"
                    : "bg-white text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-brand ${
                    activeTab === t.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {toastMessage && (
            <div className="mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Main Body per Tab */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* 1. ORDERS MANAGEMENT TAB (With exact 5 statuses flow) */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">
                      تتبع طلبات المنتجات وتأكيد الدفع والشحن
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      تتبع مباشر لطلبات العملاء مع رقم تحويل رسوم الشحن فودافون كاش وتحديث الحالات متزامن مع صفحة العميل.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <select
                      value={ordersStatusFilter}
                      onChange={(e) => setOrdersStatusFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white outline-none cursor-pointer"
                    >
                      <option value="all">جميع الحالات ({orders.length})</option>
                      {ORDER_STATUS_FLOW.map((s) => (
                        <option key={s.status} value={s.status}>
                          {s.labelAr}
                        </option>
                      ))}
                    </select>
                    <input
                      type="search"
                      placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                    />
                  </div>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center bg-neutral-50 rounded-2xl text-neutral-500 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300" />
                    <p className="text-sm font-bold">لا توجد طلبات مسجلة حتى الآن.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .filter((o) => {
                        const matchesFilter = ordersStatusFilter === "all" || o.trackingStatus === ordersStatusFilter;
                        const q = ordersSearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          (o.orderId && o.orderId.toLowerCase().includes(q)) ||
                          (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q)) ||
                          (o.customer?.phoneNumber && o.customer.phoneNumber.includes(q)) ||
                          (o.vodafoneSenderPhone && o.vodafoneSenderPhone.includes(q)) ||
                          (o.shippingTransferNumber && o.shippingTransferNumber.includes(q));
                        return matchesFilter && matchesSearch;
                      })
                      .map((o) => {
                        const currentStatusObj = ORDER_STATUS_FLOW.find((s) => s.status === o.trackingStatus) || ORDER_STATUS_FLOW[0];
                        const isCancelled = o.trackingStatus === "cancelled";

                        return (
                          <div
                            key={o.orderId}
                            className={`p-4 sm:p-5 rounded-2xl border bg-white space-y-4 transition-all shadow-xs ${
                              isCancelled ? "border-red-200 bg-red-50/10" : "border-neutral-200"
                            }`}
                          >
                            {/* Order Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-base font-brand text-neutral-950">
                                    {o.orderId}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${currentStatusObj.color}`}>
                                    {currentStatusObj.labelAr}
                                  </span>
                                  <span className="text-xs text-neutral-400">
                                    {new Date(o.createdAt).toLocaleString("ar-EG")}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-neutral-700 font-bold flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                    {o.customer?.fullName || "عميل"} ({o.customer?.phoneNumber || "بدون هاتف"})
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                    {o.governorateNameAr || ""} - {o.customer?.detailedAddress || ""}
                                  </span>
                                </div>

                                {/* Shipping Transfer Details */}
                                {(o.vodafoneSenderPhone || o.shippingTransferNumber) && (
                                  <div className="mt-1 flex items-center gap-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg w-fit">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                                    <span>
                                      رقم تحويل رسوم الشحن (فودافون كاش):{" "}
                                      <strong className="font-mono">{o.vodafoneSenderPhone || o.shippingTransferNumber}</strong>
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Status Action & Total */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                <div className="text-end">
                                  <span className="text-xs text-neutral-400 block">إجمالي الطلب</span>
                                  <span className="font-black font-brand text-lg text-neutral-950">
                                    LE {Number(o.total ?? (o as any).totalAmount ?? o.remainingUponDelivery ?? 0).toFixed(2)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-bold text-neutral-600">الحالة:</label>
                                  <select
                                    value={o.trackingStatus}
                                    onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value as OrderStatus)}
                                    className="px-3 py-2 text-xs font-bold rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-white focus:border-neutral-950 outline-none cursor-pointer transition-colors"
                                  >
                                    {ORDER_STATUS_FLOW.map((s) => (
                                      <option key={s.status} value={s.status}>
                                        {s.labelAr}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {(o.items || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs"
                                >
                                  <img
                                    src={item?.selectedColor?.image || SOTRA_PRODUCT_PLACEHOLDER}
                                    alt={item?.titleAr || item?.title || "Product"}
                                    className="w-10 h-12 object-cover rounded-lg bg-neutral-200 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-neutral-900 truncate">{item?.titleAr || item?.title}</p>
                                    <p className="text-[11px] text-neutral-500">
                                      {item?.selectedColor?.nameAr || item?.selectedColor?.name || ""} | مقاس: <span className="font-bold">{item?.selectedSize}</span> | عدد: <span className="font-bold">{item?.quantity}</span>
                                    </p>
                                    <p className="text-[11px] font-bold text-neutral-900 font-brand">
                                      LE {((Number(item?.price) || 0) * (Number(item?.quantity) || 1)).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 2. PRODUCTS TAB */}
            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">إدارة وتعديل المنتجات</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      إضافة منتج كامل بجميع البيانات، الألوان، المقاسات، وربطه بأقسام العروض والشارات.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="search"
                      placeholder="ابحث باسم المنتج..."
                      value={prodSearch}
                      onChange={(e) => setProdSearch(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white outline-none w-full sm:w-48"
                    />
                    <button
                      onClick={() => {
                        setEditingProduct({
                          id: "sotra-prod-" + Date.now(),
                          title: "New SOTRA Item",
                          titleAr: "منتج سترة الجديد",
                          fit: "Regular Fit",
                          fitAr: "قصة عصرية",
                          category: adminData.categories[0]?.id || "tops",
                          offerCategory: adminData.offerCategories[0]?.id || "",
                          price: 650,
                          originalPrice: 850,
                          colors: [
                            {
                              name: "Black",
                              nameAr: "أسود",
                              hex: "#111111",
                              image: SOTRA_PRODUCT_PLACEHOLDER,
                            },
                          ],
                          sizes: ["M", "L", "XL", "XXL"],
                          fabric: "Premium Imported Fabric",
                          fabricAr: "خامات تركية وعالمية فاخرة",
                          description: "High quality piece designed for comfort and style.",
                          descriptionAr: "قطعة مصنوعة من أجود الخامات المستوردة مع تشطيب فندقي فاخر.",
                          features: ["Breathable", "Premium Stitching"],
                          featuresAr: ["مقاوم للانكماش والتعرق", "تقفيل خياطة مزدوجة فاخرة"],
                          badge: { type: "new", text: "NEW", textAr: "جديد" },
                          inStock: true,
                          isNewArrival: true,
                          inventory: {},
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة منتج جديد</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminData.products
                    .filter((p) => (p.titleAr || p.title).toLowerCase().includes(prodSearch.toLowerCase()))
                    .map((p) => {
                      const offerCat = adminData.offerCategories.find((oc) => oc.id === p.offerCategory);
                      const cat = adminData.categories.find((c) => c.id === p.category);

                      return (
                        <div
                          key={p.id}
                          className="p-3.5 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs hover:border-neutral-400 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.colors[0]?.image || SOTRA_PRODUCT_PLACEHOLDER}
                              alt={p.title}
                              className="w-14 h-16 object-cover rounded-xl bg-neutral-100 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-black text-neutral-950 truncate">{p.titleAr || p.title}</h4>
                                {p.badge && (
                                  <span className="px-1.5 py-0.2 bg-neutral-950 text-white text-[10px] font-black rounded uppercase">
                                    {p.badge.textAr || p.badge.text}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 flex-wrap">
                                <span className="font-black text-neutral-900 font-brand">LE {p.price}</span>
                                {p.originalPrice && (
                                  <span className="line-through text-neutral-400">LE {p.originalPrice}</span>
                                )}
                                <span>•</span>
                                <span className="text-neutral-600">{cat?.nameAr || p.category}</span>
                                {offerCat && (
                                  <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] rounded font-bold">
                                    {offerCat.nameAr}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-700 cursor-pointer"
                              title="تعديل كافة بيانات المنتج"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 3. CATEGORIES TAB */}
            {activeTab === "categories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">الأقسام الرئيسية</h3>
                    <p className="text-xs text-neutral-500">تظهر في الشريط العلوي ودولاب الأقسام الثلاثي الأبعاد.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCategory({
                        id: "cat-" + Date.now(),
                        name: "New Category",
                        nameAr: "قسم جديد",
                        image: SOTRA_PRODUCT_PLACEHOLDER,
                      });
                      setIsCategoryModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم رئيسي</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adminData.categories.map((c, idx) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img src={c.image || SOTRA_PRODUCT_PLACEHOLDER} alt={c.name} className="w-12 h-14 object-cover rounded-lg bg-neutral-100" />
                        <div>
                          <h4 className="text-sm font-black text-neutral-950">{c.nameAr || c.name}</h4>
                          <span className="text-xs text-neutral-400 font-brand">ID: {c.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveCategory(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveCategory(idx, "down")}
                          disabled={idx === adminData.categories.length - 1}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. OFFER CATEGORIES TAB (With Show/Hide Toggle) */}
            {activeTab === "offerCategories" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">أقسام العروض والتخفيضات (إظهار / إخفاء)</h3>
                    <p className="text-xs text-neutral-500">
                      يمكنك إظهار أو إخفاء أي قسم عروض من المتجر بنقرة زر واحدة دون حذفه.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingOfferCat({
                        id: "offer-" + Date.now(),
                        name: "Special Offers",
                        nameAr: "عروض الموسم",
                        image: SOTRA_PRODUCT_PLACEHOLDER,
                        isVisible: true,
                      });
                      setIsOfferCatModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة قسم عروض</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adminData.offerCategories.map((oc) => {
                    const isVisible = oc.isVisible !== false;
                    const prodCount = adminData.products.filter((p) => p.offerCategory === oc.id).length;

                    return (
                      <div
                        key={oc.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isVisible ? "bg-white border-neutral-200 shadow-2xs" : "bg-neutral-50 border-neutral-300 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={oc.image || SOTRA_PRODUCT_PLACEHOLDER}
                            alt={oc.name}
                            className="w-12 h-14 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-neutral-950 truncate">{oc.nameAr || oc.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isVisible ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                                }`}
                              >
                                {isVisible ? "ظاهر بالمتجر" : "مخفي"}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-500">{prodCount} منتجات مضافة لهذا العرض</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Show/Hide Toggle Button */}
                          <button
                            onClick={() => handleToggleOfferCatVisibility(oc.id)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isVisible ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "text-neutral-600 bg-neutral-200 hover:bg-neutral-300"
                            }`}
                            title={isVisible ? "إخفاء قسم العروض من الصفحة الرئيسية" : "إظهار قسم العروض"}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => {
                              setEditingOfferCat(oc);
                              setIsOfferCatModalOpen(true);
                            }}
                            className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-700 cursor-pointer"
                            title="تعديل البيانات"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteOfferCategory(oc.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. BANNERS TAB (Linked to Category or Product) */}
            {activeTab === "banners" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">البانر الإعلاني والربط بالأقسام والمنتجات</h3>
                    <p className="text-xs text-neutral-500">
                      يمكنك ربط كل شريحة بنر بفتح قسم رئيسي، أو قسم عروض، أو فتح صفحة منتج محدد مباشرة.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingBanner({
                        id: Date.now(),
                        image: SOTRA_PRODUCT_PLACEHOLDER,
                        targetCategory: adminData.categories[0]?.id || "tops",
                        targetType: "category",
                      });
                      setIsBannerModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة شريحة بنر</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {adminData.banners.map((b, idx) => {
                    let targetLabel = "قسم رئيسي: " + (adminData.categories.find((c) => c.id === b.targetCategory)?.nameAr || b.targetCategory);
                    if (b.targetType === "offer_category") {
                      targetLabel = "قسم عروض: " + (adminData.offerCategories.find((oc) => oc.id === (b.targetOfferCategory || b.targetCategory))?.nameAr || "عروض");
                    } else if (b.targetType === "product") {
                      targetLabel = "منتج محدد: " + (adminData.products.find((p) => p.id === b.targetProduct)?.titleAr || "منتج");
                    }

                    return (
                      <div
                        key={b.id}
                        className="p-4 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={b.image || SOTRA_PRODUCT_PLACEHOLDER}
                            alt="Banner"
                            className="w-28 h-16 object-cover rounded-xl bg-neutral-100 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-neutral-900">شريحة بنر #{idx + 1}</h4>
                            <p className="text-xs text-neutral-600 flex items-center gap-1.5 mt-1 truncate">
                              <LinkIcon className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                              <span className="font-bold text-neutral-800">{targetLabel}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingBanner(b);
                              setIsBannerModalOpen(true);
                            }}
                            className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-700 cursor-pointer"
                            title="تعديل الشريحة والرابط"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. INVENTORY TAB */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">
                      إدارة المخزون اللحظي، تكلفة الجملة وهوامش الربح
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      يتم خصم الكميات آلياً عند الشراء، وعند إلغاء أي أوردر تعود الكمية فوراً للمخزن.
                    </p>
                  </div>
                  <input
                    type="search"
                    placeholder="ابحث باسم المنتج..."
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                  />
                </div>

                <div className="space-y-3">
                  {adminData.products
                    .filter((p) => (p.titleAr || p.title).toLowerCase().includes(invSearch.toLowerCase()))
                    .map((prod) => {
                      const colors = prod.colors || [{ name: "عام", nameAr: "عام", hex: "#111" }];
                      const sizes = prod.sizes || ["L"];
                      let totalQty = 0;
                      let totalWholesale = 0;
                      let totalRetail = 0;

                      colors.forEach((col) => {
                        sizes.forEach((sz) => {
                          const k = getInvKey(col.nameAr, col.name, sz);
                          const entry = prod.inventory?.[k] || { qty: 10, wholesalePrice: 0, salePrice: prod.price };
                          const q = Number(entry.qty) || 0;
                          totalQty += q;
                          totalWholesale += q * (Number(entry.wholesalePrice) || 0);
                          totalRetail += q * (Number(entry.salePrice) || prod.price);
                        });
                      });

                      return (
                        <div
                          key={prod.id}
                          className="p-4 bg-white rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.colors[0]?.image || SOTRA_PRODUCT_PLACEHOLDER}
                              alt={prod.title}
                              className="w-12 h-14 object-cover rounded-lg bg-neutral-100"
                            />
                            <div>
                              <h4 className="text-sm font-black text-neutral-950">{prod.titleAr || prod.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                                <span>
                                  إجمالي القطع:{" "}
                                  <strong className={totalQty <= 5 ? "text-amber-600" : "text-neutral-900"}>
                                    {totalQty} قطعة
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  قيمة البيع: <strong className="text-neutral-900 font-brand">LE {totalRetail}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setEditingInvProduct(prod);
                              setIsInvModalOpen(true);
                            }}
                            className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Package className="w-4 h-4" />
                            <span>تعديل كميات الألوان والمقاسات</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 7. COUPONS TAB */}
            {activeTab === "coupons" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                  <div>
                    <h3 className="text-sm font-black text-neutral-900">أكواد الخصم والبرومو كود</h3>
                    <p className="text-xs text-neutral-500">
                      شحن مجاني، خصم نسبة مئوية، أو خصم مبلغ نقدي ثابت.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCoupon({
                        id: "coupon-" + Date.now(),
                        code: "SOTRA10",
                        type: "percentage",
                        value: 10,
                        minOrderAmount: 0,
                        descriptionAr: "خصم خاص 10%",
                        isActive: true,
                      });
                      setIsCouponModalOpen(true);
                    }}
                    className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة كود خصم جديد</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(adminData.coupons || []).map((cp) => (
                    <div
                      key={cp.id}
                      className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                        cp.isActive ? "border-neutral-200" : "border-neutral-300 opacity-60 bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-brand font-black text-sm px-3 py-1 bg-neutral-950 text-white rounded-lg uppercase tracking-wider">
                            {cp.code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cp.type === "free_shipping"
                                ? "bg-blue-100 text-blue-800"
                                : cp.type === "percentage"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {cp.type === "free_shipping"
                              ? "🚚 شحن مجاني"
                              : cp.type === "percentage"
                              ? `خصم ${cp.value}%`
                              : `خصم ${cp.value} ج.م`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCoupon(cp);
                              setIsCouponModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-700 font-semibold">{cp.descriptionAr}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sub-Modal: FULL PRODUCT EDITOR */}
          {isProductModalOpen && editingProduct && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-black text-base text-neutral-950 font-brand">
                      {editingProduct.id ? "تعديل منتج" : "إضافة منتج جديد"}
                    </h3>
                    <p className="text-xs text-neutral-500">إضافة جميع معلومات المنتج والربط بقسم العروض والشارات</p>
                  </div>
                  <button onClick={() => setIsProductModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المنتج (بالعربي) *</label>
                    <input
                      type="text"
                      value={editingProduct.titleAr}
                      onChange={(e) => setEditingProduct({ ...editingProduct, titleAr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                      placeholder="مثال: تيشرت قطن تركي أوفر سايز"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المنتج (English) *</label>
                    <input
                      type="text"
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                      placeholder="e.g. SOTRA Heavy Oversized Tee"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">السعر الحالي (ج.م) *</label>
                    <input
                      type="number"
                      min="1"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">السعر قبل الخصم (ج.م اختياري)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.originalPrice || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          originalPrice: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                      placeholder="مثال: 850"
                    />
                  </div>

                  {/* Categories selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">القسم الرئيسي *</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 cursor-pointer"
                    >
                      {adminData.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr || c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Offer Categories selection */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">إضافة إلى قسم العروض (اختياري)</label>
                    <select
                      value={editingProduct.offerCategory || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, offerCategory: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 cursor-pointer"
                    >
                      <option value="">بدون قسم عروض</option>
                      {adminData.offerCategories.map((oc) => (
                        <option key={oc.id} value={oc.id}>
                          🏷️ {oc.nameAr || oc.name} {oc.isVisible === false ? "(مخفي)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Badge */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">شارة المنتج (أعلى الكارت)</label>
                    <select
                      value={editingProduct.badge?.type || ""}
                      onChange={(e) => {
                        const opt = BADGE_OPTIONS.find((b) => b.type === e.target.value);
                        if (!opt || !opt.type) {
                          setEditingProduct({ ...editingProduct, badge: undefined });
                        } else {
                          setEditingProduct({
                            ...editingProduct,
                            badge: { type: opt.type as any, text: opt.text, textAr: opt.textAr },
                          });
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 cursor-pointer"
                    >
                      {BADGE_OPTIONS.map((b, bIdx) => (
                        <option key={b.type || `badge-${bIdx}`} value={b.type}>
                          {b.textAr} {b.text ? `(${b.text})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fit type */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">نوع القصة (Fit)</label>
                    <input
                      type="text"
                      value={editingProduct.fitAr || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fitAr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                      placeholder="مثال: قصة مريحة واسعة أوفرسايز"
                    />
                  </div>

                  {/* Fabric */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">الخامة والتصنيع</label>
                    <input
                      type="text"
                      value={editingProduct.fabricAr || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fabricAr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                      placeholder="أفضل الخامات التركية والعالمية 100% قطن فاخر"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">وصف المنتج</label>
                    <textarea
                      rows={2}
                      value={editingProduct.descriptionAr || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                      placeholder="وصف تفصيلي للخامة والمظهر..."
                    />
                  </div>

                  {/* Colors variants */}
                  <div className="sm:col-span-2 space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-neutral-900">الألوان المتاحة والصور</label>
                      <button
                        type="button"
                        onClick={() => {
                          const newCols = [
                            ...(editingProduct.colors || []),
                            {
                              name: "Color",
                              nameAr: "لون جديد",
                              hex: "#333333",
                              image: SOTRA_PRODUCT_PLACEHOLDER,
                            },
                          ];
                          setEditingProduct({ ...editingProduct, colors: newCols });
                        }}
                        className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة لون</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(editingProduct.colors || []).map((col, cIdx) => (
                        <div key={cIdx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={col.hex}
                              onChange={(e) => {
                                const nextCols = [...editingProduct.colors];
                                nextCols[cIdx].hex = e.target.value;
                                setEditingProduct({ ...editingProduct, colors: nextCols });
                              }}
                              className="w-8 h-8 rounded border-none cursor-pointer p-0"
                            />
                            <input
                              type="text"
                              value={col.nameAr}
                              onChange={(e) => {
                                const nextCols = [...editingProduct.colors];
                                nextCols[cIdx].nameAr = e.target.value;
                                setEditingProduct({ ...editingProduct, colors: nextCols });
                              }}
                              placeholder="اسم اللون بالعربي"
                              className="w-28 px-2 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none"
                            />
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={col.image}
                              onChange={(e) => {
                                const nextCols = [...editingProduct.colors];
                                nextCols[cIdx].image = e.target.value;
                                setEditingProduct({ ...editingProduct, colors: nextCols });
                              }}
                              placeholder="رابط صورة اللون أو اتركها للصورة الافتراضية"
                              className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none font-sans"
                            />
                            {editingProduct.colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextCols = editingProduct.colors.filter((_, idx) => idx !== cIdx);
                                  setEditingProduct({ ...editingProduct, colors: nextCols });
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes selector */}
                  <div className="sm:col-span-2 space-y-2 border-t pt-3">
                    <label className="text-xs font-black text-neutral-900 block">المقاسات المتوفرة</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {AVAILABLE_SIZES.map((sz) => {
                        const isSelected = (editingProduct.sizes || []).includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              const currentSizes = editingProduct.sizes || [];
                              const nextSizes = isSelected
                                ? currentSizes.filter((s) => s !== sz)
                                : [...currentSizes, sz];
                              setEditingProduct({ ...editingProduct, sizes: nextSizes });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black font-brand transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                                : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(editingProduct)}
                    className="px-6 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    حفظ المنتج والمخزون
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Modal: CATEGORY EDITOR */}
          {isCategoryModalOpen && editingCategory && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-neutral-900">بيانات القسم الرئيسي</h3>
                  <button onClick={() => setIsCategoryModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">الاسم بالعربي *</label>
                  <input
                    type="text"
                    value={editingCategory.nameAr}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                    placeholder="مثال: البناطيل والشورتات"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">الاسم بالإنجليزي *</label>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand"
                    placeholder="e.g. Pants & Shorts"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">رابط الصورة</label>
                  <input
                    type="url"
                    value={editingCategory.image}
                    onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                    placeholder="رابط الصورة"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleSaveCategory(editingCategory)}
                    className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ القسم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Modal: OFFER CATEGORY EDITOR */}
          {isOfferCatModalOpen && editingOfferCat && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-neutral-900">بيانات قسم العروض</h3>
                  <button onClick={() => setIsOfferCatModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">اسم العرض بالعربي *</label>
                  <input
                    type="text"
                    value={editingOfferCat.nameAr}
                    onChange={(e) => setEditingOfferCat({ ...editingOfferCat, nameAr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                    placeholder="مثال: عروض الصيف والجمعة البيضاء"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">اسم العرض بالإنجليزي *</label>
                  <input
                    type="text"
                    value={editingOfferCat.name}
                    onChange={(e) => setEditingOfferCat({ ...editingOfferCat, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand"
                    placeholder="e.g. Summer Deals"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">رابط الصورة</label>
                  <input
                    type="url"
                    value={editingOfferCat.image}
                    onChange={(e) => setEditingOfferCat({ ...editingOfferCat, image: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border">
                  <span className="text-xs font-bold text-neutral-800">إظهار هذا القسم في الصفحة الرئيسية</span>
                  <input
                    type="checkbox"
                    checked={editingOfferCat.isVisible !== false}
                    onChange={(e) => setEditingOfferCat({ ...editingOfferCat, isVisible: e.target.checked })}
                    className="w-4 h-4 accent-neutral-950 cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleSaveOfferCategory(editingOfferCat)}
                    className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ قسم العروض
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Modal: BANNER EDITOR (Link to Category or Product) */}
          {isBannerModalOpen && editingBanner && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-neutral-900">إعداد البانر الإعلاني والربط</h3>
                  <button onClick={() => setIsBannerModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">رابط صورة البانر *</label>
                  <input
                    type="url"
                    value={editingBanner.image}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                    placeholder="رابط صورة البانر العريض"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">نوع الرابط (عند الضغط على البانر)</label>
                  <select
                    value={editingBanner.targetType || "category"}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none cursor-pointer"
                  >
                    <option value="category">ربط بقسم رئيسي</option>
                    <option value="offer_category">ربط بقسم من أقسام العروض</option>
                    <option value="product">ربط بمنتج محدد يفتح فوراً</option>
                  </select>
                </div>

                {/* Target dropdown according to targetType */}
                {(editingBanner.targetType === "category" || !editingBanner.targetType) && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">اختر القسم الرئيسي</label>
                    <select
                      value={editingBanner.targetCategory || adminData.categories[0]?.id}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetCategory: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none cursor-pointer"
                    >
                      {adminData.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editingBanner.targetType === "offer_category" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">اختر قسم العروض</label>
                    <select
                      value={editingBanner.targetOfferCategory || editingBanner.targetCategory || adminData.offerCategories[0]?.id}
                      onChange={(e) =>
                        setEditingBanner({
                          ...editingBanner,
                          targetOfferCategory: e.target.value,
                          targetCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none cursor-pointer"
                    >
                      {adminData.offerCategories.map((oc) => (
                        <option key={oc.id} value={oc.id}>
                          🏷️ {oc.nameAr || oc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editingBanner.targetType === "product" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">اختر المنتج المستهدف</label>
                    <select
                      value={editingBanner.targetProduct || adminData.products[0]?.id}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetProduct: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none cursor-pointer"
                    >
                      {adminData.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titleAr || p.title} (LE {p.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleSaveBanner(editingBanner)}
                    className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ البانر
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Modal: COUPON EDITOR */}
          {isCouponModalOpen && editingCoupon && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm text-neutral-900">بيانات كود الخصم</h3>
                  <button onClick={() => setIsCouponModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">كود الخصم *</label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-bold uppercase rounded-xl border border-neutral-300 outline-none font-brand"
                    placeholder="مثال: SOTRA15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">نوع الخصم</label>
                  <select
                    value={editingCoupon.type}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as PromoType })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none cursor-pointer"
                  >
                    <option value="percentage">٪ خصم نسبة مئوية</option>
                    <option value="free_shipping">🚚 شحن مجاني لكافة المحافظات</option>
                    <option value="fixed_amount">💵 خصم مبلغ نقدي ثابت (ج.م)</option>
                  </select>
                </div>
                {editingCoupon.type !== "free_shipping" && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      قيمة الخصم ({editingCoupon.type === "percentage" ? "% نسبة" : "ج.م مبلغ"})
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingCoupon.value}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">وصف الكوبون بالعربي</label>
                  <input
                    type="text"
                    value={editingCoupon.descriptionAr}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, descriptionAr: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                  />
                </div>
                <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl">
                  <span className="text-xs font-bold">مفعل حالياً بالمتجر</span>
                  <input
                    type="checkbox"
                    checked={editingCoupon.isActive}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                    className="w-4 h-4 accent-neutral-950 cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleSaveCoupon(editingCoupon)}
                    className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ كود الخصم
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Modal: INVENTORY MATRIX EDITOR */}
          {isInvModalOpen && editingInvProduct && (
            <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-2xl w-full shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-black text-sm text-neutral-900">
                    مخزون: {editingInvProduct.titleAr || editingInvProduct.title}
                  </h3>
                  <button onClick={() => setIsInvModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start border border-neutral-200 rounded-lg overflow-hidden">
                    <thead className="bg-neutral-100 font-bold text-neutral-700">
                      <tr>
                        <th className="p-2 text-start">اللون</th>
                        <th className="p-2 text-start">المقاس</th>
                        <th className="p-2 text-start">الكمية بالمخزن</th>
                        <th className="p-2 text-start">سعر الجملة (ج.م)</th>
                        <th className="p-2 text-start">سعر البيع (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-medium">
                      {(editingInvProduct.colors || []).map((col) =>
                        (editingInvProduct.sizes || []).map((sz) => {
                          const k = getInvKey(col.nameAr, col.name, sz);
                          const entry = editingInvProduct.inventory?.[k] || {
                            qty: 10,
                            wholesalePrice: Math.round(editingInvProduct.price * 0.6),
                            salePrice: editingInvProduct.price,
                          };

                          return (
                            <tr key={k} className="hover:bg-neutral-50">
                              <td className="p-2 flex items-center gap-1.5">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span>{col.nameAr || col.name}</span>
                              </td>
                              <td className="p-2 font-bold font-brand">{sz}</td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.qty}
                                  onChange={(e) => {
                                    const nextInv = { ...editingInvProduct.inventory };
                                    nextInv[k] = { ...entry, qty: Number(e.target.value) };
                                    setEditingInvProduct({ ...editingInvProduct, inventory: nextInv });
                                  }}
                                  className="w-16 px-2 py-1 border rounded text-xs outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.wholesalePrice || 0}
                                  onChange={(e) => {
                                    const nextInv = { ...editingInvProduct.inventory };
                                    nextInv[k] = { ...entry, wholesalePrice: Number(e.target.value) };
                                    setEditingInvProduct({ ...editingInvProduct, inventory: nextInv });
                                  }}
                                  className="w-20 px-2 py-1 border border-neutral-300 rounded text-xs outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.salePrice || editingInvProduct.price}
                                  onChange={(e) => {
                                    const nextInv = { ...editingInvProduct.inventory };
                                    nextInv[k] = { ...entry, salePrice: Number(e.target.value) };
                                    setEditingInvProduct({ ...editingInvProduct, inventory: nextInv });
                                  }}
                                  className="w-20 px-2 py-1 border border-neutral-300 rounded text-xs outline-none"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleSaveProduct(editingInvProduct);
                      setIsInvModalOpen(false);
                    }}
                    className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ المخزون
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              إغلاق لوحة التحكم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
