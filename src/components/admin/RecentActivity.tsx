"use client";
import { Clock, ArrowDownCircle, ArrowUpCircle, Settings2 } from "lucide-react";

interface Transaction {
  id: string; type: string; quantity: string; createdAt: string; notes: string;
  product: { name: string; sku: string };
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

function getIcon(type: string, notes: string) {
  if (notes?.toLowerCase().includes("deactivated")) return { icon: ArrowDownCircle, color: "text-red-500", bg: "bg-red-50" };
  if (notes?.toLowerCase().includes("created") || type === "IN") return { icon: ArrowUpCircle, color: "text-green-500", bg: "bg-green-50" };
  if (type === "OUT") return { icon: ArrowDownCircle, color: "text-amber-500", bg: "bg-amber-50" };
  return { icon: Settings2, color: "text-blue-500", bg: "bg-blue-50" };
}

function getLabel(type: string, notes: string): string {
  if (notes?.toLowerCase().includes("deactivated")) return "Product Deactivated";
  if (notes?.toLowerCase().includes("created") || (type === "IN" && notes?.toLowerCase().includes("initial"))) return "Product Created";
  if (notes?.toLowerCase().includes("edit") || type === "ADJUSTMENT") return "Inventory Adjusted";
  if (type === "OUT") return "Stock Deducted";
  return "Stock Updated";
}

interface RecentActivityProps { transactions: Transaction[]; loading: boolean; }

export default function RecentActivity({ transactions, loading }: RecentActivityProps) {
  const recent = transactions.slice(0, 6);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="flex-1"><div className="h-3 w-24 bg-slate-100 rounded mb-1.5" /><div className="h-2.5 w-32 bg-slate-50 rounded" /></div>
            </div>
          ))
        ) : recent.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
        ) : (
          recent.map((t) => {
            const { icon: Icon, color, bg } = getIcon(t.type, t.notes);
            return (
              <div key={t.id} className="flex items-center gap-3 group">
                <div className={`p-1.5 rounded-lg ${bg} shrink-0`}><Icon className={`h-4 w-4 ${color}`} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{getLabel(t.type, t.notes)}</p>
                  <p className="text-xs text-slate-400 truncate">{t.product?.name || "Unknown"}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(t.createdAt)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
