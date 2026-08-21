import React from "react";
import { Truck, ShieldCheck, RefreshCw, MessageSquare, Phone, MapPin } from "lucide-react";
import { FooterConfig } from "../types";
import { DEFAULT_FOOTER_CONFIG } from "../utils/storage";

interface FooterProps {
  onOpenProfile: () => void;
  lang: "ar" | "en";
  footerConfig?: FooterConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenProfile,
  lang,
  footerConfig,
}) => {
  const config = footerConfig || DEFAULT_FOOTER_CONFIG;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "truck":
        return <Truck className="w-5 h-5" />;
      case "refresh":
        return <RefreshCw className="w-5 h-5" />;
      case "shield":
        return <ShieldCheck className="w-5 h-5" />;
      case "message":
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getIconColor = (idx: number) => {
    const colors = ["text-red-500", "text-emerald-400", "text-amber-400", "text-blue-400"];
    return colors[idx % colors.length];
  };

  return (
    <footer className="bg-neutral-950 text-white border-t border-neutral-800 text-start pt-12 pb-24 sm:pb-12">
      {/* Guarantees Strip */}
      {config.guarantees && config.guarantees.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 border-b border-neutral-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {config.guarantees.map((item, idx) => (
              <div key={item.id || idx} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${getIconColor(idx)} flex-shrink-0`}>
                  {renderIcon(item.icon)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase font-brand">
                    {lang === "ar" ? item.titleAr : item.titleEn || item.titleAr}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {lang === "ar" ? item.descAr : item.descEn || item.descAr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 select-none">
            <span className="font-black text-xl tracking-wider font-brand text-white">
              SOTRA
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded shadow-xs">
              FASHION
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed font-arabic">
            {lang === "ar" ? config.aboutTextAr : config.aboutTextEn || config.aboutTextAr}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3 font-brand">
            {lang === "ar" ? "روابط سريعة" : "Quick Links"}
          </h4>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li>
              <button onClick={onOpenProfile} className="hover:text-white transition-colors cursor-pointer">
                {lang === "ar" ? "حسابي وتتبع وإلغاء الطلبات" : "My Account & Orders"}
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3 font-brand">
            {lang === "ar" ? "طرق الدفع والتأكيد" : "Payment & Dispatch"}
          </h4>
          <ul className="space-y-2 text-xs text-neutral-400">
            {config.paymentMethods && config.paymentMethods.length > 0 ? (
              config.paymentMethods.map((pm, idx) => (
                <li key={pm.id || idx} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pm.colorDot || "#ef4444" }}
                  />
                  <span>{lang === "ar" ? pm.nameAr : pm.nameEn || pm.nameAr}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>فودافون كاش (Vodafone Cash: {config.phoneNumber})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>الدفع عند الاستلام والمعاينة (COD)</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3 font-brand">
            {lang === "ar" ? "تواصل معنا" : "Contact Us"}
          </h4>
          <p className="text-xs text-neutral-400 flex items-center gap-2">
            <Phone className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <a href={`tel:${config.phoneNumber}`} className="font-mono text-neutral-200 hover:text-white transition-colors">
              {config.phoneNumber}
            </a>
          </p>
          <p className="text-xs text-neutral-400 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <span>{lang === "ar" ? config.storeAddressAr : config.storeAddressEn || config.storeAddressAr}</span>
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500">
        <span>{lang === "ar" ? config.copyrightAr : config.copyrightEn || config.copyrightAr}</span>
      </div>
    </footer>
  );
};
