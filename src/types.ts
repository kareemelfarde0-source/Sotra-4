export interface ColorVariant {
  name: string;
  nameAr: string;
  hex: string;
  image: string;
  backImage?: string;
}

export interface InventoryItem {
  qty: number;
  wholesalePrice?: number;
  salePrice?: number;
}

export type DiscountBadgeStyle =
  | "vertical_left" // شريط رأسي يسار الكارت بالطول (جهة اليسار)
  | "vertical_right" // شريط رأسي يمين الكارت بالطول (جهة اليمين)
  | "diagonal_corner" // شريط مائل بالزاوية اليمنى
  | "diagonal_corner_right" // شريط مائل بالزاوية اليمنى
  | "diagonal_corner_left" // شريط مائل بالزاوية اليسرى
  | "horizontal_bar" // شريط أفقي عريض أسفل الصورة
  | "horizontal_top_left" // شريط أفقي أعلى اليسار
  | "horizontal_top_right" // شريط أفقي أعلى اليمين
  | "above_title" // شارة أنيقة فوق اسم وسعر المنتج
  | "pill_corner" // كبسولة دائرية أعلى اليسار
  | "pill_corner_left" // كبسولة دائرية أعلى اليسار
  | "pill_corner_right" // كبسولة دائرية أعلى اليمين
  | "banner_ribbon" // شريط عريض أعلى الصورة
  | string;

export interface ProductBadge {
  text: string;
  textAr: string;
  type: "new" | "discount" | "featured" | "bestseller" | "restocked" | "exclusive" | "limited" | "custom" | string;
  colorBg?: string;
  colorText?: string;
}

export interface Product {
  id: string;
  title: string;
  titleAr: string;
  fit: string;
  fitAr: string;
  category: string;
  offerCategory?: string;
  price: number; // Retail selling price (سعر البيع)
  wholesalePrice?: number; // Wholesale / Cost price (سعر الجملة والتكلفة)
  originalPrice?: number | null;
  discountPercent?: number | null;
  discountBadgeStyle?: DiscountBadgeStyle | "default"; // Custom discount ribbon style override
  discountScheduleEnabled?: boolean; // Enable time-scheduled discount
  discountStartDate?: string; // Discount start date & time (e.g. ISO / datetime-local string)
  discountEndDate?: string; // Discount end date & time (e.g. ISO / datetime-local string)
  badge?: ProductBadge | null;
  colors: ColorVariant[];
  sizes: string[];
  rating?: number;
  reviewsCount?: number;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  fabric?: string;
  fabricAr?: string;
  inStock: boolean;
  isNewArrival?: boolean;
  inventory?: Record<string, InventoryItem>; // key: `${colorNameAr || colorName}__${size}`
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  itemCount?: number;
  isVisible?: boolean;
}

export interface OfferCategory {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  isVisible?: boolean;
}

export interface BannerSlide {
  id: number | string;
  image: string;
  title?: string;
  titleAr?: string;
  subtitleAr?: string;
  targetType?: "category" | "offer_category" | "product";
  targetCategory?: string;
  targetOfferCategory?: string;
  targetProduct?: string;
  targetId?: string;
}

export type PromoType = "free_shipping" | "percentage" | "fixed_amount";

export interface PromoCode {
  id: string;
  code: string;
  type: PromoType;
  value: number;
  minOrderAmount?: number;
  descriptionAr: string;
  descriptionEn?: string;
  isActive: boolean;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingCost: number;
  deliveryDays: string;
}

export interface PaymentConfig {
  vodafoneCashEnabled: boolean;
  vodafoneCashNumber: string;
  vodafoneCashAccountName?: string;
  vodafoneCashInstructionsAr?: string;

  instaPayEnabled: boolean;
  instaPayId: string; // e.g. sotra@instapay
  instaPayAccountName?: string;
  instaPayInstructionsAr?: string;
  instaPayQrImage?: string;

  advanceShippingFeeOnly: boolean; // Always true: customer pays shipping fee upfront to confirm, remaining upon delivery
}

export interface FooterGuaranteeItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: "truck" | "refresh" | "shield" | "message" | "phone" | "map";
}
export type GuaranteeItem = FooterGuaranteeItem;

export interface FooterPaymentMethod {
  id: string;
  nameAr: string;
  nameEn: string;
  colorDot: string;
}
export type PaymentMethodItem = FooterPaymentMethod;

export interface FooterConfig {
  aboutTextAr: string;
  aboutTextEn?: string;
  storeAddressAr: string;
  storeAddressEn?: string;
  phoneNumber: string;
  whatsappNumber?: string;
  copyrightAr: string;
  copyrightEn?: string;
  guarantees: FooterGuaranteeItem[];
  paymentMethods: FooterPaymentMethod[];
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

export interface SplashScreenConfig {
  isEnabled: boolean;
  theme: "white" | "dark";
  brandName?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  loadingTextAr?: string;
  establishedText?: string;
  logoLetter?: string;
  customLogoUrl?: string;
  showOnlyLogo?: boolean; // When true, displays ONLY the pure luxury logo without texts
  minDurationMs: number;
  glowEffect: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  titleAr: string;
  fit: string;
  fitAr: string;
  price: number;
  originalPrice?: number | null;
  selectedColor: ColorVariant;
  selectedSize: string;
  quantity: number;
}

export type PaymentMethodType = "vodafone_cash" | "instapay";

export interface CustomerProfile {
  fullName: string;
  phoneNumber: string;
  secondaryPhone?: string;
  governorateId: string;
  governorateNameAr?: string;
  detailedAddress: string;
  notes?: string;
  paymentMethod?: PaymentMethodType;
  senderPhoneOrInstaPayId?: string; // رقم محفظة فودافون أو حساب انستاباي المحول منه
  transactionReference?: string; // رقم العملية أو الحوالة
  shippingDepositPaid?: number; // قيمة الشحن المحولة مقدماً
  codRemainingAmount?: number; // المبلغ المطلوب عند الاستلام
  vodafoneSenderPhone?: string; // backwards compatibility
  shippingTransferNumber?: string; // backwards compatibility
}

export interface SavedCustomer {
  id: string; // clean phone number
  fullName: string;
  phoneNumber: string;
  secondaryPhone?: string;
  governorateId: string;
  governorateNameAr: string;
  detailedAddress: string;
  notes?: string;
  totalOrdersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
  updatedAt?: string;
  orders?: string[];
}

export type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "pending_verification"
  | "processing"
  | "out_for_delivery";

export interface Order {
  orderId: string;
  createdAt: string;
  customer: CustomerProfile;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  appliedCouponCode?: string;
  total: number;
  advanceShippingPaid: number; // تم دفعه مقدماً (رسوم الشحن)
  remainingUponDelivery: number; // مطلوب دفعه عند الاستلام (سعر المنتجات بعد الخصم)
  governorateNameAr: string;
  estimatedDelivery: string;
  trackingStatus: OrderStatus;
  paymentMethod: PaymentMethodType;
  senderPhoneOrInstaPayId?: string;
  transactionReference?: string;
  vodafoneSenderPhone?: string;
  shippingTransferNumber?: string;
  vodafoneAmount?: number;
  cancelledAt?: string;
  cancellationReason?: string;
  updatedAt?: string;
}

export type PopupAspectRatio = "18:9" | "4:3" | "16:9" | "1:1" | "3:4" | "9:16" | "auto";

export interface PopupBannerConfig {
  isEnabled: boolean;
  imageUrl: string;
  aspectRatio?: PopupAspectRatio;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  actionType: "none" | "category" | "offer_category" | "product" | "products_group" | "custom_url";
  targetId?: string; // category id, offerCategory id, or product id
  targetProductIds?: string[]; // array of product IDs for "products_group"
  groupTitleAr?: string; // custom title for products group
  groupTitleEn?: string;
  customUrl?: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  showFrequency: "always" | "once_per_session" | "once_per_day";
  delaySeconds?: number;
}

export interface AdminData {
  categories: Category[];
  offerCategories: OfferCategory[];
  products: Product[];
  banners: BannerSlide[];
  coupons?: PromoCode[];
  governorates?: Governorate[];
  paymentConfig?: PaymentConfig;
  footerConfig?: FooterConfig;
  splashScreenConfig?: SplashScreenConfig;
  popupBannerConfig?: PopupBannerConfig;
  discountBadgeStyle?: DiscountBadgeStyle;
  updatedAt?: number;
}

export interface FilterState {
  category: string;
  fit: string[];
  sizes: string[];
  colors: string[];
  minPrice: number;
  maxPrice: number;
  onlyDiscounted: boolean;
  onlyInStock: boolean;
  sortBy: "featured" | "newest" | "price-asc" | "price-desc" | "discount";
}
