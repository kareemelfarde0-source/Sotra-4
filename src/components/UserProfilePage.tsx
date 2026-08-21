import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Package,
  Truck,
  ChevronDown,
  ChevronUp,
  Save,
  ShieldCheck,
  MapPin,
  Phone,
  Ban,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  Lock,
  Search,
  KeyRound,
} from "lucide-react";
import { CustomerProfile, Order } from "../types";
import { EGYPTIAN_GOVERNORATES } from "../data/defaultData";
import {
  cancelOrder,
  STORAGE_KEYS,
  saveCustomerProfileToFirebase,
  getCustomerProfileFromFirebase,
  sanitizeImageUrl,
  SOTRA_PRODUCT_PLACEHOLDER,
  filterCustomerOrders,
  cleanCustomerPhone,
  getMyOrderIds,
} from "../utils/storage";

const VODAFONE_CASH_WALLET_NUMBER = "01019284755";

interface UserProfilePageProps {
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  onRefreshData?: () => void;
  onBackToHome: () => void;
  lang: "ar" | "en";
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  orders,
  onUpdateOrders,
  onRefreshData,
  onBackToHome,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<CustomerProfile>({
    fullName: "",
    phoneNumber: "",
    secondaryPhone: "",
    governorateId: "cairo",
    detailedAddress: "",
    notes: "",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  // Quick lookup state if customer wants to switch or check another registered number
  const [isSwitchingPhone, setIsSwitchingPhone] = useState(false);
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setProfileData(parsed);
          setLookupPhone(parsed.phoneNumber || "");
          // Also fetch most recent profile from Firestore if phone exists
          if (parsed.phoneNumber) {
            getCustomerProfileFromFirebase(parsed.phoneNumber).then((remote) => {
              if (remote) {
                setProfileData((prev) => ({ ...prev, ...remote }));
              }
            });
          }
        }
      }
    } catch (e) {
      console.error("Failed to load user profile:", e);
    }
  }, []);

  // Filter orders strictly for the current registered customer
  const myOrders = useMemo(() => {
    return filterCustomerOrders(orders, profileData.phoneNumber);
  }, [orders, profileData.phoneNumber]);

  useEffect(() => {
    if (myOrders.length > 0 && !expandedOrderId) {
      setExpandedOrderId(myOrders[0].orderId);
    }
  }, [myOrders, expandedOrderId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDb(true);
    try {
      const clean = cleanCustomerPhone(profileData.phoneNumber);
      const updatedProfile = { ...profileData, phoneNumber: clean || profileData.phoneNumber };
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
      setProfileData(updatedProfile);
      // Save directly into Firebase customers collection
      await saveCustomerProfileToFirebase(updatedProfile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleLookupByPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanCustomerPhone(lookupPhone);
    if (!clean || clean.length < 10) {
      setLookupMessage(lang === "ar" ? "يرجى إدخال رقم هاتف صحيح (11 رقم)" : "Please enter a valid phone number");
      return;
    }

    setLookupLoading(true);
    setLookupMessage(null);
    try {
      const remote = await getCustomerProfileFromFirebase(clean);
      const newProfile: CustomerProfile = remote
        ? {
            fullName: remote.fullName || "",
            phoneNumber: remote.phoneNumber || clean,
            secondaryPhone: remote.secondaryPhone || "",
            governorateId: remote.governorateId || profileData.governorateId || "cairo",
            governorateNameAr: remote.governorateNameAr,
            detailedAddress: remote.detailedAddress || "",
            notes: remote.notes || "",
          }
        : {
            fullName: profileData.fullName || "",
            phoneNumber: clean,
            secondaryPhone: "",
            governorateId: profileData.governorateId || "cairo",
            detailedAddress: profileData.detailedAddress || "",
            notes: "",
          };

      setProfileData(newProfile);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
      setIsSwitchingPhone(false);
      setLookupMessage(
        lang === "ar"
          ? `تم ربط حسابك برقم (${clean}) بنجاح`
          : `Connected to (${clean}) successfully`
      );
      setTimeout(() => setLookupMessage(null), 3000);
    } catch (err) {
      console.warn("Lookup error:", err);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCopyWallet = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(VODAFONE_CASH_WALLET_NUMBER);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleConfirmCancelOrder = (orderId: string) => {
    const res = cancelOrder(orderId, "تم إلغاء الطلب بناءً على رغبة العميل وإرجاع المنتجات للمخزون", orders);
    if (res.success) {
      onUpdateOrders(res.updatedOrders);
      setCancelFeedback(
        lang === "ar"
          ? "تم إلغاء الطلب بنجاح وإرجاع كمية المنتجات للمخزن"
          : "Order cancelled and stock restored to warehouse!"
      );
      setCancelModalOrderId(null);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setCancelFeedback(null), 3500);
    } else {
      alert(res.message);
    }
  };

  const currentCleanPhone = cleanCustomerPhone(profileData.phoneNumber);

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-10 animate-fade-in text-start">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-neutral-600 hover:text-neutral-950 transition-colors font-brand cursor-pointer"
          >
            {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === "ar" ? "العودة للرئيسية" : "Back to Store"}</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-white border border-white/10">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide font-brand">
                {profileData.fullName
                  ? lang === "ar"
                    ? `أهلاً بك، ${profileData.fullName}`
                    : `Welcome, ${profileData.fullName}`
                  : lang === "ar"
                  ? "حسابي وتتبع طلباتي"
                  : "My Account & Orders"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 font-medium">
                {lang === "ar"
                  ? "متابعة طلباتك الشخصية، مراحل الشحن، وإدارة بيانات التوصيل"
                  : "Track your personal orders, delivery progress, and saved profile"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2 rounded-2xl border border-neutral-800 self-start sm:self-auto">
            <Package className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-neutral-200">
              {lang === "ar" ? `طلباتك المسجلة: ${myOrders.length}` : `Your Orders: ${myOrders.length}`}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 bg-white rounded-2xl p-1.5 shadow-2xs mb-6 gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-brand ${
              activeTab === "orders"
                ? "bg-neutral-950 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>
              {lang === "ar"
                ? `طلباتي وتتبع الشحن (${myOrders.length})`
                : `My Orders & Tracking (${myOrders.length})`}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-brand ${
              activeTab === "profile"
                ? "bg-neutral-950 text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{lang === "ar" ? "بياناتي المسجلة للشحن" : "Saved Delivery Profile"}</span>
          </button>
        </div>

        {/* Customer Phone Bar / Switcher */}
        <div className="mb-6 bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          {!isSwitchingPhone ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-500 font-medium block">
                    {lang === "ar" ? "رقم الهاتف المسجل للطلبات:" : "Registered Customer Phone:"}
                  </span>
                  {currentCleanPhone ? (
                    <span className="font-bold text-neutral-950 font-mono text-sm" dir="ltr">
                      {currentCleanPhone}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">
                      {lang === "ar" ? "لم يتم تحديد رقم هاتف بعد" : "No phone number saved yet"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSwitchingPhone(true)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer font-brand"
                >
                  <Search className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{currentCleanPhone ? (lang === "ar" ? "تغيير رقم الهاتف" : "Change Phone") : (lang === "ar" ? "إدخال رقم هاتفي لعرض طلباتي" : "Enter Phone to View Orders")}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLookupByPhone} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-neutral-600" />
                  {lang === "ar" ? "عرض الطلبات المسجلة برقم هاتف معين" : "Lookup orders by phone number"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSwitchingPhone(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-800 cursor-pointer"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2 border border-neutral-300 rounded-xl text-xs sm:text-sm font-mono font-bold outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="px-4 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lookupLoading ? (lang === "ar" ? "جاري البحث..." : "Searching...") : (lang === "ar" ? "تأكيد وعرض طلباتي" : "Find My Orders")}</span>
                </button>
              </div>
            </form>
          )}

          {lookupMessage && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{lookupMessage}</span>
            </div>
          )}
        </div>

        {cancelFeedback && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{cancelFeedback}</span>
          </div>
        )}

        {/* Tab 1: Orders List */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-neutral-200 shadow-2xs space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <Package className="w-8 h-8 stroke-1" />
                </div>
                <h3 className="text-base font-black text-neutral-900 uppercase font-brand">
                  {currentCleanPhone
                    ? lang === "ar"
                      ? `لا توجد طلبات مسجلة برقم الهاتف (${currentCleanPhone})`
                      : `No orders found for (${currentCleanPhone})`
                    : lang === "ar"
                    ? "لا توجد طلبات مسجلة بحسابك بعد"
                    : "No orders registered on your account"}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
                  {currentCleanPhone
                    ? lang === "ar"
                      ? "إذا كنت قد قمت بالطلب برقم هاتف آخر يمكنك الضغط على 'تغيير رقم الهاتف' أعلاه أو تسجيل طلب جديد الآن."
                      : "If you ordered with another number, switch phone number above or place a new order."
                    : lang === "ar"
                    ? "أدخل رقم هاتفك لتسجيل الدخول وعرض طلباتك ومتابعة تسلسل شحنها مباشرة."
                    : "Enter your phone number to view your orders and real-time shipping status."}
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  {!currentCleanPhone && (
                    <button
                      onClick={() => setIsSwitchingPhone(true)}
                      className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{lang === "ar" ? "إدخال رقم الهاتف" : "Enter Phone"}</span>
                    </button>
                  )}
                  <button
                    onClick={onBackToHome}
                    className="px-6 py-2.5 bg-neutral-950 hover:bg-black text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer shadow-2xs"
                  >
                    {lang === "ar" ? "تسوق الآن" : "Shop Drops"}
                  </button>
                </div>
              </div>
            ) : (
              (myOrders || []).map((order, oIdx) => {
                const isExpanded = expandedOrderId === order.orderId;
                const isCancelled = order.trackingStatus === "cancelled";
                const hasVodafone = !!order.vodafoneSenderPhone;
                const orderKey = order.orderId ? `myorder-${order.orderId}-${oIdx}` : `myorder-idx-${oIdx}-${order.createdAt || ""}`;

                return (
                  <div
                    key={orderKey}
                    className={`border rounded-2xl overflow-hidden bg-white shadow-2xs transition-all ${
                      isCancelled ? "border-red-200 bg-red-50/20" : "border-neutral-200"
                    }`}
                  >
                    {/* Order Card Head */}
                    <div
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.orderId)}
                      className="p-4 sm:p-5 bg-neutral-50 hover:bg-neutral-100/70 cursor-pointer flex items-center justify-between border-b border-neutral-200/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCancelled ? "bg-red-600 text-white" : "bg-neutral-950 text-white"
                          }`}
                        >
                          {isCancelled ? <Ban className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm sm:text-base text-neutral-950 font-brand">
                              {order.orderId}
                            </span>
                            {(() => {
                              if (isCancelled) {
                                return (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-700 rounded-md border border-red-200">
                                    {lang === "ar" ? "🚫 ملغي (مسترجع للمخزن)" : "CANCELLED"}
                                  </span>
                                );
                              }
                              const statusMap: Record<string, { ar: string; en: string; cls: string }> = {
                                pending_payment: { ar: "1. بانتظار الدفع والتأكيد", en: "Pending Payment", cls: "bg-amber-100 text-amber-900 border-amber-300" },
                                pending_verification: { ar: "1. بانتظار التأكيد", en: "Pending Verification", cls: "bg-amber-100 text-amber-900 border-amber-300" },
                                payment_confirmed: { ar: "2. تم تأكيد الدفع", en: "Payment Confirmed", cls: "bg-blue-100 text-blue-900 border-blue-300" },
                                preparing: { ar: "3. جاري التجهيز والتغليف", en: "Preparing", cls: "bg-indigo-100 text-indigo-900 border-indigo-300" },
                                processing: { ar: "3. جاري التجهيز والتغليف", en: "Processing", cls: "bg-indigo-100 text-indigo-900 border-indigo-300" },
                                shipped: { ar: "4. تم الشحن مع المندوب", en: "Shipped", cls: "bg-purple-100 text-purple-900 border-purple-300" },
                                out_for_delivery: { ar: "4. جاري التوصيل", en: "Out for Delivery", cls: "bg-purple-100 text-purple-900 border-purple-300" },
                                delivered: { ar: "5. تم التوصيل بنجاح", en: "Delivered", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
                              };
                              const currentInfo = statusMap[order.trackingStatus] || {
                                ar: "قيد المتابعة",
                                en: "Processing",
                                cls: "bg-neutral-100 text-neutral-800 border-neutral-300",
                              };
                              return (
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${currentInfo.cls}`}>
                                  {lang === "ar" ? currentInfo.ar : currentInfo.en}
                                </span>
                              );
                            })()}
                            <span className="text-xs text-neutral-500 font-medium">
                              {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            {order.customer?.fullName || (order as any).customerName || (lang === "ar" ? "عميل" : "Customer")} • {order.governorateNameAr || ""} • {order.items?.length || 0}{" "}
                            {lang === "ar" ? "قطع" : "items"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm sm:text-base font-black font-brand ${
                            isCancelled ? "text-neutral-400 line-through" : "text-neutral-950"
                          }`}
                        >
                          {order.total ?? (order as any).totalAmount ?? order.remainingUponDelivery ?? 0}{" "}
                          <span className="text-xs font-normal text-neutral-500 font-sans">{lang === "ar" ? "ج.م" : "LE"}</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                    </div>

                    {/* Order Details Body */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 space-y-6 bg-white">
                        {/* Vodafone Cash Banner */}
                        {hasVodafone && (
                          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="flex items-center gap-2 font-black text-red-950 font-brand">
                                <span className="w-2 h-2 rounded-full bg-red-600" />
                                {lang === "ar" ? "طريقة الدفع: محفظة فودافون كاش" : "Payment: Vodafone Cash"}
                              </div>
                              <p className="text-neutral-600 mt-1">
                                {lang === "ar" ? "رقم محفظة المحول منها:" : "Sender Wallet:"}{" "}
                                <span className="font-mono font-bold text-neutral-950">{order.vodafoneSenderPhone}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-red-700 bg-white px-3 py-1.5 rounded-xl border border-red-200">
                                {VODAFONE_CASH_WALLET_NUMBER}
                              </span>
                              <button
                                onClick={handleCopyWallet}
                                className="px-3 py-1.5 bg-neutral-950 text-white rounded-xl font-bold flex items-center gap-1 hover:bg-black transition-colors cursor-pointer"
                              >
                                {copiedWallet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedWallet ? (lang === "ar" ? "تم النسخ" : "Copied") : (lang === "ar" ? "نسخ" : "Copy")}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Shipment Tracking Timeline */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black uppercase text-neutral-950 font-brand flex items-center gap-2">
                            <Truck className="w-4 h-4 text-neutral-700" />
                            <span>{lang === "ar" ? "مراحل الشحن والتوصيل" : "Shipment Progress"}</span>
                          </h4>

                          {isCancelled ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 font-bold">
                              <Ban className="w-4 h-4 text-red-600 flex-shrink-0" />
                              <span>{order.cancellationReason || (lang === "ar" ? "تم إلغاء الطلب واسترجاع المنتجات للمخزن." : "Order cancelled and items returned to stock.")}</span>
                            </div>
                          ) : (
                            (() => {
                              const st = order.trackingStatus || "pending_payment";
                              const isStep1Done = true;
                              const isStep2Done = ["payment_confirmed", "preparing", "processing", "shipped", "out_for_delivery", "delivered"].includes(st);
                              const isStep3Done = ["shipped", "out_for_delivery", "delivered"].includes(st);
                              const isStep4Done = st === "delivered";

                              return (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                  <div className={`p-2.5 rounded-xl border transition-colors ${isStep1Done ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>
                                    <Clock className={`w-4 h-4 mx-auto mb-1 ${isStep1Done ? "text-emerald-600" : "text-neutral-400"}`} />
                                    <span>{lang === "ar" ? "1. تم استلام الطلب" : "1. Order Placed"}</span>
                                  </div>
                                  <div className={`p-2.5 rounded-xl border transition-colors ${isStep2Done ? "bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>
                                    <Package className={`w-4 h-4 mx-auto mb-1 ${isStep2Done ? "text-blue-600" : "text-neutral-400"}`} />
                                    <span>{lang === "ar" ? "2. تأكيد الدفع والتجهيز" : "2. Processing"}</span>
                                  </div>
                                  <div className={`p-2.5 rounded-xl border transition-colors ${isStep3Done ? "bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>
                                    <Truck className={`w-4 h-4 mx-auto mb-1 ${isStep3Done ? "text-purple-600" : "text-neutral-400"}`} />
                                    <span>{lang === "ar" ? "3. تم تسليمه للشحن" : "3. In Transit"}</span>
                                  </div>
                                  <div className={`p-2.5 rounded-xl border transition-colors ${isStep4Done ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-2xs" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>
                                    <CheckCircle className={`w-4 h-4 mx-auto mb-1 ${isStep4Done ? "text-emerald-600" : "text-neutral-400"}`} />
                                    <span>{lang === "ar" ? "4. تم التوصيل بنجاح" : "4. Delivered"}</span>
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>

                        {/* Items in Order */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-black uppercase text-neutral-950 font-brand">
                            {lang === "ar" ? "محتويات الطلب:" : "Ordered Items:"}
                          </h4>
                          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden">
                            {(order.items || []).map((it, idx) => (
                              <div
                                key={`${order.orderId || oIdx}-item-${it?.id || idx}-${it?.selectedColor?.name || it?.selectedColor?.nameAr || ""}-${it?.selectedSize || ""}-${idx}`}
                                className="p-3 bg-neutral-50/50 flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    src={sanitizeImageUrl(it?.selectedColor?.image, SOTRA_PRODUCT_PLACEHOLDER)}
                                    alt={it?.title || "Product"}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                                    }}
                                    className="w-12 h-14 object-cover rounded-lg border border-neutral-200 bg-white"
                                  />
                                  <div>
                                    <p className="font-bold text-neutral-900">{lang === "ar" ? it?.titleAr || it?.title : it?.title}</p>
                                    <p className="text-neutral-500 text-[11px]">
                                      {it?.selectedColor?.nameAr || it?.selectedColor?.name || ""} • {it?.selectedSize} × {it?.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="font-black text-neutral-950 font-brand">
                                  {(Number(it?.price) || 0) * (Number(it?.quantity) || 1)} {lang === "ar" ? "ج.م" : "LE"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Shipping Address & Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl text-xs text-neutral-700 border border-neutral-200">
                          <div>
                            <p className="font-bold text-neutral-900 mb-1">{lang === "ar" ? "بيانات التوصيل:" : "Delivery Details:"}</p>
                            <p>{order.customer?.fullName || (order as any).customerName || ""} ({order.customer?.phoneNumber || ""})</p>
                            <p>{order.governorateNameAr || ""} - {order.customer?.detailedAddress || ""}</p>
                            {order.customer?.notes && (
                              <p className="text-neutral-500 mt-1 italic">{lang === "ar" ? "ملاحظات:" : "Notes:"} {order.customer.notes}</p>
                            )}
                          </div>
                          <div className="space-y-1 sm:text-end">
                            <p className="font-bold text-neutral-900 mb-1">{lang === "ar" ? "التكلفة:" : "Cost Breakdown:"}</p>
                            <p>{lang === "ar" ? "المنتجات:" : "Subtotal:"} {order.subtotal} {lang === "ar" ? "ج.م" : "LE"}</p>
                            {order.discount || (order as any).discountAmount ? (
                              <p className="text-emerald-700 font-bold">{lang === "ar" ? "الخصم:" : "Discount:"} -{order.discount ?? (order as any).discountAmount} {lang === "ar" ? "ج.م" : "LE"}</p>
                            ) : null}
                            <p>{lang === "ar" ? "الشحن:" : "Shipping:"} {order.shippingCost === 0 ? (lang === "ar" ? "مجاني" : "FREE") : `${order.shippingCost} ${lang === "ar" ? "ج.م" : "LE"}`}</p>
                            <p className="font-black text-neutral-950 text-sm font-brand pt-1 border-t border-neutral-200">
                              {lang === "ar" ? "الإجمالي:" : "Total:"} {order.total ?? (order as any).totalAmount ?? 0} {lang === "ar" ? "ج.م" : "LE"}
                            </p>
                          </div>
                        </div>

                        {/* Cancel Order Action */}
                        {!isCancelled && (
                          <div className="pt-2 flex justify-end">
                            {cancelModalOrderId === order.orderId ? (
                              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3 w-full sm:w-auto text-xs">
                                <p className="font-bold text-red-900 flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  {lang === "ar"
                                    ? "هل أنت متأكد من رغبتك في إلغاء هذا الطلب وإرجاع المنتجات للمخزون؟"
                                    : "Are you sure you want to cancel this order and restock items?"}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmCancelOrder(order.orderId)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg cursor-pointer"
                                  >
                                    {lang === "ar" ? "نعم، تأكيد الإلغاء" : "Yes, Cancel Order"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancelModalOrderId(null)}
                                    className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-lg cursor-pointer"
                                  >
                                    {lang === "ar" ? "تراجع" : "Keep Order"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCancelModalOrderId(order.orderId)}
                                className="px-4 py-2 bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-700 border border-neutral-300 hover:border-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-brand"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>{lang === "ar" ? "إلغاء هذا الطلب" : "Cancel this Order"}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Saved Delivery Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-black uppercase text-neutral-950 font-brand">
                {lang === "ar" ? "البيانات الشخصية وعنوان التوصيل" : "Personal & Delivery Information"}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {lang === "ar"
                  ? "يتم حفظ هذه البيانات تلقائياً لتسريع إتمام الطلبات القادمة بدون الحاجة لإعادة إدخالها."
                  : "Saved details are automatically prefilled during checkout for fast ordering."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  {lang === "ar" ? "الاسم ثلاثي أو ثنائي *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === "ar" ? "مثال: أحمد محمد علي" : "e.g., Ahmed Mohamed"}
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  {lang === "ar" ? "رقم الهاتف المحمول الأساسي *" : "Primary Phone Number *"}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold font-mono outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  {lang === "ar" ? "رقم هاتف إضافي (اختياري)" : "Secondary Phone (Optional)"}
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={profileData.secondaryPhone || ""}
                  onChange={(e) => setProfileData({ ...profileData, secondaryPhone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold font-mono outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  {lang === "ar" ? "المحافظة *" : "Governorate *"}
                </label>
                <select
                  value={profileData.governorateId}
                  onChange={(e) => setProfileData({ ...profileData, governorateId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-bold outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all cursor-pointer"
                >
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {lang === "ar" ? gov.nameAr : gov.nameEn || gov.nameAr} ({gov.shippingCost} {lang === "ar" ? "ج.م شحن" : "LE"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                {lang === "ar" ? "العنوان التفصيلي (المدينة، الحي، الشارع، العمارة، الشقة) *" : "Detailed Address *"}
              </label>
              <textarea
                required
                rows={2}
                placeholder={lang === "ar" ? "اكتب اسم الشارع، رقم العقار، رقم الشقة أو علامة مميزة..." : "Street name, building number, apartment, landmark..."}
                value={profileData.detailedAddress}
                onChange={(e) => setProfileData({ ...profileData, detailedAddress: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                {lang === "ar" ? "ملاحظات إضافية لمندوب الشحن" : "Notes for Courier"}
              </label>
              <input
                type="text"
                placeholder={lang === "ar" ? "مثال: الاتصال قبل الوصول بنصف ساعة" : "e.g., Call 30 mins before arrival"}
                value={profileData.notes || ""}
                onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === "ar" ? "تم حفظ البيانات بنجاح!" : "Profile updated successfully!"}
                </span>
              ) : <span />}

              <button
                type="submit"
                disabled={isSavingDb}
                className="px-6 py-3 bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-black uppercase rounded-xl font-brand flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDb ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ التعديلات" : "Save Profile")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
