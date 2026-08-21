import { Category, OfferCategory, Product, BannerSlide, Governorate, PromoCode, PaymentConfig } from "../types";

export const EGYPTIAN_GOVERNORATES: Governorate[] = [
  { id: "cairo", nameAr: "القاهرة", nameEn: "Cairo", shippingCost: 55, deliveryDays: "1-2 أيام عمل" },
  { id: "giza", nameAr: "الجيزة", nameEn: "Giza", shippingCost: 55, deliveryDays: "1-2 أيام عمل" },
  { id: "alexandria", nameAr: "الإسكندرية", nameEn: "Alexandria", shippingCost: 60, deliveryDays: "2-3 أيام عمل" },
  { id: "qalyubia", nameAr: "القليوبية", nameEn: "Qalyubia", shippingCost: 60, deliveryDays: "2-3 أيام عمل" },
  { id: "sharqia", nameAr: "الشرقية", nameEn: "Sharqia", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "dakahlia", nameAr: "الدقهلية (المنصورة)", nameEn: "Dakahlia", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "gharbia", nameAr: "الغربية (طنطا)", nameEn: "Gharbia", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "monufia", nameAr: "المنوفية", nameEn: "Monufia", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "beheira", nameAr: "البحيرة", nameEn: "Beheira", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "kafr_el_sheikh", nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", shippingCost: 65, deliveryDays: "2-4 أيام عمل" },
  { id: "damietta", nameAr: "دمياط", nameEn: "Damietta", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "port_said", nameAr: "بورسعيد", nameEn: "Port Said", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "ismailia", nameAr: "الإسماعيلية", nameEn: "Ismailia", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "suez", nameAr: "السويس", nameEn: "Suez", shippingCost: 65, deliveryDays: "2-3 أيام عمل" },
  { id: "fayoum", nameAr: "الفيوم", nameEn: "Fayoum", shippingCost: 70, deliveryDays: "3-4 أيام عمل" },
  { id: "beni_suef", nameAr: "بني سويف", nameEn: "Beni Suef", shippingCost: 70, deliveryDays: "3-4 أيام عمل" },
  { id: "minya", nameAr: "المنيا", nameEn: "Minya", shippingCost: 75, deliveryDays: "3-4 أيام عمل" },
  { id: "assiut", nameAr: "أسيوط", nameEn: "Assiut", shippingCost: 75, deliveryDays: "3-4 أيام عمل" },
  { id: "sohag", nameAr: "سوهاج", nameEn: "Sohag", shippingCost: 80, deliveryDays: "3-5 أيام عمل" },
  { id: "qena", nameAr: "قنا", nameEn: "Qena", shippingCost: 80, deliveryDays: "3-5 أيام عمل" },
  { id: "luxor", nameAr: "الأقصر", nameEn: "Luxor", shippingCost: 85, deliveryDays: "3-5 أيام عمل" },
  { id: "aswan", nameAr: "أسوان", nameEn: "Aswan", shippingCost: 85, deliveryDays: "4-5 أيام عمل" },
  { id: "matrouh", nameAr: "مطروح والساحل الشمالي", nameEn: "Matrouh", shippingCost: 85, deliveryDays: "3-5 أيام عمل" },
  { id: "red_sea", nameAr: "البحر الأحمر (الغردقة)", nameEn: "Red Sea", shippingCost: 90, deliveryDays: "3-5 أيام عمل" },
  { id: "south_sinai", nameAr: "جنوب سيناء (شرم الشيخ)", nameEn: "South Sinai", shippingCost: 90, deliveryDays: "4-6 أيام عمل" },
  { id: "north_sinai", nameAr: "شمال سيناء", nameEn: "North Sinai", shippingCost: 95, deliveryDays: "4-6 أيام عمل" },
  { id: "new_valley", nameAr: "الوادي الجديد", nameEn: "New Valley", shippingCost: 100, deliveryDays: "4-6 أيام عمل" },
];

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  vodafoneCashEnabled: true,
  vodafoneCashNumber: "0100000000",
  vodafoneCashAccountName: "Sotra Fashion Store",
  vodafoneCashInstructionsAr: "قم بتحويل قيمة رسوم الشحن الموضحة إلى رقم فودافون كاش أعلاه، ثم أدخل رقم محفظتك للتأكيد.",
  instaPayEnabled: true,
  instaPayId: "sotra@instapay",
  instaPayAccountName: "Sotra Fashion",
  instaPayInstructionsAr: "قم بتحويل رسوم الشحن عبر تطبيق إنستاباي إلى العنوان أعلاه، ثم أدخل معرف حسابك أو رقم العملية للتأكيد.",
  advanceShippingFeeOnly: true,
};

// Clean empty database state without hardcoded mock data
export const DEFAULT_CATEGORIES: Category[] = [];
export const DEFAULT_OFFER_CATEGORIES: OfferCategory[] = [];
export const DEFAULT_PRODUCTS: Product[] = [];
export const DEFAULT_BANNERS: BannerSlide[] = [];
export const DEFAULT_COUPONS: PromoCode[] = [];
