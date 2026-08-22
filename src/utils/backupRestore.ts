import * as XLSX from "xlsx";
import {
  AdminData,
  Order,
  Product,
  Category,
  BannerSlide,
  OfferCategory,
  PromoCode,
  FooterConfig,
  SplashScreenConfig,
  PaymentConfig,
  Governorate,
  ColorVariant,
} from "../types";
import {
  DEFAULT_PAYMENT_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_SPLASH_CONFIG,
  EGYPTIAN_GOVERNORATES,
  SOTRA_PRODUCT_PLACEHOLDER,
  SOTRA_CATEGORY_PLACEHOLDER,
  SOTRA_OFFER_PLACEHOLDER,
  SOTRA_BANNER_PLACEHOLDER,
  sanitizeImageUrl,
  normalizeProduct,
} from "./storage";

export interface BackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  timestamp: number;
  data: {
    products?: Product[];
    categories?: Category[];
    offerCategories?: OfferCategory[];
    banners?: BannerSlide[];
    coupons?: PromoCode[];
    governorates?: Governorate[];
    paymentConfig?: PaymentConfig;
    footerConfig?: FooterConfig;
    splashScreenConfig?: SplashScreenConfig;
    orders?: Order[];
  };
  stats: {
    productsCount: number;
    categoriesCount: number;
    offerCategoriesCount: number;
    bannersCount: number;
    couponsCount: number;
    hasGovernorates: boolean;
    hasPaymentConfig: boolean;
    hasFooterConfig: boolean;
    hasSplashScreenConfig: boolean;
    ordersCount: number;
  };
}

export interface LocalSnapshot {
  id: string;
  name: string;
  createdAt: string;
  timestamp: number;
  stats: {
    productsCount: number;
    categoriesCount: number;
    bannersCount: number;
    ordersCount: number;
  };
  payload: BackupPayload;
}

const SNAPSHOTS_STORAGE_KEY = "sotra_snapshots_v1";

/**
 * Trigger download of any text / JSON / CSV content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  downloadBlob(blob, filename);
}

/**
 * Trigger download of Blob (used for Excel .xlsx binary)
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate full backup JSON object
 */
export function generateFullBackupPayload(adminData: AdminData, orders: Order[] = []): BackupPayload {
  const now = new Date();
  return {
    version: "2.0.0",
    appName: "SOTRA FASHION",
    exportedAt: now.toISOString(),
    timestamp: now.getTime(),
    data: {
      products: adminData.products || [],
      categories: adminData.categories || [],
      offerCategories: adminData.offerCategories || [],
      banners: adminData.banners || [],
      coupons: adminData.coupons || [],
      governorates: adminData.governorates || EGYPTIAN_GOVERNORATES,
      paymentConfig: adminData.paymentConfig || DEFAULT_PAYMENT_CONFIG,
      footerConfig: adminData.footerConfig || DEFAULT_FOOTER_CONFIG,
      splashScreenConfig: adminData.splashScreenConfig || DEFAULT_SPLASH_CONFIG,
      orders: orders || [],
    },
    stats: {
      productsCount: adminData.products?.length || 0,
      categoriesCount: adminData.categories?.length || 0,
      offerCategoriesCount: adminData.offerCategories?.length || 0,
      bannersCount: adminData.banners?.length || 0,
      couponsCount: adminData.coupons?.length || 0,
      hasGovernorates: Boolean(adminData.governorates && adminData.governorates.length > 0),
      hasPaymentConfig: Boolean(adminData.paymentConfig),
      hasFooterConfig: Boolean(adminData.footerConfig),
      hasSplashScreenConfig: Boolean(adminData.splashScreenConfig),
      ordersCount: orders?.length || 0,
    },
  };
}

/**
 * Download Full Store Backup JSON
 */
export function exportFullBackupJSON(adminData: AdminData, orders: Order[] = []) {
  const payload = generateFullBackupPayload(adminData, orders);
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `sotra_fashion_full_backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;
  downloadFile(JSON.stringify(payload, null, 2), filename, "application/json");
}

/**
 * Export Products to Microsoft Excel (.xlsx) with both Product Catalog and Variant Stock Matrix sheets
 */
export function exportProductsToExcel(products: Product[], categories: Category[] = []) {
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.nameAr || c.name));

  // Sheet 1: Main Product Catalog Rows
  const catalogRows = products.map((p) => {
    const catName = catMap.get(p.category) || p.category || "";

    // Serialize colors: "Name:Hex:ImageUrl"
    const colorFormatted = (p.colors || [])
      .map((c) => {
        const name = c.nameAr || c.name || "لون";
        const hex = c.hex || "#111111";
        const img = c.image || "";
        return `${name}:${hex}:${img}`;
      })
      .join(" | ");

    const sizesFormatted = (p.sizes || []).join(", ");
    const mainImg = p.colors?.[0]?.image || "";

    // Build inventory breakdown string: "Color:Size:Qty"
    const safeColors = p.colors && p.colors.length > 0
      ? p.colors
      : [{ name: "Default", nameAr: "افتراضي", hex: "#111111", image: "" }];
    const safeSizes = p.sizes && p.sizes.length > 0 ? p.sizes : ["L"];

    const variantInvParts: string[] = [];
    let totalStockQty = 0;

    safeColors.forEach((col) => {
      const colName = col.nameAr || col.name || "افتراضي";
      safeSizes.forEach((sz) => {
        const kPrimary = `${col.nameAr || col.name || "default"}_${sz || "L"}`;
        const kEng = col.name ? `${col.name.trim()}__${sz.trim()}` : "";
        const kAr = col.nameAr ? `${col.nameAr.trim()}__${sz.trim()}` : "";

        let qty = 10;
        if (p.inventory && p.inventory[kPrimary] && typeof p.inventory[kPrimary].qty === "number") {
          qty = p.inventory[kPrimary].qty;
        } else if (p.inventory && kEng && p.inventory[kEng] && typeof p.inventory[kEng].qty === "number") {
          qty = p.inventory[kEng].qty;
        } else if (p.inventory && kAr && p.inventory[kAr] && typeof p.inventory[kAr].qty === "number") {
          qty = p.inventory[kAr].qty;
        } else if (p.inStock === false) {
          qty = 0;
        }

        totalStockQty += qty;
        variantInvParts.push(`${colName}:${sz}:${qty}`);
      });
    });

    return {
      "المعرف (ID)": p.id,
      "اسم المنتج بالعربية": p.titleAr || p.title,
      "اسم المنتج بالإنجليزية": p.title || p.titleAr,
      "القسم الرئيسي": catName,
      "قسم العروض": p.offerCategory || "",
      "سعر البيع (ج.م)": Number(p.price) || 0,
      "سعر الجملة (ج.م)": p.wholesalePrice !== undefined && p.wholesalePrice !== null ? Number(p.wholesalePrice) : "",
      "السعر قبل الخصم (ج.م)": p.originalPrice ? Number(p.originalPrice) : "",
      "نسبة الخصم %": p.discountPercent ? Number(p.discountPercent) : "",
      "الخامة": p.fabricAr || p.fabric || "",
      "القصة والموديل": p.fitAr || p.fit || "أوفر سايز",
      "متوفر بالمخزون": p.inStock ? "نعم" : "لا",
      "إجمالي كمية المخزون": totalStockQty,
      "المقاسات (مفصولة بفاصلة)": sizesFormatted,
      "الألوان (الاسم:كود_اللون:رابط_الصورة)": colorFormatted,
      "توزيع كميات المخزون (اللون:المقاس:العدد)": variantInvParts.join(" | "),
      "رابط الصورة الرئيسية": mainImg,
      "الشارة المميزة": p.badge?.textAr || p.badge?.text || "",
      "وصف المنتج": p.descriptionAr || p.description || "",
    };
  });

  // Sheet 2: Matrix of individual variants (1 row per Color + Size combination)
  const variantRows: any[] = [];
  products.forEach((p) => {
    const catName = catMap.get(p.category) || p.category || "";
    const safeColors = p.colors && p.colors.length > 0
      ? p.colors
      : [{ name: "Default", nameAr: "افتراضي", hex: "#111111", image: "" }];
    const safeSizes = p.sizes && p.sizes.length > 0 ? p.sizes : ["L"];

    safeColors.forEach((col) => {
      const colName = col.nameAr || col.name || "افتراضي";
      safeSizes.forEach((sz) => {
        const kPrimary = `${col.nameAr || col.name || "default"}_${sz || "L"}`;
        const kEng = col.name ? `${col.name.trim()}__${sz.trim()}` : "";
        const kAr = col.nameAr ? `${col.nameAr.trim()}__${sz.trim()}` : "";

        let qty = 10;
        let wholesalePrice = Number(p.wholesalePrice) || 0;
        let salePrice = Number(p.price) || 0;

        if (p.inventory && p.inventory[kPrimary]) {
          qty = typeof p.inventory[kPrimary].qty === "number" ? p.inventory[kPrimary].qty : 10;
          if (p.inventory[kPrimary].wholesalePrice !== undefined) wholesalePrice = Number(p.inventory[kPrimary].wholesalePrice);
          if (p.inventory[kPrimary].salePrice !== undefined) salePrice = Number(p.inventory[kPrimary].salePrice);
        } else if (p.inventory && kEng && p.inventory[kEng]) {
          qty = typeof p.inventory[kEng].qty === "number" ? p.inventory[kEng].qty : 10;
          if (p.inventory[kEng].wholesalePrice !== undefined) wholesalePrice = Number(p.inventory[kEng].wholesalePrice);
          if (p.inventory[kEng].salePrice !== undefined) salePrice = Number(p.inventory[kEng].salePrice);
        } else if (p.inventory && kAr && p.inventory[kAr]) {
          qty = typeof p.inventory[kAr].qty === "number" ? p.inventory[kAr].qty : 10;
          if (p.inventory[kAr].wholesalePrice !== undefined) wholesalePrice = Number(p.inventory[kAr].wholesalePrice);
          if (p.inventory[kAr].salePrice !== undefined) salePrice = Number(p.inventory[kAr].salePrice);
        } else if (p.inStock === false) {
          qty = 0;
        }

        variantRows.push({
          "معرف المنتج (Product ID)": p.id,
          "اسم المنتج بالعربية": p.titleAr || p.title,
          "القسم الرئيسي": catName,
          "اللون": colName,
          "كود اللون (Hex)": col.hex || "#111111",
          "رابط صورة اللون": col.image || "",
          "المقاس": sz,
          "الكمية المتوفرة (العدد)": qty,
          "سعر البيع (ج.م)": salePrice,
          "سعر التكلفة (ج.م)": wholesalePrice > 0 ? wholesalePrice : "",
        });
      });
    });
  });

  const wb = XLSX.utils.book_new();

  // 1. Append Products Catalog Sheet
  const wsCatalog = XLSX.utils.json_to_sheet(catalogRows);
  wsCatalog["!cols"] = [
    { wch: 22 }, // ID
    { wch: 30 }, // Title AR
    { wch: 25 }, // Title EN
    { wch: 18 }, // Category
    { wch: 16 }, // Offer Category
    { wch: 15 }, // Price
    { wch: 15 }, // Wholesale Price
    { wch: 18 }, // Original Price
    { wch: 14 }, // Discount
    { wch: 20 }, // Fabric
    { wch: 16 }, // Fit
    { wch: 15 }, // InStock
    { wch: 18 }, // Total Stock Qty
    { wch: 22 }, // Sizes
    { wch: 40 }, // Colors
    { wch: 45 }, // Variant inventory string
    { wch: 35 }, // Image
    { wch: 16 }, // Badge
    { wch: 45 }, // Description
  ];
  XLSX.utils.book_append_sheet(wb, wsCatalog, "منتجات_المتجر");

  // 2. Append Detailed Variant Stock Matrix Sheet
  const wsVariants = XLSX.utils.json_to_sheet(variantRows);
  wsVariants["!cols"] = [
    { wch: 22 }, // Product ID
    { wch: 28 }, // Title AR
    { wch: 18 }, // Category
    { wch: 18 }, // Color
    { wch: 16 }, // Hex
    { wch: 35 }, // Image URL
    { wch: 12 }, // Size
    { wch: 20 }, // Stock Qty
    { wch: 16 }, // Sale Price
    { wch: 16 }, // Cost
  ];
  XLSX.utils.book_append_sheet(wb, wsVariants, "مخزون_المقاسات_والألوان");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const dateStr = new Date().toISOString().split("T")[0];
  downloadBlob(blob, `sotra_products_inventory_${dateStr}.xlsx`);
}

/**
 * Export Orders to Microsoft Excel (.xlsx)
 */
export function exportOrdersToExcel(orders: Order[]) {
  const excelRows = orders.map((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.titleAr || it.title} (${it.selectedColor?.nameAr || ""}-${it.selectedSize}) x${it.quantity}`)
      .join(" | ");

    return {
      "رقم الطلب": o.orderId,
      "تاريخ الإنشاء": o.createdAt,
      "اسم العميل": o.customer?.fullName || "",
      "رقم الهاتف": o.customer?.phoneNumber || "",
      "المحافظة": o.governorateNameAr || o.customer?.governorateId || "",
      "العنوان بالتفصيل": o.customer?.detailedAddress || "",
      "طريقة الدفع": o.customer?.paymentMethod === "vodafone_cash" ? "فودافون كاش / إنستاباي" : "الدفع عند الاستلام",
      "حالة الطلب": o.trackingStatus,
      "عدد القطع": o.items?.length || 0,
      "تفاصيل المنتجات": itemsSummary,
      "إجمالي الطلب (ج.م)": o.total,
      "تكلفة الشحن (ج.م)": o.shippingCost,
      "كود الخصم المطبق": o.appliedCouponCode || "",
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelRows);
  ws["!cols"] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 25 },
    { wch: 16 },
    { wch: 16 },
    { wch: 35 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 45 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "طلبات_العملاء");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const dateStr = new Date().toISOString().split("T")[0];
  downloadBlob(blob, `sotra_orders_${dateStr}.xlsx`);
}

/**
 * Download a starter Excel Template (.xlsx) for adding new products and stock quantities per color and size
 */
export function exportProductsExcelTemplate() {
  const sampleCatalogRows = [
    {
      "المعرف (ID)": "sotra-prod-sample-1",
      "اسم المنتج بالعربية": "قميص كتان ملكي أوفر سايز",
      "اسم المنتج بالإنجليزية": "Royal Linen Oversized Shirt",
      "القسم الرئيسي": "shirts",
      "قسم العروض": "summer_sale",
      "سعر البيع (ج.م)": 650,
      "سعر الجملة (ج.م)": 380,
      "السعر قبل الخصم (ج.م)": 850,
      "نسبة الخصم %": 24,
      "الخامة": "كتان تركي 100% فاخر",
      "القصة والموديل": "أوفر سايز مريح",
      "متوفر بالمخزون": "نعم",
      "إجمالي كمية المخزون": 70,
      "المقاسات (مفصولة بفاصلة)": "M, L, XL, 2XL",
      "الألوان (الاسم:كود_اللون:رابط_الصورة)": "أبيض:#ffffff:https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80 | أسود:#111111:https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80",
      "توزيع كميات المخزون (اللون:المقاس:العدد)": "أبيض:M:10 | أبيض:L:15 | أبيض:XL:10 | أبيض:2XL:5 | أسود:M:8 | أسود:L:12 | أسود:XL:7 | أسود:2XL:3",
      "رابط الصورة الرئيسية": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80",
      "الشارة المميزة": "جديد",
      "وصف المنتج": "قميص صيفي أنيق ومميز مصنوع من أجود خيوط الكتان الطبيعي بأعلى مواصفات التشطيب والتقفيل.",
    },
    {
      "المعرف (ID)": "sotra-prod-sample-2",
      "اسم المنتج بالعربية": "بنطلون جبردين كارجو ستريت",
      "اسم المنتج بالإنجليزية": "Cargo Gabardine Straight Pants",
      "القسم الرئيسي": "pants",
      "قسم العروض": "",
      "سعر البيع (ج.م)": 580,
      "سعر الجملة (ج.م)": 320,
      "السعر قبل الخصم (ج.م)": "",
      "نسبة الخصم %": "",
      "الخامة": "جبردين قطني معالج",
      "القصة والموديل": "ستريت فيت",
      "متوفر بالمخزون": "نعم",
      "إجمالي كمية المخزون": 45,
      "المقاسات (مفصولة بفاصلة)": "30, 32, 34, 36, 38",
      "الألوان (الاسم:كود_اللون:رابط_الصورة)": "بيج:#d2b48c:https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop&q=80 | زيتي:#556b2f: | كحلي:#000080:",
      "توزيع كميات المخزون (اللون:المقاس:العدد)": "بيج:30:5 | بيج:32:5 | بيج:34:5 | زيتي:32:10 | زيتي:34:10 | كحلي:34:10",
      "رابط الصورة الرئيسية": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop&q=80",
      "الشارة المميزة": "الأكثر مبيعاً",
      "وصف المنتج": "بنطلون كارجو متعدد الجيوب بجودة استثنائية وألوان ثابتة ومريحة طوال اليوم.",
    },
  ];

  const sampleVariantRows = [
    {
      "معرف المنتج (Product ID)": "sotra-prod-sample-1",
      "اسم المنتج بالعربية": "قميص كتان ملكي أوفر سايز",
      "القسم الرئيسي": "shirts",
      "اللون": "أبيض",
      "كود اللون (Hex)": "#ffffff",
      "رابط صورة اللون": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80",
      "المقاس": "M",
      "الكمية المتوفرة (العدد)": 10,
      "سعر البيع (ج.م)": 650,
      "سعر التكلفة (ج.م)": 380,
    },
    {
      "معرف المنتج (Product ID)": "sotra-prod-sample-1",
      "اسم المنتج بالعربية": "قميص كتان ملكي أوفر سايز",
      "القسم الرئيسي": "shirts",
      "اللون": "أبيض",
      "كود اللون (Hex)": "#ffffff",
      "رابط صورة اللون": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80",
      "المقاس": "L",
      "الكمية المتوفرة (العدد)": 15,
      "سعر البيع (ج.م)": 650,
      "سعر التكلفة (ج.م)": 380,
    },
    {
      "معرف المنتج (Product ID)": "sotra-prod-sample-1",
      "اسم المنتج بالعربية": "قميص كتان ملكي أوفر سايز",
      "القسم الرئيسي": "shirts",
      "اللون": "أسود",
      "كود اللون (Hex)": "#111111",
      "رابط صورة اللون": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80",
      "المقاس": "M",
      "الكمية المتوفرة (العدد)": 8,
      "سعر البيع (ج.م)": 650,
      "سعر التكلفة (ج.م)": 380,
    },
    {
      "معرف المنتج (Product ID)": "sotra-prod-sample-1",
      "اسم المنتج بالعربية": "قميص كتان ملكي أوفر سايز",
      "القسم الرئيسي": "shirts",
      "اللون": "أسود",
      "كود اللون (Hex)": "#111111",
      "رابط صورة اللون": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=900&auto=format&fit=crop&q=80",
      "المقاس": "L",
      "الكمية المتوفرة (العدد)": 12,
      "سعر البيع (ج.م)": 650,
      "سعر التكلفة (ج.م)": 380,
    },
  ];

  const wb = XLSX.utils.book_new();

  const wsCatalog = XLSX.utils.json_to_sheet(sampleCatalogRows);
  wsCatalog["!cols"] = [
    { wch: 22 },
    { wch: 30 },
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 16 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
    { wch: 40 },
    { wch: 45 },
    { wch: 35 },
    { wch: 16 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCatalog, "نموذج_إضافة_المنتجات");

  const wsVariants = XLSX.utils.json_to_sheet(sampleVariantRows);
  wsVariants["!cols"] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 35 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVariants, "توزيع_مخزون_المقاسات_والألوان");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, "sotra_products_excel_template.xlsx");
}

/**
 * Export Products to CSV (Compatible with Microsoft Excel / Google Sheets)
 */
export function exportProductsToCSV(products: Product[], categories: Category[] = []) {
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.nameAr || c.name));

  const headers = [
    "ID (المعرف)",
    "Title_AR (اسم المنتج بالعربية)",
    "Title_EN (اسم المنتج بالإنجليزية)",
    "Category (القسم)",
    "OfferCategory (قسم العرض)",
    "Price (السعر الحالي)",
    "WholesalePrice (سعر الجملة)",
    "OriginalPrice (السعر الأصلي قبل الخصم)",
    "DiscountPercent (نسبة الخصم %)",
    "Fabric_AR (الخامة)",
    "InStock (متوفر بالمخزون)",
    "Colors (الألوان المتاحة)",
    "Sizes (المقاسات)",
    "Description_AR (الوصف)",
  ];

  const escapeCSV = (str: any): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = products.map((p) => {
    const catName = catMap.get(p.category) || p.category || "";
    const colorNames = (p.colors || []).map((c) => c.nameAr || c.name).join(" | ");
    const sizes = (p.sizes || []).join(" | ");
    return [
      escapeCSV(p.id),
      escapeCSV(p.titleAr || p.title),
      escapeCSV(p.title || p.titleAr),
      escapeCSV(catName),
      escapeCSV(p.offerCategory || ""),
      escapeCSV(p.price),
      escapeCSV(p.wholesalePrice || ""),
      escapeCSV(p.originalPrice || ""),
      escapeCSV(p.discountPercent || ""),
      escapeCSV(p.fabricAr || p.fabric || ""),
      escapeCSV(p.inStock ? "نعم" : "لا"),
      escapeCSV(colorNames),
      escapeCSV(sizes),
      escapeCSV(p.descriptionAr || p.description || ""),
    ].join(",");
  });

  // Prepend UTF-8 BOM so Excel opens Arabic text correctly
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];
  downloadFile(csvContent, `sotra_products_${dateStr}.csv`, "text/csv");
}

/**
 * Export Orders to CSV
 */
export function exportOrdersToCSV(orders: Order[]) {
  const headers = [
    "رقم الطلب (Order ID)",
    "تاريخ الإنشاء (Created At)",
    "اسم العميل (Customer Name)",
    "رقم الهاتف (Phone)",
    "المحافظة (Governorate)",
    "العنوان بالتفصيل (Address)",
    "طريقة الدفع (Payment Method)",
    "حالة الطلب (Status)",
    "عدد المنتجات (Items Count)",
    "تفاصيل المنتجات (Products Summary)",
    "إجمالي الطلب (Total EGP)",
    "تكلفة الشحن (Shipping EGP)",
    "كود الخصم (Coupon)",
  ];

  const escapeCSV = (str: any): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = orders.map((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.titleAr || it.title} (${it.selectedColor?.nameAr || ""}-${it.selectedSize}) x${it.quantity}`)
      .join(" | ");

    return [
      escapeCSV(o.orderId),
      escapeCSV(o.createdAt),
      escapeCSV(o.customer?.fullName || ""),
      escapeCSV(o.customer?.phoneNumber || ""),
      escapeCSV(o.governorateNameAr || o.customer?.governorateId || ""),
      escapeCSV(o.customer?.detailedAddress || ""),
      escapeCSV(o.customer?.paymentMethod === "vodafone_cash" ? "فودافون كاش" : "الدفع عند الاستلام"),
      escapeCSV(o.trackingStatus),
      escapeCSV(o.items?.length || 0),
      escapeCSV(itemsSummary),
      escapeCSV(o.total),
      escapeCSV(o.shippingCost),
      escapeCSV(o.appliedCouponCode || ""),
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const dateStr = new Date().toISOString().split("T")[0];
  downloadFile(csvContent, `sotra_orders_${dateStr}.csv`, "text/csv");
}

/**
 * Export Selective Entities
 */
export function exportSelectiveEntities(type: string, data: any) {
  const dateStr = new Date().toISOString().split("T")[0];
  const payload = {
    type,
    appName: "SOTRA FASHION",
    exportedAt: new Date().toISOString(),
    data,
  };
  downloadFile(JSON.stringify(payload, null, 2), `sotra_${type}_${dateStr}.json`, "application/json");
}

/**
 * Robust Product Normalizer for JSON Import
 */
export function normalizeImportedProduct(raw: any, index: number = 0): Product {
  if (!raw || typeof raw !== "object") {
    return normalizeProduct({ id: `prod-${Date.now()}-${index}`, title: "منتج جديد", price: 0 });
  }

  const id = String(raw.id || raw.productId || raw._id || `sotra-prod-${Date.now()}-${index}`);
  const title = String(raw.title || raw.name || raw.titleAr || "منتج سترة");
  const titleAr = String(raw.titleAr || raw.arabicTitle || raw.nameAr || raw.name || title);
  const price = Number(raw.price || raw.unitPrice || raw.cost || 0);
  const wholesalePrice = raw.wholesalePrice !== undefined && raw.wholesalePrice !== null ? Number(raw.wholesalePrice) : undefined;
  const originalPrice = raw.originalPrice ? Number(raw.originalPrice) : undefined;

  let colors: ColorVariant[] = [];
  if (Array.isArray(raw.colors) && raw.colors.length > 0) {
    colors = raw.colors.map((c: any, cIdx: number) => ({
      name: String(c.name || c.colorName || `Color ${cIdx + 1}`),
      nameAr: String(c.nameAr || c.colorNameAr || c.name || `لون ${cIdx + 1}`),
      hex: String(c.hex || c.colorCode || "#111111"),
      image: sanitizeImageUrl(c.image || raw.image || raw.imageUrl || raw.thumbnail, SOTRA_PRODUCT_PLACEHOLDER),
      backImage: c.backImage ? sanitizeImageUrl(c.backImage, SOTRA_PRODUCT_PLACEHOLDER) : undefined,
    }));
  } else if (raw.image || raw.imageUrl || raw.thumbnail) {
    colors = [
      {
        name: "Default",
        nameAr: "اللون الأساسي",
        hex: "#111111",
        image: sanitizeImageUrl(raw.image || raw.imageUrl || raw.thumbnail, SOTRA_PRODUCT_PLACEHOLDER),
      },
    ];
  } else {
    colors = [
      {
        name: "Black",
        nameAr: "أسود",
        hex: "#111111",
        image: SOTRA_PRODUCT_PLACEHOLDER,
      },
    ];
  }

  const sizes = Array.isArray(raw.sizes) && raw.sizes.length > 0 ? raw.sizes.map(String) : ["S", "M", "L", "XL", "2XL"];

  return normalizeProduct({
    ...raw,
    id,
    title,
    titleAr,
    price,
    wholesalePrice,
    originalPrice,
    colors,
    sizes,
    category: String(raw.category || raw.categoryId || "all"),
    offerCategory: raw.offerCategory ? String(raw.offerCategory) : undefined,
    fabric: raw.fabric || "Premium Cotton",
    fabricAr: raw.fabricAr || "قطن مصري 100%",
    fit: raw.fit || "oversized",
    description: raw.description || "",
    descriptionAr: raw.descriptionAr || raw.description || "",
    inStock: raw.inStock !== false,
    isNew: Boolean(raw.isNew),
    isBestseller: Boolean(raw.isBestseller),
    inventory: raw.inventory && typeof raw.inventory === "object" ? raw.inventory : {},
  });
}

/**
 * Helper to parse color variant string
 */
function parseColorVariants(rawColors: any, mainImg: string): ColorVariant[] {
  let colors: ColorVariant[] = [];

  if (typeof rawColors === "string" && rawColors.trim()) {
    const colorParts = rawColors.split(/[,|،]+/).map((s: string) => s.trim()).filter(Boolean);
    colors = colorParts.map((part: string, cIdx: number) => {
      const segments = part.split(":");
      if (segments.length >= 3) {
        return {
          name: segments[0].trim() || `Color ${cIdx + 1}`,
          nameAr: segments[0].trim() || `لون ${cIdx + 1}`,
          hex: segments[1].trim() || "#111111",
          image: sanitizeImageUrl(segments.slice(2).join(":").trim() || mainImg, SOTRA_PRODUCT_PLACEHOLDER),
        };
      } else if (segments.length === 2) {
        const isHex = segments[1].trim().startsWith("#");
        return {
          name: segments[0].trim() || `Color ${cIdx + 1}`,
          nameAr: segments[0].trim() || `لون ${cIdx + 1}`,
          hex: isHex ? segments[1].trim() : "#111111",
          image: sanitizeImageUrl(!isHex ? segments[1].trim() : mainImg, SOTRA_PRODUCT_PLACEHOLDER),
        };
      } else {
        return {
          name: part || `Color ${cIdx + 1}`,
          nameAr: part || `لون ${cIdx + 1}`,
          hex: "#111111",
          image: sanitizeImageUrl(mainImg, SOTRA_PRODUCT_PLACEHOLDER),
        };
      }
    });
  } else if (Array.isArray(rawColors) && rawColors.length > 0) {
    colors = rawColors.map((c: any, cIdx: number) => ({
      name: String(c.name || c.colorName || `Color ${cIdx + 1}`),
      nameAr: String(c.nameAr || c.colorNameAr || c.name || `لون ${cIdx + 1}`),
      hex: String(c.hex || c.colorCode || "#111111"),
      image: sanitizeImageUrl(c.image || mainImg, SOTRA_PRODUCT_PLACEHOLDER),
      backImage: c.backImage ? sanitizeImageUrl(c.backImage, SOTRA_PRODUCT_PLACEHOLDER) : undefined,
    }));
  }

  if (colors.length === 0) {
    colors = [
      {
        name: "Default",
        nameAr: "اللون الأساسي",
        hex: "#111111",
        image: sanitizeImageUrl(mainImg, SOTRA_PRODUCT_PLACEHOLDER),
      },
    ];
  }

  return colors;
}

/**
 * Parse inline inventory string format like:
 * "أبيض:M:10 | أبيض:L:15 | أسود:M:8 | أسود:L:12"
 * or "Black:M:10, Black:L:15"
 * or "أبيض_M=10; أسود_L=15"
 */
function parseInlineInventoryString(invStr: string, defaultRetail: number = 0, defaultWholesale: number = 0): Record<string, { qty: number; wholesalePrice?: number; salePrice?: number }> {
  const result: Record<string, { qty: number; wholesalePrice?: number; salePrice?: number }> = {};
  if (!invStr || typeof invStr !== "string") return result;

  const entries = invStr.split(/[,|;،\n]+/).map((s) => s.trim()).filter(Boolean);
  for (const entry of entries) {
    // Try matching formats: "Color:Size:Qty" or "Color:Size:Qty:Cost" or "Color_Size=Qty" or "Color-Size: Qty"
    const colonParts = entry.split(":");
    if (colonParts.length >= 3) {
      const col = colonParts[0].trim();
      const sz = colonParts[1].trim();
      const qty = Math.max(0, parseInt(colonParts[2].trim(), 10) || 0);
      const cost = colonParts[3] ? Number(colonParts[3].trim()) : defaultWholesale;
      if (col && sz) {
        const item = { qty, wholesalePrice: cost || defaultWholesale, salePrice: defaultRetail };
        result[`${col}_${sz}`] = item;
        result[`${col}__${sz}`] = item;
      }
    } else if (colonParts.length === 2) {
      // Could be "Color_Size: 10" or "Size: 10"
      const left = colonParts[0].trim();
      const qty = Math.max(0, parseInt(colonParts[1].trim(), 10) || 0);
      const subParts = left.split(/[_\-\/]/);
      if (subParts.length >= 2) {
        const col = subParts[0].trim();
        const sz = subParts[1].trim();
        const item = { qty, wholesalePrice: defaultWholesale, salePrice: defaultRetail };
        result[`${col}_${sz}`] = item;
        result[`${col}__${sz}`] = item;
      } else {
        // Assume default color
        const sz = left;
        const item = { qty, wholesalePrice: defaultWholesale, salePrice: defaultRetail };
        result[`افتراضي_${sz}`] = item;
        result[`Default__${sz}`] = item;
      }
    } else {
      // Try '=' format e.g. "Color_Size=10"
      const eqParts = entry.split("=");
      if (eqParts.length === 2) {
        const left = eqParts[0].trim();
        const qty = Math.max(0, parseInt(eqParts[1].trim(), 10) || 0);
        const subParts = left.split(/[_\-\/:]/);
        if (subParts.length >= 2) {
          const col = subParts[0].trim();
          const sz = subParts[1].trim();
          const item = { qty, wholesalePrice: defaultWholesale, salePrice: defaultRetail };
          result[`${col}_${sz}`] = item;
          result[`${col}__${sz}`] = item;
        }
      }
    }
  }

  return result;
}

/**
 * Parse Excel (.xlsx, .xls) or CSV file into normalized Product array with complete variant stock
 */
export async function parseExcelOrCsvFile(file: File): Promise<{
  success: boolean;
  error?: string;
  products?: Product[];
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, error: "ملف الإكسيل فارغ ولا يحتوي على أي شيت." };
    }

    // 1. Identify Sheets: Catalog Sheet and Variants/Inventory Sheet
    let catalogSheetName = workbook.SheetNames[0];
    let variantSheetName: string | null = null;

    for (const sName of workbook.SheetNames) {
      const lower = sName.toLowerCase();
      if (
        lower.includes("مخزون") ||
        lower.includes("المخزون") ||
        lower.includes("inventory") ||
        lower.includes("variants") ||
        lower.includes("variant") ||
        lower.includes("كميات")
      ) {
        variantSheetName = sName;
        break;
      }
    }

    // If first sheet is specifically the variants sheet and there's a catalog sheet
    if (workbook.SheetNames.length > 1 && !variantSheetName) {
      variantSheetName = workbook.SheetNames[1];
    }

    const catalogRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[catalogSheetName], { defval: "" });

    // Optional variant sheet rows
    let variantRows: any[] = [];
    if (variantSheetName && workbook.Sheets[variantSheetName]) {
      variantRows = XLSX.utils.sheet_to_json(workbook.Sheets[variantSheetName], { defval: "" });
    }

    if ((!catalogRows || catalogRows.length === 0) && (!variantRows || variantRows.length === 0)) {
      return { success: false, error: "شيت الإكسيل فارغ لا يحتوي على أي صفوف أو بيانات منتجات." };
    }

    // Map variant rows by Product ID
    const variantMapByProdId = new Map<string, Array<{
      color: string;
      hex?: string;
      image?: string;
      size: string;
      qty: number;
      wholesalePrice?: number;
      salePrice?: number;
    }>>();

    if (variantRows && variantRows.length > 0) {
      variantRows.forEach((vr) => {
        const pId = String(
          vr["معرف المنتج (Product ID)"] ||
            vr["معرف المنتج"] ||
            vr["ID (المعرف)"] ||
            vr["المعرف (ID)"] ||
            vr["Product ID"] ||
            vr["ID"] ||
            vr["id"] ||
            ""
        ).trim();

        const colorName = String(
          vr["اللون (Color)"] ||
            vr["اللون"] ||
            vr["Color"] ||
            vr["color"] ||
            "افتراضي"
        ).trim();

        const hex = String(vr["كود اللون (Hex)"] || vr["كود اللون"] || vr["Hex"] || vr["hex"] || "#111111").trim();
        const image = String(vr["رابط صورة اللون (Image URL)"] || vr["رابط صورة اللون"] || vr["صورة اللون"] || vr["Image"] || vr["image"] || "").trim();

        const size = String(
          vr["المقاس (Size)"] ||
            vr["المقاس"] ||
            vr["Size"] ||
            vr["size"] ||
            "L"
        ).trim();

        const rawQty = vr["الكمية المتوفرة (العدد)"] ?? vr["الكمية المتوفرة (Stock Qty)"] ?? vr["الكمية المتوفرة"] ?? vr["الكمية"] ?? vr["العدد"] ?? vr["Qty"] ?? vr["qty"] ?? vr["stock"] ?? 10;
        const qty = Math.max(0, parseInt(String(rawQty), 10) || 0);

        const rawSale = vr["سعر البيع (ج.م)"] ?? vr["سعر البيع (Sale Price)"] ?? vr["سعر البيع"] ?? vr["Sale Price"] ?? vr["price"];
        const salePrice = rawSale !== "" && rawSale !== undefined ? Number(rawSale) : undefined;

        const rawCost = vr["سعر التكلفة (ج.م)"] ?? vr["سعر التكلفة (Wholesale Cost)"] ?? vr["سعر التكلفة"] ?? vr["سعر الجملة"] ?? vr["cost"];
        const wholesalePrice = rawCost !== "" && rawCost !== undefined ? Number(rawCost) : undefined;

        if (pId) {
          const list = variantMapByProdId.get(pId) || [];
          list.push({ color: colorName, hex, image, size, qty, wholesalePrice, salePrice });
          variantMapByProdId.set(pId, list);
        }
      });
    }

    // Process Catalog Rows
    const products: Product[] = catalogRows.map((r, idx) => {
      const id = String(
        r["المعرف (ID)"] ||
          r["ID (المعرف)"] ||
          r["معرف المنتج (Product ID)"] ||
          r["ID"] ||
          r["id"] ||
          r["المعرف"] ||
          r["كود المنتج"] ||
          `sotra-prod-${Date.now()}-${idx}`
      ).trim();

      const titleAr = String(
        r["اسم المنتج بالعربية"] ||
          r["Title_AR (اسم المنتج بالعربية)"] ||
          r["اسم المنتج"] ||
          r["الاسم بالعربية"] ||
          r["titleAr"] ||
          r["title_ar"] ||
          r["الاسم"] ||
          r["Title"] ||
          `منتج ${idx + 1}`
      ).trim();

      const title = String(
        r["اسم المنتج بالإنجليزية"] ||
          r["Title_EN (اسم المنتج بالإنجليزية)"] ||
          r["title"] ||
          r["title_en"] ||
          titleAr
      ).trim();

      const category = String(
        r["القسم الرئيسي"] ||
          r["Category (القسم)"] ||
          r["القسم"] ||
          r["category"] ||
          r["categoryId"] ||
          "tops"
      ).trim();

      const offerCategory = String(
        r["قسم العروض"] ||
          r["OfferCategory (قسم العرض)"] ||
          r["العرض"] ||
          r["offerCategory"] ||
          ""
      ).trim();

      const price = Number(
        r["سعر البيع (ج.م)"] ||
          r["Price (السعر الحالي)"] ||
          r["السعر"] ||
          r["سعر البيع"] ||
          r["price"] ||
          0
      );

      const rawWholesale = r["سعر الجملة (ج.م)"] || r["WholesalePrice (سعر الجملة)"] || r["سعر الجملة"] || r["wholesalePrice"];
      const wholesalePrice = rawWholesale !== "" && rawWholesale !== undefined && rawWholesale !== null ? Number(rawWholesale) : 0;

      const rawOriginal = r["السعر قبل الخصم (ج.م)"] || r["OriginalPrice (السعر الأصلي قبل الخصم)"] || r["السعر قبل الخصم"] || r["originalPrice"];
      const originalPrice = rawOriginal !== "" && rawOriginal !== undefined && rawOriginal !== null ? Number(rawOriginal) : undefined;

      const rawDiscount = r["نسبة الخصم %"] || r["DiscountPercent (نسبة الخصم %)"] || r["نسبة الخصم"] || r["الخصم %"] || r["discountPercent"];
      const discountPercent = rawDiscount !== "" && rawDiscount !== undefined && rawDiscount !== null ? Number(rawDiscount) : undefined;

      const fabricAr = String(
        r["الخامة"] ||
          r["Fabric_AR (الخامة)"] ||
          r["نوع القماش"] ||
          r["fabricAr"] ||
          r["fabric"] ||
          "قطن مصري فاخر"
      ).trim();

      const fitAr = String(
        r["القصة والموديل"] ||
          r["Fit (القصة)"] ||
          r["القصة"] ||
          r["fitAr"] ||
          r["fit"] ||
          "أوفر سايز"
      ).trim();

      const rawInStock = String(r["متوفر بالمخزون"] || r["InStock (متوفر بالمخزون)"] || r["inStock"] || "نعم").trim();
      let inStock = !(
        rawInStock === "لا" ||
        rawInStock.toLowerCase() === "no" ||
        rawInStock.toLowerCase() === "false" ||
        rawInStock === "0"
      );

      const mainImg = String(
        r["رابط الصورة الرئيسية"] ||
          r["Image (رابط الصورة الرئيسية)"] ||
          r["الصورة"] ||
          r["image"] ||
          r["imageUrl"] ||
          r["thumbnail"] ||
          ""
      ).trim();

      // 2. Parse Sizes
      const rawSizes = r["المقاسات (مفصولة بفاصلة)"] || r["Sizes (المقاسات)"] || r["المقاسات"] || r["sizes"];
      let sizes: string[] = ["S", "M", "L", "XL", "2XL"];
      if (typeof rawSizes === "string" && rawSizes.trim()) {
        sizes = rawSizes
          .split(/[,|،]+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (sizes.length === 0) sizes = ["S", "M", "L", "XL", "2XL"];
      } else if (Array.isArray(rawSizes) && rawSizes.length > 0) {
        sizes = rawSizes.map(String);
      }

      // 3. Parse Colors
      const rawColors = r["الألوان (الاسم:كود_اللون:رابط_الصورة)"] || r["Colors (الألوان المتاحة)"] || r["الألوان"] || r["colors"];
      let colors: ColorVariant[] = parseColorVariants(rawColors, mainImg);

      // 4. Parse Inventory Quantities per Size and Color
      const productInventory: Record<string, { qty: number; wholesalePrice?: number; salePrice?: number }> = {};

      // A. Check for inline breakdown column
      const rawInvStr =
        r["توزيع كميات المخزون (اللون:المقاس:العدد)"] ||
        r["كميات المخزون (اللون:المقاس:العدد)"] ||
        r["كميات المخزون"] ||
        r["المخزون"] ||
        r["الكميات"] ||
        r["inventory"];

      if (rawInvStr && typeof rawInvStr === "string" && rawInvStr.trim()) {
        const inlineMap = parseInlineInventoryString(rawInvStr, price, wholesalePrice);
        Object.entries(inlineMap).forEach(([k, val]) => {
          productInventory[k] = val;
        });
      }

      // B. Check if separate Sheet 2 variants exist for this product
      const sheet2Variants = variantMapByProdId.get(id);
      if (sheet2Variants && sheet2Variants.length > 0) {
        sheet2Variants.forEach((v) => {
          const kPrimary = `${v.color}_${v.size}`;
          const item = {
            qty: v.qty,
            wholesalePrice: v.wholesalePrice !== undefined ? v.wholesalePrice : wholesalePrice,
            salePrice: v.salePrice !== undefined ? v.salePrice : price,
          };
          productInventory[kPrimary] = item;
          productInventory[`${v.color}__${v.size}`] = item;

          // Ensure color is in product's colors
          const existsCol = colors.some((c) => c.nameAr === v.color || c.name === v.color);
          if (!existsCol && v.color) {
            colors.push({
              name: v.color,
              nameAr: v.color,
              hex: v.hex || "#111111",
              image: sanitizeImageUrl(v.image || mainImg, SOTRA_PRODUCT_PLACEHOLDER),
            });
          }

          // Ensure size is in sizes
          if (v.size && !sizes.includes(v.size)) {
            sizes.push(v.size);
          }
        });
      }

      // C. Check for direct size columns (e.g. "S", "M", "L", "XL", "2XL", "كمية S", etc.)
      const standardSizesCheck = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "30", "32", "34", "36", "38"];
      standardSizesCheck.forEach((sz) => {
        const sizeVal = r[sz] !== undefined && r[sz] !== "" ? r[sz] : (r[`كمية ${sz}`] !== undefined && r[`كمية ${sz}`] !== "" ? r[`كمية ${sz}`] : undefined);
        if (sizeVal !== undefined) {
          const qty = Math.max(0, parseInt(String(sizeVal), 10) || 0);
          if (!sizes.includes(sz)) sizes.push(sz);
          colors.forEach((col) => {
            const colName = col.nameAr || col.name || "افتراضي";
            const k = `${colName}_${sz}`;
            if (productInventory[k] === undefined) {
              const item = { qty, wholesalePrice, salePrice: price };
              productInventory[k] = item;
              productInventory[`${colName}__${sz}`] = item;
            }
          });
        }
      });

      // D. If no specific inventory was found, initialize default matrix entries
      if (Object.keys(productInventory).length === 0) {
        const defaultQty = inStock ? 10 : 0;
        colors.forEach((col) => {
          const colName = col.nameAr || col.name || "افتراضي";
          sizes.forEach((sz) => {
            const k = `${colName}_${sz}`;
            const item = { qty: defaultQty, wholesalePrice, salePrice: price };
            productInventory[k] = item;
            productInventory[`${colName}__${sz}`] = item;
          });
        });
      }

      // E. Calculate total inventory count and sync inStock status
      const totalInventoryQty = Object.values(productInventory).reduce(
        (sum, item) => sum + (Number(item?.qty) || 0),
        0
      );
      if (totalInventoryQty <= 0 && rawInStock !== "نعم" && rawInStock !== "yes" && rawInStock !== "true") {
        inStock = false;
      } else if (totalInventoryQty > 0) {
        inStock = true;
      }

      // Badge
      const rawBadge = String(r["الشارة المميزة"] || r["Badge (الشارة)"] || r["شارة"] || r["badge"] || "").trim();
      let badge: { type: string; text: string; textAr: string } | undefined = undefined;
      if (rawBadge) {
        if (rawBadge.includes("جديد") || rawBadge.toLowerCase().includes("new")) {
          badge = { type: "new", text: "NEW", textAr: "جديد" };
        } else if (rawBadge.includes("خصم") || rawBadge.toLowerCase().includes("sale")) {
          badge = { type: "discount", text: "SALE", textAr: "خصم" };
        } else if (rawBadge.includes("مبيع") || rawBadge.toLowerCase().includes("best")) {
          badge = { type: "bestseller", text: "BEST SELLER", textAr: "الأكثر مبيعاً" };
        } else {
          badge = { type: "custom", text: rawBadge, textAr: rawBadge };
        }
      }

      const descriptionAr = String(r["وصف المنتج"] || r["Description_AR (الوصف)"] || r["الوصف"] || r["descriptionAr"] || r["description"] || "").trim();

      return normalizeProduct({
        id,
        title,
        titleAr,
        category,
        offerCategory: offerCategory || undefined,
        price,
        wholesalePrice,
        originalPrice,
        discountPercent,
        fabricAr,
        fabric: fabricAr,
        fitAr,
        fit: fitAr,
        inStock,
        colors,
        sizes,
        badge,
        descriptionAr,
        description: descriptionAr,
        inventory: productInventory,
      });
    });

    return {
      success: true,
      products,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `فشل قراءة ملف الإكسيل: ${err?.message || "صيغة غير مدعومة"}`,
    };
  }
}

/**
 * Parse and Validate Uploaded Backup JSON or Excel (.xlsx / .csv) File
 */
export async function parseBackupFile(file: File): Promise<{
  success: boolean;
  error?: string;
  payload?: BackupPayload;
  rawJson?: any;
}> {
  const fileNameLower = file.name.toLowerCase();

  // If it's an Excel or CSV file, route to Excel parser
  if (
    fileNameLower.endsWith(".xlsx") ||
    fileNameLower.endsWith(".xls") ||
    fileNameLower.endsWith(".csv")
  ) {
    const excelRes = await parseExcelOrCsvFile(file);
    if (!excelRes.success || !excelRes.products) {
      return { success: false, error: excelRes.error || "تعذر قراءة ملف الإكسيل." };
    }

    const payload: BackupPayload = {
      version: "2.0.0",
      appName: "SOTRA FASHION",
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      data: {
        products: excelRes.products,
      },
      stats: {
        productsCount: excelRes.products.length,
        categoriesCount: 0,
        offerCategoriesCount: 0,
        bannersCount: 0,
        couponsCount: 0,
        hasGovernorates: false,
        hasPaymentConfig: false,
        hasFooterConfig: false,
        hasSplashScreenConfig: false,
        ordersCount: 0,
      },
    };

    return {
      success: true,
      payload,
    };
  }

  // Otherwise handle as standard JSON
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = (e.target?.result as string || "").trim();
        // Remove UTF-8 BOM if present
        text = text.replace(/^\uFEFF/, "");

        if (!text) {
          return resolve({ success: false, error: "الملف فارغ لا يحتوي على أي بيانات." });
        }

        const parsed = JSON.parse(text);

        let rawProductsList: any[] | undefined;
        let rawCategoriesList: any[] | undefined;
        let rawOfferCategoriesList: any[] | undefined;
        let rawBannersList: any[] | undefined;
        let rawCouponsList: any[] | undefined;
        let rawGovernoratesList: any[] | undefined;
        let paymentConfigObj: PaymentConfig | undefined;
        let footerConfigObj: FooterConfig | undefined;
        let splashScreenConfigObj: SplashScreenConfig | undefined;
        let rawOrdersList: any[] | undefined;

        if (Array.isArray(parsed)) {
          // It's a direct array of items
          if (parsed.length > 0) {
            const first = parsed[0];
            if (first && typeof first === "object") {
              if (first.price !== undefined || first.colors !== undefined || first.sizes !== undefined || first.fabricAr !== undefined || first.wholesalePrice !== undefined) {
                rawProductsList = parsed;
              } else if (first.icon !== undefined || (first.nameAr && !first.price)) {
                rawCategoriesList = parsed;
              } else if (first.customer !== undefined || first.orderId !== undefined) {
                rawOrdersList = parsed;
              } else if (first.code !== undefined && (first.discount !== undefined || first.percent !== undefined)) {
                rawCouponsList = parsed;
              } else if (first.image && (first.subtitle || first.cta)) {
                rawBannersList = parsed;
              } else {
                // Default fallback: treat as products
                rawProductsList = parsed;
              }
            }
          } else {
            rawProductsList = [];
          }
        } else if (parsed && typeof parsed === "object") {
          // Check if single product
          if (parsed.title || parsed.titleAr || parsed.price !== undefined) {
            if (!parsed.products && !parsed.categories && !parsed.data) {
              rawProductsList = [parsed];
            }
          }

          // Check wrapped .data or root
          const source = parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data) ? parsed.data : parsed;

          if (Array.isArray(source.products)) rawProductsList = source.products;
          else if (Array.isArray(source.items)) rawProductsList = source.items;
          else if (Array.isArray(source.catalog)) rawProductsList = source.catalog;
          else if (Array.isArray(source.productList)) rawProductsList = source.productList;

          if (Array.isArray(source.categories)) rawCategoriesList = source.categories;
          if (Array.isArray(source.offerCategories)) rawOfferCategoriesList = source.offerCategories;
          if (Array.isArray(source.banners) || Array.isArray(source.slides)) rawBannersList = source.banners || source.slides;
          if (Array.isArray(source.coupons) || Array.isArray(source.promoCodes)) rawCouponsList = source.coupons || source.promoCodes;
          if (Array.isArray(source.governorates) || Array.isArray(source.shippingRates)) rawGovernoratesList = source.governorates || source.shippingRates;
          if (Array.isArray(source.orders)) rawOrdersList = source.orders;

          if (source.paymentConfig && typeof source.paymentConfig === "object") {
            paymentConfigObj = { ...DEFAULT_PAYMENT_CONFIG, ...source.paymentConfig };
          } else if (source.payment && typeof source.payment === "object") {
            paymentConfigObj = { ...DEFAULT_PAYMENT_CONFIG, ...source.payment };
          }

          if (source.footerConfig && typeof source.footerConfig === "object") {
            footerConfigObj = { ...DEFAULT_FOOTER_CONFIG, ...source.footerConfig };
          }
          if (source.splashScreenConfig && typeof source.splashScreenConfig === "object") {
            splashScreenConfigObj = { ...DEFAULT_SPLASH_CONFIG, ...source.splashScreenConfig };
          }
        }

        // Normalize products
        const products: Product[] | undefined = rawProductsList
          ? rawProductsList.map((p, idx) => normalizeImportedProduct(p, idx))
          : undefined;

        const categories: Category[] | undefined = rawCategoriesList
          ? rawCategoriesList.map((c, idx) => ({
              id: String(c.id || `cat-${idx + 1}`),
              name: String(c.name || c.nameAr || `Category ${idx + 1}`),
              nameAr: String(c.nameAr || c.name || `قسم ${idx + 1}`),
              icon: String(c.icon || "Shirt"),
              image: sanitizeImageUrl(c.image, SOTRA_CATEGORY_PLACEHOLDER),
            }))
          : undefined;

        const offerCategories: OfferCategory[] | undefined = rawOfferCategoriesList
          ? rawOfferCategoriesList.map((oc, idx) => ({
              id: String(oc.id || `offer-${idx + 1}`),
              name: String(oc.name || oc.nameAr || `Offer ${idx + 1}`),
              nameAr: String(oc.nameAr || oc.name || `عرض ${idx + 1}`),
              image: sanitizeImageUrl(oc.image, SOTRA_OFFER_PLACEHOLDER),
              badge: oc.badge || "SALE",
              badgeAr: oc.badgeAr || "خصم",
            }))
          : undefined;

        const banners: BannerSlide[] | undefined = rawBannersList
          ? rawBannersList.map((b, idx) => ({
              id: b.id || idx + 1,
              tag: b.tag || "SOTRA",
              tagAr: b.tagAr || "سترة",
              title: b.title || "تشكيلة جديدة",
              titleAr: b.titleAr || b.title || "تشكيلة جديدة",
              subtitle: b.subtitle || "",
              subtitleAr: b.subtitleAr || b.subtitle || "",
              cta: b.cta || "تسوق الآن",
              ctaAr: b.ctaAr || b.cta || "تسوق الآن",
              image: sanitizeImageUrl(b.image, SOTRA_BANNER_PLACEHOLDER),
              theme: b.theme || "dark",
              linkType: b.linkType || "category",
              linkTarget: b.linkTarget || "all",
            }))
          : undefined;

        const coupons: PromoCode[] | undefined = rawCouponsList;
        const governorates: Governorate[] | undefined = rawGovernoratesList;
        const orders: Order[] | undefined = rawOrdersList;

        const hasRecognizableData =
          (products && products.length > 0) ||
          (categories && categories.length > 0) ||
          (offerCategories && offerCategories.length > 0) ||
          (banners && banners.length > 0) ||
          (coupons && coupons.length > 0) ||
          (governorates && governorates.length > 0) ||
          paymentConfigObj !== undefined ||
          footerConfigObj !== undefined ||
          splashScreenConfigObj !== undefined ||
          (orders && orders.length > 0);

        if (!hasRecognizableData) {
          return resolve({
            success: false,
            error: "الملف المرفوع لا يحتوي على بنية بيانات معروفة لمتجر سترة (منتجات، أقسام، إعدادات، أو طلبات).",
          });
        }

        const normalizedPayload: BackupPayload = {
          version: parsed.version || "2.0.0",
          appName: parsed.appName || "SOTRA FASHION",
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          timestamp: parsed.timestamp || Date.now(),
          data: {
            products: products || [],
            categories: categories || [],
            offerCategories: offerCategories || [],
            banners: banners || [],
            coupons: coupons || [],
            governorates: governorates,
            paymentConfig: paymentConfigObj,
            footerConfig: footerConfigObj,
            splashScreenConfig: splashScreenConfigObj,
            orders: orders || [],
          },
          stats: {
            productsCount: products?.length || 0,
            categoriesCount: categories?.length || 0,
            offerCategoriesCount: offerCategories?.length || 0,
            bannersCount: banners?.length || 0,
            couponsCount: coupons?.length || 0,
            hasGovernorates: Boolean(governorates && governorates.length > 0),
            hasPaymentConfig: Boolean(paymentConfigObj),
            hasFooterConfig: Boolean(footerConfigObj),
            hasSplashScreenConfig: Boolean(splashScreenConfigObj),
            ordersCount: orders?.length || 0,
          },
        };

        return resolve({
          success: true,
          payload: normalizedPayload,
          rawJson: parsed,
        });
      } catch (err: any) {
        return resolve({
          success: false,
          error: `خطأ في قراءة ملف JSON: ${err?.message || "صيغة غير صالحة"}`,
        });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, error: "تعذر قراءة الملف من الجهاز." });
    };
    reader.readAsText(file);
  });
}

/**
 * Local Snapshots Management (Stored in Browser LocalStorage)
 */
export function getLocalSnapshots(): LocalSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Could not read local snapshots", e);
  }
  return [];
}

export function saveLocalSnapshot(name: string, adminData: AdminData, orders: Order[] = []): LocalSnapshot {
  const snapshots = getLocalSnapshots();
  const payload = generateFullBackupPayload(adminData, orders);
  const newSnapshot: LocalSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || `نسخة احتياطية ${new Date().toLocaleDateString("ar-EG")}`,
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    stats: {
      productsCount: payload.stats.productsCount,
      categoriesCount: payload.stats.categoriesCount,
      bannersCount: payload.stats.bannersCount,
      ordersCount: payload.stats.ordersCount,
    },
    payload,
  };

  const updated = [newSnapshot, ...snapshots].slice(0, 10);
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
  return newSnapshot;
}

export function deleteLocalSnapshot(snapshotId: string): LocalSnapshot[] {
  const snapshots = getLocalSnapshots().filter((s) => s.id !== snapshotId);
  localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  return snapshots;
}

export function clearAllLocalSnapshots(): void {
  localStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
}

