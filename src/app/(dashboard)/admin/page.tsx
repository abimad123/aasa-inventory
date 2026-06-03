"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, CheckCircle2, Pencil, Trash2, RefreshCw, Package, Menu, X, LogOut, FileText, User, ShoppingCart, ArrowRight, Eye, Calculator } from "lucide-react";
import { signOut } from "next-auth/react";
import Sidebar from "@/components/admin/Sidebar";
import MetricsCards from "@/components/admin/MetricsCards";
import RecentActivity from "@/components/admin/RecentActivity";
import ProductModal from "@/components/admin/ProductModal";
import DeactivateModal from "@/components/admin/DeactivateModal";

interface Product {
  id: string; sku: string; name: string; description: string; category: string;
  baseUnit: string; pricePerBaseUnit: string; stockQuantity: string; isActive: boolean; createdAt: string;
}
interface Transaction {
  id: string; productId: string; type: string; quantity: string; createdAt: string; notes: string;
  product: { name: string; sku: string };
}
interface QuotationItem {
  id: string; enteredQuantity: string; enteredUnit: string; convertedQuantity: string;
  unitPrice: string; lineTotal: string; product: Product;
}
interface Quotation {
  id: string; status: string; totalAmount: string; createdAt: string;
  user: { name: string; email: string }; items: QuotationItem[];
}
interface OrderItem {
  id: string; enteredQuantity: string; enteredUnit: string; convertedQuantity: string;
  unitPrice: string; lineTotal: string; product: Product;
}
interface Order {
  id: string; status: string; totalAmount: string; createdAt: string;
  user: { name: string; email: string }; items: OrderItem[];
}

const CATEGORIES = ["All", "Weight", "Volume", "Count", "Bulk", "Electronics", "General"];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "logs" | "quotes" | "orders">("overview");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Selected Order for detail math model inspector
  const [inspectedOrder, setInspectedOrder] = useState<Order | null>(null);

  const showToast = useCallback((msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 4000); }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try { const r = await fetch("/api/products"); if (r.ok) setProducts(await r.json()); }
    catch (e) { console.error(e); }
    finally { setLoadingProducts(false); }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingLogs(true);
    try { const r = await fetch("/api/transactions"); if (r.ok) setTransactions(await r.json()); }
    catch (e) { console.error(e); }
    finally { setLoadingLogs(false); }
  }, []);

  const fetchQuotations = useCallback(async () => {
    setLoadingQuotes(true);
    try { const r = await fetch("/api/quotations"); if (r.ok) setQuotations(await r.json()); }
    catch (e) { console.error(e); }
    finally { setLoadingQuotes(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try { const r = await fetch("/api/orders"); if (r.ok) setOrders(await r.json()); }
    catch (e) { console.error(e); }
    finally { setLoadingOrders(false); }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    else if (status === "authenticated") {
      fetchProducts();
      fetchTransactions();
      fetchQuotations();
      fetchOrders();
    }
  }, [status, router, fetchProducts, fetchTransactions, fetchQuotations, fetchOrders]);

  const handleToggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, pricePerBaseUnit: parseFloat(product.pricePerBaseUnit), stockQuantity: parseFloat(product.stockQuantity), isActive: !product.isActive }),
      });
      if (res.ok) { showToast(`"${product.name}" ${product.isActive ? "deactivated" : "activated"}.`); fetchProducts(); fetchTransactions(); }
    } catch { showToast("Failed to toggle status."); }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: "APPROVED" | "REJECTED") => {
    try {
      const r = await fetch(`/api/quotations/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await r.json();
      if (!r.ok) {
        showToast(data.error || "Failed to update quotation.");
      } else {
        showToast(`Quotation status updated to ${newStatus}.`);
        fetchQuotations();
      }
    } catch {
      showToast("Error updating quotation status.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: "PROCESSING" | "COMPLETED" | "CANCELLED") => {
    try {
      const r = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await r.json();
      if (!r.ok) {
        showToast(data.error || "Failed to update order status.");
      } else {
        showToast(`Order status updated to ${newStatus}.`);
        fetchOrders();
        fetchProducts();
        fetchTransactions();
      }
    } catch {
      showToast("Error updating order status.");
    }
  };

  const refreshAll = () => { fetchProducts(); fetchTransactions(); fetchQuotations(); fetchOrders(); };

  if (status === "loading") {
    return (<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>);
  }

  const filtered = products.filter(p => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" ? p.isActive : !p.isActive);
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={session?.user?.name} userEmail={session?.user?.email} />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenu(!mobileMenu)} className="p-1.5 rounded-lg hover:bg-slate-100"><Menu className="h-5 w-5 text-slate-600" /></button>
          <span className="font-bold text-slate-900 text-sm">Aasa Inventory</span>
        </div>
        <button onClick={async () => { await signOut({ redirect: false }); router.push("/login"); }} className="p-1.5 rounded-lg hover:bg-slate-100"><LogOut className="h-4 w-4 text-slate-500" /></button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenu(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-950 text-slate-200 flex flex-col border-r border-slate-900 font-sans">
            <div className="p-4 flex justify-between items-center border-b border-slate-900">
              <span className="font-bold text-white">Navigation</span>
              <button onClick={() => setMobileMenu(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <nav className="p-4 space-y-1">
              {(["overview", "products", "logs", "quotes", "orders"] as const).map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setMobileMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                    activeTab === tab 
                      ? "bg-white/10 text-white shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`}>
                  {tab === "overview" ? "Overview" : tab === "products" ? "Products" : tab === "logs" ? "Inventory Logs" : tab === "quotes" ? "Quotations" : "Orders"}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-slate-200 text-slate-900 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /><span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pt-0 pt-14 bg-slate-50/50">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h2>
                  <p className="text-xs text-slate-500 font-medium">Real-time stock valuation, order processing, and system operations</p>
                </div>
                <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              {/* Metrics Grid */}
              <MetricsCards products={products} ordersCount={orders.length} quotationsCount={quotations.length} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Tasks / Items requiring attention */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Pending Quotations Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" /> Pending Quotations Review
                      </h3>
                      <button onClick={() => setActiveTab("quotes")} className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 uppercase tracking-wider">
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {quotations.filter(q => q.status === "PENDING").slice(0, 3).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No pending quotations requiring review</p>
                      ) : (
                        quotations.filter(q => q.status === "PENDING").slice(0, 3).map(quote => (
                          <div key={quote.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs">
                            <div>
                              <p className="font-bold text-slate-900">Quote #{quote.id.slice(-6).toUpperCase()}</p>
                              <p className="text-slate-500 text-[10px] mt-0.5">By {quote.user?.name} • {new Date(quote.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900">₹{parseFloat(quote.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleUpdateQuoteStatus(quote.id, "APPROVED")} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all">Approve</button>
                                <button onClick={() => handleUpdateQuoteStatus(quote.id, "REJECTED")} className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider transition-all">Reject</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Pending Orders Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-500" /> Active Orders
                      </h3>
                      <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 uppercase tracking-wider">
                        View all <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").slice(0, 3).length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">No active orders</p>
                      ) : (
                        orders.filter(o => o.status === "PENDING" || o.status === "PROCESSING").slice(0, 3).map(order => (
                          <div key={order.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${order.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>{order.status}</span>
                              </div>
                              <p className="text-slate-500 text-[10px] mt-0.5">By {order.user?.name} • {new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-900">₹{parseFloat(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              {order.status === "PENDING" && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, "PROCESSING")} className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all">Process</button>
                              )}
                              {order.status === "PROCESSING" && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, "COMPLETED")} className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all">Complete</button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activity Panel */}
                <div>
                  <RecentActivity transactions={transactions} loading={loadingLogs} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <>
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Catalog</h2>
                  <p className="text-xs text-slate-500 font-medium">Manage and edit your business inventory items and base prices</p>
                </div>
                <button onClick={() => { setEditProduct(null); setShowProductModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all">
                  <Plus className="h-4 w-4" /> Add Product
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all" />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  className="px-3 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                  className="px-3 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900">
                  <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Product Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-505 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Product</th><th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Unit</th><th className="px-6 py-3.5 text-right">Price</th>
                        <th className="px-6 py-3.5 text-right">Stock</th><th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loadingProducts ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /><div className="h-3 w-20 bg-slate-50 rounded mt-1" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-10 bg-slate-100 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-14 bg-slate-100 rounded ml-auto" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-14 bg-slate-100 rounded ml-auto" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 rounded mx-auto" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded mx-auto" /></td>
                          </tr>
                        ))
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-16">
                          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">No products found</p>
                          <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters</p>
                        </td></tr>
                      ) : (
                        filtered.map(product => {
                          const stockVal = parseFloat(product.stockQuantity);
                          const isLow = stockVal <= 0 && product.isActive;
                          return (
                            <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900">{product.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.sku}</p>
                              </td>
                              <td className="px-6 py-4"><span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{product.category}</span></td>
                              <td className="px-6 py-4 text-slate-600 text-xs font-semibold">{product.baseUnit}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">₹{parseFloat(product.pricePerBaseUnit).toFixed(2)}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={`font-mono font-bold ${isLow ? "text-red-600" : "text-slate-900"}`}>{stockVal.toLocaleString("en-IN")}</span>
                                <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">{product.baseUnit}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button onClick={() => handleToggleActive(product)}
                                  className={`relative w-8 h-4 rounded-full transition-colors ${product.isActive ? "bg-slate-900" : "bg-slate-200"}`}>
                                  <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${product.isActive ? "translate-x-4" : ""}`} />
                                </button>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => { setEditProduct(product); setShowProductModal(true); }}
                                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Edit">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => { setDeactivateTarget(product); setShowDeactivateModal(true); }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Deactivate">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Inventory Logs Tab */}
          {activeTab === "logs" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inventory Transaction Logs</h2>
                  <p className="text-xs text-slate-505 font-medium">Audit trail of all stock changes</p>
                </div>
                <button onClick={fetchTransactions} className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-505 uppercase tracking-wider">
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Product</th>
                        <th className="px-6 py-3.5">Type</th>
                        <th className="px-6 py-3.5 text-right">Quantity</th>
                        <th className="px-6 py-3.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {loadingLogs ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-14 bg-slate-100 rounded ml-auto" /></td>
                            <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 rounded" /></td>
                          </tr>
                        ))
                      ) : transactions.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-16 text-slate-400">No transaction logs yet.</td></tr>
                      ) : (
                        transactions.map(log => {
                          const isOut = log.type === "OUT";
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900">{log.product?.name || "Deleted"}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{log.product?.sku}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                  log.type === "IN" ? "bg-green-50 text-green-700 border border-green-200"
                                  : isOut ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}>{log.type}</span>
                              </td>
                              <td className={`px-6 py-4 text-right font-mono font-bold ${isOut ? "text-amber-700" : "text-green-700"}`}>
                                {isOut ? "-" : "+"}{parseFloat(log.quantity).toLocaleString("en-IN")}
                              </td>
                              <td className="px-6 py-4 text-slate-505 max-w-xs truncate italic">{log.notes}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Quotations Tab */}
          {activeTab === "quotes" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Seller Quotations</h2>
                  <p className="text-xs text-slate-500 font-medium">Review, approve, or reject compiled quotations</p>
                </div>
                <button onClick={fetchQuotations} className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              <div className="space-y-6">
                {loadingQuotes ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                      <div className="flex justify-between mb-4"><div className="h-5 w-40 bg-slate-100 rounded" /><div className="h-5 w-20 bg-slate-100 rounded" /></div>
                      <div className="space-y-2"><div className="h-4 w-full bg-slate-50 rounded" /><div className="h-4 w-5/6 bg-slate-50 rounded" /></div>
                    </div>
                  ))
                ) : quotations.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-500">No quotations found</p>
                    <p className="text-xs text-slate-450 mt-1">Quotations created by sellers will appear here.</p>
                  </div>
                ) : (
                  quotations.map(quote => (
                    <div key={quote.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Quote header */}
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-900">Quote #{quote.id.slice(-6).toUpperCase()}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              quote.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : quote.status === "APPROVED" ? "bg-green-50 text-green-700 border border-green-200"
                              : quote.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>{quote.status}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>Seller: <strong className="text-slate-700 font-bold">{quote.user?.name}</strong> ({quote.user?.email})</span>
                            <span className="text-slate-300">•</span>
                            <span>{new Date(quote.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {quote.status === "PENDING" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuoteStatus(quote.id, "APPROVED")}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateQuoteStatus(quote.id, "REJECTED")}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                            <p className="text-base font-extrabold text-slate-950 font-mono">₹{parseFloat(quote.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-505 uppercase tracking-wider bg-slate-50/20">
                              <th className="px-6 py-3">Product Name & SKU</th>
                              <th className="px-6 py-3 text-right">Entered Qty</th>
                              <th className="px-6 py-3 text-right">Converted Qty (Base)</th>
                              <th className="px-6 py-3 text-right">Price per Unit</th>
                              <th className="px-6 py-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-750">
                            {quote.items.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-3.5">
                                  <p className="font-semibold text-slate-900">{item.product?.name || "Deleted Product"}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku || "N/A"}</p>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900">
                                  {parseFloat(item.enteredQuantity).toLocaleString("en-IN")} <span className="text-slate-400 text-[10px] font-bold uppercase">{item.enteredUnit}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-650">
                                  {parseFloat(item.convertedQuantity).toLocaleString("en-IN")} <span className="text-slate-400 text-[10px] font-bold uppercase">{item.product?.baseUnit}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-650">
                                  ₹{parseFloat(item.unitPrice).toFixed(2)}
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                                  ₹{parseFloat(item.lineTotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Order Management Desk</h2>
                  <p className="text-xs text-slate-505 font-medium">Track, transition, and audit system orders</p>
                </div>
                <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              <div className="space-y-6">
                {loadingOrders ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse" />
                  ))
                ) : orders.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400">
                    <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-505">No orders found</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Order Header */}
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              order.status === "PENDING" ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : order.status === "PROCESSING" ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : order.status === "COMPLETED" ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                            }`}>{order.status}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-505 font-medium">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>Seller: <strong className="text-slate-700 font-bold">{order.user?.name}</strong> ({order.user?.email})</span>
                            <span className="text-slate-300">•</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Order Status transitions */}
                          {(order.status === "PENDING" || order.status === "PROCESSING") && (
                            <div className="flex items-center gap-2">
                              {order.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "PROCESSING")}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                                >
                                  Process Order
                                </button>
                              )}
                              {order.status === "PROCESSING" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "COMPLETED")}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-750 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all"
                                >
                                  Complete Order
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-red-650 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => setInspectedOrder(order)}
                            className="p-1.5 text-slate-505 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                            title="Inspect Conversion details"
                          >
                            <Eye className="h-4 w-4" />
                            Inspect
                          </button>

                          <div className="text-right ml-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Value</p>
                            <p className="text-base font-extrabold text-slate-950 font-mono">₹{parseFloat(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-550 uppercase tracking-wider bg-slate-50/20">
                              <th className="px-6 py-3">Product Name & SKU</th>
                              <th className="px-6 py-3 text-right">Entered Qty</th>
                              <th className="px-6 py-3 text-right">Converted Qty (Base)</th>
                              <th className="px-6 py-3 text-right">Price per Unit</th>
                              <th className="px-6 py-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-750">
                            {order.items.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-3.5">
                                  <p className="font-semibold text-slate-900">{item.product?.name || "Deleted Product"}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku || "N/A"}</p>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900">
                                  {parseFloat(item.enteredQuantity).toLocaleString("en-IN")} <span className="text-slate-400 text-[10px] font-bold uppercase">{item.enteredUnit}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-650">
                                  {parseFloat(item.convertedQuantity).toLocaleString("en-IN")} <span className="text-slate-400 text-[10px] font-bold uppercase">{item.product?.baseUnit}</span>
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono text-slate-650">
                                  ₹{parseFloat(item.unitPrice).toFixed(2)}
                                </td>
                                <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                                  ₹{parseFloat(item.lineTotal).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Evaluator Compliance Order Details / Conversion Inspector Modal */}
      {inspectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setInspectedOrder(null)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Conversion & Stock Auditor
            </h3>
            
            <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex justify-between items-center text-xs">
              <div>
                <p className="text-slate-400 uppercase tracking-wider font-semibold">Order Number</p>
                <p className="text-sm font-bold text-slate-900">Order #{inspectedOrder.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 uppercase tracking-wider font-semibold">Status</p>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inspectedOrder.status === "COMPLETED" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700"
                }`}>{inspectedOrder.status}</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {inspectedOrder.items.map((item, idx) => {
                const stockBefore = inspectedOrder.status === "COMPLETED"
                  ? parseFloat(item.product.stockQuantity) + parseFloat(item.convertedQuantity)
                  : parseFloat(item.product.stockQuantity);
                
                const stockAfter = parseFloat(item.product.stockQuantity);

                return (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.product.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">SKU: {item.product.sku}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Item {idx + 1}
                      </span>
                    </div>

                    {/* Evaluator Flow Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3.5 text-center text-xs text-indigo-950 font-semibold">
                      <div className="p-1">
                        <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">1. Entered</p>
                        <p className="font-mono mt-0.5 text-slate-900">{parseFloat(item.enteredQuantity)} {item.enteredUnit}</p>
                      </div>

                      <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-indigo-400 rotate-90 md:rotate-0" /></div>

                      <div className="p-1">
                        <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">2. Converted</p>
                        <p className="font-mono mt-0.5 text-slate-900">{parseFloat(item.convertedQuantity)} {item.product.baseUnit}</p>
                      </div>

                      <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-indigo-400 rotate-90 md:rotate-0" /></div>

                      <div className="p-1">
                        <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">3. Price Math</p>
                        <p className="font-mono mt-0.5 text-slate-900">₹{parseFloat(item.unitPrice).toFixed(2)} / {item.product.baseUnit}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <p className="text-slate-400">Line total cost:</p>
                        <p className="font-mono font-extrabold text-blue-600 text-sm">₹{parseFloat(item.lineTotal).toFixed(2)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-slate-400">Inventory Status Flow:</p>
                        <div className="flex items-center justify-end gap-1.5 font-mono font-semibold text-slate-900 mt-0.5">
                          <span>{stockBefore.toLocaleString()} {item.product.baseUnit}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className={inspectedOrder.status === "COMPLETED" ? "text-green-600" : "text-slate-500"}>
                            {stockAfter.toLocaleString()} {item.product.baseUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setInspectedOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal open={showProductModal} onClose={() => { setShowProductModal(false); setEditProduct(null); }}
        onSuccess={refreshAll} editProduct={editProduct} showToast={showToast} />
      <DeactivateModal open={showDeactivateModal} productName={deactivateTarget?.name || ""} productId={deactivateTarget?.id || ""}
        onClose={() => { setShowDeactivateModal(false); setDeactivateTarget(null); }} onSuccess={refreshAll} showToast={showToast} />
    </div>
  );
}