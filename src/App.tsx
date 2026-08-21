import React, { useState, useEffect, useMemo } from "react";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Header } from "./components/Header";
import { PromoBanner } from "./components/PromoBanner";
import { HeroCategorySlider } from "./components/HeroCategorySlider";
import { OfferCategoriesSection } from "./components/OfferCategoriesSection";
import { CategoryPills } from "./components/CategoryPills";
import { FilterBar } from "./components/FilterBar";
import { FilterDrawer } from "./components/FilterDrawer";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { ProductDetailPage } from "./components/ProductDetailPage";
import { CategoryDetailPage } from "./components/CategoryDetailPage";
import { OfferCategoryDetailPage } from "./components/OfferCategoryDetailPage";
import { ProductsGroupDetailPage } from "./components/ProductsGroupDetailPage";
import { CartPage } from "./components/CartPage";
import { UserProfilePage } from "./components/UserProfilePage";
import { SearchPage } from "./components/SearchPage";
import { FastCheckoutModal } from "./components/FastCheckoutModal";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { AdminPage } from "./components/AdminPage";
import { AdminPasswordModal } from "./components/AdminPasswordModal";
import { NavigationMenuDrawer } from "./components/NavigationMenuDrawer";
import { ImageLightbox } from "./components/ImageLightbox";
import { PromotionalPopupModal } from "./components/PromotionalPopupModal";
import { Footer } from "./components/Footer";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { SplashScreen } from "./components/SplashScreen";

import {
  AdminData,
  BannerSlide,
  CartItem,
  ColorVariant,
  FilterState,
  Order,
  Product,
  PromoCode,
} from "./types";
import {
  loadAdminData,
  saveAdminData,
  loadCart,
  saveCart,
  loadOrders,
  saveOrders,
  STORAGE_KEYS,
  addMyOrderId,
} from "./utils/storage";
import {
  subscribeToFirebaseAdminData,
  subscribeToFirebaseOrders,
  saveAdminDataToFirebase,
} from "./firebase";

export default function App() {
  // --- Initial Loading Splash State ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // --- Persistent States ---
  const [adminData, setAdminData] = useState<AdminData>(() => loadAdminData());
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());

  // Subscribe to real-time Firestore database updates
  useEffect(() => {
    // Safety timer to prevent splash screen hanging if network is slow
    const fallbackTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);

    const unsubAdmin = subscribeToFirebaseAdminData((remoteAdminData) => {
      setAdminData(remoteAdminData);
      try {
        localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(remoteAdminData));
      } catch (e) {
        console.warn("Storage sync error:", e);
      }
      setIsInitialLoading(false);
    });

    const unsubOrders = subscribeToFirebaseOrders((remoteOrders) => {
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders(remoteOrders);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(remoteOrders));
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubAdmin();
      unsubOrders();
    };
  }, []);

  // --- UI Navigation State (Default language is 'ar') ---
  const [currentView, setCurrentView] = useState<
    "home" | "category-detail" | "offer-category-detail" | "products-group-detail" | "product-detail" | "cart" | "profile" | "search" | "admin"
  >("home");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedOfferCategoryId, setSelectedOfferCategoryId] = useState<string>("");
  const [selectedProductsGroup, setSelectedProductsGroup] = useState<{
    productIds: string[];
    titleAr?: string;
    titleEn?: string;
    bannerImage?: string;
  }>({ productIds: [] });
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // --- Modals State ---
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<{ product: Product; selectedColorIndex: number } | null>(null);
  const [isFastCheckoutOpen, setIsFastCheckoutOpen] = useState(false);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

  // --- Lightbox ---
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; images: string[]; startIndex: number }>({
    isOpen: false,
    images: [],
    startIndex: 0,
  });

  // --- Applied Promo in session ---
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  // --- Filters & Sorting ---
  const [layoutCols, setLayoutCols] = useState(2);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    sizes: [],
    colors: [],
    fit: [],
    maxPrice: 1200,
    onlyDiscounted: false,
    onlyInStock: false,
    sortBy: "featured",
  });

  // Default language is 'ar' as requested
  const [lang, setLang] = useState<"ar" | "en">("ar");

  // Scroll detection to auto-hide header and bottom toolbar when scrolling down
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show near the top of the page
      if (currentScrollY < 60) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      // Threshold check to avoid jittering
      if (Math.abs(diff) > 8) {
        if (diff > 0) {
          // Scrolling DOWN -> hide header and tools
          setIsHeaderVisible(false);
        } else {
          // Scrolling UP -> show header and tools
          setIsHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Show promotional popup on site entry if configured and enabled
  useEffect(() => {
    if (adminData.popupBannerConfig && adminData.popupBannerConfig.isEnabled !== false) {
      const popupTimer = setTimeout(() => {
        setIsPopupOpen(true);
      }, 1200);
      return () => clearTimeout(popupTimer);
    }
  }, [adminData.popupBannerConfig?.isEnabled]);

  // Synchronize storage
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const handleRefreshData = () => {
    setAdminData(loadAdminData());
    setOrders(loadOrders());
  };

  const maxCatalogPrice = useMemo(() => {
    if (!adminData?.products || adminData.products.length === 0) return 2000;
    const prices = (adminData.products || []).map((p) => Number(p.price) || 0);
    return Math.max(...prices);
  }, [adminData?.products]);

  // --- Filtered Home Products ---
  const filteredHomeProducts = useMemo(() => {
    let list = [...(adminData?.products || [])];

    // Category filter
    if (selectedCategoryId !== "all") {
      list = list.filter((p) => p.category === selectedCategoryId);
    }

    // Secondary Filter State
    if (filters.category && filters.category !== "all") {
      list = list.filter((p) => p.category === filters.category);
    }

    // Sizes
    if (filters.sizes.length > 0) {
      list = list.filter((p) => p.sizes.some((sz) => filters.sizes.includes(sz)));
    }

    // Colors
    if (filters.colors.length > 0) {
      list = list.filter((p) =>
        p.colors?.some((c) =>
          filters.colors.some(
            (fc) =>
              fc.trim().toLowerCase() === (c.name || "").trim().toLowerCase() ||
              fc.trim().toLowerCase() === (c.nameAr || "").trim().toLowerCase()
          )
        )
      );
    }

    // Fit
    if (filters.fit.length > 0) {
      list = list.filter((p) => filters.fit.includes(p.fit));
    }

    // Dynamic Max Price
    if (typeof filters.maxPrice === "number" && filters.maxPrice < maxCatalogPrice) {
      list = list.filter((p) => p.price <= filters.maxPrice);
    }

    // Only Discounted
    if (filters.onlyDiscounted) {
      list = list.filter((p) => (p.originalPrice && p.originalPrice > p.price) || (p.discountPercent && p.discountPercent > 0));
    }

    // Only In Stock
    if (filters.onlyInStock) {
      list = list.filter((p) => p.inStock);
    }

    // Sort By
    if (filters.sortBy === "price_asc" || filters.sortBy === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price_desc" || filters.sortBy === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "newest") {
      list.sort((a, b) => (b.isNewArrival || (b as any).isNew ? 1 : 0) - (a.isNewArrival || (a as any).isNew ? 1 : 0));
    } else if (filters.sortBy === "discount") {
      list.sort((a, b) => {
        const discA = a.originalPrice ? a.originalPrice - a.price : (a.discountPercent || 0);
        const discB = b.originalPrice ? b.originalPrice - b.price : (b.discountPercent || 0);
        return discB - discA;
      });
    }

    return list;
  }, [adminData.products, selectedCategoryId, filters, maxCatalogPrice]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "all") count++;
    if (filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.colors.length > 0) count += filters.colors.length;
    if (filters.fit.length > 0) count += filters.fit.length;
    if (typeof filters.maxPrice === "number" && filters.maxPrice < maxCatalogPrice) count++;
    if (filters.onlyDiscounted) count++;
    if (filters.onlyInStock) count++;
    return count;
  }, [filters, maxCatalogPrice]);

  // --- Cart Actions ---
  const handleAddToCart = (
    product: Product,
    selectedColor: ColorVariant,
    size: string,
    quantity: number = 1
  ) => {
    const itemKey = `${product.id}-${selectedColor.name}-${size}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemKey);
      if (existing) {
        return prev.map((item) =>
          item.id === itemKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemKey,
          productId: product.id,
          title: product.title,
          titleAr: product.titleAr,
          price: product.price,
          originalPrice: product.originalPrice,
          selectedColor,
          selectedSize: size,
          quantity,
          category: product.category,
        },
      ];
    });
  };

  const handleQuickOrderNow = (
    product: Product,
    selectedColor: ColorVariant,
    size: string,
    quantity: number = 1
  ) => {
    handleAddToCart(product, selectedColor, size, quantity);
    setIsFastCheckoutOpen(true);
  };

  const handleUpdateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // --- Navigation Actions ---
  const handleOpenCategoryDetail = (catId: string) => {
    setSelectedCategoryId(catId);
    setCurrentView("category-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenOfferCategoryDetail = (offerCatId: string) => {
    setSelectedOfferCategoryId(offerCatId);
    setCurrentView("offer-category-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenProductsGroupDetail = (productIds: string[], titleAr?: string, titleEn?: string) => {
    setSelectedProductsGroup({
      productIds,
      titleAr,
      titleEn,
      bannerImage: adminData.popupBannerConfig?.imageUrl,
    });
    setCurrentView("products-group-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenProductDetail = (product: Product) => {
    setSelectedProductForDetail(product);
    setCurrentView("product-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBannerClick = (banner: BannerSlide) => {
    if (banner.targetType === "product" && banner.targetProduct) {
      const prod = adminData.products.find((p) => p.id === banner.targetProduct);
      if (prod) {
        handleOpenProductDetail(prod);
        return;
      }
    }
    if (banner.targetType === "offer_category") {
      const targetId = banner.targetOfferCategory || banner.targetCategory;
      if (targetId) {
        handleOpenOfferCategoryDetail(targetId);
        return;
      }
    }
    if (banner.targetCategory) {
      handleOpenCategoryDetail(banner.targetCategory);
    }
  };

  const handleOpenLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxState({ isOpen: true, images, startIndex });
  };

  const handleOrderSuccess = (order: Order) => {
    setLastPlacedOrder(order);
    addMyOrderId(order.orderId);
    const updated = [order, ...orders];
    setOrders(updated);
    saveOrders(updated);
    setCart([]);
    setIsFastCheckoutOpen(false);
    setIsOrderSuccessOpen(true);
    // Reload admin data for updated inventory
    setAdminData(loadAdminData());
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-arabic antialiased selection:bg-neutral-950 selection:text-white pb-14 sm:pb-0">
      {/* Luxury Initial Splash Screen */}
      <SplashScreen isLoading={isInitialLoading} splashConfig={adminData.splashScreenConfig} />

      {currentView === "admin" ? (
        <AdminPage
          adminData={adminData}
          orders={orders}
          onUpdateAdminData={(newData) => {
            setAdminData(newData);
            saveAdminData(newData);
          }}
          onUpdateOrders={(newOrders) => {
            setOrders(newOrders);
            saveOrders(newOrders);
          }}
          onBackToHome={() => {
            setCurrentView("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          lang={lang}
        />
      ) : (
        <>
          {/* Top Sticky Header & Announcement Bar with Auto-Hide on Scroll */}
          <div
            className={`sticky top-0 z-40 transition-transform duration-300 ease-in-out ${
              isHeaderVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
            }`}
          >
            {/* Top Announcement Strip */}
            <AnnouncementBar lang={lang} />

            {/* Main App Header */}
            <Header
              cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
              onOpenCart={() => {
                setCurrentView("cart");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenProfile={() => {
                setCurrentView("profile");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenSearch={() => {
                setCurrentView("search");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenMenu={() => setIsNavMenuOpen(true)}
              onOpenAdmin={() => setIsAdminPasswordOpen(true)}
              onGoHome={() => {
                setCurrentView("home");
                setSelectedCategoryId("all");
                setSelectedOfferCategoryId("");
                setSelectedProductForDetail(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onToggleLang={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
              onSelectCategory={(catId) => {
                setSelectedCategoryId(catId);
                setCurrentView(catId === "all" ? "home" : "category-detail");
              }}
              isVisible={isHeaderVisible}
              lang={lang}
            />
          </div>

          {/* VIEW ROUTING */}
          {currentView === "home" && (
            <main className="animate-fade-in">
              {/* 3D Auto-Rotating Promo Banner with Link to Category, Offer Category, or Product */}
              <PromoBanner
                banners={adminData.banners}
                onSelectCategory={handleOpenCategoryDetail}
                onBannerClick={handleBannerClick}
                lang={lang}
              />

              {/* 3D Modern Category Carousel Slider */}
              <HeroCategorySlider
                categories={adminData.categories}
                onSelectCategory={handleOpenCategoryDetail}
                lang={lang}
              />

              {/* Offer Categories Carousel */}
              <OfferCategoriesSection
                offerCategories={adminData.offerCategories}
                products={adminData.products}
                onSelectOfferCategory={handleOpenOfferCategoryDetail}
                onOpenOfferCategoryPage={handleOpenOfferCategoryDetail}
                onOpenProductModal={handleOpenProductDetail}
                onQuickAdd={handleAddToCart}
                onQuickOrderNow={handleQuickOrderNow}
                onOpenLightbox={handleOpenLightbox}
                lang={lang}
                globalDiscountStyle={adminData.discountBadgeStyle}
              />

              {/* Category Quick Pills */}
              <CategoryPills
                categories={adminData.categories}
                selectedCategory={selectedCategoryId}
                onSelectCategory={(catId) => setSelectedCategoryId(catId)}
                lang={lang}
              />

              {/* Filter & View Toolbar */}
              <FilterBar
                productsCount={filteredHomeProducts.length}
                layoutCols={layoutCols}
                onChangeLayout={(cols) => setLayoutCols(cols)}
                onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                activeFiltersCount={activeFiltersCount}
                filters={filters}
                onSortChange={(sortBy) => setFilters({ ...filters, sortBy })}
                lang={lang}
              />

              {/* Products Grid */}
              <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 text-start">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-5 bg-[#dc2626] rounded-full" />
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wide text-neutral-950 font-brand">
                      {selectedCategoryId === "all"
                        ? lang === "ar"
                          ? "جميع التشكيلات والمنتجات"
                          : "ALL PRODUCTS & DROPS"
                        : adminData.categories.find((c) => c.id === selectedCategoryId)?.nameAr || selectedCategoryId}
                    </h2>
                    <span className="text-xs font-bold text-neutral-400 font-brand">
                      ({filteredHomeProducts.length})
                    </span>
                  </div>
                </div>

                {filteredHomeProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-2xs my-4">
                    <h3 className="text-base font-bold text-neutral-800">
                      {lang === "ar" ? "لا توجد منتجات تطابق اختياراتك حالياً" : "No items match your criteria"}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      {lang === "ar" ? "جرب تعديل الفلاتر أو السعر الأقصى" : "Try clearing filters to see all available drops"}
                    </p>
                    <button
                      onClick={() =>
                        setFilters({
                          category: "all",
                          sizes: [],
                          colors: [],
                          fit: [],
                          maxPrice: 1200,
                          onlyDiscounted: false,
                          onlyInStock: false,
                          sortBy: "featured",
                        })
                      }
                      className="mt-4 px-4 py-2 bg-neutral-950 text-white text-xs font-black uppercase rounded-xl font-brand cursor-pointer"
                    >
                      {lang === "ar" ? "إعادة ضبط جميع الفلاتر" : "Reset All Filters"}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid gap-3 sm:gap-6 ${
                      layoutCols === 1
                        ? "grid-cols-1 max-w-xl mx-auto"
                        : layoutCols === 2
                        ? "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    }`}
                  >
                    {filteredHomeProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpenProductModal={() => handleOpenProductDetail(product)}
                        onQuickAdd={handleAddToCart}
                        onQuickOrderNow={handleQuickOrderNow}
                        onOpenLightbox={handleOpenLightbox}
                        layoutCols={layoutCols}
                        lang={lang}
                        globalDiscountStyle={adminData.discountBadgeStyle}
                      />
                    ))}
                  </div>
                )}
              </section>
            </main>
          )}

          {currentView === "category-detail" && (
            <CategoryDetailPage
              category={
                adminData.categories.find((c) => c.id === selectedCategoryId) || {
                  id: "all",
                  name: "All",
                  nameAr: "الكل",
                  image: "",
                }
              }
              allCategories={adminData.categories}
              products={adminData.products}
              onSelectCategory={(catId) => setSelectedCategoryId(catId)}
              onOpenProductModal={(p) => handleOpenProductDetail(p)}
              onQuickAdd={handleAddToCart}
              onQuickOrderNow={handleQuickOrderNow}
              onBackToHome={() => setCurrentView("home")}
              onOpenLightbox={handleOpenLightbox}
              lang={lang}
              globalDiscountStyle={adminData.discountBadgeStyle}
            />
          )}

          {currentView === "offer-category-detail" && (
            <OfferCategoryDetailPage
              offerCategory={
                adminData.offerCategories.find((oc) => oc.id === selectedOfferCategoryId) ||
                adminData.offerCategories[0]
              }
              allOfferCategories={adminData.offerCategories}
              products={adminData.products}
              onSelectOfferCategory={(catId) => setSelectedOfferCategoryId(catId)}
              onOpenProductModal={(p) => handleOpenProductDetail(p)}
              onQuickAdd={handleAddToCart}
              onQuickOrderNow={handleQuickOrderNow}
              onBackToHome={() => setCurrentView("home")}
              onOpenLightbox={handleOpenLightbox}
              lang={lang}
              globalDiscountStyle={adminData.discountBadgeStyle}
            />
          )}

          {currentView === "products-group-detail" && (
            <ProductsGroupDetailPage
              titleAr={selectedProductsGroup.titleAr}
              titleEn={selectedProductsGroup.titleEn}
              bannerImage={selectedProductsGroup.bannerImage}
              productIds={selectedProductsGroup.productIds}
              allProducts={adminData.products}
              onOpenProductModal={(p) => handleOpenProductDetail(p)}
              onQuickAdd={handleAddToCart}
              onQuickOrderNow={handleQuickOrderNow}
              onBackToHome={() => setCurrentView("home")}
              onOpenLightbox={handleOpenLightbox}
              lang={lang}
              globalDiscountStyle={adminData.discountBadgeStyle}
            />
          )}

          {currentView === "product-detail" && selectedProductForDetail && (
            <ProductDetailPage
              product={selectedProductForDetail}
              allProducts={adminData.products}
              relatedProducts={adminData.products.filter(
                (p) => p.category === selectedProductForDetail.category && p.id !== selectedProductForDetail.id
              )}
              onSelectProduct={(p) => setSelectedProductForDetail(p)}
              onAddToCart={handleAddToCart}
              onQuickOrderNow={handleQuickOrderNow}
              onBuyNow={handleQuickOrderNow}
              onBack={() => setCurrentView("home")}
              onOpenLightbox={handleOpenLightbox}
              lang={lang}
            />
          )}

          {/* DEDICATED CART PAGE */}
          {currentView === "cart" && (
            <CartPage
              items={cart}
              onUpdateQuantity={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onProceedToCheckout={() => setIsFastCheckoutOpen(true)}
              onOpenProfile={() => {
                setCurrentView("profile");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onBackToShopping={() => {
                setCurrentView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              coupons={adminData.coupons}
              appliedCoupon={appliedPromo}
              onApplyCoupon={(coupon) => setAppliedPromo(coupon)}
              lang={lang}
            />
          )}

          {/* DEDICATED USER ACCOUNT / PROFILE & ORDER TRACKING PAGE */}
          {currentView === "profile" && (
            <UserProfilePage
              orders={orders}
              onUpdateOrders={(up) => {
                setOrders(up);
                saveOrders(up);
              }}
              onRefreshData={handleRefreshData}
              onBackToHome={() => {
                setCurrentView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              lang={lang}
            />
          )}

          {/* DEDICATED SEARCH PAGE */}
          {currentView === "search" && (
            <SearchPage
              products={adminData.products}
              onOpenProductModal={(p) => handleOpenProductDetail(p)}
              onQuickAdd={handleAddToCart}
              onQuickOrderNow={handleQuickOrderNow}
              onOpenLightbox={handleOpenLightbox}
              onBackToHome={() => {
                setCurrentView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              lang={lang}
              globalDiscountStyle={adminData.discountBadgeStyle}
            />
          )}

          {/* Footer */}
          <Footer
            onOpenProfile={() => {
              setCurrentView("profile");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            lang={lang}
            footerConfig={adminData.footerConfig}
          />

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav
            activeTab={
              currentView === "home"
                ? "home"
                : currentView === "category-detail"
                ? "categories"
                : currentView === "cart"
                ? "cart"
                : currentView === "profile"
                ? "profile"
                : currentView === "search"
                ? "search"
                : "home"
            }
            onSelectTab={(tab) => {
              if (tab === "home") {
                setCurrentView("home");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              if (tab === "categories") {
                handleOpenCategoryDetail("tops");
              }
              if (tab === "search") {
                setCurrentView("search");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              if (tab === "cart") {
                setCurrentView("cart");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              if (tab === "profile") {
                setCurrentView("profile");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)}
            isVisible={isHeaderVisible}
            lang={lang}
          />
        </>
      )}

      {/* MODALS & DRAWERS */}

      {/* 1. Product Quick View & Order Modal (if used) */}
      {activeProductModal && (
        <ProductModal
          isOpen={true}
          onClose={() => setActiveProductModal(null)}
          product={activeProductModal.product}
          initialColorIndex={activeProductModal.selectedColorIndex}
          onAddToCart={handleAddToCart}
          onBuyNow={handleQuickOrderNow}
          onOpenLightbox={handleOpenLightbox}
          lang={lang}
        />
      )}

      {/* 2. Fast Checkout Modal with Vodafone Cash, Shipping Transfer input & Stock Deduction */}
      <FastCheckoutModal
        isOpen={isFastCheckoutOpen}
        onClose={() => setIsFastCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
        coupons={adminData.coupons}
        initialCoupon={appliedPromo}
        paymentConfig={adminData.paymentConfig}
        governorates={adminData.governorates}
        lang={lang}
      />

      {/* 3. Order Placed Confirmation Modal with Live Tracking & WhatsApp */}
      <OrderSuccessModal
        order={lastPlacedOrder}
        isOpen={isOrderSuccessOpen}
        onClose={() => setIsOrderSuccessOpen(false)}
        onOpenProfile={() => {
          setIsOrderSuccessOpen(false);
          setCurrentView("profile");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        lang={lang}
      />

      {/* 4. Admin Password Modal (Secret Password: admin) */}
      <AdminPasswordModal
        isOpen={isAdminPasswordOpen}
        onClose={() => setIsAdminPasswordOpen(false)}
        onSuccess={() => {
          setIsAdminPasswordOpen(false);
          setCurrentView("admin");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        lang={lang}
      />

      {/* 5. Slide-over Filter & Sort Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onUpdateFilters={(f) => setFilters(f)}
        onResetFilters={() =>
          setFilters({
            category: "all",
            sizes: [],
            colors: [],
            fit: [],
            maxPrice: 1200,
            onlyDiscounted: false,
            onlyInStock: false,
            sortBy: "featured",
          })
        }
        totalFilteredCount={filteredHomeProducts.length}
        products={adminData.products}
        lang={lang}
      />

      {/* 6. Navigation Menu Side-Drawer with Language Switcher & Quick Navigation */}
      <NavigationMenuDrawer
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        categories={adminData.categories}
        offerCategories={adminData.offerCategories}
        onSelectCategory={handleOpenCategoryDetail}
        onSelectOfferCategory={handleOpenOfferCategoryDetail}
        onOpenProfile={() => {
          setIsNavMenuOpen(false);
          setCurrentView("profile");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenCart={() => {
          setIsNavMenuOpen(false);
          setCurrentView("cart");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenSearch={() => {
          setIsNavMenuOpen(false);
          setCurrentView("search");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
      />

      {/* 7. Image Zoom Lightbox */}
      <ImageLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
        images={lightboxState.images}
        startIndex={lightboxState.startIndex}
      />

      {/* 8. Promotional Popup Modal (Triggered on Site Entry) */}
      <PromotionalPopupModal
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        config={adminData.popupBannerConfig}
        onNavigateCategory={handleOpenCategoryDetail}
        onNavigateOfferCategory={handleOpenOfferCategoryDetail}
        onNavigateProduct={(prodId) => {
          const p = adminData.products.find((item) => item.id === prodId);
          if (p) handleOpenProductDetail(p);
        }}
        onNavigateProductsGroup={handleOpenProductsGroupDetail}
        categories={adminData.categories}
        products={adminData.products}
        offerCategories={adminData.offerCategories}
        lang={lang}
      />
    </div>
  );
}
