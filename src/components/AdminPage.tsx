import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Package,
  Layers,
  Tag,
  Image as ImageIcon,
  DollarSign,
  Ticket,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Phone,
  MapPin,
  Clock,
  Check,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Store,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  FolderArchive,
  Download,
  Upload,
  Calendar,
  Flame,
  Percent,
  FileSpreadsheet,
} from "lucide-react";
import {
  AdminData,
  BannerSlide,
  Category,
  ColorVariant,
  OfferCategory,
  Order,
  OrderStatus,
  Product,
  PromoCode,
  FooterConfig,
  SplashScreenConfig,
  PaymentConfig,
  Governorate,
  CustomerProfile,
  PopupBannerConfig,
  DiscountBadgeStyle,
  FlashSaleConfig,
  OutfitBundle,
  HomeSectionsConfig,
} from "../types";
import {
  saveAdminData,
  loadAdminData,
  updateOrderStatus,
  confirmOrderShipping,
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
  saveFooterConfigToFirestore,
  saveSplashScreenConfigToFirestore,
  savePopupBannerConfigToFirestore,
  saveDiscountBadgeStyleToFirestore,
  saveFlashSaleConfigToFirestore,
  saveOutfitsToFirestore,
  saveHomeSectionsConfigToFirestore,
  DEFAULT_POPUP_CONFIG,
  DEFAULT_HOME_SECTIONS_CONFIG,
  saveAdminDataToFirebase,
  syncAllStoreDataToFirebase,
  savePaymentConfigToFirestore,
  saveGovernoratesToFirestore,
  SOTRA_PRODUCT_PLACEHOLDER,
} from "../utils/storage";
import { DiscountBadge } from "./DiscountBadge";
import { getEffectiveProductDiscount, DISCOUNT_BADGE_STYLES_META } from "../utils/discount";
import { AdminFooterSettings } from "./AdminFooterSettings";
import { AdminSplashSettings } from "./AdminSplashSettings";
import { AdminBackupRestore } from "./AdminBackupRestore";
import { ProductInventoryForm } from "./ProductInventoryForm";
import { AdminPaymentAndShippingSettings } from "./AdminPaymentAndShippingSettings";
import { AdminCustomersTab } from "./AdminCustomersTab";
import { AdminPopupBannerSettings } from "./AdminPopupBannerSettings";
import { AdminDatabaseManager } from "./AdminDatabaseManager";
import { AdminFlashSaleSettings } from "./AdminFlashSaleSettings";
import { AdminOutfitsSettings } from "./AdminOutfitsSettings";
import { AdminHomeSectionsSettings } from "./AdminHomeSectionsSettings";
import {
  parseBackupFile,
  exportProductsToExcel,
  exportProductsExcelTemplate,
  exportProductsToCSV,
} from "../utils/backupRestore";

interface AdminPageProps {
  adminData: AdminData;
  orders: Order[];
  onUpdateAdminData: (data: AdminData) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onBackToHome: () => void;
  lang: "ar" | "en";
}

const ORDER_STATUS_FLOW: { status: OrderStatus; labelAr: string; labelEn: string; color: string }[] = [
  {
    status: "pending_payment",
    labelAr: "بانتظار الدفع والتأكيد",
    labelEn: "Pending Payment",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    status: "payment_confirmed",
    labelAr: "تم تأكيد الدفع وتحويل الشحن",
    labelEn: "Payment Confirmed",
    color: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    status: "processing",
    labelAr: "جاري تجهيز وتغليف الطلب",
    labelEn: "Processing",
    color: "bg-indigo-100 text-indigo-900 border-indigo-300",
  },
  {
    status: "shipped",
    labelAr: "تم الشحن مع مندوب التوصيل",
    labelEn: "Out for Delivery",
    color: "bg-purple-100 text-purple-900 border-purple-300",
  },
  {
    status: "delivered",
    labelAr: "تم التوصيل بنجاح",
    labelEn: "Delivered",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    status: "cancelled",
    labelAr: "ملغي ومسترجع للمخزن",
    labelEn: "Cancelled",
    color: "bg-red-100 text-red-900 border-red-300",
  },
];

const BADGE_OPTIONS = [
  { type: "", text: "", textAr: "بدون شارة", bg: "bg-neutral-200 text-neutral-800" },
  { type: "new", text: "NEW", textAr: "جديد", bg: "bg-emerald-600 text-white" },
  { type: "discount", text: "SALE", textAr: "خصم", bg: "bg-red-600 text-white" },
  { type: "featured", text: "FEATURED", textAr: "مميز", bg: "bg-amber-500 text-neutral-950" },
  { type: "bestseller", text: "BEST SELLER", textAr: "الأكثر مبيعاً", bg: "bg-amber-500 text-neutral-950" },
  { type: "exclusive", text: "EXCLUSIVE", textAr: "عرض حصري", bg: "bg-purple-700 text-white" },
  { type: "limited", text: "LIMITED", textAr: "إصدار محدود", bg: "bg-rose-700 text-white" },
  { type: "restocked", text: "RESTOCKED", textAr: "توفر من جديد", bg: "bg-blue-600 text-white" },
  { type: "custom", text: "CUSTOM", textAr: "نص مخصص", bg: "bg-neutral-950 text-white" },
];

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "Free Size"];

export const AdminPage: React.FC<AdminPageProps> = ({
  adminData,
  orders,
  onUpdateAdminData,
  onUpdateOrders,
  onBackToHome,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<
    "homeSections" | "orders" | "products" | "flashSale" | "outfits" | "categories" | "offerCategories" | "banners" | "popup" | "inventory" | "coupons" | "payment" | "customers" | "footer" | "splash" | "backup" | "database"
  >("homeSections");

  // Search and Filter states
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");
  const [prodSearch, setProdSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const prodImportInputRef = React.useRef<HTMLInputElement>(null);

  const handleDirectProductJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const result = await parseBackupFile(file);
      if (!result.success || !result.payload) {
        showToast(`❌ ${result.error || "تعذر قراءة ملف JSON"}`);
        return;
      }
      const importedProducts = result.payload.data.products;
      if (!importedProducts || importedProducts.length === 0) {
        // If there are categories or other data imported
        if (result.payload.data.categories && result.payload.data.categories.length > 0) {
          const catMap = new Map<string, Category>();
          adminData.categories.forEach((c) => catMap.set(c.id, c));
          result.payload.data.categories.forEach((c) => catMap.set(c.id, c));
          const newCats = Array.from(catMap.values());
          const newData = { ...adminData, categories: newCats };
          onUpdateAdminData(newData);
          saveAdminData(newData);
          saveAdminDataToFirebase(newData).catch((err) => console.warn(err));
          showToast(`✅ تم استيراد ${result.payload.data.categories.length} قسم وحفظها في قاعدة البيانات!`);
          return;
        }
        showToast("⚠️ لم يتم العثور على منتجات في هذا الملف.");
        return;
      }

      // Merge products by ID
      const prodMap = new Map<string, Product>();
      adminData.products.forEach((p) => prodMap.set(p.id, p));
      importedProducts.forEach((p) => prodMap.set(p.id, p));
      const mergedProducts = Array.from(prodMap.values());

      const newData = { ...adminData, products: mergedProducts };
      onUpdateAdminData(newData);
      saveAdminData(newData);
      saveAdminDataToFirebase(newData).catch((err) => console.warn(err));

      showToast(`✅ تم استيراد ${importedProducts.length} منتج بنجاح وحفظها في قاعدة البيانات!`);
    } catch (err: any) {
      showToast(`❌ خطأ أثناء الاستيراد: ${err?.message || "ملف غير صالح"}`);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Payment and Shipping Handlers
  const handleSavePaymentConfig = (newConfig: PaymentConfig) => {
    const newData = { ...adminData, paymentConfig: newConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    savePaymentConfigToFirestore(newConfig).catch((e) => console.warn(e));
    showToast("✅ تم حفظ وتحديث رقم الكاش وإعدادات الدفع والشحن في قاعدة البيانات بنجاح!");
  };

  const handleSaveGovernorates = (newGovs: Governorate[]) => {
    const newData = { ...adminData, governorates: newGovs };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveGovernoratesToFirestore(newGovs).catch((e) => console.warn(e));
    showToast("✅ تم حفظ وتحديث أسعار ومواعيد شحن المحافظات بنجاح!");
  };

  const handleSaveFlashSaleConfig = (newConfig: FlashSaleConfig) => {
    const newData = { ...adminData, flashSaleConfig: newConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveFlashSaleConfigToFirestore(newConfig).catch((e) => console.warn(e));
    showToast("✅ تم حفظ وتحديث إعدادات ومنتجات الفلاش سيل في قاعدة البيانات بنجاح!");
  };

  const handleSaveOutfits = (newOutfits: OutfitBundle[]) => {
    const newData = { ...adminData, outfits: newOutfits };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveOutfitsToFirestore(newOutfits).catch((e) => console.warn(e));
    showToast("✅ تم حفظ وتحديث أطقم نسق إطلالتك في قاعدة البيانات بنجاح!");
  };

  // Sub-Modals states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  const [editingOfferCat, setEditingOfferCat] = useState<OfferCategory | null>(null);
  const [isOfferCatModalOpen, setIsOfferCatModalOpen] = useState(false);

  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const [editingInvProduct, setEditingInvProduct] = useState<Product | null>(null);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<PromoCode | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Helper to generate inventory key
  const getInvKey = (colNameAr?: string, colName?: string, sz?: string) => {
    return `${colNameAr || colName || "default"}_${sz || "L"}`;
  };

  // CATEGORIES CRUD
  const handleSaveCategory = (cat: Category) => {
    let updated = [...adminData.categories];
    const idx = updated.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      updated[idx] = cat;
    } else {
      updated.push(cat);
    }
    const newData = { ...adminData, categories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveCategoryToFirestore(cat).catch((e) => console.warn(e));
    setIsCatModalOpen(false);
    showToast("تم حفظ القسم الرئيسي بنجاح في قاعدة البيانات");
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    const updated = adminData.categories.filter((c) => c.id !== id);
    const newData = { ...adminData, categories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    deleteCategoryFromFirestore(id).catch((e) => console.warn(e));
    showToast("تم حذف القسم الرئيسي من قاعدة البيانات");
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const updated = [...adminData.categories];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    const newData = { ...adminData, categories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveAdminDataToFirebase(newData).catch((e) => console.warn(e));
  };

  // OFFER CATEGORIES CRUD
  const handleSaveOfferCategory = (cat: OfferCategory) => {
    let updated = [...adminData.offerCategories];
    const idx = updated.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      updated[idx] = cat;
    } else {
      updated.push(cat);
    }
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveOfferCategoryToFirestore(cat).catch((e) => console.warn(e));
    setIsOfferCatModalOpen(false);
    showToast("تم حفظ قسم العروض بنجاح في قاعدة البيانات");
  };

  const handleToggleOfferCatVisibility = (catId: string) => {
    const updated = adminData.offerCategories.map((oc) =>
      oc.id === catId ? { ...oc, isVisible: oc.isVisible === false ? true : false } : oc
    );
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    const target = updated.find((x) => x.id === catId);
    if (target) saveOfferCategoryToFirestore(target).catch((e) => console.warn(e));
    showToast("تم تحديث حالة ظهور قسم العروض");
  };

  const handleDeleteOfferCategory = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف قسم العروض؟")) return;
    const updated = adminData.offerCategories.filter((c) => c.id !== id);
    const newData = { ...adminData, offerCategories: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    deleteOfferCategoryFromFirestore(id).catch((e) => console.warn(e));
    showToast("تم حذف قسم العروض");
  };

  // BANNERS CRUD
  const handleSaveBanner = (b: BannerSlide) => {
    let updated = [...adminData.banners];
    const idx = updated.findIndex((x) => String(x.id) === String(b.id));
    if (idx >= 0) {
      updated[idx] = b;
    } else {
      updated.push(b);
    }
    const newData = { ...adminData, banners: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveBannerToFirestore(b).catch((e) => console.warn(e));
    setIsBannerModalOpen(false);
    showToast("تم حفظ شريحة البانر بنجاح في قاعدة البيانات");
  };

  const handleDeleteBanner = (id: number | string) => {
    if (!confirm("هل أنت متأكد من حذف الشريحة؟")) return;
    const updated = adminData.banners.filter((b) => String(b.id) !== String(id));
    const newData = { ...adminData, banners: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    deleteBannerFromFirestore(id).catch((e) => console.warn(e));
    showToast("تم حذف الشريحة الإعلانية");
  };

  // PRODUCTS CRUD - BLANK DEFAULT INITIALIZATION
  const handleOpenNewProductModal = () => {
    setEditingProduct({
      id: "sotra-prod-" + Date.now(),
      title: "",
      titleAr: "",
      fit: "",
      fitAr: "",
      category: adminData.categories[0]?.id || "",
      offerCategory: "",
      price: 0,
      wholesalePrice: 0,
      originalPrice: undefined,
      discountPercent: undefined,
      discountBadgeStyle: "default",
      discountScheduleEnabled: false,
      discountStartDate: "",
      discountEndDate: "",
      colors: [
        {
          name: "Black",
          nameAr: "أسود",
          hex: "#111111",
          image: "",
        },
      ],
      sizes: ["M", "L", "XL", "XXL"],
      fabric: "",
      fabricAr: "",
      description: "",
      descriptionAr: "",
      features: [],
      featuresAr: [],
      badge: undefined,
      inStock: true,
      isNewArrival: true,
      inventory: {},
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (p: Product) => {
    // Clean and validate
    const updatedInv = { ...(p.inventory || {}) };
    const validColors =
      p.colors && p.colors.length > 0
        ? p.colors.map((c) => ({
            name: c.name || c.nameAr || "Color",
            nameAr: c.nameAr || c.name || "لون",
            hex: c.hex || "#111111",
            image: c.image || SOTRA_PRODUCT_PLACEHOLDER,
          }))
        : [{ name: "Default", nameAr: "افتراضي", hex: "#111111", image: SOTRA_PRODUCT_PLACEHOLDER }];

    const validSizes = p.sizes && p.sizes.length > 0 ? p.sizes : ["L"];

    validColors.forEach((col) => {
      validSizes.forEach((sz) => {
        const kPrimary = getInvKey(col.nameAr, col.name, sz);
        let entry = updatedInv[kPrimary];
        if (!entry && col.name) entry = updatedInv[`${col.name.trim()}__${sz.trim()}`];
        if (!entry && col.nameAr) entry = updatedInv[`${col.nameAr.trim()}__${sz.trim()}`];

        const finalItem = {
          qty: entry && typeof entry.qty === "number" ? entry.qty : 10,
          wholesalePrice:
            entry?.wholesalePrice !== undefined
              ? entry.wholesalePrice
              : p.wholesalePrice !== undefined && p.wholesalePrice > 0
              ? Number(p.wholesalePrice)
              : Math.round((Number(p.price) || 0) * 0.6),
          salePrice: entry?.salePrice || Number(p.price) || 0,
        };

        updatedInv[kPrimary] = finalItem;
        if (col.name) updatedInv[`${col.name.trim()}__${sz.trim()}`] = finalItem;
        if (col.nameAr) updatedInv[`${col.nameAr.trim()}__${sz.trim()}`] = finalItem;
      });
    });

    const parsedRetail = Number(p.price) || 0;
    const parsedOriginal = p.originalPrice ? Number(p.originalPrice) : undefined;
    const computedDiscount =
      p.discountPercent !== undefined && p.discountPercent !== null && p.discountPercent > 0
        ? Number(p.discountPercent)
        : parsedOriginal && parsedOriginal > parsedRetail
        ? Math.round(((parsedOriginal - parsedRetail) / parsedOriginal) * 100)
        : undefined;

    const productToSave: Product = {
      ...p,
      titleAr: p.titleAr || p.title || "منتج جديد",
      title: p.title || p.titleAr || "New Product",
      fitAr: p.fitAr || "",
      fit: p.fit || "",
      fabricAr: p.fabricAr || "",
      fabric: p.fabric || "",
      descriptionAr: p.descriptionAr || "",
      description: p.description || "",
      price: parsedRetail,
      wholesalePrice: p.wholesalePrice !== undefined && p.wholesalePrice !== null ? Number(p.wholesalePrice) : 0,
      originalPrice: parsedOriginal,
      discountPercent: computedDiscount,
      discountBadgeStyle: p.discountBadgeStyle || "default",
      discountScheduleEnabled: Boolean(p.discountScheduleEnabled),
      discountStartDate: p.discountStartDate || "",
      discountEndDate: p.discountEndDate || "",
      colors: validColors,
      sizes: validSizes,
      category: p.category || adminData.categories[0]?.id || "tops",
      offerCategory: p.offerCategory || "",
      inventory: updatedInv,
      inStock: Object.values(updatedInv).some((v) => Number(v.qty) > 0),
    };

    let updated = [...adminData.products];
    const idx = updated.findIndex((x) => x.id === productToSave.id);
    if (idx >= 0) {
      updated[idx] = productToSave;
    } else {
      updated.unshift(productToSave);
    }
    const newData = { ...adminData, products: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveProductToFirestore(productToSave).catch((e) => console.warn(e));
    setIsProductModalOpen(false);
    showToast("تم حفظ المنتج بنجاح في قاعدة البيانات");
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    const updated = adminData.products.filter((p) => p.id !== id);
    const newData = { ...adminData, products: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    deleteProductFromFirestore(id).catch((e) => console.warn(e));
    showToast("تم حذف المنتج من قاعدة البيانات");
  };

  // INVENTORY MATRIX SAVE
  const handleSaveInventory = (updatedInv: Record<string, { qty: number; wholesalePrice?: number; salePrice?: number }>) => {
    if (!editingInvProduct) return;
    const nextInv = { ...updatedInv };
    editingInvProduct.colors.forEach((col) => {
      editingInvProduct.sizes.forEach((sz) => {
        const kPrimary = getInvKey(col.nameAr, col.name, sz);
        let entry = nextInv[kPrimary];
        if (!entry && col.name) entry = nextInv[`${col.name.trim()}__${sz.trim()}`];
        if (!entry && col.nameAr) entry = nextInv[`${col.nameAr.trim()}__${sz.trim()}`];
        const finalItem = {
          qty: entry && typeof entry.qty === "number" ? entry.qty : 10,
          wholesalePrice: entry?.wholesalePrice || Math.round((Number(editingInvProduct.price) || 0) * 0.6),
          salePrice: entry?.salePrice || Number(editingInvProduct.price) || 0,
        };
        nextInv[kPrimary] = finalItem;
        if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = finalItem;
        if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = finalItem;
      });
    });

    const inStock = Object.values(nextInv).some((entry) => Number(entry.qty) > 0);
    const updatedProduct = {
      ...editingInvProduct,
      inventory: nextInv,
      inStock,
    };
    const updatedList = adminData.products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    const newData = { ...adminData, products: updatedList };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveProductToFirestore(updatedProduct).catch((e) => console.warn(e));
    setIsInvModalOpen(false);
    showToast("تم تحديث مخزون المنتج بدقة في قاعدة البيانات");
  };

  // COUPONS CRUD
  const handleSaveCoupon = (cp: PromoCode) => {
    let existing = adminData.coupons || [];
    const idx = existing.findIndex((c) => c.id === cp.id);
    let updated = [...existing];
    if (idx >= 0) {
      updated[idx] = cp;
    } else {
      updated.push(cp);
    }
    const newData = { ...adminData, coupons: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveCouponToFirestore(cp).catch((e) => console.warn(e));
    setIsCouponModalOpen(false);
    showToast("تم حفظ كود الخصم بنجاح في قاعدة البيانات");
  };

  const handleDeleteCoupon = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    const existing = adminData.coupons || [];
    const updated = existing.filter((c) => c.id !== id);
    const newData = { ...adminData, coupons: updated };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    deleteCouponFromFirestore(id).catch((e) => console.warn(e));
    showToast("تم حذف الكوبون من قاعدة البيانات");
  };

  // FOOTER & SPLASH SCREEN CONFIG SAVE HANDLERS
  const handleSaveFooterConfig = (footerConfig: FooterConfig) => {
    const newData = { ...adminData, footerConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveFooterConfigToFirestore(footerConfig).catch((e) => console.warn(e));
  };

  const handleSaveSplashScreenConfig = (splashScreenConfig: SplashScreenConfig) => {
    const newData = { ...adminData, splashScreenConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveSplashScreenConfigToFirestore(splashScreenConfig).catch((e) => console.warn(e));
  };

  // POPUP BANNER & DISCOUNT BADGE SAVE HANDLERS
  const handleSavePopupConfig = (popupBannerConfig: PopupBannerConfig) => {
    const newData = { ...adminData, popupBannerConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    savePopupBannerConfigToFirestore(popupBannerConfig).catch((e) => console.warn(e));
  };

  const handleSaveDiscountBadgeStyle = (discountBadgeStyle: DiscountBadgeStyle) => {
    const newData = { ...adminData, discountBadgeStyle };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveDiscountBadgeStyleToFirestore(discountBadgeStyle).catch((e) => console.warn(e));
  };

  const handleSaveHomeSectionsConfig = (homeSectionsConfig: HomeSectionsConfig) => {
    const newData = { ...adminData, homeSectionsConfig };
    onUpdateAdminData(newData);
    saveAdminData(newData);
    saveHomeSectionsConfigToFirestore(homeSectionsConfig).catch((e) => console.warn(e));
    showToast("✅ تم حفظ وتطبيق تخصيص الشاشة الرئيسية وحجم البنر بنجاح!");
  };

  // ORDER STATUS CHANGE & SYNCHRONIZATION
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const res = updateOrderStatus(orderId, newStatus, orders);
    if (res.success && res.updatedOrders.length > 0) {
      onUpdateOrders(res.updatedOrders);
    } else {
      const fallbackList = orders.map((o) =>
        o.orderId === orderId ? { ...o, trackingStatus: newStatus, updatedAt: new Date().toISOString() } : o
      );
      onUpdateOrders(fallbackList);
    }

    // Refresh products inventory in adminData state
    onUpdateAdminData(loadAdminData());

    const statusObj = ORDER_STATUS_FLOW.find((s) => s.status === newStatus);
    showToast(
      newStatus === "cancelled"
        ? "✅ تم إلغاء الطلب وإرجاع المنتجات للمخزون"
        : `✅ تم تحديث حالة الطلب إلى: ${statusObj?.labelAr || newStatus}`
    );
  };

  const handleConfirmShippingFee = (orderId: string) => {
    const res = confirmOrderShipping(orderId, orders);
    if (res.success && res.updatedOrders.length > 0) {
      onUpdateOrders(res.updatedOrders);
      onUpdateAdminData(loadAdminData());
      showToast(res.message);
    } else {
      showToast(res.message || "حدث خطأ أثناء تأكيد الشحن");
    }
  };

  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-neutral-900 font-arabic text-start pb-20 animate-fade-in">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950 text-white border-b border-neutral-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dc2626] flex items-center justify-center font-black font-brand text-base text-white shadow-md">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase font-brand text-white">
                  SOTRA FASHION
                </h1>
                <span className="text-[11px] bg-red-600 px-2 py-0.5 rounded text-white font-mono font-bold">
                  ADMIN PANEL
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  قاعدة البيانات: متصلة ومحدثة
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                لوحة الإدارة الشاملة للمتجر والطلبات والمخزون مع مزامنة سحابية مباشرة
              </p>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border border-neutral-700 active:scale-98"
          >
            <Store className="w-4 h-4 text-red-500" />
            <span>العودة إلى المتجر</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Cloud Database Status & Quick Controls Bar */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5">
                ⚡ قاعدة البيانات السحابية
              </span>
              <span className="text-xs text-neutral-300 font-bold">
                حالة الاتصال: <span className="text-emerald-400 font-black">مزامنة سحابية حية ومباشرة</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              جميع المنتجات، الأقسام، العروض، والطلبات مخزنة وتدار مركزياً في قاعدة البيانات السحابية. يمكنك تصدير المنتجات كشيت Excel وتعديلها وإعادة رفعها في أي وقت.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <button
              onClick={async () => {
                showToast("⏳ جاري مزامنة ورفع كافة بيانات المتجر إلى قاعدة البيانات...");
                const res = await syncAllStoreDataToFirebase(adminData);
                if (res.success) {
                  showToast("✅ تمت مزامنة كامل بيانات المتجر مع قاعدة البيانات السحابية بنجاح!");
                } else {
                  showToast(`❌ ${res.message}`);
                }
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="مزامنة شاملة ورفع فوري لكافة المنتجات والأقسام والإعدادات إلى قاعدة البيانات السحابية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>مزامنة سحابية شاملة</span>
            </button>

            <button
              onClick={() => setActiveTab("backup")}
              className="px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:brightness-110 text-neutral-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              title="تصدير واستيراد النسخ الاحتياطية وشيتات الإكسيل"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>النسخ الاحتياطي والتصدير</span>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all border border-red-500/50 active:scale-95"
              title="مسح وتفريغ قاعدة البيانات بالكامل أو بشكل مخصص"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إدارة وتفريغ قاعدة البيانات</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl shadow-xs border border-neutral-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "homeSections", label: "🏠 تخصيص الشاشة الرئيسية والبنر", count: "تحكم وإخفاء" },
            { id: "orders", label: "📋 تتبع وإدارة الطلبات", count: orders.length },
            { id: "customers", label: "👥 قاعدة بيانات العملاء", count: "CRM" },
            { id: "payment", label: "💳 رسوم الدفع والشحن", count: "فودافون/إنستاباي" },
            { id: "products", label: "👕 المنتجات وتفاصيلها", count: adminData.products.length },
            { id: "flashSale", label: "🔥 عروض الفلاش سيل", count: adminData.flashSaleConfig?.isEnabled ? "مفعّل" : "مغلق" },
            { id: "outfits", label: "✨ نسّق إطلالتك (الأطقم)", count: adminData.outfits?.length || 0 },
            { id: "inventory", label: "📦 المخزون وهوامش الربح", count: adminData.products.length },
            { id: "categories", label: "🗂️ الأقسام الرئيسية", count: adminData.categories.length },
            { id: "offerCategories", label: "🏷️ أقسام العروض (إظهار/إخفاء)", count: adminData.offerCategories.length },
            { id: "banners", label: "📣 البانر الإعلاني والروابط", count: adminData.banners.length },
            { id: "popup", label: "🎁 النافذة الإعلانية وأشرطة الخصم", count: adminData.popupBannerConfig?.isEnabled ? "مفعّلة" : "مغلقة" },
            { id: "coupons", label: "🎟️ البرومو كود والخصومات", count: adminData.coupons?.length || 0 },
            { id: "footer", label: "🦶 تخصيص الفوتر والضمانات", count: "فوتر" },
            { id: "splash", label: "✨ تخصيص شاشة البداية", count: adminData.splashScreenConfig?.theme === "white" ? "أبيض" : "داكن" },
            { id: "backup", label: "💾 النسخ الاحتياطي (تصدير/استيراد)", count: "تصدير/استيراد" },
            { id: "database", label: "🗑️ مسح قاعدة البيانات", count: "Wipe" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer font-arabic ${
                activeTab === t.id
                  ? "bg-neutral-950 text-white shadow-md"
                  : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span>{t.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-brand ${
                  activeTab === t.id ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-800"
                }`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-scale-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 0: HOME SECTIONS & BANNER SIZING CONFIG */}
        {activeTab === "homeSections" && (
          <AdminHomeSectionsSettings
            config={adminData.homeSectionsConfig}
            banners={adminData.banners}
            onSave={handleSaveHomeSectionsConfig}
            onNavigateTab={(tabId) => setActiveTab(tabId as any)}
            lang={lang}
          />
        )}

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">
                  تتبع طلبات المنتجات وتأكيد الدفع والشحن
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  تتبع مباشر لطلبات العملاء مع رقم تحويل رسوم الشحن فودافون كاش وتحديث الحالات متزامن مع صفحة العميل.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <select
                  value={ordersStatusFilter}
                  onChange={(e) => setOrdersStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 outline-none cursor-pointer"
                >
                  <option value="all">جميع الحالات ({orders.length})</option>
                  {ORDER_STATUS_FLOW.map((s) => (
                    <option key={s.status} value={s.status}>
                      {s.labelAr}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <input
                    type="search"
                    placeholder="بحث برقم الطلب، الاسم، أو الهاتف..."
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 outline-none pr-8"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500 space-y-2">
                <ShoppingBag className="w-12 h-12 mx-auto text-neutral-300" />
                <p className="text-sm font-bold">لا توجد طلبات مسجلة حتى الآن.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter((o) => {
                    const matchesFilter = ordersStatusFilter === "all" || o.trackingStatus === ordersStatusFilter;
                    const q = ordersSearch.toLowerCase();
                    const matchesSearch =
                      !q ||
                      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
                      (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q)) ||
                      (o.customer?.phoneNumber && o.customer.phoneNumber.includes(q)) ||
                      (o.vodafoneSenderPhone && o.vodafoneSenderPhone.includes(q)) ||
                      (o.shippingTransferNumber && o.shippingTransferNumber.includes(q));
                    return matchesFilter && matchesSearch;
                  })
                  .map((o, oIdx) => {
                    const currentStatusObj =
                      ORDER_STATUS_FLOW.find((s) => s.status === o.trackingStatus) || ORDER_STATUS_FLOW[0];
                    const isCancelled = o.trackingStatus === "cancelled";

                    return (
                      <div
                        key={o.orderId || `order-${oIdx}`}
                        className={`p-5 rounded-2xl border bg-white space-y-4 transition-all shadow-xs ${
                          isCancelled ? "border-red-200 bg-red-50/20" : "border-neutral-200"
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-base font-brand text-neutral-950">
                                {o.orderId}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${currentStatusObj.color}`}>
                                {currentStatusObj.labelAr}
                              </span>
                              <span className="text-xs text-neutral-400">
                                {new Date(o.createdAt).toLocaleString("ar-EG")}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-neutral-700 font-bold flex-wrap">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                {o.customer?.fullName || "عميل"} ({o.customer?.phoneNumber || "بدون هاتف"})
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                {o.governorateNameAr || ""} - {o.customer?.detailedAddress || ""}
                              </span>
                            </div>

                            {/* Shipping Transfer Details */}
                            {(o.vodafoneSenderPhone || o.shippingTransferNumber || o.senderPhoneOrInstaPayId || o.transactionReference) && (
                              <div className="mt-1 flex items-center gap-2 text-xs bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg w-fit font-bold flex-wrap">
                                <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                                <span>
                                  بيانات تحويل الشحن:{" "}
                                  <strong className="font-mono text-red-600">
                                    {o.vodafoneSenderPhone || o.shippingTransferNumber || o.senderPhoneOrInstaPayId || "تم التحويل"}
                                  </strong>
                                  {o.transactionReference && (
                                    <span className="text-neutral-600 font-normal mr-2">
                                      (مرجع: {o.transactionReference})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Stock Deduction Status & Confirmation Indicator */}
                            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                              {o.stockDeducted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  تم خصم الكميات من المخزون
                                </span>
                              ) : (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                                    المخزون معلق (بانتظار تأكيد استلام الشحن)
                                  </span>
                                  <button
                                    onClick={() => handleConfirmShippingFee(o.orderId)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    تأكيد ثمن الشحن وخصم المخزون
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Order Status Controller */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <label className="text-xs font-bold text-neutral-600">تحديث الحالة:</label>
                            <select
                              value={o.trackingStatus}
                              onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value as OrderStatus)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none cursor-pointer ${currentStatusObj.color}`}
                            >
                              {ORDER_STATUS_FLOW.map((s) => (
                                <option key={s.status} value={s.status}>
                                  {s.labelAr}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Order Items & Totals */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {(o.items || []).map((item, idx) => (
                            <div key={`order-item-${item?.id || idx}-${idx}`} className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                              <img
                                src={item?.selectedColor?.image || SOTRA_PRODUCT_PLACEHOLDER}
                                alt={item?.titleAr || item?.title || "Product"}
                                className="w-12 h-14 object-cover rounded-lg bg-neutral-100 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-neutral-900 truncate text-xs">{item?.titleAr || item?.title}</p>
                                <p className="text-[11px] text-neutral-500">
                                  {item?.selectedColor?.nameAr || item?.selectedColor?.name || ""} | مقاس: <span className="font-bold">{item?.selectedSize}</span> | عدد: <span className="font-bold">{item?.quantity}</span>
                                </p>
                                <p className="text-[11px] font-bold text-neutral-900 font-brand">
                                  LE {((Number(item?.price) || 0) * (Number(item?.quantity) || 1)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200 font-bold">
                          <span className="text-neutral-600">إجمالي المبلغ المطلوب عند الاستلام:</span>
                          <span className="font-black text-sm text-neutral-950 font-brand">
                            LE {Number(o.remainingUponDelivery ?? o.total ?? (o as any).totalAmount ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">إدارة وتعديل المنتجات</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  إضافة وتعديل بيانات المنتجات، وتصديرها واستيرادها عبر ملفات Excel (XLSX) لتسهيل التعديل الجماعي وإعادة الرفع.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                <input
                  type="search"
                  placeholder="ابحث باسم المنتج..."
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 outline-none w-full sm:w-44"
                />
                <input
                  type="file"
                  ref={prodImportInputRef}
                  onChange={handleDirectProductJsonImport}
                  accept=".xlsx,.xls,.csv,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                />
                {/* Excel Export Button */}
                <button
                  onClick={() => {
                    if (adminData.products.length === 0) {
                      showToast("⚠️ لا توجد منتجات لتصديرها حالياً");
                      return;
                    }
                    exportProductsToExcel(adminData.products, adminData.categories);
                    showToast("✅ تم تصدير كافة المنتجات إلى شيت Excel بنجاح!");
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                  title="تصدير جميع المنتجات إلى ملف Excel (.xlsx) جاهز للتعديل"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>

                {/* Excel / JSON Import Button */}
                <button
                  onClick={() => prodImportInputRef.current?.click()}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                  title="استيراد وتحديث المنتجات من ملف Excel (.xlsx / .csv) أو JSON"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>استيراد Excel / JSON</span>
                </button>

                {/* Template Download Button */}
                <button
                  onClick={() => {
                    exportProductsExcelTemplate();
                    showToast("✅ تم تحميل نموذج إكسيل جاهز لإدخال المنتجات!");
                  }}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  title="تحميل نموذج Excel فارغ مع أمثلة للشيت لتعبئة المنتجات وإعادة رفعها"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-500" />
                  <span>نموذج Excel جاهز</span>
                </button>

                {/* New Product Button */}
                <button
                  onClick={handleOpenNewProductModal}
                  className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>

            {adminData.products.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500 space-y-4 shadow-2xs">
                <Package className="w-12 h-12 mx-auto text-neutral-300" />
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-neutral-900">لا توجد منتجات مضافة في قاعدة البيانات حالياً</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    قاعدة البيانات جاهزة ونظيفة. يمكنك إضافة أول منتج يدوياً أو استيراد ملف Excel / JSON مباشرة أو تحميل نموذج الإكسيل الجاهز.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={handleOpenNewProductModal}
                    className="px-4 py-2.5 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول منتج</span>
                  </button>
                  <button
                    onClick={() => prodImportInputRef.current?.click()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>استيراد من Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      exportProductsExcelTemplate();
                      showToast("✅ تم تحميل نموذج إكسيل فارغ جاهز!");
                    }}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-neutral-500" />
                    <span>تحميل نموذج Excel</span>
                  </button>
                  <button
                    onClick={async () => {
                      showToast("⏳ جاري مزامنة المنتجات من Firebase...");
                      const res = await syncAllStoreDataToFirebase(adminData);
                      if (res.success) {
                        showToast("✅ تمت المزامنة مع Firebase بنجاح!");
                      }
                    }}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span>مزامنة مع Firebase</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adminData.products
                  .filter((p) => (p.titleAr || p.title).toLowerCase().includes(prodSearch.toLowerCase()))
                  .map((p, idx) => {
                    const offerCat = adminData.offerCategories.find((oc) => oc.id === p.offerCategory);
                    const cat = adminData.categories.find((c) => c.id === p.category);

                    const eff = getEffectiveProductDiscount(p, adminData.discountBadgeStyle);

                    return (
                      <div
                        key={p.id || `product-${idx}`}
                        className="p-4 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs hover:border-neutral-400 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={p.colors[0]?.image || SOTRA_PRODUCT_PLACEHOLDER}
                              alt={p.title}
                              className="w-16 h-20 object-cover rounded-xl bg-neutral-100"
                            />
                            {eff.isActive && (
                              <span className="absolute top-1 start-1 px-1.5 py-0.5 bg-red-600 text-white font-black text-[9px] rounded shadow-xs font-brand">
                                -{eff.percent}%
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-black text-neutral-950 truncate">{p.titleAr || p.title}</h4>
                              {p.badge && (
                                <span className="px-1.5 py-0.2 bg-neutral-950 text-white text-[10px] font-black rounded uppercase">
                                  {p.badge.textAr || p.badge.text}
                                </span>
                              )}
                              {p.discountBadgeStyle && p.discountBadgeStyle !== "default" && (
                                <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-700 text-[10px] font-bold rounded border border-neutral-200">
                                  شريط: {DISCOUNT_BADGE_STYLES_META[p.discountBadgeStyle]?.labelAr || p.discountBadgeStyle}
                                </span>
                              )}
                              {p.discountScheduleEnabled && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 ${
                                  eff.scheduleStatus === "active"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : eff.scheduleStatus === "scheduled"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  {eff.scheduleStatus === "active" ? `نشط (${eff.timeRemainingAr})` : eff.scheduleStatus === "scheduled" ? "مجدول" : "منتهي"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 flex-wrap">
                              <span className="font-black text-neutral-900 font-brand">LE {p.price}</span>
                              {p.originalPrice && (
                                <span className="line-through text-neutral-400">LE {p.originalPrice}</span>
                              )}
                              <span>•</span>
                              <span className="text-neutral-600">{cat?.nameAr || p.category}</span>
                              {offerCat && (
                                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] rounded font-bold">
                                  {offerCat.nameAr}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1 truncate max-w-xs">
                              {p.colors?.length || 0} ألوان • مقاسات: {p.sizes?.join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-2 hover:bg-neutral-100 rounded-xl text-neutral-700 cursor-pointer"
                            title="تعديل كافة بيانات المنتج"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MAIN CATEGORIES */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">الأقسام الرئيسية للمتجر</h2>
                <p className="text-xs text-neutral-500">
                  إضافة وتعديل الأقسام الرئيسية وترتيب ظهورها في السلايدر والقوائم.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory({
                    id: "cat-" + Date.now(),
                    name: "",
                    nameAr: "",
                    image: "",
                  });
                  setIsCatModalOpen(true);
                }}
                className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {adminData.categories.map((cat, idx) => (
                <div
                  key={cat.id || `cat-${idx}`}
                  className="p-4 bg-white rounded-2xl border border-neutral-200 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={cat.image || SOTRA_PRODUCT_PLACEHOLDER}
                      alt={cat.name}
                      className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                    />
                    <div>
                      <h4 className="text-sm font-black text-neutral-950">{cat.nameAr}</h4>
                      <p className="text-xs text-neutral-400 font-brand">{cat.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveCategory(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(idx, "down")}
                      disabled={idx === adminData.categories.length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsCatModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: OFFER CATEGORIES */}
        {activeTab === "offerCategories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">أقسام العروض والتخفيضات المميزة</h2>
                <p className="text-xs text-neutral-500">
                  إضافة أقسام العروض مع إمكانية **إظهار أو إخفاء** أي قسم بنقرة زر واحدة دون حذفه.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingOfferCat({
                    id: "offer-cat-" + Date.now(),
                    name: "",
                    nameAr: "",
                    image: "",
                    badge: "عروض حصرية",
                    discountText: "خصم يصل إلى 50%",
                    isVisible: true,
                  });
                  setIsOfferCatModalOpen(true);
                }}
                className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم عروض جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {adminData.offerCategories.map((oc, idx) => (
                <div
                  key={oc.id || `oc-${idx}`}
                  className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 transition-all ${
                    oc.isVisible === false ? "opacity-60 border-neutral-300 bg-neutral-50" : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={oc.image || SOTRA_PRODUCT_PLACEHOLDER}
                        alt={oc.name}
                        className="w-14 h-14 rounded-xl object-cover bg-neutral-100"
                      />
                      <div>
                        <h4 className="text-sm font-black text-neutral-950">{oc.nameAr}</h4>
                        <p className="text-xs text-red-600 font-bold">{oc.discountText}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleOfferCatVisibility(oc.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          oc.isVisible === false
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                        title={oc.isVisible === false ? "القسم مخفي - انقر للإظهار" : "القسم ظاهر - انقر للإخفاء"}
                      >
                        {oc.isVisible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{oc.isVisible === false ? "مخفي" : "ظاهر"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingOfferCat(oc);
                          setIsOfferCatModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteOfferCategory(oc.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BANNERS SLIDER */}
        {activeTab === "banners" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">البانر الإعلاني المتحرك (Promo Banners)</h2>
                <p className="text-xs text-neutral-500">
                  إضافة وتعديل شرائح البانر مع إمكانية ربط كل شريحة بقسم رئيسي، قسم عروض، أو منتج محدد مباشرة.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("homeSections")}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sliders className="w-4 h-4 text-neutral-600" />
                  <span>تعديل حجم وأبعاد البنر</span>
                </button>
                <button
                  onClick={() => {
                    setEditingBanner({
                      id: Date.now(),
                      title: "",
                      titleAr: "",
                      subtitle: "",
                      subtitleAr: "",
                      tag: "EXCLUSIVE",
                      tagAr: "عرض حصري",
                      image: "",
                      targetType: "category",
                      targetCategory: adminData.categories[0]?.id || "",
                    });
                    setIsBannerModalOpen(true);
                  }}
                  className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة شريحة بنر</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adminData.banners.map((b, idx) => (
                <div
                  key={b.id || `banner-${idx}`}
                  className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="relative h-32 rounded-xl overflow-hidden bg-neutral-900 text-white p-4 flex flex-col justify-end">
                    <img
                      src={b.image || SOTRA_PRODUCT_PLACEHOLDER}
                      alt={b.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative z-10">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-600 text-white rounded">
                        {b.tagAr || b.tag}
                      </span>
                      <h4 className="text-base font-black mt-1">{b.titleAr || b.title}</h4>
                      <p className="text-xs text-neutral-300">{b.subtitleAr || b.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-600">
                    <div>
                      <span>نوع الرابط: </span>
                      <strong className="text-neutral-900">
                        {b.targetType === "product"
                          ? "🎯 منتج محدد"
                          : b.targetType === "offer_category"
                          ? "🏷️ قسم عروض"
                          : "🗂️ قسم رئيسي"}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBanner(b);
                          setIsBannerModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-700 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: INVENTORY & STOCK MATRIX */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">المخزون والكميات للألوان والمقاسات</h2>
                <p className="text-xs text-neutral-500 mt-1">
                  تحديد كمية كل مقاس ولون بدقة وتحديث هوامش الربح وأسعار الجملة، مع إمكانية التصدير والاستيراد عبر Excel.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
                <input
                  type="search"
                  placeholder="ابحث عن منتج بالمخزن..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-neutral-50 outline-none w-full sm:w-44"
                />
                <button
                  onClick={() => {
                    if (adminData.products.length === 0) {
                      showToast("⚠️ لا توجد منتجات لتصديرها حالياً");
                      return;
                    }
                    exportProductsToExcel(adminData.products, adminData.categories);
                    showToast("✅ تم تصدير شيت Excel مع توزيع كميات المخزون والمقاسات والألوان بنجاح!");
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                  title="تصدير شيت Excel للمنتجات والمخزون (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel</span>
                </button>
                <button
                  onClick={() => prodImportInputRef.current?.click()}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
                  title="استيراد وتحديث كميات المخزون من ملف Excel (.xlsx)"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>استيراد Excel</span>
                </button>
                <button
                  onClick={() => {
                    exportProductsExcelTemplate();
                    showToast("✅ تم تحميل نموذج إكسيل جاهز لإدخال كميات المخزون والمقاسات والألوان!");
                  }}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  title="تحميل نموذج Excel فارغ مع أمثلة للمقاسات والألوان والكميات"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-500" />
                  <span>نموذج Excel</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {adminData.products
                .filter((p) => (p.titleAr || p.title).toLowerCase().includes(invSearch.toLowerCase()))
                .map((prod, idx) => {
                  const colors = prod.colors || [{ name: "عام", nameAr: "عام", hex: "#111" }];
                  const sizes = prod.sizes || ["L"];
                  let totalQty = 0;
                  let totalWholesale = 0;
                  let totalRetail = 0;

                  colors.forEach((col) => {
                    sizes.forEach((sz) => {
                      const k = getInvKey(col.nameAr, col.name, sz);
                      const entry = prod.inventory?.[k] || { qty: 10, wholesalePrice: 0, salePrice: prod.price };
                      const q = Number(entry.qty) || 0;
                      totalQty += q;
                      totalWholesale += q * (Number(entry.wholesalePrice) || 0);
                      totalRetail += q * (Number(entry.salePrice) || prod.price);
                    });
                  });

                  return (
                    <div
                      key={prod.id || `inv-prod-${idx}`}
                      className="p-4 bg-white rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.colors[0]?.image || SOTRA_PRODUCT_PLACEHOLDER}
                          alt={prod.title}
                          className="w-14 h-16 object-cover rounded-xl bg-neutral-100"
                        />
                        <div>
                          <h4 className="text-sm font-black text-neutral-950">{prod.titleAr || prod.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                            <span>
                              إجمالي القطع:{" "}
                              <strong className={totalQty <= 5 ? "text-amber-600 font-bold" : "text-neutral-900 font-bold"}>
                                {totalQty} قطعة
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              قيمة البيع: <strong className="text-neutral-900 font-brand">LE {totalRetail}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingInvProduct(prod);
                          setIsInvModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Package className="w-4 h-4" />
                        <span>تعديل كميات الألوان والمقاسات</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 7: COUPONS & PROMOS */}
        {activeTab === "coupons" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-base font-black text-neutral-900">أكواد الخصم والبرومو كود</h2>
                <p className="text-xs text-neutral-500">
                  شحن مجاني، خصم نسبة مئوية، أو خصم مبلغ نقدي ثابت.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCoupon({
                    id: "coupon-" + Date.now(),
                    code: "",
                    type: "percentage",
                    value: 10,
                    minOrderAmount: 0,
                    descriptionAr: "",
                    isActive: true,
                  });
                  setIsCouponModalOpen(true);
                }}
                className="px-4 py-2 bg-neutral-950 hover:bg-[#dc2626] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كود خصم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(adminData.coupons || []).map((cp, idx) => (
                <div
                  key={cp.id || `coupon-${idx}`}
                  className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 ${
                    cp.isActive ? "border-neutral-200" : "border-neutral-300 opacity-60 bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-brand font-black text-sm px-3 py-1 bg-neutral-950 text-white rounded-lg uppercase tracking-wider">
                        {cp.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cp.type === "free_shipping"
                            ? "bg-blue-100 text-blue-800"
                            : cp.type === "percentage"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {cp.type === "free_shipping"
                          ? "🚚 شحن مجاني"
                          : cp.type === "percentage"
                          ? `خصم ${cp.value}%`
                          : `خصم ${cp.value} ج.م`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCoupon(cp);
                          setIsCouponModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(cp.id)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-700 font-semibold">{cp.descriptionAr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: POPUP BANNER & DISCOUNT BADGE SETTINGS */}
        {activeTab === "popup" && (
          <AdminPopupBannerSettings
            config={adminData.popupBannerConfig}
            discountBadgeStyle={adminData.discountBadgeStyle}
            categories={adminData.categories}
            offerCategories={adminData.offerCategories}
            products={adminData.products}
            onSaveConfig={handleSavePopupConfig}
            onSaveDiscountStyle={handleSaveDiscountBadgeStyle}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB: FLASH SALE SETTINGS */}
        {activeTab === "flashSale" && (
          <AdminFlashSaleSettings
            config={adminData.flashSaleConfig}
            allProducts={adminData.products}
            onSave={handleSaveFlashSaleConfig}
            lang={lang}
          />
        )}

        {/* TAB: OUTFITS (SHOP THE LOOK) SETTINGS */}
        {activeTab === "outfits" && (
          <AdminOutfitsSettings
            outfits={adminData.outfits}
            allProducts={adminData.products}
            onSave={handleSaveOutfits}
            lang={lang}
          />
        )}

        {/* TAB 8: PAYMENT AND SHIPPING SETTINGS */}
        {activeTab === "payment" && (
          <AdminPaymentAndShippingSettings
            paymentConfig={adminData.paymentConfig}
            governorates={adminData.governorates}
            onSavePaymentConfig={handleSavePaymentConfig}
            onSaveGovernorates={handleSaveGovernorates}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB 9: CUSTOMERS CRM DATABASE */}
        {activeTab === "customers" && (
          <AdminCustomersTab
            orders={orders}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB 10: FOOTER SETTINGS */}
        {activeTab === "footer" && (
          <AdminFooterSettings
            footerConfig={adminData.footerConfig}
            onSave={handleSaveFooterConfig}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB 9: SPLASH SCREEN SETTINGS */}
        {activeTab === "splash" && (
          <AdminSplashSettings
            splashConfig={adminData.splashScreenConfig}
            onSave={handleSaveSplashScreenConfig}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB 10: BACKUP & RESTORE */}
        {activeTab === "backup" && (
          <AdminBackupRestore
            adminData={adminData}
            orders={orders}
            onUpdateAdminData={(newData) => {
              onUpdateAdminData(newData);
              saveAdminData(newData);
              saveAdminDataToFirebase(newData).catch((e) => console.warn(e));
            }}
            onUpdateOrders={(newOrders) => {
              onUpdateOrders(newOrders);
            }}
            showToast={showToast}
            lang={lang}
          />
        )}

        {/* TAB 11: DATABASE WIPE & RESET MANAGER */}
        {activeTab === "database" && (
          <AdminDatabaseManager
            adminData={adminData}
            orders={orders}
            onUpdateAdminData={(newData) => {
              onUpdateAdminData(newData);
              saveAdminData(newData);
            }}
            onUpdateOrders={(newOrders) => {
              onUpdateOrders(newOrders);
            }}
            showToast={showToast}
            lang={lang}
          />
        )}
      </div>

      {/* SUB-MODAL 1: PRODUCT FORM (BLANK FIELDS FOR NEW PRODUCTS) */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-base text-neutral-950 font-brand">
                  {editingProduct.titleAr || editingProduct.title ? "تعديل منتج" : "إضافة منتج جديد"}
                </h3>
                <p className="text-xs text-neutral-500">أدخل بيانات المنتج بدقة، الألوان، والمقاسات</p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المنتج (بالعربي) *</label>
                <input
                  type="text"
                  value={editingProduct.titleAr || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, titleAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                  placeholder="مثال: تيشرت قطن تركي أوفر سايز"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">اسم المنتج (English)</label>
                <input
                  type="text"
                  value={editingProduct.title || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                  placeholder="e.g. SOTRA Heavy Oversized Tee"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">سعر البيع الحالي للجمهور (ج.م) *</label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.price === 0 ? "" : editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand font-bold"
                  placeholder="مثال: 650"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  سعر الجملة / التكلفة للقطعة (ج.م) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.wholesalePrice === 0 ? "" : editingProduct.wholesalePrice ?? ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      wholesalePrice: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand font-bold text-blue-900 bg-blue-50/40"
                  placeholder="مثال: 380"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">السعر قبل الخصم (ج.م اختياري)</label>
                <input
                  type="number"
                  min="0"
                  value={editingProduct.originalPrice ?? ""}
                  onChange={(e) => {
                    const orig = e.target.value === "" ? undefined : Number(e.target.value);
                    const currentRetail = Number(editingProduct.price) || 0;
                    const computedPct = orig && orig > currentRetail ? Math.round(((orig - currentRetail) / orig) * 100) : undefined;
                    setEditingProduct({
                      ...editingProduct,
                      originalPrice: orig,
                      discountPercent: computedPct,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-brand"
                  placeholder="مثال: 850"
                />
              </div>

              {/* Live Profit Margin & Discount Badge */}
              <div className="flex flex-col gap-2">
                {(() => {
                  const retail = Number(editingProduct.price) || 0;
                  const wholesale = Number(editingProduct.wholesalePrice) || 0;
                  const original = Number(editingProduct.originalPrice) || 0;
                  const profit = retail - wholesale;
                  const marginPct = retail > 0 && wholesale > 0 ? Math.round((profit / retail) * 100) : 0;
                  const discountPct = original > retail && original > 0 ? Math.round(((original - retail) / original) * 100) : (editingProduct.discountPercent || 0);

                  return (
                    <div className="space-y-1.5">
                      <div className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 text-xs flex items-center justify-between">
                        <span className="font-bold">هامش ربح القطعة:</span>
                        <span className="font-black font-brand text-emerald-800">
                          +{profit} ج.م ({marginPct}%)
                        </span>
                      </div>
                      {discountPct > 0 && (
                        <div className="w-full p-2.5 rounded-xl border border-red-200 bg-red-50 text-red-950 text-xs flex items-center justify-between">
                          <span className="font-bold">نسبة الخصم المحسوبة:</span>
                          <span className="px-2 py-0.5 bg-red-600 text-white font-black rounded text-[11px] font-brand">
                            خصم {discountPct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* DISCOUNT RIBBON STYLE & SCHEDULING SECTION */}
              <div className="sm:col-span-2 p-4 sm:p-5 bg-red-50/50 rounded-2xl border border-red-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-red-200/70 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
                      <Percent className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-neutral-950">شريط الخصم ومواعيد العرض الترويجي للمنتج</h4>
                      <p className="text-[11px] text-neutral-500 font-medium">تحديد موضع ونوع شريط الخصم (يمين / يسار / مائل) وجدولته بتوقيت محدد</p>
                    </div>
                  </div>
                  {editingProduct.originalPrice && editingProduct.originalPrice > editingProduct.price && (
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-full font-brand shadow-xs">
                      خصم {editingProduct.discountPercent || Math.round(((editingProduct.originalPrice - editingProduct.price) / editingProduct.originalPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* 1. Ribbon Style & Position Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800">
                      موضع ونوع شريط الخصم على المنتج (Discount Ribbon Position & Style)
                    </label>
                    <span className="text-[11px] text-neutral-500 font-bold">
                      {DISCOUNT_BADGE_STYLES_META[editingProduct.discountBadgeStyle || "default"]?.labelAr || "تلقائي"}
                    </span>
                  </div>

                  <select
                    value={editingProduct.discountBadgeStyle || "default"}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountBadgeStyle: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white font-bold cursor-pointer"
                  >
                    <option value="default">
                      ⚙️ تلقائي - حسب إعداد المتجر العام ({adminData.discountBadgeStyle ? (DISCOUNT_BADGE_STYLES_META[adminData.discountBadgeStyle]?.labelAr || adminData.discountBadgeStyle) : "شريط رأسي يمين"})
                    </option>
                    <optgroup label="الجانب الأيمن (Right Side)">
                      <option value="vertical_right">📌 شريط رأسي جهة اليمين (Vertical Right Ribbon)</option>
                      <option value="diagonal_corner_right">📐 شريط مائل بالزاوية اليمنى (Top-Right Corner)</option>
                      <option value="horizontal_top_right">🏷️ شريط أفقي أعلى اليمين (Top Right Badge)</option>
                      <option value="pill_corner_right">💊 كبسولة دائرية أعلى اليمين (Pill Right)</option>
                    </optgroup>
                    <optgroup label="الجانب الأيسر (Left Side)">
                      <option value="vertical_left">📌 شريط رأسي جهة اليسار (Vertical Left Ribbon)</option>
                      <option value="diagonal_corner_left">📐 شريط مائل بالزاوية اليسرى (Top-Left Corner)</option>
                      <option value="horizontal_top_left">🏷️ شريط أفقي أعلى اليسار (Top Left Badge)</option>
                      <option value="pill_corner_left">💊 كبسولة دائرية أعلى اليسار (Pill Left)</option>
                    </optgroup>
                    <optgroup label="أنماط أخرى">
                      <option value="horizontal_bar">🚩 شريط أفقي عريض أسفل الصورة (Horizontal Bottom Bar)</option>
                      <option value="banner_ribbon">🚩 شريط عريض يغطي أعلى الصورة بالكامل (Top Banner Ribbon)</option>
                      <option value="above_title">📝 شارة أنيقة فوق عنوان وسعر المنتج (Above Title)</option>
                    </optgroup>
                  </select>

                  {/* Quick Visual Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: "default", label: "⚙️ المتجر العام" },
                      { id: "vertical_right", label: "📌 رأسي يمين" },
                      { id: "vertical_left", label: "📌 رأسي يسار" },
                      { id: "diagonal_corner_right", label: "📐 مائل يمين" },
                      { id: "diagonal_corner_left", label: "📐 مائل يسار" },
                      { id: "pill_corner_right", label: "💊 كبسولة يمين" },
                      { id: "pill_corner_left", label: "💊 كبسولة يسار" },
                      { id: "horizontal_bar", label: "🚩 شريط أسفل" },
                      { id: "banner_ribbon", label: "🚩 شريط أعلى" },
                      { id: "above_title", label: "📝 فوق العنوان" },
                    ].map((btn) => {
                      const isCur = (editingProduct.discountBadgeStyle || "default") === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, discountBadgeStyle: btn.id as any })}
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer border ${
                            isCur
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Scheduling & Timers Section */}
                <div className="pt-3 border-t border-red-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(editingProduct.discountScheduleEnabled)}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            discountScheduleEnabled: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
                      />
                      <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        تحديد موعد وجدولة زمنية للخصم (يبدأ وينتهي تلقائياً مع مؤقت)
                      </span>
                    </label>
                  </div>

                  {editingProduct.discountScheduleEnabled && (
                    <div className="p-3.5 bg-white rounded-xl border border-red-200 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            تاريخ ووقت بدء الخصم (اختياري)
                          </label>
                          <input
                            type="datetime-local"
                            value={editingProduct.discountStartDate ? editingProduct.discountStartDate.slice(0, 16) : ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                discountStartDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 font-sans"
                          />
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">
                            اتركه فارغاً ليبدأ الخصم فوراً
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-red-600" />
                            تاريخ ووقت انتهاء الخصم *
                          </label>
                          <input
                            type="datetime-local"
                            value={editingProduct.discountEndDate ? editingProduct.discountEndDate.slice(0, 16) : ""}
                            onChange={(e) =>
                              setEditingProduct({
                                ...editingProduct,
                                discountEndDate: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 outline-none focus:border-neutral-950 font-sans font-bold"
                          />
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">
                            عند انتهاء الموعد يختفي الخصم ويعود السعر الأصلي تلقائياً
                          </span>
                        </div>
                      </div>

                      {/* Quick Presets for Scheduling */}
                      <div className="pt-2 border-t border-neutral-100 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-neutral-500">مواعيد سريعة جاهزة:</span>
                        {[
                          { label: "+24 ساعة", hours: 24 },
                          { label: "+3 أيام", hours: 72 },
                          { label: "+7 أيام", hours: 168 },
                          { label: "+14 يوم", hours: 336 },
                        ].map((pr) => (
                          <button
                            key={pr.label}
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const future = new Date(now.getTime() + pr.hours * 3600 * 1000);
                              const pad = (n: number) => String(n).padStart(2, "0");
                              const isoStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
                              setEditingProduct({
                                ...editingProduct,
                                discountEndDate: isoStr,
                              });
                            }}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
                          >
                            {pr.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0);
                            const pad = (n: number) => String(n).padStart(2, "0");
                            const isoStr = `${endOfMonth.getFullYear()}-${pad(endOfMonth.getMonth() + 1)}-${pad(endOfMonth.getDate())}T23:59`;
                            setEditingProduct({
                              ...editingProduct,
                              discountEndDate: isoStr,
                            });
                          }}
                          className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 text-[10px] font-bold rounded cursor-pointer transition-colors"
                        >
                          نهاية الشهر
                        </button>
                      </div>

                      {/* Live Scheduling Feedback */}
                      {(() => {
                        const eff = getEffectiveProductDiscount(editingProduct as Product, adminData.discountBadgeStyle);
                        if (!editingProduct.discountEndDate && !editingProduct.discountStartDate) {
                          return null;
                        }
                        if (eff.scheduleStatus === "expired") {
                          return (
                            <div className="p-2.5 bg-red-100/70 border border-red-300 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2">
                              <span className="text-base">⚠️</span>
                              <div>
                                <div>فترة الخصم منتهية الصلاحية:</div>
                                <div className="text-[11px] font-normal text-red-800">
                                  لن يظهر شريط الخصم للعملاء وسيباع المنتج بالسعر الأساسي.
                                </div>
                              </div>
                            </div>
                          );
                        }
                        if (eff.scheduleStatus === "scheduled") {
                          return (
                            <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                                <span>الخصم مجدول للمستقبل:</span>
                              </span>
                              <span>سيبدأ في: {new Date(editingProduct.discountStartDate!).toLocaleString("ar-EG")}</span>
                            </div>
                          );
                        }
                        if (eff.scheduleStatus === "active") {
                          return (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                <span>الخصم نشط حالياً للزوار:</span>
                              </span>
                              <span className="font-brand text-emerald-800 font-black">{eff.timeRemainingAr}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>

                {/* 3. Live Visual Badge Preview on Product Image */}
                {(() => {
                  const eff = getEffectiveProductDiscount(editingProduct as Product, adminData.discountBadgeStyle);
                  const previewImg = editingProduct.colors?.[0]?.image || SOTRA_PRODUCT_PLACEHOLDER;
                  return (
                    <div className="pt-3 border-t border-red-200/70">
                      <span className="block text-[11px] font-bold text-neutral-600 mb-2">
                        👁️ معاينة شكل وموضع شريط الخصم كما سيظهر في المتجر:
                      </span>
                      <div className="bg-neutral-100 p-3 rounded-2xl border border-neutral-200 flex items-center justify-center">
                        <div className="relative w-40 aspect-[3/4] bg-white rounded-xl overflow-hidden shadow-md border border-neutral-300">
                          <img
                            src={previewImg}
                            alt="Preview"
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = SOTRA_PRODUCT_PLACEHOLDER;
                            }}
                          />
                          <DiscountBadge
                            discountPercent={eff.percent || 25}
                            originalPrice={editingProduct.originalPrice || 900}
                            price={editingProduct.price || 650}
                            style={eff.style}
                            lang={lang}
                            timeRemainingText={eff.timeRemainingAr}
                          />
                          <div className="absolute bottom-1.5 start-1.5 end-1.5 bg-black/75 backdrop-blur-xs text-white p-1 rounded text-center text-[9px] font-bold truncate">
                            {editingProduct.titleAr || "معاينة المنتج"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Categories selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">القسم الرئيسي *</label>
                <select
                  value={editingProduct.category || adminData.categories[0]?.id || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 cursor-pointer bg-white"
                >
                  {adminData.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Offer Categories selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">إضافة إلى قسم العروض (اختياري)</label>
                <select
                  value={editingProduct.offerCategory || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, offerCategory: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 cursor-pointer bg-white"
                >
                  <option value="">بدون قسم عروض</option>
                  {adminData.offerCategories.map((oc) => (
                    <option key={oc.id} value={oc.id}>
                      🏷️ {oc.nameAr || oc.name} {oc.isVisible === false ? "(مخفي)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Badge & Custom Text */}
              <div className="sm:col-span-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800">
                    شارة المنتج أعلى الكارت (جديد / خصم / مميز أو كتابة نص مخصص)
                  </label>
                  {editingProduct.badge && (editingProduct.badge.textAr || editingProduct.badge.text) && (
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-neutral-500">المعاينة:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-black uppercase font-brand shadow-xs ${
                          editingProduct.badge.type === "new"
                            ? "bg-emerald-600 text-white"
                            : editingProduct.badge.type === "discount"
                            ? "bg-red-600 text-white"
                            : editingProduct.badge.type === "featured" || editingProduct.badge.type === "bestseller"
                            ? "bg-amber-500 text-neutral-950"
                            : editingProduct.badge.type === "exclusive"
                            ? "bg-purple-700 text-white"
                            : editingProduct.badge.type === "limited"
                            ? "bg-rose-700 text-white"
                            : editingProduct.badge.type === "restocked"
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-950 text-white"
                        }`}
                        style={{
                          backgroundColor: editingProduct.badge.colorBg || undefined,
                          color: editingProduct.badge.colorText || undefined,
                        }}
                      >
                        {editingProduct.badge.textAr || editingProduct.badge.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {BADGE_OPTIONS.map((b, bIdx) => {
                    const isSelected =
                      (!b.type && !editingProduct.badge) ||
                      (b.type && editingProduct.badge?.type === b.type);

                    return (
                      <button
                        type="button"
                        key={b.type || `badge-opt-${bIdx}`}
                        onClick={() => {
                          if (!b.type) {
                            setEditingProduct({ ...editingProduct, badge: undefined });
                          } else {
                            setEditingProduct({
                              ...editingProduct,
                              badge: {
                                type: b.type as any,
                                text: b.type === "custom" ? (editingProduct.badge?.text || "CUSTOM") : b.text,
                                textAr: b.type === "custom" ? (editingProduct.badge?.textAr || "شارة مخصصة") : b.textAr,
                                colorBg: editingProduct.badge?.colorBg,
                                colorText: editingProduct.badge?.colorText,
                              },
                            });
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-xs scale-102"
                            : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        {b.type === "new" && "✨ "}
                        {b.type === "discount" && "🏷️ "}
                        {b.type === "featured" && "⭐ "}
                        {b.type === "bestseller" && "🔥 "}
                        {b.type === "exclusive" && "💎 "}
                        {b.type === "limited" && "⏳ "}
                        {b.type === "restocked" && "🔄 "}
                        {b.type === "custom" && "✍️ "}
                        {b.textAr}
                      </button>
                    );
                  })}
                </div>

                {/* Editable Badge Text inputs when badge is active */}
                {editingProduct.badge && (
                  <div className="pt-2 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        نص الشارة المكتوب بالعربي (يظهر بالكارت) *
                      </label>
                      <input
                        type="text"
                        value={editingProduct.badge.textAr || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            badge: {
                              ...editingProduct.badge!,
                              textAr: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white"
                        placeholder="مثال: جديد، خصم، مميز، أو أي نص مخصص"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        نص الشارة بالإنجليزي (اختياري)
                      </label>
                      <input
                        type="text"
                        value={editingProduct.badge.text || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            badge: {
                              ...editingProduct.badge!,
                              text: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950 bg-white uppercase font-brand"
                        placeholder="e.g. NEW, SALE, FEATURED"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Fit type */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">نوع القصة (Fit)</label>
                <input
                  type="text"
                  value={editingProduct.fitAr || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fitAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                  placeholder="مثال: قصة مريحة واسعة أوفرسايز"
                />
              </div>

              {/* Fabric */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1">الخامة والتصنيع</label>
                <input
                  type="text"
                  value={editingProduct.fabricAr || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, fabricAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                  placeholder="أفضل الخامات التركية والعالمية 100% قطن فاخر"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1">وصف المنتج</label>
                <textarea
                  rows={2}
                  value={editingProduct.descriptionAr || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none focus:border-neutral-950"
                  placeholder="وصف تفصيلي للخامة والمظهر والمميزات..."
                />
              </div>

              {/* Colors variants */}
              <div className="sm:col-span-2 space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-neutral-900">الألوان المتاحة والصور</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newCols = [
                        ...(editingProduct.colors || []),
                        {
                          name: "",
                          nameAr: "",
                          hex: "#333333",
                          image: "",
                        },
                      ];
                      setEditingProduct({ ...editingProduct, colors: newCols });
                    }}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة لون</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingProduct.colors || []).map((col, cIdx) => (
                    <div
                      key={`edit-col-${cIdx}`}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={col.hex || "#111111"}
                          onChange={(e) => {
                            const nextCols = [...editingProduct.colors];
                            nextCols[cIdx].hex = e.target.value;
                            setEditingProduct({ ...editingProduct, colors: nextCols });
                          }}
                          className="w-8 h-8 rounded border-none cursor-pointer p-0 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={col.nameAr || ""}
                          onChange={(e) => {
                            const nextCols = [...editingProduct.colors];
                            nextCols[cIdx].nameAr = e.target.value;
                            setEditingProduct({ ...editingProduct, colors: nextCols });
                          }}
                          placeholder="اسم اللون (مثلاً: أسود)"
                          className="w-32 px-2 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none"
                        />
                      </div>

                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={col.image || ""}
                          onChange={(e) => {
                            const nextCols = [...editingProduct.colors];
                            nextCols[cIdx].image = e.target.value;
                            setEditingProduct({ ...editingProduct, colors: nextCols });
                          }}
                          placeholder="رابط صورة اللون أو اتركها فارغة للصورة الافتراضية"
                          className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white outline-none font-sans"
                        />
                        {editingProduct.colors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextCols = editingProduct.colors.filter((_, idx) => idx !== cIdx);
                              setEditingProduct({ ...editingProduct, colors: nextCols });
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes selector */}
              <div className="sm:col-span-2 space-y-2 border-t pt-3">
                <label className="text-xs font-black text-neutral-900 block">المقاسات المتوفرة (اختر المقاسات)</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVAILABLE_SIZES.map((sz) => {
                    const isSelected = (editingProduct.sizes || []).includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          let nextSizes = [...(editingProduct.sizes || [])];
                          if (isSelected) {
                            nextSizes = nextSizes.filter((s) => s !== sz);
                          } else {
                            nextSizes.push(sz);
                          }
                          setEditingProduct({ ...editingProduct, sizes: nextSizes });
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer font-brand ${
                          isSelected
                            ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                            : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inventory and Stock Distribution by Size and Color */}
              <div className="sm:col-span-2">
                <ProductInventoryForm
                  colors={editingProduct.colors || []}
                  sizes={editingProduct.sizes || []}
                  inventory={editingProduct.inventory || {}}
                  price={editingProduct.price || 0}
                  onChange={(newInv, inStock) => {
                    setEditingProduct({
                      ...editingProduct,
                      inventory: newInv,
                      inStock,
                    });
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct(editingProduct)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-neutral-950 hover:bg-[#dc2626] text-white cursor-pointer shadow-md transition-colors"
              >
                حفظ المنتج في المتجر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: CATEGORY FORM */}
      {isCatModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-neutral-950">
                {editingCategory.id ? "تعديل قسم" : "إضافة قسم جديد"}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">اسم القسم (بالعربي)</label>
                <input
                  type="text"
                  value={editingCategory.nameAr || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, nameAr: e.target.value })}
                  placeholder="مثال: قمصان فاخرة"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">اسم القسم (English)</label>
                <input
                  type="text"
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Premium Shirts"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">رابط صورة القسم</label>
                <input
                  type="text"
                  value={editingCategory.image || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                  placeholder="https://... أو اتركها فارغة"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveCategory(editingCategory)}
                className="px-4 py-2 text-xs font-black bg-neutral-950 text-white rounded-xl hover:bg-[#dc2626]"
              >
                حفظ القسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: OFFER CATEGORY FORM */}
      {isOfferCatModalOpen && editingOfferCat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-neutral-950">إضافة / تعديل قسم عروض</h3>
              <button onClick={() => setIsOfferCatModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">اسم قسم العروض (بالعربي)</label>
                <input
                  type="text"
                  value={editingOfferCat.nameAr || ""}
                  onChange={(e) => setEditingOfferCat({ ...editingOfferCat, nameAr: e.target.value })}
                  placeholder="مثال: عروض الصيف الكبرى"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">نص الخصم / العرض</label>
                <input
                  type="text"
                  value={editingOfferCat.discountText || ""}
                  onChange={(e) => setEditingOfferCat({ ...editingOfferCat, discountText: e.target.value })}
                  placeholder="مثال: خصم حتى 50%"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">شارة العرض</label>
                <input
                  type="text"
                  value={editingOfferCat.badge || ""}
                  onChange={(e) => setEditingOfferCat({ ...editingOfferCat, badge: e.target.value })}
                  placeholder="مثال: عروض حصرية"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">رابط صورة قسم العروض</label>
                <input
                  type="text"
                  value={editingOfferCat.image || ""}
                  onChange={(e) => setEditingOfferCat({ ...editingOfferCat, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-offer-visible"
                  checked={editingOfferCat.isVisible !== false}
                  onChange={(e) => setEditingOfferCat({ ...editingOfferCat, isVisible: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 cursor-pointer"
                />
                <label htmlFor="chk-offer-visible" className="text-xs font-bold text-neutral-800 cursor-pointer">
                  ظاهر في الصفحة الرئيسية للعملاء
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsOfferCatModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveOfferCategory(editingOfferCat)}
                className="px-4 py-2 text-xs font-black bg-neutral-950 text-white rounded-xl hover:bg-[#dc2626]"
              >
                حفظ قسم العروض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: BANNER FORM */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-neutral-950">إضافة / تعديل شريحة بنر إعلاني</h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">عنوان البانر الرئيسي</label>
                <input
                  type="text"
                  value={editingBanner.titleAr || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, titleAr: e.target.value })}
                  placeholder="مثال: تشكيلة الصيف الحصرية"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الوصف الفرعي</label>
                <input
                  type="text"
                  value={editingBanner.subtitleAr || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitleAr: e.target.value })}
                  placeholder="مثال: خامات قطنية تركية فاخرة بأفضل الأسعار"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">رابط صورة البانر</label>
                <input
                  type="text"
                  value={editingBanner.image || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-sans"
                />
              </div>

              {/* Link Target Configuration */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                <label className="block text-xs font-black text-neutral-900">ربط وتوجيه البانر عند النقر:</label>
                <select
                  value={editingBanner.targetType || "category"}
                  onChange={(e) => setEditingBanner({ ...editingBanner, targetType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                >
                  <option value="category">🗂️ توجيه إلى قسم رئيسي</option>
                  <option value="offer_category">🏷️ توجيه إلى قسم عروض</option>
                  <option value="product">👕 فتح صفحة منتج محدد مباشرة</option>
                </select>

                {editingBanner.targetType === "category" && (
                  <select
                    value={editingBanner.targetCategory || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                  >
                    {adminData.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr || c.name}
                      </option>
                    ))}
                  </select>
                )}

                {editingBanner.targetType === "offer_category" && (
                  <select
                    value={editingBanner.targetOfferCategory || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetOfferCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                  >
                    {adminData.offerCategories.map((oc) => (
                      <option key={oc.id} value={oc.id}>
                        {oc.nameAr || oc.name}
                      </option>
                    ))}
                  </select>
                )}

                {editingBanner.targetType === "product" && (
                  <select
                    value={editingBanner.targetProduct || ""}
                    onChange={(e) => setEditingBanner({ ...editingBanner, targetProduct: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white outline-none"
                  >
                    {adminData.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titleAr || p.title} (LE {p.price})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveBanner(editingBanner)}
                className="px-4 py-2 text-xs font-black bg-neutral-950 text-white rounded-xl hover:bg-[#dc2626]"
              >
                حفظ الشريحة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 5: INVENTORY MATRIX FORM */}
      {isInvModalOpen && editingInvProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-neutral-950">
                  مخزون: {editingInvProduct.titleAr || editingInvProduct.title}
                </h3>
                <p className="text-xs text-neutral-500">تعديل كمية كل مقاس ولون بدقة</p>
              </div>
              <button onClick={() => setIsInvModalOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(editingInvProduct.colors || []).map((col, cIdx) => (
                <div key={`inv-modal-col-${col.nameAr || col.name || ""}-${cIdx}`} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border" style={{ backgroundColor: col.hex }} />
                    <span className="text-xs font-black text-neutral-900">{col.nameAr || col.name}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(editingInvProduct.sizes || []).map((sz, szIdx) => {
                      const k = getInvKey(col.nameAr, col.name, sz);
                      const currentEntry = editingInvProduct.inventory?.[k] || { qty: 10, salePrice: editingInvProduct.price };
                      return (
                        <div key={`inv-modal-sz-${sz}-${szIdx}`} className="p-2 bg-white rounded-lg border border-neutral-200">
                          <span className="text-[10px] font-bold text-neutral-600 block">مقاس {sz}:</span>
                          <input
                            type="number"
                            min="0"
                            value={currentEntry.qty}
                            onChange={(e) => {
                              const newInv = { ...(editingInvProduct.inventory || {}) };
                              newInv[k] = {
                                ...currentEntry,
                                qty: Number(e.target.value) || 0,
                              };
                              setEditingInvProduct({ ...editingInvProduct, inventory: newInv });
                            }}
                            className="w-full px-2 py-1 text-xs rounded border border-neutral-300 outline-none font-bold"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsInvModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveInventory(editingInvProduct.inventory || {})}
                className="px-4 py-2 text-xs font-black bg-neutral-950 text-white rounded-xl hover:bg-[#dc2626]"
              >
                حفظ المخزون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 6: COUPON FORM */}
      {isCouponModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4 text-start animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-neutral-950">إضافة / تعديل كود خصم</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">كود الخصم (الكوبون) *</label>
                <input
                  type="text"
                  value={editingCoupon.code || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: SOTRA20"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none uppercase font-brand font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">نوع الخصم</label>
                <select
                  value={editingCoupon.type}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ نقدي ثابت (ج.م)</option>
                  <option value="free_shipping">🚚 شحن مجاني</option>
                </select>
              </div>

              {editingCoupon.type !== "free_shipping" && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">قيمة الخصم</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCoupon.value}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none font-brand"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">وصف الكوبون</label>
                <input
                  type="text"
                  value={editingCoupon.descriptionAr || ""}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, descriptionAr: e.target.value })}
                  placeholder="مثال: خصم 20% على إجمالي المشتريات"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-coupon-active"
                  checked={editingCoupon.isActive}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 cursor-pointer"
                />
                <label htmlFor="chk-coupon-active" className="text-xs font-bold text-neutral-800 cursor-pointer">
                  الكود مفعّل وجاهز للاستخدام
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleSaveCoupon(editingCoupon)}
                className="px-4 py-2 text-xs font-black bg-neutral-950 text-white rounded-xl hover:bg-[#dc2626]"
              >
                حفظ الكود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
