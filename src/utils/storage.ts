import {
  AdminData,
  CartItem,
  ColorVariant,
  Order,
  OrderStatus,
  Product,
  PromoCode,
  CustomerProfile,
  SavedCustomer,
  FooterConfig,
  SplashScreenConfig,
  PaymentConfig,
  Governorate,
} from "../types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_OFFER_CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_COUPONS,
  DEFAULT_PAYMENT_CONFIG,
  EGYPTIAN_GOVERNORATES,
} from "../data/defaultData";
import {
  SOTRA_PRODUCT_PLACEHOLDER,
  SOTRA_BANNER_PLACEHOLDER,
  SOTRA_CATEGORY_PLACEHOLDER,
  SOTRA_OFFER_PLACEHOLDER,
} from "../assets/placeholder";
import {
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_SPLASH_CONFIG,
  DEFAULT_POPUP_CONFIG,
  saveAdminDataToFirebase,
  saveOrderToFirebase,
  updateOrderInFirebase,
  clearAllDemoDataFromFirebase,
  resetDemoDataToFirebase,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveOfferCategoryToFirestore,
  deleteOfferCategoryFromFirestore,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  saveCustomerProfileToFirebase,
  getCustomerProfileFromFirebase,
  subscribeToCustomerProfile,
  subscribeToFirebaseCustomers,
  deleteCustomerFromFirestore,
  savePaymentConfigToFirestore,
  saveGovernoratesToFirestore,
  saveFooterConfigToFirestore,
  saveSplashScreenConfigToFirestore,
  savePopupBannerConfigToFirestore,
  saveDiscountBadgeStyleToFirestore,
  syncAllStoreDataToFirebase,
  wipeEntireStoreDatabase,
  wipeSelectiveStoreCollection,
  wipeFirestoreCollection,
  type WipeDatabaseOptions,
} from "../firebase";

export {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_OFFER_CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_COUPONS,
  DEFAULT_PAYMENT_CONFIG,
  EGYPTIAN_GOVERNORATES,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_SPLASH_CONFIG,
  DEFAULT_POPUP_CONFIG,
  SOTRA_PRODUCT_PLACEHOLDER,
  SOTRA_BANNER_PLACEHOLDER,
  SOTRA_CATEGORY_PLACEHOLDER,
  SOTRA_OFFER_PLACEHOLDER,
  clearAllDemoDataFromFirebase,
  resetDemoDataToFirebase,
  wipeEntireStoreDatabase,
  wipeSelectiveStoreCollection,
  wipeFirestoreCollection,
  type WipeDatabaseOptions,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveCategoryToFirestore,
  deleteCategoryFromFirestore,
  saveOfferCategoryToFirestore,
  deleteOfferCategoryFromFirestore,
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  saveCouponToFirestore,
  deleteCouponFromFirestore,
  saveCustomerProfileToFirebase,
  getCustomerProfileFromFirebase,
  subscribeToCustomerProfile,
  subscribeToFirebaseCustomers,
  deleteCustomerFromFirestore,
  savePaymentConfigToFirestore,
  saveGovernoratesToFirestore,
  saveFooterConfigToFirestore,
  saveSplashScreenConfigToFirestore,
  savePopupBannerConfigToFirestore,
  saveDiscountBadgeStyleToFirestore,
  saveAdminDataToFirebase,
  syncAllStoreDataToFirebase,
  saveOrderToFirebase,
  updateOrderInFirebase,
};

export const STORAGE_KEYS = {
  ADMIN_DATA: "sotra_admin_data_v5",
  CART: "sotra_cart_v5",
  ORDERS: "sotra_orders_v5",
  PROFILE: "sotra_profile_v5",
  COUPONS: "sotra_coupons_v5",
  MY_ORDER_IDS: "sotra_my_order_ids_v5",
};

export function getInvKey(colorNameAr?: string, colorName?: string, size?: string): string {
  const col = (colorNameAr || colorName || "عام").trim();
  const sz = (size || "مقاس واحد").trim();
  return `${col}__${sz}`;
}

export function sanitizeImageUrl(url?: string, fallback: string = SOTRA_PRODUCT_PLACEHOLDER): string {
  if (!url || typeof url !== "string" || url.trim().length === 0 || url.includes("images.unsplash.com")) {
    return fallback;
  }
  return url;
}

export function normalizeProduct(p: any): Product {
  const rawColors =
    Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors
      : [{ name: "Black", nameAr: "أسود", hex: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }];

  const safeColors = rawColors.map((col: any) => ({
    ...col,
    image: sanitizeImageUrl(col.image, SOTRA_PRODUCT_PLACEHOLDER),
    backImage: col.backImage ? sanitizeImageUrl(col.backImage, SOTRA_PRODUCT_PLACEHOLDER) : undefined,
  }));

  const safeSizes =
    Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["S", "M", "L", "XL", "XXL"];

  return {
    ...p,
    price: Number(p.price) || 0,
    wholesalePrice: p.wholesalePrice !== undefined ? Number(p.wholesalePrice) : 0,
    colors: safeColors,
    sizes: safeSizes,
    features: Array.isArray(p.features) ? p.features : [],
    featuresAr: Array.isArray(p.featuresAr) ? p.featuresAr : [],
    inventory: p.inventory && typeof p.inventory === "object" ? p.inventory : {},
  };
}

export function loadAdminData(): AdminData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const rawProducts = Array.isArray(parsed.products) ? parsed.products : [];
        const normalizedProducts = rawProducts.map(normalizeProduct);
        const rawCategories = Array.isArray(parsed.categories) ? parsed.categories : [];
        const rawOfferCategories = Array.isArray(parsed.offerCategories) ? parsed.offerCategories : [];
        const rawBanners = Array.isArray(parsed.banners) ? parsed.banners : [];

        return {
          categories: rawCategories.map((c: any) => ({ ...c, image: sanitizeImageUrl(c.image, SOTRA_CATEGORY_PLACEHOLDER) })),
          offerCategories: rawOfferCategories.map((oc: any) => ({ ...oc, image: sanitizeImageUrl(oc.image, SOTRA_OFFER_PLACEHOLDER) })),
          products: normalizedProducts,
          banners: rawBanners.map((b: any) => ({ ...b, image: sanitizeImageUrl(b.image, SOTRA_BANNER_PLACEHOLDER) })),
          coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
          governorates: Array.isArray(parsed.governorates) && parsed.governorates.length > 0 ? parsed.governorates : EGYPTIAN_GOVERNORATES,
          paymentConfig: parsed.paymentConfig ? { ...DEFAULT_PAYMENT_CONFIG, ...parsed.paymentConfig } : DEFAULT_PAYMENT_CONFIG,
          footerConfig: parsed.footerConfig ? { ...DEFAULT_FOOTER_CONFIG, ...parsed.footerConfig } : DEFAULT_FOOTER_CONFIG,
          splashScreenConfig: parsed.splashScreenConfig ? { ...DEFAULT_SPLASH_CONFIG, ...parsed.splashScreenConfig } : DEFAULT_SPLASH_CONFIG,
          popupBannerConfig: parsed.popupBannerConfig ? { ...DEFAULT_POPUP_CONFIG, ...parsed.popupBannerConfig } : DEFAULT_POPUP_CONFIG,
          discountBadgeStyle: parsed.discountBadgeStyle || "vertical_left",
          updatedAt: parsed.updatedAt || Date.now(),
        };
      }
    }
  } catch (e) {
    console.warn("Could not read admin data from storage, returning clean empty state", e);
  }

  const initialData: AdminData = {
    categories: [],
    offerCategories: [],
    products: [],
    banners: [],
    coupons: [],
    governorates: EGYPTIAN_GOVERNORATES,
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    footerConfig: DEFAULT_FOOTER_CONFIG,
    splashScreenConfig: DEFAULT_SPLASH_CONFIG,
    popupBannerConfig: DEFAULT_POPUP_CONFIG,
    discountBadgeStyle: "vertical_left",
    updatedAt: Date.now(),
  };
  return initialData;
}

export function saveAdminData(data: AdminData): void {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(data));
    saveAdminDataToFirebase(data).catch((e) => console.warn("Background Firebase saveAdminData error:", e));
  } catch (e) {
    console.error("Failed to save admin data to localStorage", e);
  }
}

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not load cart from localStorage", e);
  }
  return [];
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not load orders from localStorage", e);
  }
  return [];
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    if (orders.length > 0) {
      const latest = orders[0];
      saveOrderToFirebase(latest).catch((e) => console.warn("Background Firebase saveOrder error:", e));
    }
  } catch (e) {
    console.error("Failed to save orders to localStorage", e);
  }
}

/**
 * Normalizes phone numbers for accurate customer matching
 */
export function cleanCustomerPhone(phone?: string): string {
  if (!phone || typeof phone !== "string") return "";
  let clean = phone.replace(/[\s\-\(\)\.]+/g, "").trim();
  // Strip country codes: +20, 0020, 20
  if (clean.startsWith("+20")) clean = "0" + clean.slice(3);
  else if (clean.startsWith("0020")) clean = "0" + clean.slice(4);
  else if (clean.startsWith("20") && clean.length >= 12) clean = "0" + clean.slice(2);
  else if (clean.length === 10 && clean.startsWith("1")) clean = "0" + clean;
  return clean;
}

/**
 * Retrieves the list of order IDs placed by the current user on this device
 */
export function getMyOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MY_ORDER_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    }
  } catch (e) {
    console.warn("Could not read my order IDs from storage", e);
  }
  return [];
}

/**
 * Registers an order ID as belonging to the current user
 */
export function addMyOrderId(orderId: string): void {
  if (!orderId) return;
  try {
    const current = getMyOrderIds();
    if (!current.includes(orderId)) {
      const updated = [orderId, ...current];
      localStorage.setItem(STORAGE_KEYS.MY_ORDER_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn("Could not save my order ID to storage", e);
  }
}

/**
 * Filters orders so only the registered customer's own orders are returned.
 * Matches by phone number or by locally registered order IDs.
 */
export function filterCustomerOrders(
  allOrders: Order[],
  customerPhone?: string,
  myOrderIds?: string[]
): Order[] {
  if (!Array.isArray(allOrders) || allOrders.length === 0) return [];

  const targetPhone = cleanCustomerPhone(customerPhone);
  const ids = myOrderIds || getMyOrderIds();

  // If no phone and no local order IDs registered, return empty array to prevent data leakage
  if (!targetPhone && ids.length === 0) {
    return [];
  }

  return allOrders.filter((order) => {
    if (!order) return false;

    // 1. Match by stored local order IDs
    if (order.orderId && ids.includes(order.orderId)) {
      return true;
    }

    // 2. Match by primary customer phone
    if (targetPhone) {
      const orderPhone = cleanCustomerPhone(order.customer?.phoneNumber);
      if (orderPhone && orderPhone === targetPhone) return true;

      // 3. Match by secondary phone
      const secPhone = cleanCustomerPhone(order.customer?.secondaryPhone);
      if (secPhone && secPhone === targetPhone) return true;

      // 4. Match by Vodafone sender phone if applicable
      const vodafonePhone = cleanCustomerPhone(order.vodafoneSenderPhone || order.senderPhoneOrInstaPayId);
      if (vodafonePhone && vodafonePhone === targetPhone) return true;
    }

    return false;
  });
}

export function normalizeKeyPart(str?: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ");
}

/**
 * Returns available stock for a given product variant (color + size)
 */
export function getVariantStock(product: Product, color?: ColorVariant, size?: string): number {
  if (!product) return 0;

  if (!product.inventory || Object.keys(product.inventory).length === 0) {
    return product.inStock !== false ? 10 : 0;
  }

  if (!color || !size) {
    const total = Object.values(product.inventory).reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
    if (total === 0 && product.inStock !== false) return 10;
    return total;
  }

  const primaryKey = getInvKey(color.nameAr, color.name, size);
  if (product.inventory[primaryKey] !== undefined && product.inventory[primaryKey] !== null) {
    return Number(product.inventory[primaryKey]?.qty) || 0;
  }

  if (color.name) {
    const engKey = `${color.name.trim()}__${size.trim()}`;
    if (product.inventory[engKey] !== undefined && product.inventory[engKey] !== null) {
      return Number(product.inventory[engKey]?.qty) || 0;
    }
  }

  if (color.nameAr) {
    const arKey = `${color.nameAr.trim()}__${size.trim()}`;
    if (product.inventory[arKey] !== undefined && product.inventory[arKey] !== null) {
      return Number(product.inventory[arKey]?.qty) || 0;
    }
  }

  const targetNormColAr = normalizeKeyPart(color.nameAr);
  const targetNormColEn = normalizeKeyPart(color.name);
  const targetNormSize = normalizeKeyPart(size);

  const entries = Object.entries(product.inventory);
  for (const [k, val] of entries) {
    const parts = k.split("__");
    if (parts.length >= 2) {
      const kCol = normalizeKeyPart(parts[0]);
      const kSize = normalizeKeyPart(parts[1]);

      if (kSize === targetNormSize) {
        if (
          (targetNormColAr && (kCol === targetNormColAr || kCol.includes(targetNormColAr) || targetNormColAr.includes(kCol))) ||
          (targetNormColEn && (kCol === targetNormColEn || kCol.includes(targetNormColEn) || targetNormColEn.includes(kCol))) ||
          kCol === "عام" ||
          kCol === "افتراضي" ||
          entries.length === 1
        ) {
          return Number(val?.qty) || 0;
        }
      }
    }
  }

  if ((!product.colors || product.colors.length <= 1) && targetNormSize) {
    for (const [k, val] of entries) {
      const parts = k.split("__");
      if (parts.length >= 2 && normalizeKeyPart(parts[1]) === targetNormSize) {
        return Number(val?.qty) || 0;
      }
    }
  }

  if (product.inStock !== false) {
    return 10;
  }

  return 0;
}

export function isLowStock(qty: number): boolean {
  return qty === 1;
}

export function isOutOfStock(qty: number): boolean {
  return qty <= 0;
}

export function decrementInventory(orderItems: CartItem[]): void {
  const adminData = loadAdminData();
  let changed = false;

  orderItems.forEach((item) => {
    const product = adminData.products.find((p) => p.id === item.productId);
    if (!product) return;
    if (!product.inventory) product.inventory = {};

    const key = getInvKey(item.selectedColor.nameAr, item.selectedColor.name, item.selectedSize);
    const currentEntry = product.inventory[key];
    const currentQty = currentEntry && typeof currentEntry.qty === "number" ? currentEntry.qty : 10;
    const nextQty = Math.max(0, currentQty - (Number(item.quantity) || 1));

    product.inventory[key] = {
      qty: nextQty,
      wholesalePrice: currentEntry?.wholesalePrice || product.wholesalePrice || 0,
      salePrice: currentEntry?.salePrice || item.price,
    };

    const totalRemaining = Object.values(product.inventory).reduce((acc, cur) => acc + (Number(cur?.qty) || 0), 0);
    product.inStock = totalRemaining > 0;
    changed = true;
  });

  if (changed) {
    saveAdminData(adminData);
  }
}

export function restoreInventory(orderItems: CartItem[]): void {
  const adminData = loadAdminData();
  let changed = false;

  orderItems.forEach((item) => {
    const product = adminData.products.find((p) => p.id === item.productId);
    if (!product) return;
    if (!product.inventory) product.inventory = {};

    const key = getInvKey(item.selectedColor.nameAr, item.selectedColor.name, item.selectedSize);
    const currentEntry = product.inventory[key];
    const currentQty = currentEntry && typeof currentEntry.qty === "number" ? currentEntry.qty : 0;
    const nextQty = currentQty + (Number(item.quantity) || 1);

    product.inventory[key] = {
      qty: nextQty,
      wholesalePrice: currentEntry?.wholesalePrice || product.wholesalePrice || 0,
      salePrice: currentEntry?.salePrice || item.price,
    };
    product.inStock = true;
    changed = true;
  });

  if (changed) {
    saveAdminData(adminData);
  }
}

export function cancelOrder(
  orderId: string,
  reason?: string,
  currentOrdersList?: Order[]
): { success: boolean; message: string; updatedOrders: Order[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    let orders: Order[] = raw ? JSON.parse(raw) : [];

    if (currentOrdersList && currentOrdersList.length > 0) {
      const orderMap = new Map<string, Order>();
      orders.forEach((o) => { if (o.orderId) orderMap.set(o.orderId.trim(), o); });
      currentOrdersList.forEach((o) => { if (o.orderId) orderMap.set(o.orderId.trim(), o); });
      orders = Array.from(orderMap.values());
    }

    const trimmedId = (orderId || "").trim();
    const orderIndex = orders.findIndex(
      (o) => o.orderId && o.orderId.trim().toLowerCase() === trimmedId.toLowerCase()
    );

    if (orderIndex === -1) {
      return { success: false, message: "لم يتم العثور على الطلب", updatedOrders: orders };
    }

    const targetOrder = orders[orderIndex];
    if (targetOrder.trackingStatus === "cancelled") {
      return { success: false, message: "هذا الطلب ملغي بالفعل", updatedOrders: orders };
    }

    restoreInventory(targetOrder.items || []);

    targetOrder.trackingStatus = "cancelled";
    targetOrder.cancelledAt = new Date().toISOString();
    targetOrder.updatedAt = new Date().toISOString();
    targetOrder.cancellationReason = reason || "تم إلغاء الطلب بناءً على رغبة العميل وإرجاع المنتجات للمخزون";

    orders[orderIndex] = targetOrder;
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    updateOrderInFirebase(trimmedId, {
      trackingStatus: "cancelled",
      cancelledAt: targetOrder.cancelledAt,
      cancellationReason: targetOrder.cancellationReason,
      updatedAt: targetOrder.updatedAt,
    }).catch((e) => console.warn("Firebase updateOrder error:", e));

    return { success: true, message: "تم إلغاء الطلب بنجاح وإرجاع الكمية إلى المخزون", updatedOrders: orders };
  } catch (e) {
    console.error("Cancel order error:", e);
    return { success: false, message: "حدث خطأ أثناء إلغاء الطلب", updatedOrders: [] };
  }
}

export function validatePromoCode(
  inputCode: string,
  subtotal: number,
  shippingCost: number,
  adminCoupons: PromoCode[]
): {
  isValid: boolean;
  messageAr: string;
  messageEn: string;
  discountAmount: number;
  freeShipping: boolean;
  coupon?: PromoCode;
} {
  const code = (inputCode || "").trim().toUpperCase();
  if (!code) {
    return {
      isValid: false,
      messageAr: "الرجاء إدخال كود الخصم",
      messageEn: "Please enter promo code",
      discountAmount: 0,
      freeShipping: false,
    };
  }

  const match = adminCoupons.find((c) => c.code.trim().toUpperCase() === code && c.isActive);
  if (!match) {
    return {
      isValid: false,
      messageAr: "كود الخصم غير صالح أو منتهي الصلاحية",
      messageEn: "Invalid or expired promo code",
      discountAmount: 0,
      freeShipping: false,
    };
  }

  if (match.minOrderAmount && subtotal < match.minOrderAmount) {
    return {
      isValid: false,
      messageAr: `هذا الكود يتطلب حداً أدنى للطلب بقيمة ${match.minOrderAmount} ج.م`,
      messageEn: `This coupon requires minimum order of ${match.minOrderAmount} LE`,
      discountAmount: 0,
      freeShipping: false,
    };
  }

  let discountAmount = 0;
  let freeShipping = false;

  if (match.type === "free_shipping") {
    freeShipping = true;
    discountAmount = 0;
  } else if (match.type === "percentage") {
    discountAmount = Math.round((subtotal * match.value) / 100);
  } else if (match.type === "fixed_amount") {
    discountAmount = Math.min(subtotal, match.value);
  }

  return {
    isValid: true,
    messageAr: `تم تفعيل كود الخصم بنجاح (${match.code})`,
    messageEn: `Coupon ${match.code} applied successfully!`,
    discountAmount,
    freeShipping,
    coupon: match,
  };
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  currentOrdersList?: Order[]
): { success: boolean; updatedOrders: Order[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    let orders: Order[] = raw ? JSON.parse(raw) : [];

    // Merge currentOrdersList if provided to make sure we don't miss live items
    if (currentOrdersList && currentOrdersList.length > 0) {
      const orderMap = new Map<string, Order>();
      orders.forEach((o) => { if (o.orderId) orderMap.set(o.orderId.trim(), o); });
      currentOrdersList.forEach((o) => { if (o.orderId) orderMap.set(o.orderId.trim(), o); });
      orders = Array.from(orderMap.values());
    }

    const trimmedId = (orderId || "").trim();
    const idx = orders.findIndex(
      (o) => o.orderId && o.orderId.trim().toLowerCase() === trimmedId.toLowerCase()
    );

    if (idx === -1) {
      console.warn(`Order not found for status update: ${orderId}`);
      return { success: false, updatedOrders: orders };
    }

    const prevStatus = orders[idx].trackingStatus;
    const nowIso = new Date().toISOString();

    orders[idx] = {
      ...orders[idx],
      trackingStatus: newStatus,
      updatedAt: nowIso,
    };

    if (newStatus === "cancelled" && prevStatus !== "cancelled") {
      restoreInventory(orders[idx].items || []);
      orders[idx].cancelledAt = nowIso;
      orders[idx].cancellationReason = "تم إلغاء الطلب من لوحة الإدارة وإرجاع المخزون";
    }

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    updateOrderInFirebase(trimmedId, {
      trackingStatus: newStatus,
      updatedAt: orders[idx].updatedAt,
      cancelledAt: orders[idx].cancelledAt,
      cancellationReason: orders[idx].cancellationReason,
    }).catch((e) => console.warn("Firebase updateOrderStatus error:", e));

    return { success: true, updatedOrders: orders };
  } catch (e) {
    console.error("Update order status error:", e);
    return { success: false, updatedOrders: [] };
  }
}
