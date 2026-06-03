"use client";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface DeactivateModalProps {
  open: boolean; productName: string; productId: string;
  onClose: () => void; onSuccess: () => void; showToast: (msg: string) => void;
}

export default function DeactivateModal({ open, productName, productId, onClose, onSuccess, showToast }: DeactivateModalProps) {
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) { showToast(`"${productName}" has been deactivated.`); onClose(); onSuccess(); }
      else { const d = await res.json(); showToast(d.error || "Failed to deactivate."); }
    } catch { showToast("An error occurred."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 bg-red-50 rounded-xl"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Deactivate Product</h3>
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to deactivate <strong className="text-slate-700">&quot;{productName}&quot;</strong>? The product will be hidden from active listings but preserved for historical records.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Cancel</button>
          <button onClick={handleDeactivate} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}
