"use client";
import { Package, CheckCircle2, AlertTriangle, IndianRupee } from "lucide-react";

interface Product {
  id: string; stockQuantity: string; pricePerBaseUnit: string; isActive: boolean;
}

interface MetricsCardsProps { products: Product[]; }

export default function MetricsCards({ products }: MetricsCardsProps) {
  const total = products.length;
  const active = products.filter(p => p.isActive).length;
  const outOfStock = products.filter(p => p.isActive && parseFloat(p.stockQuantity) <= 0).length;
  const valuation = products.filter(p => p.isActive).reduce((a, p) => a + parseFloat(p.stockQuantity) * parseFloat(p.pricePerBaseUnit), 0);

  const cards = [
    { label: "Total Products", value: total.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Products", value: active.toString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Out of Stock", value: outOfStock.toString(), icon: AlertTriangle, color: outOfStock > 0 ? "text-red-600" : "text-slate-400", bg: outOfStock > 0 ? "bg-red-50" : "bg-slate-50" },
    { label: "Inventory Value", value: `₹${valuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.label === "Inventory Value" ? "text-slate-900 text-xl" : "text-slate-900"}`}>{c.value}</p>
          </div>
          <div className={`p-3 rounded-xl ${c.bg}`}>
            <c.icon className={`h-5 w-5 ${c.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
