import React, { useState } from "react";
import { Plus, Minus, Layers, Package, Sparkles, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { ColorVariant, InventoryItem } from "../types";
import { getInvKey } from "../utils/storage";

interface ProductInventoryFormProps {
  colors: ColorVariant[];
  sizes: string[];
  inventory?: Record<string, InventoryItem>;
  price: number;
  onChange: (newInventory: Record<string, InventoryItem>, inStock: boolean) => void;
}

export const ProductInventoryForm: React.FC<ProductInventoryFormProps> = ({
  colors,
  sizes,
  inventory = {},
  price,
  onChange,
}) => {
  const [bulkQty, setBulkQty] = useState<number>(10);
  const [showCostPrice, setShowCostPrice] = useState(false);

  // Normalize colors & sizes
  const activeColors = colors.length > 0 ? colors : [{ name: "Standard", nameAr: "افتراضي", hex: "#111111", image: "" }];
  const activeSizes = sizes.length > 0 ? sizes : ["L"];

  // Helper to safely read entry with alias fallbacks
  const getCellEntry = (col: ColorVariant, sz: string): { qty: number; wholesalePrice: number; salePrice: number } => {
    const k = getInvKey(col.nameAr, col.name, sz);
    if (inventory[k] && typeof inventory[k].qty === "number") {
      return {
        qty: inventory[k].qty,
        wholesalePrice: inventory[k].wholesalePrice || 0,
        salePrice: inventory[k].salePrice || price || 0,
      };
    }
    if (col.name) {
      const kEng = `${col.name.trim()}__${sz.trim()}`;
      if (inventory[kEng] && typeof inventory[kEng].qty === "number") {
        return {
          qty: inventory[kEng].qty,
          wholesalePrice: inventory[kEng].wholesalePrice || 0,
          salePrice: inventory[kEng].salePrice || price || 0,
        };
      }
    }
    if (col.nameAr) {
      const kAr = `${col.nameAr.trim()}__${sz.trim()}`;
      if (inventory[kAr] && typeof inventory[kAr].qty === "number") {
        return {
          qty: inventory[kAr].qty,
          wholesalePrice: inventory[kAr].wholesalePrice || 0,
          salePrice: inventory[kAr].salePrice || price || 0,
        };
      }
    }
    return { qty: 10, wholesalePrice: 0, salePrice: price || 0 };
  };

  // Calculate totals
  let grandTotalQty = 0;
  let totalWholesaleCost = 0;
  let totalRetailValue = 0;

  activeColors.forEach((col) => {
    activeSizes.forEach((sz) => {
      const entry = getCellEntry(col, sz);
      grandTotalQty += entry.qty;
      totalWholesaleCost += entry.qty * entry.wholesalePrice;
      totalRetailValue += entry.qty * (entry.salePrice || price || 0);
    });
  });

  const updateCellQty = (col: ColorVariant, sz: string, newQty: number) => {
    const safeQty = Math.max(0, newQty);
    const cell = getCellEntry(col, sz);
    const kPrimary = getInvKey(col.nameAr, col.name, sz);
    const updatedItem = {
      qty: safeQty,
      wholesalePrice: cell.wholesalePrice,
      salePrice: cell.salePrice || price,
    };

    const nextInv: Record<string, InventoryItem> = {
      ...inventory,
      [kPrimary]: updatedItem,
    };
    if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = updatedItem;
    if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = updatedItem;

    const nextGrandTotal = Object.values(nextInv).reduce((acc, curr) => acc + (Number(curr?.qty) || 0), 0);
    onChange(nextInv, nextGrandTotal > 0);
  };

  const updateCellCost = (col: ColorVariant, sz: string, cost: number) => {
    const safeCost = Math.max(0, cost);
    const cell = getCellEntry(col, sz);
    const kPrimary = getInvKey(col.nameAr, col.name, sz);
    const updatedItem = {
      qty: cell.qty,
      wholesalePrice: safeCost,
      salePrice: cell.salePrice || price,
    };

    const nextInv: Record<string, InventoryItem> = {
      ...inventory,
      [kPrimary]: updatedItem,
    };
    if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = updatedItem;
    if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = updatedItem;

    const nextGrandTotal = Object.values(nextInv).reduce((acc, curr) => acc + (Number(curr?.qty) || 0), 0);
    onChange(nextInv, nextGrandTotal > 0);
  };

  // Bulk Apply to All Cells
  const handleApplyBulkToAll = (qty: number) => {
    const safeQty = Math.max(0, qty);
    const nextInv: Record<string, InventoryItem> = { ...inventory };
    activeColors.forEach((col) => {
      activeSizes.forEach((sz) => {
        const kPrimary = getInvKey(col.nameAr, col.name, sz);
        const cell = getCellEntry(col, sz);
        const updatedItem = {
          qty: safeQty,
          wholesalePrice: cell.wholesalePrice,
          salePrice: price,
        };
        nextInv[kPrimary] = updatedItem;
        if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = updatedItem;
        if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = updatedItem;
      });
    });

    const nextGrandTotal = Object.values(nextInv).reduce((acc, curr) => acc + (Number(curr?.qty) || 0), 0);
    onChange(nextInv, nextGrandTotal > 0);
  };

  // Apply to Specific Color Row
  const handleApplyToColorRow = (col: ColorVariant, qty: number) => {
    const safeQty = Math.max(0, qty);
    const nextInv: Record<string, InventoryItem> = { ...inventory };
    activeSizes.forEach((sz) => {
      const kPrimary = getInvKey(col.nameAr, col.name, sz);
      const cell = getCellEntry(col, sz);
      const updatedItem = {
        qty: safeQty,
        wholesalePrice: cell.wholesalePrice,
        salePrice: cell.salePrice || price,
      };
      nextInv[kPrimary] = updatedItem;
      if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = updatedItem;
      if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = updatedItem;
    });
    const nextGrandTotal = Object.values(nextInv).reduce((acc, curr) => acc + (Number(curr?.qty) || 0), 0);
    onChange(nextInv, nextGrandTotal > 0);
  };

  // Apply to Specific Size Column
  const handleApplyToSizeColumn = (sz: string, qty: number) => {
    const safeQty = Math.max(0, qty);
    const nextInv: Record<string, InventoryItem> = { ...inventory };
    activeColors.forEach((col) => {
      const kPrimary = getInvKey(col.nameAr, col.name, sz);
      const cell = getCellEntry(col, sz);
      const updatedItem = {
        qty: safeQty,
        wholesalePrice: cell.wholesalePrice,
        salePrice: cell.salePrice || price,
      };
      nextInv[kPrimary] = updatedItem;
      if (col.name) nextInv[`${col.name.trim()}__${sz.trim()}`] = updatedItem;
      if (col.nameAr) nextInv[`${col.nameAr.trim()}__${sz.trim()}`] = updatedItem;
    });
    const nextGrandTotal = Object.values(nextInv).reduce((acc, curr) => acc + (Number(curr?.qty) || 0), 0);
    onChange(nextInv, nextGrandTotal > 0);
  };

  return (
    <div className="space-y-4 pt-3 border-t border-neutral-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#d4af37]" />
          <div>
            <h4 className="text-xs font-black text-neutral-900">
              توزيع كميات المخزون المتوفرة على المقاسات والألوان
            </h4>
            <p className="text-[11px] text-neutral-500">
              حدد عدد القطع المتاحة لكل مقاس ولون بدقة ليتم إخفاء المقاسات النافذة تلقائياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCostPrice(!showCostPrice)}
            className="text-[11px] font-bold text-neutral-600 hover:text-neutral-900 underline cursor-pointer"
          >
            {showCostPrice ? "إخفاء سعر التكلفة" : "إظهار سعر التكلفة (اختياري)"}
          </button>
        </div>
      </div>

      {/* Quick Bulk Distribution Toolbar */}
      <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-neutral-800">توزيع كمية موحدة:</span>
          <input
            type="number"
            min="0"
            value={bulkQty}
            onChange={(e) => setBulkQty(Math.max(0, Number(e.target.value)))}
            className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-amber-300 bg-white text-center"
          />
          <button
            type="button"
            onClick={() => handleApplyBulkToAll(bulkQty)}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg cursor-pointer shadow-2xs transition-all active:scale-95"
          >
            تطبيق على كافة المقاسات والألوان
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-neutral-500 font-bold">جاهز:</span>
          {[0, 5, 10, 20, 50].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleApplyBulkToAll(num)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                num === 0
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {num === 0 ? "تصفير (0)" : `${num} قطع`}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Stock Matrix Table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-2xs">
        <table className="w-full text-xs text-start">
          <thead>
            <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-700">
              <th className="p-2.5 text-start font-black">اللون / المقاسات</th>
              {activeSizes.map((sz) => (
                <th key={sz} className="p-2.5 text-center font-black">
                  <div className="flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-neutral-900 text-white rounded-md text-[10px] font-brand">
                      {sz}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyToSizeColumn(sz, bulkQty)}
                      className="text-[9px] text-blue-600 hover:underline mt-0.5 font-normal cursor-pointer"
                      title={`تعيين مقاس ${sz} لكافة الألوان بقيمة ${bulkQty}`}
                    >
                      (ملء {bulkQty})
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2.5 text-center font-black bg-neutral-200/50">مجموع اللون</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {activeColors.map((col, cIdx) => {
              let colorRowQty = 0;
              activeSizes.forEach((sz) => {
                const cell = getCellEntry(col, sz);
                colorRowQty += cell.qty;
              });

              return (
                <tr key={cIdx} className="hover:bg-neutral-50/50 transition-colors">
                  {/* Color Label & Quick Row Fill */}
                  <td className="p-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-neutral-300 shadow-2xs flex-shrink-0"
                        style={{ backgroundColor: col.hex || "#111111" }}
                      />
                      <span className="font-bold text-neutral-900 text-xs">
                        {col.nameAr || col.name || `لون ${cIdx + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyToColorRow(col, bulkQty)}
                        className="text-[9px] text-blue-600 hover:underline font-normal cursor-pointer mr-1"
                        title={`تطبيق ${bulkQty} قطعة لكافة مقاسات هذا اللون`}
                      >
                        (ملء {bulkQty})
                      </button>
                    </div>
                  </td>

                  {/* Quantity Cells */}
                  {activeSizes.map((sz) => {
                    const cell = getCellEntry(col, sz);
                    const currentQty = cell.qty;
                    const isZero = currentQty === 0;

                    return (
                      <td key={sz} className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateCellQty(col, sz, currentQty - 1)}
                            className="w-5 h-5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) =>
                              updateCellQty(col, sz, e.target.value === "" ? 0 : Number(e.target.value))
                            }
                            className={`w-12 py-1 px-1 text-center font-bold text-xs rounded-lg border focus:outline-hidden font-brand transition-colors ${
                              isZero
                                ? "bg-red-50 text-red-600 border-red-300 font-black"
                                : currentQty === 1
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-white text-neutral-900 border-neutral-300 focus:border-neutral-900"
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => updateCellQty(col, sz, currentQty + 1)}
                            className="w-5 h-5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Optional Wholesale Cost Input */}
                        {showCostPrice && (
                          <div className="mt-1 flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="تكلفة"
                              value={cell.wholesalePrice || ""}
                              onChange={(e) => updateCellCost(col, sz, Number(e.target.value))}
                              className="w-14 py-0.5 px-1 text-center text-[10px] rounded border border-neutral-200 bg-neutral-50 text-neutral-600"
                              title="سعر التكلفة للقطعة"
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Total */}
                  <td className="p-2.5 text-center font-black bg-neutral-50 font-brand">
                    <span className={colorRowQty === 0 ? "text-red-500" : "text-neutral-900"}>
                      {colorRowQty} قطعة
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-100/90 border-t border-neutral-200 font-black text-neutral-800">
              <td className="p-2.5 text-start font-black">إجمالي المقاس:</td>
              {activeSizes.map((sz) => {
                let colSum = 0;
                activeColors.forEach((col) => {
                  const cell = getCellEntry(col, sz);
                  colSum += cell.qty;
                });
                return (
                  <td key={sz} className="p-2.5 text-center font-brand text-xs">
                    <span className={colSum === 0 ? "text-red-600" : "text-neutral-900"}>
                      {colSum}
                    </span>
                  </td>
                );
              })}
              <td className="p-2.5 text-center font-brand text-sm bg-neutral-200 text-neutral-950 font-black">
                {grandTotalQty}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Live Inventory Summary Footer Card */}
      <div className="p-3 bg-neutral-900 text-white rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300 font-bold">إجمالي كمية المنتج بالمخزن:</span>
              <span className="text-sm font-black font-brand text-white">{grandTotalQty} قطعة</span>
            </div>
            <p className="text-[10px] text-neutral-400">
              القيمة الإجمالية للبيع:{" "}
              <strong className="text-emerald-400 font-brand">{totalRetailValue.toLocaleString()} ج.م</strong>
              {showCostPrice && totalWholesaleCost > 0 && (
                <span>
                  {" "}
                  | التكلفة:{" "}
                  <strong className="text-amber-400 font-brand">
                    {totalWholesaleCost.toLocaleString()} ج.م
                  </strong>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {grandTotalQty > 0 ? (
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متوفر للطلب في المتجر ({grandTotalQty})</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-black flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>نفد المخزون (Out of stock)</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
