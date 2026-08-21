import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  ShoppingBag,
  Trash2,
  Eye,
  DollarSign,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { SavedCustomer, Order } from "../types";
import { subscribeToFirebaseCustomers, deleteCustomerFromFirestore } from "../firebase";

interface AdminCustomersTabProps {
  orders: Order[];
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

export const AdminCustomersTab: React.FC<AdminCustomersTabProps> = ({
  orders,
  showToast,
  lang,
}) => {
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<SavedCustomer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Subscribe to real-time customers from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseCustomers(
      (firestoreCustomers) => {
        // Merge with any customers found directly in local orders if not yet in Firestore
        const customerMap = new Map<string, SavedCustomer>();

        firestoreCustomers.forEach((c) => {
          if (c && c.phoneNumber) {
            customerMap.set(c.phoneNumber.replace(/\s+/g, ""), c);
          }
        });

        // Also cross-reference with orders to ensure 100% data completeness
        orders.forEach((o) => {
          if (o && o.customer && o.customer.phoneNumber) {
            const cleanPhone = o.customer.phoneNumber.replace(/\s+/g, "");
            const existing = customerMap.get(cleanPhone);
            if (!existing) {
              customerMap.set(cleanPhone, {
                id: cleanPhone,
                fullName: o.customer.fullName || "عميل",
                phoneNumber: cleanPhone,
                secondaryPhone: o.customer.secondaryPhone,
                governorateId: o.customer.governorateId,
                governorateNameAr: o.governorateNameAr || o.customer.governorateNameAr || "",
                detailedAddress: o.customer.detailedAddress,
                notes: o.customer.notes,
                totalOrdersCount: 1,
                totalSpent: o.total || 0,
                lastOrderDate: o.createdAt,
                createdAt: o.createdAt,
                orders: [o.orderId],
              });
            }
          }
        });

        const merged = Array.from(customerMap.values());
        merged.sort((a, b) => new Date(b.lastOrderDate || b.createdAt || 0).getTime() - new Date(a.lastOrderDate || a.createdAt || 0).getTime());
        setCustomers(merged);
      },
      (err) => {
        console.warn("Customers subscription error:", err);
      }
    );

    return () => unsubscribe();
  }, [orders]);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("هل أنت متأكد من حذف بيانات هذا العميل من قاعدة البيانات؟")) return;
    try {
      await deleteCustomerFromFirestore(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId && c.phoneNumber !== customerId));
      if (selectedCustomer?.id === customerId) {
        setIsDetailModalOpen(false);
        setSelectedCustomer(null);
      }
      showToast("تم حذف العميل من قاعدة البيانات بنجاح");
    } catch (e) {
      console.error(e);
      showToast("حدث خطأ أثناء حذف العميل");
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (!c) return false;
    const name = (c.fullName || "").toLowerCase();
    const phone = c.phoneNumber || "";
    const secPhone = c.secondaryPhone || "";
    const addr = (c.detailedAddress || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !q ||
      name.includes(q) ||
      phone.includes(q) ||
      secPhone.includes(q) ||
      addr.includes(q);

    const matchesGov =
      selectedGovernorate === "all" ||
      c.governorateId === selectedGovernorate ||
      c.governorateNameAr === selectedGovernorate;

    return matchesSearch && matchesGov;
  });

  // Calculate Metrics
  const totalCustomersCount = customers.length;
  const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgCustomerSpend = totalCustomersCount > 0 ? Math.round(totalCustomerSpend / totalCustomersCount) : 0;
  const repeatCustomersCount = customers.filter((c) => (c.totalOrdersCount || 0) > 1).length;
  const repeatRate = totalCustomersCount > 0 ? Math.round((repeatCustomersCount / totalCustomersCount) * 100) : 0;

  // Extract governorates for filter
  const governoratesList = Array.from(new Set(customers.map((c) => c.governorateNameAr || c.governorateId).filter(Boolean)));

  return (
    <div className="space-y-6 text-start animate-fade-in">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">إجمالي العملاء المسجلين</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-950">{totalCustomersCount}</p>
          <span className="text-[11px] text-neutral-400 font-medium">مسجلين في قاعدة بيانات Firestore</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">إجمالي مبيعات العملاء</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-950 font-mono">
            {totalCustomerSpend.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
          </p>
          <span className="text-[11px] text-neutral-400 font-medium">عبر كافة الطلبات المكتملة</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">متوسط قيمة العميل (LTV)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-950 font-mono">
            {avgCustomerSpend.toLocaleString()} <span className="text-xs font-bold">ج.م</span>
          </p>
          <span className="text-[11px] text-neutral-400 font-medium">متوسط إنفاق العميل الواحد</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">معدل تكرار الشراء</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-neutral-950">{repeatRate}%</p>
          <span className="text-[11px] text-neutral-400 font-medium">{repeatCustomersCount} عميل اشترى أكثر من مرة</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، رقم الهاتف، أو العنوان..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-neutral-950 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-neutral-50 focus:ring-2 focus:ring-neutral-950 outline-hidden cursor-pointer"
          >
            <option value="all">كافة المحافظات ({customers.length})</option>
            {governoratesList.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3.5 text-start">العميل</th>
                <th className="px-4 py-3.5 text-start">رقم الهاتف</th>
                <th className="px-4 py-3.5 text-start">المحافظة والعنوان</th>
                <th className="px-4 py-3.5 text-center">عدد الطلبات</th>
                <th className="px-4 py-3.5 text-start">إجمالي المشتريات</th>
                <th className="px-4 py-3.5 text-start">آخر طلب</th>
                <th className="px-4 py-3.5 text-center">تواصل وإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id || customer.phoneNumber} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-neutral-950 text-xs">{customer.fullName || "عميل بدون اسم"}</div>
                    {customer.secondaryPhone && (
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5" dir="ltr">
                        هاتف إضافي: {customer.secondaryPhone}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900 font-mono" dir="ltr">
                        {customer.phoneNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(customer.phoneNumber, customer.id)}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                        title="نسخ رقم الهاتف"
                      >
                        {copiedPhone === customer.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="font-bold text-neutral-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span>{customer.governorateNameAr || customer.governorateId}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                      {customer.detailedAddress || "لا يوجد عنوان مسجل"}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-black text-xs ${
                        (customer.totalOrdersCount || 0) > 1
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {customer.totalOrdersCount || 1}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-black text-neutral-950 font-mono">
                      {(customer.totalSpent || 0).toLocaleString()}{" "}
                      <span className="text-[10px] text-neutral-500 font-bold">ج.م</span>
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-neutral-500 text-[11px] whitespace-nowrap">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString("ar-EG") : "—"}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* WhatsApp Call/Chat */}
                      <a
                        href={`https://wa.me/20${customer.phoneNumber.replace(/^0+/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                        title="مراسلة عبر واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>

                      {/* Phone Call */}
                      <a
                        href={`tel:${customer.phoneNumber}`}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                        title="اتصال هاتفياً"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>

                      {/* View Customer Details */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="عرض الملف الكامل"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Customer */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-xs">لا يوجد عملاء مطابقين لخيارات البحث</p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      يتم حفظ وتسجيل بيانات العملاء تلقائياً في قاعدة البيانات فور إتمام أي طلب
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Full Profile Modal */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div onClick={() => setIsDetailModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 border border-neutral-200 animate-scale-in text-start">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-sm">
                    {selectedCustomer?.fullName ? selectedCustomer.fullName.slice(0, 1) : "C"}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-neutral-950">{selectedCustomer?.fullName || "عميل"}</h3>
                    <span className="text-xs text-neutral-500 font-mono" dir="ltr">
                      {selectedCustomer?.phoneNumber || ""}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-950 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3.5 rounded-xl">
                  <div>
                    <span className="text-neutral-500 block mb-0.5">المحافظة</span>
                    <span className="font-bold text-neutral-900">
                      {selectedCustomer.governorateNameAr || selectedCustomer.governorateId}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">إجمالي المشتريات</span>
                    <span className="font-bold text-neutral-900 font-mono">
                      {(selectedCustomer.totalSpent || 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">عدد الطلبات</span>
                    <span className="font-bold text-neutral-900">{selectedCustomer.totalOrdersCount || 1} طلبات</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">تاريخ أول تسجيل</span>
                    <span className="font-bold text-neutral-900">
                      {selectedCustomer.createdAt
                        ? new Date(selectedCustomer.createdAt).toLocaleDateString("ar-EG")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-500 block font-bold mb-1">العنوان التفصيلي للتوصيل</label>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-800 font-medium leading-relaxed">
                    {selectedCustomer.detailedAddress || "لا يوجد عنوان تفصيلي"}
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <label className="text-neutral-500 block font-bold mb-1">ملاحظات إضافية</label>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                      {selectedCustomer.notes}
                    </div>
                  </div>
                )}

                {/* Orders by this customer */}
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <div>
                    <label className="text-neutral-500 block font-bold mb-1">أرقام الطلبات السابقة للعميل</label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.orders.map((ordId) => (
                        <span
                          key={ordId}
                          className="px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-800 font-mono text-[11px] font-bold"
                        >
                          #{ordId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                  <a
                    href={`https://wa.me/20${selectedCustomer.phoneNumber.replace(/^0+/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>مراسلة واتساب</span>
                  </a>

                  <a
                    href={`tel:${selectedCustomer.phoneNumber}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl font-bold transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال هاتفياً</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
