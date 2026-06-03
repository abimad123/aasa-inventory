"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

interface Product {
  id: string; sku: string; name: string; description: string; category: string;
  baseUnit: string; pricePerBaseUnit: string; stockQuantity: string; isActive: boolean;
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProduct?: Product | null;
  showToast: (msg: string) => void;
}

const CATEGORIES = ["Weight", "Volume", "Count", "Bulk", "Electronics", "General"];

export default function ProductModal({ open, onClose, onSuccess, editProduct, showToast }: ProductModalProps) {
  const isEdit = !!editProduct;
  const [sku, setSku] = useState(""); const [name, setName] = useState("");
  const [desc, setDesc] = useState(""); const [category, setCategory] = useState("General");
  const [baseUnit, setBaseUnit] = useState<"G" | "ML" | "ITEM">("G");
  const [price, setPrice] = useState(""); const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editProduct) {
      setSku(editProduct.sku); setName(editProduct.name);
      setDesc(editProduct.description || ""); setCategory(editProduct.category);
      setBaseUnit(editProduct.baseUnit as "G" | "ML" | "ITEM");
      setPrice(parseFloat(editProduct.pricePerBaseUnit).toString());
      setStock(parseFloat(editProduct.stockQuantity).toString());
      setIsActive(editProduct.isActive);
    } else {
      setSku(""); setName(""); setDesc(""); setCategory("General");
      setBaseUnit("G"); setPrice(""); setStock(""); setIsActive(true);
    }
    setFormError(null);
  }, [editProduct, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!sku || !name || !price || (!isEdit && !stock)) { setFormError("Please fill all required fields."); return; }
    if (Number(price) <= 0) { setFormError("Price must be positive."); return; }
    if (!isEdit && Number(stock) < 0) { setFormError("Stock must be positive."); return; }

    setSubmitting(true);
    try {
      const url = isEdit ? `/api/products/${editProduct.id}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const payload: Record<string, unknown> = {
        sku, name, description: desc, category,
        baseUnit, pricePerBaseUnit: parseFloat(price),
      };
      if (isEdit) { payload.stockQuantity = parseFloat(stock); payload.isActive = isActive; }
      else { payload.stockQuantity = parseFloat(stock); }

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || "Operation failed."); }
      else { showToast(isEdit ? `"${name}" updated successfully.` : `"${name}" created successfully.`); onClose(); onSuccess(); }
    } catch { setFormError("An unexpected error occurred."); }
    finally { setSubmitting(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all";
  const labelCls = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">{isEdit ? "Edit Product" : "Create New Product"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>SKU Code *</label><input type="text" placeholder="e.g. WGT-001" value={sku} onChange={e => setSku(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelCls}>Product Name *</label><input type="text" placeholder="e.g. Gold Connector" value={name} onChange={e => setName(e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Description</label><textarea rows={2} placeholder="Optional product details..." value={desc} onChange={e => setDesc(e.target.value)} className={`${inputCls} resize-none`} /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelCls}>Base Unit *</label>
              <select value={baseUnit} onChange={e => setBaseUnit(e.target.value as "G" | "ML" | "ITEM")} className={inputCls}>
                <option value="G">Grams (G)</option><option value="ML">Milliliters (ML)</option><option value="ITEM">Items</option>
              </select>
            </div>
            <div><label className={labelCls}>Price/Unit (₹) *</label><input type="number" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>{isEdit ? "Stock Qty" : "Initial Stock *"}</label><input type="number" step="0.001" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} className={inputCls} /></div>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-700">Active Status</span>
              <button type="button" onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-green-500" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : ""}`} />
              </button>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg shadow-sm transition-all">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
