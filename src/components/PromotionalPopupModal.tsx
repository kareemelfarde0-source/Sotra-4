import React, { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { PopupBannerConfig, Category, OfferCategory, Product } from "../types";
import { sanitizeImageUrl, SOTRA_BANNER_PLACEHOLDER } from "../utils/storage";

interface PromotionalPopupModalProps {
  config?: PopupBannerConfig;
  isOpen: boolean;
  onClose: () => void;
  onNavigateCategory?: (categoryId: string) => void;
  onNavigateOfferCategory?: (offerCatId: string) => void;
  onNavigateProduct?: (productId: string) => void;
  onNavigateProductsGroup?: (productIds: string[], titleAr?: string, titleEn?: string) => void;
  categories?: Category[];
  products?: Product[];
  offerCategories?: OfferCategory[];
  lang: "ar" | "en";
}

export const PromotionalPopupModal: React.FC<PromotionalPopupModalProps> = ({
  config,
  isOpen,
  onClose,
  onNavigateCategory,
  onNavigateOfferCategory,
  onNavigateProduct,
  onNavigateProductsGroup,
  lang,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !config || config.isEnabled === false) {
    return null;
  }

  const handleAction = () => {
    onClose();
    if (!config.actionType || config.actionType === "none") return;

    if (config.actionType === "category" && config.targetId && onNavigateCategory) {
      onNavigateCategory(config.targetId);
    } else if (config.actionType === "offer_category" && config.targetId && onNavigateOfferCategory) {
      onNavigateOfferCategory(config.targetId);
    } else if (config.actionType === "product" && config.targetId && onNavigateProduct) {
      onNavigateProduct(config.targetId);
    } else if (config.actionType === "products_group" && onNavigateProductsGroup) {
      onNavigateProductsGroup(
        config.targetProductIds || [],
        config.groupTitleAr || "تشكيلة العرض الخاص",
        config.groupTitleEn || "Special Drop Collection"
      );
    } else if (config.actionType === "custom_url" && config.customUrl) {
      try {
        window.open(config.customUrl, "_blank");
      } catch {
        window.location.href = config.customUrl;
      }
    }
  };

  const imageSrc = sanitizeImageUrl(config.imageUrl, SOTRA_BANNER_PLACEHOLDER);
  const isClickable = Boolean(config.actionType && config.actionType !== "none");
  const ratio = config.aspectRatio || "18:9";

  // Aspect ratio styling
  const getAspectClasses = () => {
    switch (ratio) {
      case "18:9":
        return { aspect: "aspect-[18/9]", container: "max-w-lg sm:max-w-2xl" };
      case "4:3":
        return { aspect: "aspect-[4/3]", container: "max-w-md sm:max-w-lg" };
      case "16:9":
        return { aspect: "aspect-[16/9]", container: "max-w-lg sm:max-w-2xl" };
      case "1:1":
        return { aspect: "aspect-square", container: "max-w-sm sm:max-w-md" };
      case "3:4":
        return { aspect: "aspect-[3/4]", container: "max-w-xs sm:max-w-sm" };
      case "9:16":
        return { aspect: "aspect-[9/16]", container: "max-w-xs sm:max-w-sm" };
      default:
        return { aspect: "", container: "max-w-md sm:max-w-lg" };
    }
  };

  const { aspect: aspectClass, container: containerClass } = getAspectClasses();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Pure Image Modal Container */}
      <div
        id="promotional-popup-modal"
        className={`relative ${containerClass} w-full z-10 animate-scale-in my-auto flex flex-col items-center`}
      >
        {/* Floating Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close promotional popup"
          className="absolute -top-3.5 -end-3.5 z-30 w-10 h-10 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-xl border-2 border-white/40"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Pure Banner Image (Clickable for Redirection) */}
        <div
          onClick={handleAction}
          className={`relative w-full ${aspectClass} rounded-3xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 ${
            isClickable ? "cursor-pointer group" : "cursor-default"
          }`}
        >
          <img
            src={imageSrc}
            alt="Promotional Banner"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = SOTRA_BANNER_PLACEHOLDER;
            }}
            className={`w-full ${aspectClass ? "h-full object-cover" : "max-h-[82vh] object-contain sm:object-cover"} mx-auto transition-transform duration-500 ease-out group-hover:scale-[1.02] block`}
          />
        </div>
      </div>
    </div>
  );
};

