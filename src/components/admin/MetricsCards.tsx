"use client";
import { Package, CheckCircle2, AlertTriangle, IndianRupee, ShoppingCart, FileText } from "lucide-react";

interface Product {
  id: string; stockQuantity: string; pricePerBaseUnit: string; isActive: boolean;
}

interface MetricsCardsProps {
  products: Product[];
  ordersCount: number;
  quotationsCount: number;
}

export default function MetricsCards({ products, ordersCount, quotationsCount }: MetricsCardsProps) {
  const total = products.length;
  const active = products.filter(p => p.isActive).length;
  
  // Define Low Stock Alert: Active products where stock quantity is low (<= 50)
  const lowStock = products.filter(p => p.isActive && parseFloat(p.stockQuantity) <= 50).length;
  
  const valuation = products.filter(p => p.isActive).reduce((a, p) => a + parseFloat(p.stockQuantity) * parseFloat(p.pricePerBaseUnit), 0);

  const cards = [
    { label: "Total Products", value: total.toString(), icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Products", value: active.toString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: ordersCount.toString(), icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Quotations", value: quotationsCount.toString(), icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Low Stock Alerts", value: lowStock.toString(), icon: AlertTriangle, color: lowStock > 0 ? "text-red-600" : "text-slate-400", bg: lowStock > 0 ? "bg-red-50" : "bg-slate-50" },
    { label: "Inventory Value", value: `₹${valuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.label === "Inventory Value" ? "text-slate-900 text-base" : "text-slate-900"}`}>{c.value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${c.bg} shrink-0`}>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
