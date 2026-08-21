import React, { useState } from "react";
import { CheckCircle2, Copy, Check, MessageSquare, ArrowRight, Truck, User, Package } from "lucide-react";
import { Order } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";

const VODAFONE_CASH_WALLET_NUMBER = "01019284755";

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  lang: "ar" | "en";
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenProfile,
  lang,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !order) return null;

  const handleCopyWallet = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(VODAFONE_CASH_WALLET_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const customerName = order?.customer?.fullName || (order as any)?.customerName || "";
  const whatsappMessage = encodeURIComponent(
    `مرحباً سترة فاشون (SOTRA FASHION)، تم تسجيل طلبي رقم (${order.orderId}) باسم: ${customerName}، محافظة: ${order.governorateNameAr || ""}. ` +
      (order.vodafoneSenderPhone
        ? `تم تحويل مصاريف الشحن فودافون كاش من الرقم: ${order.vodafoneSenderPhone}.`
        : `أود تأكيد الشحن ومتابعة حالة الطلب.`)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 animate-scale-in text-start">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-6 text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase font-brand">
              {lang === "ar" ? "تم تسجيل وتأكيد طلبك بنجاح!" : "Order Placed Successfully!"}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium font-arabic">
              {lang === "ar"
                ? `رقم الطلب: ${order.orderId} • تم خصم وحجز القطع بالمخزن وجاري التجهيز`
                : `Order #${order.orderId} • Stock reserved & dispatch in progress.`}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Vodafone Cash notice */}
            {order?.customer?.paymentMethod === "vodafone_cash" && (
              <div className="bg-gradient-to-r from-red-950 to-neutral-900 text-white p-4 rounded-xl space-y-2 border border-red-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-red-300 font-brand flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    {lang === "ar" ? "تأكيد مصاريف الشحن فودافون كاش" : "Vodafone Cash Status"}
                  </span>
                  <span className="text-xs font-bold text-red-200 font-brand">{order.shippingCost} LE</span>
                </div>

                {order.vodafoneSenderPhone ? (
                  <p className="text-xs text-emerald-300 font-bold bg-white/10 p-2.5 rounded-lg border border-white/10">
                    ✓{" "}
                    {lang === "ar"
                      ? `تم ربط رقم المحفظة المحول منها (${order.vodafoneSenderPhone}) بنجاح! سيتم فحص التحويل وبدء التغليف فوراً.`
                      : `Wallet #${order.vodafoneSenderPhone} linked. Processing dispatch!`}
                  </p>
                ) : (
                  <div className="text-xs space-y-1.5 text-neutral-200">
                    <p>
                      {lang === "ar"
                        ? `قم بتحويل (${order.shippingCost} ج.م) على محفظتنا لتأكيد شحن طلبك بأولوية قصوى:`
                        : `Transfer (${order.shippingCost} LE) to confirm priority dispatch:`}
                    </p>
                    <div className="flex items-center justify-between bg-black/50 p-2 rounded-lg">
                      <span className="font-mono font-bold text-white tracking-widest">
                        {VODAFONE_CASH_WALLET_NUMBER}
                      </span>
                      <button
                        onClick={handleCopyWallet}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{lang === "ar" ? "نسخ" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2.5 text-xs">
              <h3 className="font-extrabold text-neutral-900 uppercase tracking-wide text-xs border-b border-neutral-200 pb-1.5 flex items-center gap-1.5 font-brand">
                <User className="w-4 h-4 text-neutral-600" />
                <span>{lang === "ar" ? "بيانات التوصيل المسجلة للطلب:" : "Delivery Information:"}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-700">
                <div>
                  <span className="font-bold text-neutral-500 block">{lang === "ar" ? "الاسم:" : "Name:"}</span>
                  <span className="font-bold text-neutral-900">{order?.customer?.fullName || customerName || "عميل"}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block">{lang === "ar" ? "الهاتف:" : "Phone:"}</span>
                  <span className="font-bold text-neutral-900 font-sans">{order?.customer?.phoneNumber || ""}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block">
                    {lang === "ar" ? "المحافظة:" : "Governorate:"}
                  </span>
                  <span className="font-bold text-neutral-900">{order.governorateNameAr}</span>
                </div>
                <div>
                  <span className="font-bold text-neutral-500 block">
                    {lang === "ar" ? "مدة التوصيل:" : "Delivery Time:"}
                  </span>
                  <span className="font-bold text-emerald-600">{order.estimatedDelivery}</span>
                </div>
              </div>

              <div className="pt-1">
                <span className="font-bold text-neutral-500 block">
                  {lang === "ar" ? "العنوان بالتفصيل:" : "Detailed Address:"}
                </span>
                <span className="font-semibold text-neutral-800 leading-relaxed">
                  {order?.customer?.detailedAddress || ""}
                </span>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h4 className="text-xs font-extrabold uppercase text-neutral-800 mb-2 font-brand">
                {lang === "ar" ? "محتويات الشحنة" : "Package Contents"} ({order?.items?.length || 0})
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                {(order?.items || []).map((item, itemIdx) => (
                  <div
                    key={`${item?.id || itemIdx}-${item?.selectedColor?.name || ""}-${item?.selectedSize || ""}-${itemIdx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item?.selectedColor?.image || SOTRA_PRODUCT_PLACEHOLDER}
                        alt={item?.title || "Product"}
                        className="w-9 h-11 object-cover rounded"
                      />
                      <div>
                        <p className="font-bold text-neutral-900 break-words leading-tight">
                          {lang === "ar" ? item?.titleAr || item?.title : item?.title}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {item?.selectedColor?.nameAr || item?.selectedColor?.name || ""} |{" "}
                          {lang === "ar" ? "مقاس" : "Size"} {item?.selectedSize || ""} × {item?.quantity || 1}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-neutral-950 font-brand">
                      {((Number(item?.price) || 0) * (Number(item?.quantity) || 1)).toFixed(2)} LE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-neutral-950 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block uppercase font-brand">
                  {lang === "ar" ? "المبلغ الإجمالي للطلب" : "Total Amount"}
                </span>
                <span className="text-xs text-neutral-300">
                  {lang === "ar" ? "(شامل مصاريف الشحن والخصومات)" : "(Including Shipping)"}
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-white font-brand">
                {Number(order.total ?? (order as any).totalAmount ?? 0).toFixed(2)} LE
              </span>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="w-full py-3 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Truck className="w-4 h-4 text-red-500" />
                  <span>{lang === "ar" ? "تتبع الشحنة وإدارتها في حسابي" : "Track Order in My Account"}</span>
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://wa.me/201000000000?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{lang === "ar" ? "تأكيد عبر واتساب" : "Confirm via WhatsApp"}</span>
                </a>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{lang === "ar" ? "متابعة التسوق" : "Continue Shopping"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
