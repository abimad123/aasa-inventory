"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  History,
  Plus,
  Search,
  LogOut,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Coins
} from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  baseUnit: string;
  pricePerBaseUnit: string;
  stockQuantity: string;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  productId: string;
  type: string;
  quantity: string;
  createdAt: string;
  notes: string;
  product: { name: string; sku: string };
  user: { name: string; email: string };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation tabs: 'products' | 'logs'
  const [activeTab, setActiveTab] = useState<"products" | "logs">("products");

  // State for data
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Create Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Weight");
  const [newUnit, setNewUnit] = useState<"g" | "mL" | "item">("g");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      fetchProducts();
      fetchTransactions();
    }
  }, [status, router]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newSku || !newName || !newPrice || !newStock) {
      setFormError("All marked fields are required.");
      return;
    }

    setSubmittingProduct(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newSku,
          name: newName,
          description: newDesc,
          category: newCategory,
          baseUnit: newUnit === "mL" ? "ML" : newUnit.toUpperCase(),
          pricePerBaseUnit: parseFloat(newPrice),
          stockQuantity: parseFloat(newStock),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create product.");
      } else {
        showToast(`Product "${newName}" created successfully.`);
        setShowAddModal(false);
        // Reset form
        setNewSku("");
        setNewName("");
        setNewDesc("");
        setNewPrice("");
        setNewStock("");
        // Reload statistics and data
        fetchProducts();
        fetchTransactions();
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-slate-400">Loading system admin...</p>
        </div>
      </div>
    );
  }

  // Filter products based on search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute Metrics
  const totalProductsCount = products.length;
  const outOfStockCount = products.filter((p) => parseFloat(p.stockQuantity) <= 0).length;
  const totalValuation = products.reduce((acc, p) => {
    return acc + parseFloat(p.stockQuantity) * parseFloat(p.pricePerBaseUnit);
  }, 0);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Dynamic Toast System */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Grid Layout Container */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Header Block */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Premium SaaS Enterprise
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Aasa Core Panel
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <p className="text-xs text-slate-500">{session?.user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all duration-200"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Metric Overview Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Products</p>
              <h3 className="text-3xl font-bold text-white mt-2 font-mono">{totalProductsCount}</h3>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl text-indigo-400 border border-slate-800/60">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Out of Stock</p>
              <h3 className={`text-3xl font-bold mt-2 font-mono ${outOfStockCount > 0 ? "text-rose-500" : "text-white"}`}>
                {outOfStockCount}
              </h3>
            </div>
            <div className={`p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 ${outOfStockCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stock Valuation</p>
              <h3 className="text-3xl font-bold text-white mt-2 font-mono">
                ${totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl text-emerald-400 border border-slate-800/60">
              <Coins className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Security State</p>
              <h3 className="text-lg font-bold text-emerald-400 mt-3 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                Protected
              </h3>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl text-blue-400 border border-slate-800/60">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* Navigation Tabs and Quick Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "products"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Package className="h-4 w-4" />
              Products List
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === "logs"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="h-4 w-4" />
              Audit Transaction Logs
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === "products" && (
              <>
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search SKU or Name..."
                    className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-900 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </>
            )}

            {activeTab === "logs" && (
              <button
                onClick={fetchTransactions}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Logs
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents: Products List */}
        {activeTab === "products" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Product details</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Price per unit</th>
                    <th className="px-6 py-4 text-right">Stock Quantity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-sm">
                  {loadingProducts ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 ml-auto bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 ml-auto bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-14 mx-auto bg-slate-800/80 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No products found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const stockVal = parseFloat(product.stockQuantity);
                      const isLow = stockVal <= 0;
                      return (
                        <tr key={product.id} className="hover:bg-slate-900/20 transition-all">
                          <td className="px-6 py-4 font-medium text-white">
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{product.sku}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-white">
                            ${parseFloat(product.pricePerBaseUnit).toFixed(2)}
                            <span className="text-xs text-slate-500 font-sans ml-1">/{product.baseUnit}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-mono font-semibold ${isLow ? "text-rose-500" : "text-emerald-400"}`}>
                              {parseFloat(product.stockQuantity).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 font-sans ml-1">{product.baseUnit}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                product.isActive ? "bg-emerald-500" : "bg-slate-600"
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Contents: Audit Logs */}
        {activeTab === "logs" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Quantity change</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-sm">
                  {loadingLogs ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-16 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 ml-auto bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-20 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-slate-800/80 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        No transactions registered yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((log) => {
                      const isDeduction = log.type === "DEDUCTION";
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/20 transition-all text-xs sm:text-sm">
                          <td className="px-6 py-4 text-slate-400 font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-white">{log.product?.name || "Deleted Product"}</p>
                              <p className="text-xs text-slate-500 font-mono">{log.product?.sku}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                log.type === "INITIAL"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : isDeduction
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              }`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-mono font-semibold ${isDeduction ? "text-amber-400" : "text-emerald-400"}`}>
                            {isDeduction ? "-" : "+"}
                            {parseFloat(log.quantity).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <div>
                              <p className="font-medium">{log.user?.name || "System"}</p>
                              <p className="text-xs text-slate-500">{log.user?.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 italic max-w-xs truncate">{log.notes}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modern Dialog Modal: Add Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl -z-10" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Create New Product</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-all text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WGT-GOLD-10"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  >
                    <option value="Weight">Weight</option>
                    <option value="Volume">Volume</option>
                    <option value="Count">Count</option>
                    <option value="Bulk">Bulk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gold Plated Connector"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  placeholder="Additional product specifications..."
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Base Unit *
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as "g" | "mL" | "item")}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  >
                    <option value="g">grams (g)</option>
                    <option value="mL">milliliters (mL)</option>
                    <option value="item">items (item)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Price/Unit *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 text-white rounded-xl shadow-lg transition-all"
                >
                  {submittingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}