import React, { useState } from "react";
import { Sparkles, Plus, Trash2, Edit3, Check, Save, Layers, Image as ImageIcon, X, ArrowRight } from "lucide-react";
import { OutfitBundle, Product } from "../types";
import { SOTRA_PRODUCT_PLACEHOLDER } from "../utils/storage";

interface AdminOutfitsSettingsProps {
  outfits?: OutfitBundle[];
  allProducts: Product[];
  onSave: (newOutfits: OutfitBundle[]) => void;
  lang: "ar" | "en";
}

export function AdminOutfitsSettings({
  outfits = [],
  allProducts,
  onSave,
  lang,
}: AdminOutfitsSettingsProps) {
  const [list, setList] = useState<OutfitBundle[]>(() => outfits);
  const [editingOutfit, setEditingOutfit] = useState<OutfitBundle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleOpenAdd = () => {
    const newId = `outfit-${Date.now()}`;
    const defaultProducts = allProducts.slice(0, 3).map((p) => p.id);
    const firstImg = allProducts[0]?.colors?.[0]?.image || "";

    setEditingOutfit({
      id: newId,
      titleAr: "إطلالة كاجوال أنيقة صيفية",
      titleEn: "Summer Smart Casual Look",
      descriptionAr: "طقم متناسق بعناية يجمع بين قميص كتان وبنطلون جبردين مع تيشيرت أساسي بخصم إضافي",
      image: firstImg,
      productIds: defaultProducts,
      discountPercent: 15,
      badgeAr: "خصم إضافي 15%",
      isActive: true,
      createdAt: Date.now(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outfit: OutfitBundle) => {
    setEditingOutfit({ ...outfit, productIds: [...(outfit.productIds || [])] });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطقم؟")) return;
    const updated = list.filter((o) => o.id !== id);
    setList(updated);
    onSave(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutfit) return;

    if (editingOutfit.productIds.length === 0) {
      alert("يجب اختيار منتج واحد على الأقل في الطقم!");
      return;
    }

    const idx = list.findIndex((o) => o.id === editingOutfit.id);
    let updated = [...list];
    if (idx >= 0) {
      updated[idx] = editingOutfit;
    } else {
      updated.unshift(editingOutfit);
    }

    setList(updated);
    onSave(updated);
    setIsModalOpen(false);
    setEditingOutfit(null);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const toggleProductSelection = (productId: string) => {
    if (!editingOutfit) return;
    const current = editingOutfit.productIds || [];
    let next: string[];
    if (current.includes(productId)) {
      next = current.filter((id) => id !== productId);
    } else {
      next = [...current, productId];
    }
    setEditingOutfit({ ...editingOutfit, productIds: next });
  };

  return (
    <div className="space-y-6 text-start">
      {/* Section Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-neutral-900 font-brand">
              إدارة أطقم "نسّق إطلالتك" (Shop The Look Bundles)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              أنشئ أطقم ملابس متناسقة كاملة وحدد نسبة خصم إضافي يحصل عليها العميل فور اختياره الطقم بالكامل.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة طقم جديد</span>
        </button>
      </div>

      {/* Outfits List */}
      {list.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200 shadow-xs">
          <Sparkles className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h4 className="text-sm font-black text-neutral-800">لا توجد أطقم إطلالات مضافة حالياً</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            اضغط على زر "إضافة طقم جديد" لإنشاء أول طقم متناسق بخصم مخصص يجذب العملاء لزيادة متوسط قيمة الطلب.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول طقم الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((outfit) => {
            const includedProds = (outfit.productIds || [])
              .map((id) => allProducts.find((p) => p.id === id))
              .filter((p): p is Product => p !== undefined);

            const origSum = includedProds.reduce((sum, p) => sum + p.price, 0);
            const discountedSum = Math.round(origSum * (1 - (outfit.discountPercent || 15) / 100));

            return (
              <div
                key={outfit.id}
                className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/9 bg-neutral-100 overflow-hidden">
                    <img
                      src={outfit.image || SOTRA_PRODUCT_PLACEHOLDER}
                      alt={outfit.titleAr}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-black text-xs rounded-lg shadow-sm">
                        خصم {outfit.discountPercent}%
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${outfit.isActive ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-300"}`}>
                        {outfit.isActive ? "🟢 معروض بالمتجر" : "⚪ مخفي"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h4 className="text-sm font-black text-neutral-900">{outfit.titleAr}</h4>
                      {outfit.descriptionAr && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{outfit.descriptionAr}</p>
                      )}
                    </div>

                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-neutral-500">
                        <span>قطع الطقم ({includedProds.length}):</span>
                        <span className="font-bold text-neutral-800 font-mono">{origSum} ج.م</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-black pt-1 border-t border-neutral-200">
                        <span>سعر الطقم بعد الخصم ({outfit.discountPercent}%):</span>
                        <span className="font-mono text-sm">{discountedSum} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(outfit)}
                      className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDelete(outfit.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="حذف الطقم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] text-neutral-400 font-mono">
                    {includedProds.length} منتجات مشمولة
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && editingOutfit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-neutral-200 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-neutral-900 font-brand">
                  {editingOutfit.id ? "تعديل طقم الإطلالة" : "إضافة طقم إطلالة جديد"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    عنوان الطقم (عربي) *:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingOutfit.titleAr}
                    onChange={(e) => setEditingOutfit({ ...editingOutfit, titleAr: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    نسبة الخصم الإضافي على الطقم بالكامل (%) *:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={editingOutfit.discountPercent || 15}
                    onChange={(e) => setEditingOutfit({ ...editingOutfit, discountPercent: Number(e.target.value) || 15 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-700 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    وصف الطقم ومناسبته (عربي):
                  </label>
                  <textarea
                    rows={2}
                    value={editingOutfit.descriptionAr || ""}
                    onChange={(e) => setEditingOutfit({ ...editingOutfit, descriptionAr: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    رابط صورة غلاف الطقم (Look Image URL):
                  </label>
                  <input
                    type="text"
                    value={editingOutfit.image || ""}
                    onChange={(e) => setEditingOutfit({ ...editingOutfit, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={editingOutfit.isActive !== false}
                      onChange={(e) => setEditingOutfit({ ...editingOutfit, isActive: e.target.checked })}
                      className="w-4 h-4 accent-neutral-950 rounded cursor-pointer"
                    />
                    <span>إظهار وتفعيل الطقم بالمتجر</span>
                  </label>
                </div>
              </div>

              {/* Product Multi-Selector */}
              <div>
                <label className="block text-xs font-black text-neutral-900 mb-2">
                  اختر المنتجات المكونة لهذا الطقم (اضغط لتحديد / إلغاء تحديد):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                  {allProducts.map((p) => {
                    const isSelected = editingOutfit.productIds?.includes(p.id);
                    const img = p.colors?.[0]?.image || SOTRA_PRODUCT_PLACEHOLDER;

                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProductSelection(p.id)}
                        className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-amber-50/80 border-amber-500 shadow-xs"
                            : "bg-neutral-50 border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className="w-10 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0 border">
                          <img src={img} alt={p.titleAr} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">{p.titleAr}</p>
                          <p className="text-[11px] font-mono text-neutral-500">{p.price} ج.م</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? "bg-amber-500 text-white" : "border border-neutral-300"}`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الطقم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
