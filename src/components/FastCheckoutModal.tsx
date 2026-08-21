import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  MapPin,
  User,
  Tag,
  AlertCircle,
  Truck,
  CreditCard,
  ChevronDown,
  Info,
  DollarSign,
  Phone,
} from "lucide-react";
import { CartItem, CustomerProfile, Order, PromoCode, PaymentConfig, Governorate, PaymentMethodType } from "../types";
import { DEFAULT_PAYMENT_CONFIG, EGYPTIAN_GOVERNORATES } from "../data/defaultData";
import {
  STORAGE_KEYS,
  decrementInventory,
  validatePromoCode,
  saveCustomerProfileToFirebase,
  saveOrderToFirebase,
  sanitizeImageUrl,
  SOTRA_PRODUCT_PLACEHOLDER,
  addMyOrderId,
} from "../utils/storage";

interface FastCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
  coupons?: PromoCode[];
  initialCoupon?: PromoCode | null;
  paymentConfig?: PaymentConfig;
  governorates?: Governorate[];
  lang: "ar" | "en";
}

export const FastCheckoutModal: React.FC<FastCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  coupons = [],
  initialCoupon,
  paymentConfig = DEFAULT_PAYMENT_CONFIG,
  governorates = EGYPTIAN_GOVERNORATES,
  lang,
}) => {
  const activeGovernorates = governorates && governorates.length > 0 ? governorates : EGYPTIAN_GOVERNORATES;
  const activePaymentConfig = paymentConfig || DEFAULT_PAYMENT_CONFIG;

  const [formData, setFormData] = useState<CustomerProfile>({
    fullName: "",
    phoneNumber: "",
    secondaryPhone: "",
    governorateId: "", // Start empty so price is only revealed upon governorate selection
    detailedAddress: "",
    notes: "",
    paymentMethod: activePaymentConfig.vodafoneCashEnabled ? "vodafone_cash" : "instapay",
    senderPhoneOrInstaPayId: "",
    transactionReference: "",
  });

  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(initialCoupon || null);
  const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
  const [promoHasFreeShipping, setPromoHasFreeShipping] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
        if (saved) {
          const profile = JSON.parse(saved);
          if (profile && typeof profile === "object") {
            setFormData((prev) => ({
              ...prev,
              fullName: profile.fullName || prev.fullName,
              phoneNumber: profile.phoneNumber || prev.phoneNumber,
              secondaryPhone: profile.secondaryPhone || prev.secondaryPhone,
              governorateId: profile.governorateId || prev.governorateId,
              detailedAddress: profile.detailedAddress || prev.detailedAddress,
              notes: profile.notes || prev.notes,
              senderPhoneOrInstaPayId: profile.senderPhoneOrInstaPayId || prev.senderPhoneOrInstaPayId,
            }));

            if (profile.fullName && profile.phoneNumber && profile.detailedAddress && profile.governorateId) {
              setHasSavedProfile(true);
              setIsEditingDelivery(false);
            } else {
              setHasSavedProfile(false);
              setIsEditingDelivery(true);
            }
          } else {
            setHasSavedProfile(false);
            setIsEditingDelivery(true);
          }
        } else {
          setHasSavedProfile(false);
          setIsEditingDelivery(true);
        }
      } catch (e) {
        setIsEditingDelivery(true);
      }
    }
  }, [isOpen]);

  const selectedGovernorate = activeGovernorates.find((g) => g.id === formData.governorateId);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Recalculate discount & shipping
  useEffect(() => {
    if (appliedPromo && selectedGovernorate) {
      const val = validatePromoCode(appliedPromo.code, subtotal, selectedGovernorate.shippingCost, coupons);
      if (val.isValid) {
        setPromoDiscountAmount(val.discountAmount);
        setPromoHasFreeShipping(val.freeShipping);
      } else {
        setAppliedPromo(null);
        setPromoDiscountAmount(0);
        setPromoHasFreeShipping(false);
      }
    } else {
      setPromoDiscountAmount(0);
      setPromoHasFreeShipping(false);
    }
  }, [appliedPromo, subtotal, selectedGovernorate, coupons]);

  if (!isOpen) return null;

  // Shipping cost is only known once governorate is selected
  const hasSelectedGov = !!selectedGovernorate;
  const rawShippingCost = hasSelectedGov ? selectedGovernorate.shippingCost : 0;
  const finalShippingCost = promoHasFreeShipping ? 0 : rawShippingCost;
  const discount = promoDiscountAmount;
  const remainingUponDelivery = Math.max(0, subtotal - discount); // Merchandise total to pay on delivery
  const advanceDepositRequired = finalShippingCost; // Shipping fee paid upfront
  const grandTotal = remainingUponDelivery + advanceDepositRequired;

  const currentPaymentDestination =
    formData.paymentMethod === "vodafone_cash"
      ? activePaymentConfig.vodafoneCashNumber
      : activePaymentConfig.instaPayId;

  const handleCopyPaymentDestination = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && currentPaymentDestination) {
      navigator.clipboard.writeText(currentPaymentDestination);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2500);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    const currentShipping = selectedGovernorate ? selectedGovernorate.shippingCost : 50;
    const res = validatePromoCode(promoCodeInput, subtotal, currentShipping, coupons);
    if (res.isValid && res.coupon) {
      setAppliedPromo(res.coupon);
      setPromoDiscountAmount(res.discountAmount);
      setPromoHasFreeShipping(res.freeShipping);
      setPromoFeedback({ message: lang === "ar" ? res.messageAr : res.messageEn, isError: false });
    } else {
      setPromoFeedback({ message: lang === "ar" ? res.messageAr : res.messageEn, isError: true });
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().split(" ").length < 2) {
      errs.fullName = "يرجى إدخال الاسم ثنائي على الأقل";
    }
    const cleanPhone = formData.phoneNumber.replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 10 || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      errs.phoneNumber = "يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)";
    }
    if (!formData.governorateId) {
      errs.governorateId = "يرجى اختيار المحافظة لتحديد سعر الشحن وتأكيد الطلب";
    }
    if (!formData.detailedAddress.trim() || formData.detailedAddress.trim().length < 8) {
      errs.detailedAddress = "يرجى كتابة العنوان بالتفصيل (المنطقة، الشارع، رقم العمارة، الشقة)";
    }
    if (!formData.senderPhoneOrInstaPayId.trim()) {
      errs.senderPhoneOrInstaPayId =
        formData.paymentMethod === "vodafone_cash"
          ? "يرجى كتابة رقم محفظة فودافون كاش التي قمت بالتحويل منها"
          : "يرجى كتابة معرف أو اسم حساب إنستاباي الذي قمت بالتحويل منه";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (items.length === 0) return;
    if (!selectedGovernorate) return;

    setIsSubmitting(true);

    const profileToSave: CustomerProfile = {
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      secondaryPhone: formData.secondaryPhone,
      governorateId: formData.governorateId,
      governorateNameAr: selectedGovernorate.nameAr,
      detailedAddress: formData.detailedAddress,
      notes: formData.notes,
      paymentMethod: formData.paymentMethod,
      senderPhoneOrInstaPayId: formData.senderPhoneOrInstaPayId,
      transactionReference: formData.transactionReference,
      shippingDepositPaid: advanceDepositRequired,
      codRemainingAmount: remainingUponDelivery,
    };

    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileToSave));
    } catch (err) {
      console.warn("Storage profile error:", err);
    }

    // 1. Decrement inventory
    decrementInventory(items);

    // 2. Create Completed Order
    const completedOrder: Order = {
      orderId: "SOTRA-" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      customer: profileToSave,
      items,
      subtotal,
      shippingCost: finalShippingCost,
      discount,
      appliedCouponCode: appliedPromo?.code,
      total: grandTotal,
      advanceShippingPaid: advanceDepositRequired,
      remainingUponDelivery,
      governorateNameAr: selectedGovernorate.nameAr,
      estimatedDelivery: selectedGovernorate.deliveryDays,
      trackingStatus: "payment_confirmed",
      paymentMethod: formData.paymentMethod,
      senderPhoneOrInstaPayId: formData.senderPhoneOrInstaPayId,
      transactionReference: formData.transactionReference,
    };

    // 3. Save to Firebase Firestore (both Order and Customer Collections)
    try {
      addMyOrderId(completedOrder.orderId);
      await saveOrderToFirebase(completedOrder);
      await saveCustomerProfileToFirebase(profileToSave, completedOrder);
    } catch (err) {
      console.warn("Firebase save error:", err);
    }

    setIsSubmitting(false);
    onOrderSuccess(completedOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-scale-in text-start">
          {/* Header */}
          <div className="px-5 py-4 bg-neutral-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wide">إتمام الطلب المباشر الفوري</h3>
                <p className="text-[11px] text-neutral-400">سترة فاشون — دفع رسوم الشحن مقدماً والباقي عند الاستلام</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Products Quick Summary */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600 border-b border-neutral-200/80 pb-2">
                <span>المنتجات المطلوبة ({items.length})</span>
                <span>المجموع: {subtotal.toLocaleString()} ج.م</span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {items.map((item, idx) => (
                  <div key={`${item.id}-${item.selectedColor?.name || ""}-${item.selectedSize || ""}-${idx}`} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-neutral-200/60">
                    <img
                      src={sanitizeImageUrl(item.selectedColor.image, SOTRA_PRODUCT_PLACEHOLDER)}
                      alt={item.titleAr}
                      className="w-11 h-11 object-cover rounded-lg shrink-0 border border-neutral-100"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-bold text-neutral-900 truncate">{item.titleAr || item.title}</h4>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                        <span>اللون: {item.selectedColor.nameAr || item.selectedColor.name}</span>
                        <span>•</span>
                        <span>المقاس: {item.selectedSize}</span>
                        <span>•</span>
                        <span>الكمية: {item.quantity}</span>
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs text-neutral-950 shrink-0">
                      {(item.price * item.quantity).toLocaleString()} ج.م
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 1. CUSTOMER & DELIVERY DATA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="font-black text-sm text-neutral-950">بيانات العميل وعنوان الشحن</h4>
                </div>

                {hasSavedProfile && !isEditingDelivery && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDelivery(true)}
                    className="flex items-center gap-1 text-xs text-red-600 font-bold hover:underline cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>تعديل العنوان</span>
                  </button>
                )}
              </div>

              {hasSavedProfile && !isEditingDelivery ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-neutral-900">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{formData.fullName}</span>
                    <span className="text-neutral-400 font-normal">({formData.phoneNumber})</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>
                      {selectedGovernorate?.nameAr} — {formData.detailedAddress}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      الاسم بالكامل (ثنائي أو ثلاثي) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="مثال: أحمد محمد علي"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-neutral-950 outline-hidden ${
                        errors.fullName ? "border-red-500 bg-red-50/30" : "border-neutral-300"
                      }`}
                    />
                    {errors.fullName && <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      رقم الهاتف المحمول (مصر) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="01012345678"
                      dir="ltr"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-neutral-950 outline-hidden font-mono ${
                        errors.phoneNumber ? "border-red-500 bg-red-50/30" : "border-neutral-300"
                      }`}
                    />
                    {errors.phoneNumber && <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.phoneNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      رقم هاتف إضافي للطوارئ (اختياري)
                    </label>
                    <input
                      type="tel"
                      value={formData.secondaryPhone || ""}
                      onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                      placeholder="01112345678"
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold focus:ring-2 focus:ring-neutral-950 outline-hidden font-mono"
                    />
                  </div>

                  {/* GOVERNORATE SELECTION - CRITICAL REQUIREMENT: PRICE ONLY SHOWS AFTER SELECTING */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-900 mb-1">
                      المحافظة <span className="text-red-500">*</span>{" "}
                      <span className="text-neutral-400 font-normal">(اختر محافظتك لمعرفة قيمة الشحن)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.governorateId}
                        onChange={(e) => {
                          setFormData({ ...formData, governorateId: e.target.value });
                          if (errors.governorateId) {
                            setErrors((prev) => ({ ...prev, governorateId: "" }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-neutral-900 bg-white focus:ring-2 focus:ring-neutral-950 outline-hidden appearance-none cursor-pointer ${
                          errors.governorateId ? "border-red-500 bg-red-50/30" : "border-neutral-300"
                        }`}
                      >
                        <option value="">-- اضغط هنا لاختيار المحافظة --</option>
                        {activeGovernorates.map((gov) => (
                          <option key={gov.id} value={gov.id}>
                            {gov.nameAr}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {errors.governorateId && <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.governorateId}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      العنوان بالتفصيل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.detailedAddress}
                      onChange={(e) => setFormData({ ...formData, detailedAddress: e.target.value })}
                      placeholder="المنطقة، اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:ring-2 focus:ring-neutral-950 outline-hidden ${
                        errors.detailedAddress ? "border-red-500 bg-red-50/30" : "border-neutral-300"
                      }`}
                    />
                    {errors.detailedAddress && (
                      <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.detailedAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROMO CODE SECTION */}
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-neutral-600 shrink-0" />
                <input
                  type="text"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="هل لديك كود خصم؟ اكتبه هنا"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold uppercase tracking-wider outline-hidden bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-[11px] mt-2 font-bold ${
                    promoFeedback.isError ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {promoFeedback.message}
                </p>
              )}
            </div>

            {/* 2. MANDATORY ADVANCE SHIPPING PAYMENT SECTION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="font-black text-sm text-neutral-950">
                  دفع رسوم الشحن مقدماً لتأكيد الطلب (إجباري)
                </h4>
              </div>

              {!hasSelectedGov ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>تنبيه:</strong> يرجى اختيار محافظتك من الأعلى أولاً لتظهر لك قيمة رسوم الشحن وبيانات الحساب للتحويل.
                  </span>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Payment Method Selector (Vodafone Cash or InstaPay) */}
                  <div className="grid grid-cols-2 gap-3">
                    {activePaymentConfig.vodafoneCashEnabled && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: "vodafone_cash" })}
                        className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                          formData.paymentMethod === "vodafone_cash"
                            ? "border-red-600 bg-red-50/50 shadow-xs ring-2 ring-red-500/20"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs">
                          VF
                        </div>
                        <span className="font-black text-xs text-neutral-900">فودافون كاش</span>
                        <span className="text-[10px] text-neutral-500 font-medium">Vodafone Cash</span>
                      </button>
                    )}

                    {activePaymentConfig.instaPayEnabled && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: "instapay" })}
                        className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                          formData.paymentMethod === "instapay"
                            ? "border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-500/20"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                          IP
                        </div>
                        <span className="font-black text-xs text-neutral-900">إنستاباي</span>
                        <span className="text-[10px] text-neutral-500 font-medium">InstaPay App</span>
                      </button>
                    )}
                  </div>

                  {/* Transfer Instructions Box */}
                  <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-0.5">
                          {formData.paymentMethod === "vodafone_cash"
                            ? "رقم محفظة فودافون كاش للتحويل إليها:"
                            : "عنوان إنستاباي (IPA / Username) للتحويل إليه:"}
                        </span>
                        <span className="text-base sm:text-lg font-black text-amber-400 font-mono tracking-wider" dir="ltr">
                          {currentPaymentDestination}
                        </span>
                        {formData.paymentMethod === "vodafone_cash" && activePaymentConfig.vodafoneCashAccountName && (
                          <span className="block text-[11px] text-neutral-300 mt-0.5 font-bold">
                            باسم: {activePaymentConfig.vodafoneCashAccountName}
                          </span>
                        )}
                        {formData.paymentMethod === "instapay" && activePaymentConfig.instaPayAccountName && (
                          <span className="block text-[11px] text-neutral-300 mt-0.5 font-bold">
                            اسم الحساب: {activePaymentConfig.instaPayAccountName}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPaymentDestination}
                        className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedTarget ? "تم النسخ" : "نسخ الرقم"}</span>
                      </button>
                    </div>

                    <div className="bg-neutral-800/80 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-neutral-300 font-medium">المبلغ المطلوب تحويله الآن (رسوم الشحن):</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {advanceDepositRequired.toLocaleString()} ج.م
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {formData.paymentMethod === "vodafone_cash"
                        ? activePaymentConfig.vodafoneCashInstructionsAr
                        : activePaymentConfig.instaPayInstructionsAr}
                    </p>
                  </div>

                  {/* Customer Input for Verification */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <div>
                      <label className="block text-xs font-bold text-neutral-900 mb-1">
                        {formData.paymentMethod === "vodafone_cash"
                          ? "رقم محفظة فودافون كاش التي قمت بالتحويل منها *"
                          : "معرف / اسم حساب إنستاباي المحول منه *"}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.senderPhoneOrInstaPayId}
                        onChange={(e) => setFormData({ ...formData, senderPhoneOrInstaPayId: e.target.value })}
                        placeholder={
                          formData.paymentMethod === "vodafone_cash"
                            ? "مثال: 01098765432"
                            : "مثال: user@instapay أو اسمك بالتطبيق"
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold bg-white focus:ring-2 focus:ring-neutral-950 outline-hidden ${
                          errors.senderPhoneOrInstaPayId ? "border-red-500 bg-red-50/30" : "border-neutral-300"
                        }`}
                      />
                      {errors.senderPhoneOrInstaPayId && (
                        <p className="text-[11px] text-red-600 mt-1 font-bold">{errors.senderPhoneOrInstaPayId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        رقم العملية / الحوالة (اختياري للتوثيق السريع)
                      </label>
                      <input
                        type="text"
                        value={formData.transactionReference || ""}
                        onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                        placeholder="رقم مرجع التحويل من رسالة التأكيد"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium bg-white focus:ring-2 focus:ring-neutral-950 outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ORDER FINANCIAL SUMMARY */}
            <div className="bg-neutral-950 text-white rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-xs text-neutral-300">
                <span>مجموع المنتجات:</span>
                <span className="font-mono font-bold">{subtotal.toLocaleString()} ج.م</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>كود الخصم المطبق:</span>
                  <span className="font-mono font-bold">- {discount.toLocaleString()} ج.م</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-neutral-300">
                <span>رسوم التوصيل والشحن:</span>
                <span className="font-mono font-bold">
                  {hasSelectedGov ? (
                    finalShippingCost === 0 ? (
                      <span className="text-emerald-400">شحن مجاني</span>
                    ) : (
                      `${finalShippingCost} ج.م`
                    )
                  ) : (
                    <span className="text-amber-400 font-bold">يحدد بعد اختيار المحافظة</span>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-2">
                {/* UPFRONT SHIPPING PAYMENT */}
                <div className="flex items-center justify-between text-xs bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-amber-300">المطلوب تحويله الآن (رسوم الشحن):</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">
                    {hasSelectedGov ? `${advanceDepositRequired.toLocaleString()} ج.م` : "—"}
                  </span>
                </div>

                {/* REMAINING MERCHANDISE AMOUNT UPON DELIVERY */}
                <div className="flex items-center justify-between text-xs bg-neutral-900 p-2.5 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-emerald-300">المبلغ المطلوب عند الاستلام (سعر المنتجات):</span>
                  </div>
                  <span className="font-mono font-black text-emerald-400">
                    {remainingUponDelivery.toLocaleString()} ج.م
                  </span>
                </div>

                {/* TOTAL */}
                <div className="flex justify-between text-sm font-black pt-1">
                  <span>إجمالي الطلب الكلي:</span>
                  <span className="font-mono text-base text-white">
                    {hasSelectedGov ? `${grandTotal.toLocaleString()} ج.م` : `${remainingUponDelivery.toLocaleString()} ج.م + الشحن`}
                  </span>
                </div>
              </div>
            </div>

            {/* SUBMIT ORDER BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting || !hasSelectedGov}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تأكيد الطلب وإرسال إشعار الدفع الفوري</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
