import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Truck,
  Tag,
  Check,
  Edit2,
  MapPin,
  User,
  AlertCircle,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { CartItem, CustomerProfile, PromoCode, Governorate } from "../types";
import { STORAGE_KEYS, validatePromoCode, sanitizeImageUrl, SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";
import { EGYPTIAN_GOVERNORATES } from "../data/defaultData";

interface CartPageProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToCheckout: () => void;
  onOpenProfile: () => void;
  onBackToShopping: () => void;
  coupons?: PromoCode[];
  appliedCoupon?: PromoCode | null;
  onApplyCoupon?: (coupon: PromoCode | null, discountAmount: number, freeShipping: boolean) => void;
  governorates?: Governorate[];
  lang: "ar" | "en";
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onOpenProfile,
  onBackToShopping,
  coupons = [],
  appliedCoupon,
  onApplyCoupon,
  governorates = EGYPTIAN_GOVERNORATES,
  lang,
}) => {
  const [savedProfile, setSavedProfile] = useState<CustomerProfile | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const activeGovernorates = governorates && governorates.length > 0 ? governorates : EGYPTIAN_GOVERNORATES;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile && typeof profile === "object" && profile.fullName && profile.phoneNumber && profile.detailedAddress) {
          setSavedProfile(profile);
        } else {
          setSavedProfile(null);
        }
      }
    } catch (e) {
      setSavedProfile(null);
    }
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 1500;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  const selectedGovernorate = savedProfile?.governorateId
    ? activeGovernorates.find((g) => g.id === savedProfile.governorateId) || null
    : null;

  const shippingCost =
    items.length === 0
      ? 0
      : appliedCoupon?.type === "free_shipping" || subtotal >= freeShippingThreshold
      ? 0
      : selectedGovernorate
      ? selectedGovernorate.shippingCost
      : 0;

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === "fixed_amount") {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + (selectedGovernorate ? shippingCost : 0));

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const currentShipping = selectedGovernorate ? selectedGovernorate.shippingCost : 50;
    const result = validatePromoCode(promoInput, subtotal, currentShipping, coupons);
    if (result.isValid && result.coupon) {
      setPromoMessage({ text: lang === "ar" ? result.messageAr : result.messageEn, isError: false });
      if (onApplyCoupon) {
        onApplyCoupon(result.coupon, result.discountAmount, result.freeShipping);
      }
    } else {
      setPromoMessage({ text: lang === "ar" ? result.messageAr : result.messageEn, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-6 sm:py-10 animate-fade-in text-start">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToShopping}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-neutral-600 hover:text-neutral-950 transition-colors font-brand cursor-pointer"
          >
            {lang === "ar" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{lang === "ar" ? "متابعة التسوق" : "Continue Shopping"}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 font-brand">
              {lang === "ar" ? `${items.length} قطع في السلة` : `${items.length} Items in Cart`}
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-neutral-950 text-white flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-brand tracking-tight">
              {lang === "ar" ? "سلة التسوق" : "Shopping Bag"}
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              {lang === "ar" ? "راجع تفاصيل المنتجات وأكمل طلبك بسهولة" : "Review your selected items and checkout securely"}
            </p>
          </div>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-neutral-900 mb-2">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              {remainingForFree === 0
                ? lang === "ar"
                  ? "🎉 مبروك! حصلت على شحن مجاني لكافة المحافظات"
                  : "🎉 You unlocked Free Shipping to all governorates!"
                : lang === "ar"
                ? `باقي ${remainingForFree} ج.م للحصول على شحن مجاني`
                : `Add ${remainingForFree} LE more to qualify for Free Shipping`}
            </span>
            <span className="font-brand font-black text-neutral-700">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-2xs my-4 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-neutral-100 mx-auto flex items-center justify-center text-neutral-400">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-black text-neutral-900 font-brand">
              {lang === "ar" ? "سلة التسوق فارغة حالياً" : "Your Shopping Cart is Empty"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              {lang === "ar"
                ? "تصفح أحدث التشكيلات والملابس الرياضية الفاخرة من سترة فاشون وأضف قطعك المفضلة إلى السلة."
                : "Explore our latest luxury athletic drops and select your favorite pieces to get started."}
            </p>
            <button
              onClick={onBackToShopping}
              className="mt-2 px-6 py-3 bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-black uppercase rounded-xl tracking-wider font-brand cursor-pointer transition-all shadow-sm"
            >
              {lang === "ar" ? "تصفح المنتجات الآن" : "Start Shopping Now"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left/Main Column: Items List & Saved Shipping Info */}
            <div className="lg:col-span-8 space-y-6">
              {/* Saved Shipping Info Box */}
              {savedProfile && (
                <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs sm:text-sm font-black text-neutral-900 font-brand uppercase">
                        {lang === "ar" ? "عنوان الشحن المحفوظ" : "Saved Shipping Address"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenProfile}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-950 hover:text-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 transition-all flex items-center gap-1 cursor-pointer font-brand"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{lang === "ar" ? "تعديل" : "Edit"}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-bold">{savedProfile?.fullName || ""}</span>
                      <span className="text-neutral-400">•</span>
                      <span className="font-mono">{savedProfile?.phoneNumber || ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                      <span className="font-bold">{selectedGovernorate?.nameAr || ""}:</span>
                      <span className="truncate">{savedProfile?.detailedAddress || ""}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-2xs divide-y divide-neutral-100">
                {(items || []).map((item, idx) => (
                  <div key={`${item?.id || idx}-${item?.selectedColor?.name || ""}-${item?.selectedSize || ""}-${idx}`} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-3 sm:gap-4 items-center">
                      <img
                        src={sanitizeImageUrl(item?.selectedColor?.image, SOTRA_PRODUCT_PLACEHOLDER)}
                        alt={item?.title || "Product"}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                        }}
                        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl bg-neutral-100 border border-neutral-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-black text-neutral-950 font-brand">
                          {lang === "ar" ? item?.titleAr || item?.title : item?.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                              style={{ backgroundColor: item?.selectedColor?.colorCode || "#000" }}
                            />
                            {lang === "ar" ? item?.selectedColor?.nameAr || item?.selectedColor?.name || "" : item?.selectedColor?.name || ""}
                          </span>
                          <span>•</span>
                          <span className="font-bold font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800">
                            {item?.selectedSize || ""}
                          </span>
                        </div>
                        <div className="text-sm font-black text-neutral-950 font-brand pt-1">
                          {item.price} <span className="text-xs font-normal text-neutral-500 font-sans">{lang === "ar" ? "ج.م" : "LE"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden bg-neutral-50 shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-black transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 font-bold text-xs font-mono text-neutral-950 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-black transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <div className="text-sm font-black text-neutral-950 font-brand min-w-[5rem] text-end">
                        {item.price * item.quantity}{" "}
                        <span className="text-xs font-normal text-neutral-500 font-sans">{lang === "ar" ? "ج.م" : "LE"}</span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title={lang === "ar" ? "حذف من السلة" : "Remove item"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Promo Code & Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              {/* Promo Code Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs text-start space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-neutral-700" />
                  <h3 className="text-xs sm:text-sm font-black uppercase text-neutral-950 font-brand">
                    {lang === "ar" ? "كوبون الخصم" : "Promo Code"}
                  </h3>
                </div>
                <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === "ar" ? "أدخل كود الخصم (مثال: SOTRA10)" : "Enter Promo Code"}
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 border border-neutral-300 rounded-xl text-xs font-bold outline-none uppercase tracking-wider font-mono focus:border-neutral-950 bg-neutral-50 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 hover:bg-black text-white text-xs font-black uppercase rounded-xl tracking-wider font-brand cursor-pointer transition-colors"
                  >
                    {lang === "ar" ? "تطبيق" : "Apply"}
                  </button>
                </form>
                {promoMessage && (
                  <p
                    className={`text-xs font-bold flex items-center gap-1 ${
                      promoMessage.isError ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {promoMessage.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    {promoMessage.text}
                  </p>
                )}
                {appliedCoupon && !promoMessage && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-bold">
                      {lang === "ar" ? `الكوبون المطبق: ${appliedCoupon.code}` : `Applied: ${appliedCoupon.code}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onApplyCoupon?.(null, 0, false)}
                      className="text-red-600 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      {lang === "ar" ? "إلغاء" : "Remove"}
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 text-start">
                <h3 className="text-sm font-black uppercase text-neutral-950 font-brand border-b border-neutral-100 pb-3">
                  {lang === "ar" ? "ملخص الطلب" : "Order Summary"}
                </h3>

                <div className="space-y-2.5 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>{lang === "ar" ? "إجمالي المنتجات" : "Subtotal"}</span>
                    <span className="font-black text-neutral-900 font-brand">
                      {subtotal} {lang === "ar" ? "ج.م" : "LE"}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{lang === "ar" ? "الخصم" : "Discount"}</span>
                      <span>
                        -{discountAmount} {lang === "ar" ? "ج.م" : "LE"}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>
                      {selectedGovernorate
                        ? lang === "ar"
                          ? `الشحن (${selectedGovernorate.nameAr})`
                          : `Shipping (${selectedGovernorate.nameEn || selectedGovernorate.nameAr})`
                        : lang === "ar"
                        ? "الشحن (يحدد بعد اختيار المحافظة)"
                        : "Shipping (Selected at checkout)"}
                    </span>
                    <span className="font-black text-neutral-900 font-brand">
                      {selectedGovernorate ? (
                        shippingCost === 0 ? (
                          <span className="text-emerald-600 font-bold">{lang === "ar" ? "مجاني" : "FREE"}</span>
                        ) : (
                          `${shippingCost} ${lang === "ar" ? "ج.م" : "LE"}`
                        )
                      ) : (
                        <span className="text-neutral-500 text-xs font-normal">
                          {lang === "ar" ? "يحدد بالخطوة التالية" : "At checkout"}
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Advance Shipping Note */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {lang === "ar"
                        ? "نظام الدفع: يتم سداد رسوم الشحن فقط مقدماً (فودافون كاش / إنستاباي) لتأكيد الطلب، وباقي الحساب عند استلام الأوردر."
                        : "Shipping fee is paid upfront via Vodafone Cash or InstaPay to confirm the order, rest paid upon delivery."}
                    </span>
                  </div>

                  <div className="border-t border-neutral-200 pt-3 flex justify-between text-sm sm:text-base font-black text-neutral-950 font-brand">
                    <span>{lang === "ar" ? "إجمالي المنتجات" : "Products Total"}</span>
                    <span className="text-neutral-950">
                      {subtotal - discountAmount} <span className="text-xs font-normal text-neutral-500 font-sans">{lang === "ar" ? "ج.م" : "LE"}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-3.5 bg-[#dc2626] hover:bg-red-700 text-white text-xs sm:text-sm font-black uppercase rounded-xl tracking-wider font-brand flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                >
                  <span>{lang === "ar" ? "إتمام الشراء السريع وتأكيد الشحن" : "Proceed to Fast Checkout"}</span>
                  {lang === "ar" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-[11px] text-center text-neutral-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === "ar" ? "حجز فوري ومؤكد مع فودافون كاش & إنستاباي" : "Instant Confirmation with Vodafone Cash & InstaPay"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
