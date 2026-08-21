import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  onSnapshot,
  Firestore,
  getDocFromServer,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import {
  AdminData,
  Category,
  CustomerProfile,
  SavedCustomer,
  OfferCategory,
  Order,
  Product,
  PromoCode,
  BannerSlide,
  FooterConfig,
  SplashScreenConfig,
  PaymentConfig,
  Governorate,
  PopupBannerConfig,
  DiscountBadgeStyle,
} from "./types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_OFFER_CATEGORIES,
  DEFAULT_BANNERS,
  DEFAULT_COUPONS,
  DEFAULT_PAYMENT_CONFIG,
  EGYPTIAN_GOVERNORATES,
} from "./data/defaultData";

export const DEFAULT_POPUP_CONFIG: PopupBannerConfig = {
  isEnabled: true,
  imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
  aspectRatio: "18:9",
  titleAr: "عروض الموسم الحصرية 🔥",
  titleEn: "Exclusive Season Offers 🔥",
  subtitleAr: "اكتشف أحدث تشكيلات الملابس والأزياء الفاخرة بخصومات خاصة",
  subtitleEn: "Discover latest luxury drops with exclusive discounts",
  actionType: "category",
  targetId: "",
  targetProductIds: [],
  groupTitleAr: "تشكيلة العرض الخاص",
  groupTitleEn: "Special Offer Collection",
  buttonTextAr: "تسوق العرض الآن",
  buttonTextEn: "Shop Deals Now",
  showFrequency: "once_per_session",
  delaySeconds: 1,
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  aboutTextAr: "سترة فاشون (SOTRA FASHION) — أفضل الخامات التركية والعالمية في الملابس والأزياء العصرية بأعلى معايير الجودة والتصنيع الفاخر.",
  aboutTextEn: "SOTRA FASHION — Premium Turkish & International apparel crafted with the finest fabrics.",
  storeAddressAr: "مرسي مطروح بجوار فرع بين سبورت",
  storeAddressEn: "Marsa Matrouh, Next to beIN Sports",
  phoneNumber: "0100000000",
  whatsappNumber: "0100000000",
  copyrightAr: `© ${new Date().getFullYear()} SOTRA FASHION MEN. جميع الحقوق محفوظة.`,
  copyrightEn: `© ${new Date().getFullYear()} SOTRA FASHION MEN. All Rights Reserved.`,
  guarantees: [
    {
      id: "g1",
      titleAr: "شحن سريع لكافة المحافظات",
      titleEn: "Fast Egypt Shipping",
      descAr: "توصيل خلال 24 - 72 ساعة لباب بيتك",
      descEn: "Delivery in 24 - 72 hours",
      icon: "truck",
    },
    {
      id: "g2",
      titleAr: "معاينة واستبدال فوري",
      titleEn: "Easy Exchange & Returns",
      descAr: "افتح وعاين الخامات والمقاس مع المندوب قبل دفع باقي الحساب",
      descEn: "Inspect quality before final payment",
      icon: "refresh",
    },
    {
      id: "g3",
      titleAr: "أفضل الخامات التركية والعالمية",
      titleEn: "Premium International Fabrics",
      descAr: "أقمشة مستوردة ومصنوعة بأعلى مقاييس الجودة",
      descEn: "Imported premium materials",
      icon: "shield",
    },
    {
      id: "g4",
      titleAr: "دعم واتساب مباشر 24/7",
      titleEn: "24/7 Customer Care",
      descAr: "خدمة العملاء ومتابعة الشحنات على مدار اليوم",
      descEn: "Direct WhatsApp support all day",
      icon: "message",
    },
  ],
  paymentMethods: [
    { id: "pm1", nameAr: "فودافون كاش (Vodafone Cash)", nameEn: "Vodafone Cash", colorDot: "#ef4444" },
    { id: "pm2", nameAr: "إنستاباي (InstaPay)", nameEn: "InstaPay", colorDot: "#3b82f6" },
    { id: "pm3", nameAr: "الدفع عند الاستلام لمبلغ المنتجات", nameEn: "COD Remaining Balance", colorDot: "#10b981" },
  ],
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    whatsapp: "0100000000",
  },
};

export const DEFAULT_SPLASH_CONFIG: SplashScreenConfig = {
  isEnabled: true,
  theme: "white",
  brandName: "SOTRA FASHION",
  subtitleAr: "",
  subtitleEn: "",
  loadingTextAr: "",
  establishedText: "",
  logoLetter: "S",
  customLogoUrl: "",
  showOnlyLogo: true, // Only the clean luxury logo is displayed by default
  minDurationMs: 1000,
  glowEffect: true,
};

// Initialize Firebase App instance safely
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseApp = app;

// Set Firestore log level to error to avoid noisy connection retry warnings when offline
try {
  setLogLevel("error");
} catch {
  // Ignored if already set
}

// Initialize Firestore with Database ID from config as mandated
export const db: Firestore = (() => {
  try {
    const dbId =
      firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
        ? firebaseConfig.firestoreDatabaseId
        : undefined;

    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      dbId
    );
  } catch {
    return firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();
export const auth = getAuth(app);

// Error Handling Definition matching Firebase Skill specifications
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  // Only log if not an expected offline/network unavailable state
  const isOfflineNotice =
    errMsg.includes("unavailable") ||
    errMsg.includes("offline") ||
    errMsg.includes("Could not reach Cloud Firestore backend") ||
    errMsg.includes("Failed to get document");

  if (!isOfflineNotice) {
    console.warn("Firestore Notice:", JSON.stringify(errInfo));
  }
  return errInfo;
}

/**
 * Recursively remove undefined keys so Firebase Firestore never throws "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Collection Names
export const COLLECTIONS = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  OFFER_CATEGORIES: "offerCategories",
  BANNERS: "banners",
  COUPONS: "coupons",
  ORDERS: "orders",
  CUSTOMERS: "customers",
  STORE_CONFIG: "store_config",
};

const STORE_CONFIG_COLLECTION = COLLECTIONS.STORE_CONFIG;
const ADMIN_DATA_DOC = "admin_data";

/**
 * Default clean admin dataset
 */
export function getDefaultAdminData(): AdminData {
  return {
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
}

export function safeNormalizeProduct(p: any): Product {
  if (!p) {
    return {
      id: "prod-" + Date.now(),
      title: "New Product",
      titleAr: "منتج جديد",
      fit: "",
      fitAr: "",
      category: "tops",
      price: 0,
      colors: [{ name: "Black", nameAr: "أسود", hex: "#111111", image: "" }],
      sizes: ["S", "M", "L", "XL", "2XL"],
      description: "",
      descriptionAr: "",
      features: [],
      featuresAr: [],
      inStock: true,
      inventory: {},
    };
  }

  const rawColors =
    Array.isArray(p.colors) && p.colors.length > 0
      ? p.colors
      : [{ name: "Black", nameAr: "أسود", hex: "#111111", image: "" }];

  const safeColors = rawColors.map((col: any) => ({
    name: String(col.name || "Default"),
    nameAr: String(col.nameAr || col.name || "افتراضي"),
    hex: String(col.hex || col.colorCode || "#111111"),
    image: String(col.image || ""),
    backImage: col.backImage ? String(col.backImage) : undefined,
  }));

  const safeSizes =
    Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.map(String) : ["S", "M", "L", "XL", "2XL"];

  return {
    id: String(p.id || "prod-" + Date.now()),
    title: String(p.title || p.titleAr || "New Product"),
    titleAr: String(p.titleAr || p.title || "منتج جديد"),
    fit: p.fit ? String(p.fit) : "",
    fitAr: p.fitAr ? String(p.fitAr) : "",
    category: String(p.category || "tops"),
    offerCategory: p.offerCategory ? String(p.offerCategory) : undefined,
    price: Number(p.price) || 0,
    wholesalePrice: p.wholesalePrice !== undefined && p.wholesalePrice !== null ? Number(p.wholesalePrice) : 0,
    originalPrice: p.originalPrice !== undefined && p.originalPrice !== null && p.originalPrice > 0 ? Number(p.originalPrice) : undefined,
    discountPercent: p.discountPercent !== undefined && p.discountPercent !== null && p.discountPercent > 0 ? Number(p.discountPercent) : undefined,
    discountBadgeStyle: p.discountBadgeStyle ? (String(p.discountBadgeStyle) as any) : undefined,
    discountScheduleEnabled: typeof p.discountScheduleEnabled === "boolean" ? p.discountScheduleEnabled : false,
    discountStartDate: p.discountStartDate ? String(p.discountStartDate) : undefined,
    discountEndDate: p.discountEndDate ? String(p.discountEndDate) : undefined,
    badge: p.badge && (p.badge.textAr || p.badge.text)
      ? {
          type: String(p.badge.type || "custom"),
          text: String(p.badge.text || p.badge.textAr || ""),
          textAr: String(p.badge.textAr || p.badge.text || ""),
          colorBg: p.badge.colorBg ? String(p.badge.colorBg) : undefined,
          colorText: p.badge.colorText ? String(p.badge.colorText) : undefined,
        }
      : undefined,
    colors: safeColors,
    sizes: safeSizes,
    rating: p.rating ? Number(p.rating) : 5.0,
    reviewsCount: p.reviewsCount ? Number(p.reviewsCount) : 0,
    description: String(p.description || ""),
    descriptionAr: String(p.descriptionAr || ""),
    features: Array.isArray(p.features) ? p.features : [],
    featuresAr: Array.isArray(p.featuresAr) ? p.featuresAr : [],
    fabric: p.fabric ? String(p.fabric) : undefined,
    fabricAr: p.fabricAr ? String(p.fabricAr) : undefined,
    inStock: typeof p.inStock === "boolean" ? p.inStock : true,
    isNewArrival: typeof p.isNewArrival === "boolean" ? p.isNewArrival : false,
    inventory: p.inventory && typeof p.inventory === "object" ? p.inventory : {},
  };
}

/**
 * Subscribe to real-time Admin Data updates from Firebase Firestore
 * Listens in real-time to both store_config/admin_data and individual collections
 * (products, categories, offerCategories, banners, coupons) to ensure zero delay
 * across all active browser windows and admin panels.
 */
export function subscribeToFirebaseAdminData(
  onData: (data: AdminData) => void,
  onError?: (err: Error) => void
): () => void {
  let currentAdminData: AdminData = getDefaultAdminData();

  let masterDocProducts: Product[] = [];
  let collectionProducts: Product[] = [];

  let masterDocCategories: Category[] = [];
  let collectionCategories: Category[] = [];

  let masterDocOfferCategories: OfferCategory[] = [];
  let collectionOfferCategories: OfferCategory[] = [];

  let masterDocBanners: BannerSlide[] = [];
  let collectionBanners: BannerSlide[] = [];

  let masterDocCoupons: PromoCode[] = [];
  let collectionCoupons: PromoCode[] = [];

  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);

  const notifyUpdate = () => {
    // Robust Merge Strategy: Union by ID so no products or categories are ever lost
    const prodMap = new Map<string, Product>();
    masterDocProducts.forEach((p) => {
      if (p && p.id) prodMap.set(p.id, safeNormalizeProduct(p));
    });
    collectionProducts.forEach((p) => {
      if (p && p.id) prodMap.set(p.id, safeNormalizeProduct(p));
    });
    const resolvedProducts = Array.from(prodMap.values());

    const catMap = new Map<string, Category>();
    masterDocCategories.forEach((c) => {
      if (c && c.id) catMap.set(c.id, c);
    });
    collectionCategories.forEach((c) => {
      if (c && c.id) catMap.set(c.id, c);
    });
    const resolvedCategories = Array.from(catMap.values());

    const offerMap = new Map<string, OfferCategory>();
    masterDocOfferCategories.forEach((o) => {
      if (o && o.id) offerMap.set(o.id, o);
    });
    collectionOfferCategories.forEach((o) => {
      if (o && o.id) offerMap.set(o.id, o);
    });
    const resolvedOfferCategories = Array.from(offerMap.values());

    const bannerMap = new Map<string, BannerSlide>();
    masterDocBanners.forEach((b) => {
      if (b && b.id !== undefined) bannerMap.set(String(b.id), b);
    });
    collectionBanners.forEach((b) => {
      if (b && b.id !== undefined) bannerMap.set(String(b.id), b);
    });
    const resolvedBanners = Array.from(bannerMap.values());

    const couponMap = new Map<string, PromoCode>();
    masterDocCoupons.forEach((cp) => {
      if (cp && cp.id) couponMap.set(cp.id, cp);
    });
    collectionCoupons.forEach((cp) => {
      if (cp && cp.id) couponMap.set(cp.id, cp);
    });
    const resolvedCoupons = Array.from(couponMap.values());

    currentAdminData = {
      ...currentAdminData,
      products: resolvedProducts,
      categories: resolvedCategories,
      offerCategories: resolvedOfferCategories,
      banners: resolvedBanners,
      coupons: resolvedCoupons,
    };

    onData(currentAdminData);
  };

  // 1. Master document listener
  const unsubDoc = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as AdminData;
        if (Array.isArray(remoteData.products)) {
          masterDocProducts = remoteData.products.map(safeNormalizeProduct);
        }
        if (Array.isArray(remoteData.categories)) {
          masterDocCategories = remoteData.categories;
        }
        if (Array.isArray(remoteData.offerCategories)) {
          masterDocOfferCategories = remoteData.offerCategories;
        }
        if (Array.isArray(remoteData.banners)) {
          masterDocBanners = remoteData.banners;
        }
        if (Array.isArray(remoteData.coupons)) {
          masterDocCoupons = remoteData.coupons;
        }

        currentAdminData = {
          ...currentAdminData,
          governorates: Array.isArray(remoteData.governorates) && remoteData.governorates.length > 0 ? remoteData.governorates : (currentAdminData.governorates?.length ? currentAdminData.governorates : EGYPTIAN_GOVERNORATES),
          paymentConfig: remoteData.paymentConfig ? { ...DEFAULT_PAYMENT_CONFIG, ...remoteData.paymentConfig } : currentAdminData.paymentConfig || DEFAULT_PAYMENT_CONFIG,
          footerConfig: remoteData.footerConfig ? { ...DEFAULT_FOOTER_CONFIG, ...remoteData.footerConfig } : currentAdminData.footerConfig || DEFAULT_FOOTER_CONFIG,
          splashScreenConfig: remoteData.splashScreenConfig ? { ...DEFAULT_SPLASH_CONFIG, ...remoteData.splashScreenConfig } : currentAdminData.splashScreenConfig || DEFAULT_SPLASH_CONFIG,
          popupBannerConfig: remoteData.popupBannerConfig ? { ...DEFAULT_POPUP_CONFIG, ...remoteData.popupBannerConfig } : currentAdminData.popupBannerConfig || DEFAULT_POPUP_CONFIG,
          discountBadgeStyle: remoteData.discountBadgeStyle || currentAdminData.discountBadgeStyle || "vertical_left",
          updatedAt: remoteData.updatedAt || Date.now(),
        };
        notifyUpdate();
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
      if (onError) onError(error);
    }
  );

  // 2. Real-time listener for products collection
  const unsubProducts = onSnapshot(
    collection(db, COLLECTIONS.PRODUCTS),
    (snap) => {
      const prods: Product[] = [];
      snap.forEach((docSnap) => {
        prods.push(safeNormalizeProduct(docSnap.data()));
      });
      collectionProducts = prods;
      notifyUpdate();
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PRODUCTS)
  );

  // 3. Real-time listener for categories collection
  const unsubCategories = onSnapshot(
    collection(db, COLLECTIONS.CATEGORIES),
    (snap) => {
      const cats: Category[] = [];
      snap.forEach((docSnap) => {
        cats.push(docSnap.data() as Category);
      });
      collectionCategories = cats;
      notifyUpdate();
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CATEGORIES)
  );

  // 4. Real-time listener for offerCategories collection
  const unsubOfferCategories = onSnapshot(
    collection(db, COLLECTIONS.OFFER_CATEGORIES),
    (snap) => {
      const offerCats: OfferCategory[] = [];
      snap.forEach((docSnap) => {
        offerCats.push(docSnap.data() as OfferCategory);
      });
      collectionOfferCategories = offerCats;
      notifyUpdate();
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.OFFER_CATEGORIES)
  );

  // 5. Real-time listener for banners collection
  const unsubBanners = onSnapshot(
    collection(db, COLLECTIONS.BANNERS),
    (snap) => {
      const bannersList: BannerSlide[] = [];
      snap.forEach((docSnap) => {
        bannersList.push(docSnap.data() as BannerSlide);
      });
      collectionBanners = bannersList;
      notifyUpdate();
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BANNERS)
  );

  // 6. Real-time listener for coupons collection
  const unsubCoupons = onSnapshot(
    collection(db, COLLECTIONS.COUPONS),
    (snap) => {
      const couponsList: PromoCode[] = [];
      snap.forEach((docSnap) => {
        couponsList.push(docSnap.data() as PromoCode);
      });
      collectionCoupons = couponsList;
      notifyUpdate();
    },
    (err) => handleFirestoreError(err, OperationType.LIST, COLLECTIONS.COUPONS)
  );

  return () => {
    unsubDoc();
    unsubProducts();
    unsubCategories();
    unsubOfferCategories();
    unsubBanners();
    unsubCoupons();
  };
}

/**
 * Subscribe to real-time Orders updates from Firebase Firestore
 */
export function subscribeToFirebaseOrders(
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const ordersCol = collection(db, COLLECTIONS.ORDERS);
    const unsubscribe = onSnapshot(
      ordersCol,
      (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((docSnap) => {
          ordersList.push(docSnap.data() as Order);
        });
        // Sort newest first
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onOrders(ordersList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ORDERS);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ORDERS);
    return () => {};
  }
}

/**
 * Subscribe to real-time Customers list from Firebase Firestore
 */
export function subscribeToFirebaseCustomers(
  onCustomers: (customers: SavedCustomer[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const customersCol = collection(db, COLLECTIONS.CUSTOMERS);
    const unsubscribe = onSnapshot(
      customersCol,
      (snapshot) => {
        const customersList: SavedCustomer[] = [];
        snapshot.forEach((docSnap) => {
          customersList.push(docSnap.data() as SavedCustomer);
        });
        // Sort by last order date or creation date
        customersList.sort((a, b) => new Date(b.lastOrderDate || b.createdAt || 0).getTime() - new Date(a.lastOrderDate || a.createdAt || 0).getTime());
        onCustomers(customersList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CUSTOMERS);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CUSTOMERS);
    return () => {};
  }
}

/**
 * Save complete Admin Data directly into Firebase Firestore
 */
export async function saveAdminDataToFirebase(data: AdminData): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    const safeProducts = (data.products || []).map((p) => cleanForFirestore(safeNormalizeProduct(p)));
    const payload = cleanForFirestore({
      categories: data.categories || [],
      offerCategories: data.offerCategories || [],
      products: safeProducts,
      banners: data.banners || [],
      coupons: data.coupons || [],
      governorates: data.governorates || EGYPTIAN_GOVERNORATES,
      paymentConfig: data.paymentConfig || DEFAULT_PAYMENT_CONFIG,
      footerConfig: data.footerConfig || DEFAULT_FOOTER_CONFIG,
      splashScreenConfig: data.splashScreenConfig || DEFAULT_SPLASH_CONFIG,
      popupBannerConfig: data.popupBannerConfig || DEFAULT_POPUP_CONFIG,
      discountBadgeStyle: data.discountBadgeStyle || "vertical_left",
      updatedAt: Date.now(),
    });
    await setDoc(docRef, payload);

    // Also persist all individual products to products collection
    if (safeProducts.length > 0) {
      Promise.all(
        safeProducts.map((p) =>
          setDoc(doc(db, COLLECTIONS.PRODUCTS, p.id), p).catch((e) =>
            console.warn("Background product sync error:", e)
          )
        )
      ).catch(() => {});
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function savePopupBannerConfigToFirestore(popupBannerConfig: PopupBannerConfig): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ popupBannerConfig, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function saveDiscountBadgeStyleToFirestore(discountBadgeStyle: DiscountBadgeStyle): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ discountBadgeStyle, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function savePaymentConfigToFirestore(paymentConfig: PaymentConfig): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ paymentConfig, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function saveGovernoratesToFirestore(governorates: Governorate[]): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ governorates, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function saveFooterConfigToFirestore(footerConfig: FooterConfig): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ footerConfig, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

export async function saveSplashScreenConfigToFirestore(splashScreenConfig: SplashScreenConfig): Promise<boolean> {
  const docPath = `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`;
  try {
    const docRef = doc(db, STORE_CONFIG_COLLECTION, ADMIN_DATA_DOC);
    await setDoc(docRef, cleanForFirestore({ splashScreenConfig, updatedAt: Date.now() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

/**
 * Individual Product Firestore Operations
 */
export async function saveProductToFirestore(product: Product): Promise<boolean> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    const safeProduct = cleanForFirestore(safeNormalizeProduct(product));
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), safeProduct);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Individual Category Firestore Operations
 */
export async function saveCategoryToFirestore(category: Category): Promise<boolean> {
  const path = `${COLLECTIONS.CATEGORIES}/${category.id}`;
  try {
    const safeCat = cleanForFirestore(category);
    await setDoc(doc(db, COLLECTIONS.CATEGORIES, category.id), safeCat);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<boolean> {
  const path = `${COLLECTIONS.CATEGORIES}/${categoryId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Individual Offer Category Firestore Operations
 */
export async function saveOfferCategoryToFirestore(offerCat: OfferCategory): Promise<boolean> {
  const path = `${COLLECTIONS.OFFER_CATEGORIES}/${offerCat.id}`;
  try {
    const safeOfferCat = cleanForFirestore(offerCat);
    await setDoc(doc(db, COLLECTIONS.OFFER_CATEGORIES, offerCat.id), safeOfferCat);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteOfferCategoryFromFirestore(offerCatId: string): Promise<boolean> {
  const path = `${COLLECTIONS.OFFER_CATEGORIES}/${offerCatId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.OFFER_CATEGORIES, offerCatId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Individual Banner Firestore Operations
 */
export async function saveBannerToFirestore(banner: BannerSlide): Promise<boolean> {
  const bannerIdStr = String(banner.id);
  const path = `${COLLECTIONS.BANNERS}/${bannerIdStr}`;
  try {
    const safeBanner = cleanForFirestore(banner);
    await setDoc(doc(db, COLLECTIONS.BANNERS, bannerIdStr), safeBanner);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteBannerFromFirestore(bannerId: string | number): Promise<boolean> {
  const bannerIdStr = String(bannerId);
  const path = `${COLLECTIONS.BANNERS}/${bannerIdStr}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.BANNERS, bannerIdStr));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Individual Coupon Firestore Operations
 */
export async function saveCouponToFirestore(coupon: PromoCode): Promise<boolean> {
  const path = `${COLLECTIONS.COUPONS}/${coupon.id}`;
  try {
    const safeCoupon = cleanForFirestore(coupon);
    await setDoc(doc(db, COLLECTIONS.COUPONS, coupon.id), safeCoupon);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteCouponFromFirestore(couponId: string): Promise<boolean> {
  const path = `${COLLECTIONS.COUPONS}/${couponId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.COUPONS, couponId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Force Synchronize All Store Data into Firestore Database
 * Writes the entire admin data to both the master store_config doc
 * AND each individual collection (products, categories, offers, banners, coupons).
 * Ensures all other devices, sessions, and visitors immediately see the full data.
 */
export async function syncAllStoreDataToFirebase(adminData: AdminData): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Save Master Document
    await saveAdminDataToFirebase(adminData);

    // 2. Save all individual products
    if (Array.isArray(adminData.products)) {
      for (const prod of adminData.products) {
        if (prod && prod.id) {
          await saveProductToFirestore(prod);
        }
      }
    }

    // 3. Save all individual categories
    if (Array.isArray(adminData.categories)) {
      for (const cat of adminData.categories) {
        if (cat && cat.id) {
          await saveCategoryToFirestore(cat);
        }
      }
    }

    // 4. Save all offer categories
    if (Array.isArray(adminData.offerCategories)) {
      for (const offerCat of adminData.offerCategories) {
        if (offerCat && offerCat.id) {
          await saveOfferCategoryToFirestore(offerCat);
        }
      }
    }

    // 5. Save all banners
    if (Array.isArray(adminData.banners)) {
      for (const banner of adminData.banners) {
        if (banner && banner.id !== undefined) {
          await saveBannerToFirestore(banner);
        }
      }
    }

    // 6. Save all coupons
    if (Array.isArray(adminData.coupons)) {
      for (const coupon of adminData.coupons) {
        if (coupon && coupon.id) {
          await saveCouponToFirestore(coupon);
        }
      }
    }

    return { success: true, message: "تمت المزامنة الكاملة مع قاعدة البيانات السحابية بنجاح!" };
  } catch (error: any) {
    console.error("Failed full store sync to Firebase:", error);
    return { success: false, message: error?.message || "حدث خطأ أثناء المزامنة" };
  }
}

/**
 * Save / Update Customer Profile directly into Firebase Firestore
 */
export async function saveCustomerProfileToFirebase(profile: CustomerProfile, newOrder?: Order): Promise<boolean> {
  if (!profile.phoneNumber || profile.phoneNumber.trim().length === 0) {
    return false;
  }
  const cleanPhone = profile.phoneNumber.trim().replace(/\s+/g, "");
  const docPath = `${COLLECTIONS.CUSTOMERS}/${cleanPhone}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, cleanPhone);
    const existingSnap = await getDoc(docRef);
    const existingData = existingSnap.exists() ? (existingSnap.data() as SavedCustomer) : null;

    const existingOrders = existingData?.orders || [];
    if (newOrder && !existingOrders.includes(newOrder.orderId)) {
      existingOrders.push(newOrder.orderId);
    }

    const orderSpend = newOrder ? newOrder.total : 0;
    const totalSpent = (existingData?.totalSpent || 0) + orderSpend;
    const totalOrdersCount = Math.max(existingOrders.length, (existingData?.totalOrdersCount || 0) + (newOrder ? 1 : 0));

    const customerRecord: SavedCustomer = {
      id: cleanPhone,
      fullName: profile?.fullName || existingData?.fullName || "",
      phoneNumber: cleanPhone,
      secondaryPhone: profile?.secondaryPhone || existingData?.secondaryPhone || "",
      governorateId: profile?.governorateId || existingData?.governorateId || "cairo",
      governorateNameAr: profile?.governorateNameAr || existingData?.governorateNameAr || "",
      detailedAddress: profile?.detailedAddress || existingData?.detailedAddress || "",
      notes: profile?.notes || existingData?.notes || "",
      totalOrdersCount,
      totalSpent,
      lastOrderDate: new Date().toISOString(),
      createdAt: existingData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orders: existingOrders,
    };

    await setDoc(docRef, cleanForFirestore(customerRecord), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

/**
 * Fetch Customer Profile directly from Firebase Firestore
 */
export async function getCustomerProfileFromFirebase(phoneNumber: string): Promise<SavedCustomer | null> {
  if (!phoneNumber || phoneNumber.trim().length === 0) return null;
  const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
  const docPath = `${COLLECTIONS.CUSTOMERS}/${cleanPhone}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, cleanPhone);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SavedCustomer;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

/**
 * Delete a customer record from Firebase
 */
export async function deleteCustomerFromFirestore(customerId: string): Promise<boolean> {
  const cleanPhone = customerId.trim().replace(/\s+/g, "");
  const docPath = `${COLLECTIONS.CUSTOMERS}/${cleanPhone}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, cleanPhone);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    return false;
  }
}

/**
 * Subscribe to real-time updates for a specific customer profile
 */
export function subscribeToCustomerProfile(
  phoneNumber: string,
  onProfile: (profile: SavedCustomer | null) => void
): () => void {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    onProfile(null);
    return () => {};
  }
  const cleanPhone = phoneNumber.trim().replace(/\s+/g, "");
  const docPath = `${COLLECTIONS.CUSTOMERS}/${cleanPhone}`;
  try {
    const docRef = doc(db, COLLECTIONS.CUSTOMERS, cleanPhone);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onProfile(snap.data() as SavedCustomer);
        } else {
          onProfile(null);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, docPath);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return () => {};
  }
}

/**
 * Save a new Order directly into Firebase Firestore & link to Customer
 */
export async function saveOrderToFirebase(order: Order): Promise<boolean> {
  const docPath = `${COLLECTIONS.ORDERS}/${order.orderId}`;
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, order.orderId);
    await setDoc(docRef, cleanForFirestore(order));

    // Also update customer profile in Firebase customers collection
    if (order.customer && order.customer.phoneNumber) {
      await saveCustomerProfileToFirebase(order.customer, order);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
    return false;
  }
}

/**
 * Update an existing Order status in Firebase Firestore
 */
export async function updateOrderInFirebase(orderId: string, updates: Partial<Order>): Promise<boolean> {
  if (!orderId) return false;
  const trimmedId = orderId.trim();
  const docPath = `${COLLECTIONS.ORDERS}/${trimmedId}`;
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, trimmedId);
    await setDoc(docRef, cleanForFirestore({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    return false;
  }
}

/**
 * Wipe all documents from a specific Firestore collection using batch deletion
 */
export async function wipeFirestoreCollection(collectionName: string): Promise<number> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    let count = 0;
    const batchLimit = 400;
    let batch = writeBatch(db);
    let opCount = 0;

    for (const docSnap of snap.docs) {
      batch.delete(docSnap.ref);
      opCount++;
      count++;
      if (opCount >= batchLimit) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
    return 0;
  }
}

export interface WipeDatabaseOptions {
  clearProducts?: boolean;
  clearCategories?: boolean;
  clearOfferCategories?: boolean;
  clearBanners?: boolean;
  clearCoupons?: boolean;
  clearOrders?: boolean;
  clearCustomers?: boolean;
  resetConfigs?: boolean;
}

/**
 * Wipe Full Database or selective collections from Firestore and master config document
 */
export async function wipeEntireStoreDatabase(
  options: WipeDatabaseOptions = {
    clearProducts: true,
    clearCategories: true,
    clearOfferCategories: true,
    clearBanners: true,
    clearCoupons: true,
    clearOrders: true,
    clearCustomers: true,
    resetConfigs: false,
  },
  currentData?: AdminData
): Promise<{
  success: boolean;
  message: string;
  deletedCounts: Record<string, number>;
  updatedAdminData: AdminData;
}> {
  const deletedCounts: Record<string, number> = {
    products: 0,
    categories: 0,
    offerCategories: 0,
    banners: 0,
    coupons: 0,
    orders: 0,
    customers: 0,
  };

  try {
    // 1. Wipe individual products collection if requested
    if (options.clearProducts) {
      deletedCounts.products = await wipeFirestoreCollection(COLLECTIONS.PRODUCTS);
    }

    // 2. Wipe individual categories collection if requested
    if (options.clearCategories) {
      deletedCounts.categories = await wipeFirestoreCollection(COLLECTIONS.CATEGORIES);
    }

    // 3. Wipe individual offer categories collection if requested
    if (options.clearOfferCategories) {
      deletedCounts.offerCategories = await wipeFirestoreCollection(COLLECTIONS.OFFER_CATEGORIES);
    }

    // 4. Wipe individual banners collection if requested
    if (options.clearBanners) {
      deletedCounts.banners = await wipeFirestoreCollection(COLLECTIONS.BANNERS);
    }

    // 5. Wipe individual coupons collection if requested
    if (options.clearCoupons) {
      deletedCounts.coupons = await wipeFirestoreCollection(COLLECTIONS.COUPONS);
    }

    // 6. Wipe individual orders collection if requested
    if (options.clearOrders) {
      deletedCounts.orders = await wipeFirestoreCollection(COLLECTIONS.ORDERS);
    }

    // 7. Wipe individual customers collection if requested
    if (options.clearCustomers) {
      deletedCounts.customers = await wipeFirestoreCollection(COLLECTIONS.CUSTOMERS);
    }

    // 8. Build and update the new AdminData master document
    const base = currentData || getDefaultAdminData();
    const updatedAdminData: AdminData = {
      ...base,
      products: options.clearProducts ? [] : base.products || [],
      categories: options.clearCategories ? [] : base.categories || [],
      offerCategories: options.clearOfferCategories ? [] : base.offerCategories || [],
      banners: options.clearBanners ? [] : base.banners || [],
      coupons: options.clearCoupons ? [] : base.coupons || [],
      governorates: options.resetConfigs ? EGYPTIAN_GOVERNORATES : base.governorates || EGYPTIAN_GOVERNORATES,
      paymentConfig: options.resetConfigs ? DEFAULT_PAYMENT_CONFIG : base.paymentConfig || DEFAULT_PAYMENT_CONFIG,
      footerConfig: options.resetConfigs ? DEFAULT_FOOTER_CONFIG : base.footerConfig || DEFAULT_FOOTER_CONFIG,
      splashScreenConfig: options.resetConfigs ? DEFAULT_SPLASH_CONFIG : base.splashScreenConfig || DEFAULT_SPLASH_CONFIG,
      updatedAt: Date.now(),
    };

    await saveAdminDataToFirebase(updatedAdminData);

    return {
      success: true,
      message: "تم مسح البيانات المحددة وتفريغ قاعدة البيانات السحابية بنجاح!",
      deletedCounts,
      updatedAdminData,
    };
  } catch (error: any) {
    console.error("Failed to wipe database:", error);
    return {
      success: false,
      message: error?.message || "حدث خطأ أثناء مسح قاعدة البيانات",
      deletedCounts,
      updatedAdminData: currentData || getDefaultAdminData(),
    };
  }
}

/**
 * Wipe a single entity/collection from Firestore & Master config
 */
export async function wipeSelectiveStoreCollection(
  target: "products" | "categories" | "offerCategories" | "banners" | "coupons" | "orders" | "customers",
  currentData?: AdminData
): Promise<{ success: boolean; count: number; updatedAdminData?: AdminData }> {
  try {
    let colName = COLLECTIONS.PRODUCTS;
    if (target === "categories") colName = COLLECTIONS.CATEGORIES;
    else if (target === "offerCategories") colName = COLLECTIONS.OFFER_CATEGORIES;
    else if (target === "banners") colName = COLLECTIONS.BANNERS;
    else if (target === "coupons") colName = COLLECTIONS.COUPONS;
    else if (target === "orders") colName = COLLECTIONS.ORDERS;
    else if (target === "customers") colName = COLLECTIONS.CUSTOMERS;

    const count = await wipeFirestoreCollection(colName);

    if (target !== "orders" && target !== "customers") {
      const base = currentData || getDefaultAdminData();
      const updatedAdminData: AdminData = {
        ...base,
        [target]: [],
        updatedAt: Date.now(),
      };
      await saveAdminDataToFirebase(updatedAdminData);
      return { success: true, count, updatedAdminData };
    }

    return { success: true, count };
  } catch (error) {
    console.error(`Failed to wipe ${target}:`, error);
    return { success: false, count: 0 };
  }
}

/**
 * Clear All Data from Firebase Firestore (Wipes products, categories, offers, banners, coupons)
 */
export async function clearAllDemoDataFromFirebase(): Promise<{ success: boolean; data: AdminData }> {
  try {
    // Delete individual collection items
    await wipeFirestoreCollection(COLLECTIONS.PRODUCTS);
    await wipeFirestoreCollection(COLLECTIONS.CATEGORIES);
    await wipeFirestoreCollection(COLLECTIONS.OFFER_CATEGORIES);
    await wipeFirestoreCollection(COLLECTIONS.BANNERS);
    await wipeFirestoreCollection(COLLECTIONS.COUPONS);

    const emptyCatalog: AdminData = {
      categories: [],
      offerCategories: [],
      products: [],
      banners: [],
      coupons: [],
      governorates: EGYPTIAN_GOVERNORATES,
      paymentConfig: DEFAULT_PAYMENT_CONFIG,
      footerConfig: DEFAULT_FOOTER_CONFIG,
      splashScreenConfig: DEFAULT_SPLASH_CONFIG,
      updatedAt: Date.now(),
    };
    await saveAdminDataToFirebase(emptyCatalog);
    return { success: true, data: emptyCatalog };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`);
    return { success: false, data: getDefaultAdminData() };
  }
}

/**
 * Reset/Seed Full Demo Data to Firebase Firestore (Only if user explicitly requests)
 */
export async function resetDemoDataToFirebase(): Promise<{ success: boolean; data: AdminData }> {
  try {
    const emptyData = getDefaultAdminData();
    await saveAdminDataToFirebase(emptyData);
    await syncAllStoreDataToFirebase(emptyData);
    return { success: true, data: emptyData };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STORE_CONFIG_COLLECTION}/${ADMIN_DATA_DOC}`);
    return { success: false, data: getDefaultAdminData() };
  }
}
