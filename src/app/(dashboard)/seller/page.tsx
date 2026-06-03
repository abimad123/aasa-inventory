"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileText,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Calculator,
  AlertTriangle,
  Loader2,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Clock
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
}

interface DraftItem {
  product: Product;
  enteredQuantity: number;
  enteredUnit: "g" | "kg" | "mL" | "L" | "item";
  unitPrice: number;
}

interface OrderItem {
  id: string;
  enteredQuantity: string;
  enteredUnit: string;
  unitPrice: string;
  lineTotal: string;
  product: Product;
}

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: OrderItem[];
}

interface QuotationItem {
  id: string;
  enteredQuantity: string;
  enteredUnit: string;
  unitPrice: string;
  lineTotal: string;
  product: Product;
}

interface Quotation {
  id: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  items: QuotationItem[];
}

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tabs: 'builder' | 'past_orders' | 'past_quotes'
  const [activeTab, setActiveTab] = useState<"builder" | "past_orders" | "past_quotes">("builder");

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [pastQuotes, setPastQuotes] = useState<Quotation[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(true);

  // Search & Builder State
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputQty, setInputQty] = useState("");
  const [inputUnit, setInputUnit] = useState<"g" | "kg" | "mL" | "L" | "item">("g");
  const [inputPrice, setInputPrice] = useState("");

  // Draft List (Order / Quotation Items)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  // Action status state
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
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
        // Only active products can be sold
        setProducts(data.filter((p: Product) => p.isActive));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchPastOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setPastOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPastQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await fetch("/api/quotations");
      if (res.ok) {
        const data = await res.json();
        setPastQuotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated") {
      fetchProducts();
      fetchPastOrders();
      fetchPastQuotes();
    }
  }, [status, router]);

  // Set default price and unit when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      setInputPrice(parseFloat(selectedProduct.pricePerBaseUnit).toFixed(2));
      // Guess default unit
      if (selectedProduct.baseUnit === "g") setInputUnit("g");
      else if (selectedProduct.baseUnit === "mL") setInputUnit("mL");
      else setInputUnit("item");
    }
  }, [selectedProduct]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Convert entered unit to base unit for display/checking
  const calculateBaseQuantity = (qty: number, unit: string) => {
    if (unit === "kg" || unit === "L") {
      return qty * 1000;
    }
    return qty;
  };

  const handleAddDraftItem = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!selectedProduct || !inputQty || !inputPrice) {
      setActionError("Please select a product and enter a quantity.");
      return;
    }

    const qty = parseFloat(inputQty);
    const price = parseFloat(inputPrice);

    if (isNaN(qty) || qty <= 0) {
      setActionError("Quantity must be a positive number.");
      return;
    }

    if (isNaN(price) || price < 0) {
      setActionError("Price must be a valid positive number.");
      return;
    }

    // Check if item is already in draft
    const existsIndex = draftItems.findIndex((item) => item.product.id === selectedProduct.id);
    if (existsIndex > -1) {
      setActionError(`Product "${selectedProduct.name}" is already in draft. Remove it first to re-add.`);
      return;
    }

    const newDraftItem: DraftItem = {
      product: selectedProduct,
      enteredQuantity: qty,
      enteredUnit: inputUnit,
      unitPrice: price,
    };

    setDraftItems([...draftItems, newDraftItem]);
    setSelectedProduct(null);
    setInputQty("");
    setSearchProductQuery("");
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  const handleCreateQuotation = async () => {
    if (draftItems.length === 0) return;
    setSubmittingAction(true);
    setActionError(null);

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: draftItems.map((item) => ({
            productId: item.product.id,
            enteredQuantity: item.enteredQuantity,
            enteredUnit: item.enteredUnit.toUpperCase(),
            unitPrice: item.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to create quotation.");
      } else {
        showToast("Quotation compiled and saved successfully.");
        setDraftItems([]);
        fetchPastQuotes();
        setActiveTab("past_quotes");
      }
    } catch {
      setActionError("An error occurred while compiling quotation.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateOrder = async () => {
    if (draftItems.length === 0) return;
    setSubmittingAction(true);
    setActionError(null);

    // Verify stock locally first for user experience
    for (const item of draftItems) {
      const baseQty = calculateBaseQuantity(item.enteredQuantity, item.enteredUnit);
      const stock = parseFloat(item.product.stockQuantity);
      if (baseQty > stock) {
        setActionError(
          `Insufficient stock for "${item.product.name}". Required: ${baseQty} ${item.product.baseUnit}, Available: ${stock} ${item.product.baseUnit}.`
        );
        setSubmittingAction(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: draftItems.map((item) => ({
            productId: item.product.id,
            enteredQuantity: item.enteredQuantity,
            enteredUnit: item.enteredUnit.toUpperCase(),
            unitPrice: item.unitPrice,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to create order.");
      } else {
        showToast("Order completed successfully. Inventory stock updated.");
        setDraftItems([]);
        fetchProducts(); // Refresh stocks
        fetchPastOrders();
        setActiveTab("past_orders");
      }
    } catch {
      setActionError("An error occurred while completing order.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-slate-400">Loading system agent...</p>
        </div>
      </div>
    );
  }

  // Calculate Draft Summary
  const draftSubtotal = draftItems.reduce((acc, item) => acc + item.enteredQuantity * item.unitPrice, 0);

  // Filter dropdown products
  const filteredProductDropdown = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans relative antialiased selection:bg-blue-500/30 selection:text-blue-200">
      {/* Radial ambient background lights */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Dynamic Toast System */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8">
        {/* Header Block */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Premium SaaS Sales Desk
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Aasa Sales Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <p className="text-xs text-slate-500">{session?.user?.role} Account</p>
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

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 w-full sm:w-max mb-6">
          <button
            onClick={() => setActiveTab("builder")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "builder"
                ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Order & Quote Desk
          </button>
          <button
            onClick={() => setActiveTab("past_orders")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "past_orders"
                ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            My Past Orders
          </button>
          <button
            onClick={() => setActiveTab("past_quotes")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "past_quotes"
                ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            My Past Quotes
          </button>
        </div>

        {/* Tab 1: Builder Desk */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Builder */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selector form */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  Select Item Inputs
                </h3>

                {actionError && (
                  <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <form onSubmit={handleAddDraftItem} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Find Product SKU or Name
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search product inventory..."
                        value={searchProductQuery}
                        onChange={(e) => {
                          setSearchProductQuery(e.target.value);
                          if (selectedProduct) setSelectedProduct(null);
                        }}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />

                      {/* Dropdown list */}
                      {searchProductQuery && !selectedProduct && (
                        <div className="absolute left-0 right-0 z-40 bg-slate-900 border border-slate-850 mt-1 max-h-48 overflow-y-auto rounded-xl shadow-2xl divide-y divide-slate-800">
                          {loadingProducts ? (
                            <div className="p-3 text-xs text-slate-500">Searching products...</div>
                          ) : filteredProductDropdown.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500">No active products found</div>
                          ) : (
                            filteredProductDropdown.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setSearchProductQuery(`${p.name} (${p.sku})`);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-800/60 text-white flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-semibold">{p.name}</span>
                                  <span className="text-slate-500 font-mono ml-2 text-xs">SKU: {p.sku}</span>
                                </div>
                                <span className="text-slate-400 font-medium text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                                  Qty: {parseFloat(p.stockQuantity).toLocaleString()} {p.baseUnit}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/40 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Enter Quantity
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="e.g. 5"
                          value={inputQty}
                          onChange={(e) => setInputQty(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Select Unit
                        </label>
                        <select
                          value={inputUnit}
                          onChange={(e) => setInputUnit(e.target.value as "g" | "kg" | "mL" | "L" | "item")}
                          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        >
                          {selectedProduct.baseUnit === "g" && (
                            <>
                              <option value="g">Grams (g)</option>
                              <option value="kg">Kilograms (kg)</option>
                            </>
                          )}
                          {selectedProduct.baseUnit === "mL" && (
                            <>
                              <option value="mL">Milliliters (mL)</option>
                              <option value="L">Liters (L)</option>
                            </>
                          )}
                          {selectedProduct.baseUnit === "item" && (
                            <option value="item">Items (item)</option>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inputPrice}
                          onChange={(e) => setInputPrice(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                      </div>

                      {/* Display Base Unit Conversion Helper */}
                      {inputQty && (
                        <div className="col-span-1 sm:col-span-3 text-xs bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl text-slate-400 flex items-center justify-between">
                          <span>
                            Converts to base:{" "}
                            <strong className="text-white font-mono">
                              {calculateBaseQuantity(parseFloat(inputQty) || 0, inputUnit).toLocaleString()}
                            </strong>{" "}
                            {selectedProduct.baseUnit}
                          </span>
                          <span>
                            Available stock:{" "}
                            <strong className="text-white font-mono">
                              {parseFloat(selectedProduct.stockQuantity).toLocaleString()}
                            </strong>{" "}
                            {selectedProduct.baseUnit}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProduct && (
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-200 rounded-xl transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Add to draft
                    </button>
                  )}
                </form>
              </div>

              {/* Draft Inventory Table list */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur">
                <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/20 flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Draft Items</h3>
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full font-medium">
                    {draftItems.length} lines
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3 text-right">Entered Qty</th>
                        <th className="px-6 py-3 text-right">Unit Price</th>
                        <th className="px-6 py-3 text-right">Line Total</th>
                        <th className="px-6 py-3 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-sm">
                      {draftItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-500">
                            Search and select products above to compile a sale or quote.
                          </td>
                        </tr>
                      ) : (
                        draftItems.map((item, index) => {
                          const total = item.enteredQuantity * item.unitPrice;
                          return (
                            <tr key={item.product.id} className="hover:bg-slate-900/20 transition-all">
                              <td className="px-6 py-4 font-semibold text-white">
                                <div>
                                  <p>{item.product.name}</p>
                                  <p className="text-xs text-slate-500 font-mono font-normal mt-0.5">
                                    SKU: {item.product.sku}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-slate-300">
                                {item.enteredQuantity} <span className="text-xs text-slate-500">{item.enteredUnit}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-slate-300">
                                ${item.unitPrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-semibold text-white">
                                ${total.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDraftItem(index)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-950/60 hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Invoice Summary */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur flex flex-col justify-between h-max relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl -z-10" />
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-400" />
                  Bill Details
                </h3>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total lines</span>
                    <span className="font-mono text-white">{draftItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax estimate (0%)</span>
                    <span className="font-mono text-slate-500">$0.00</span>
                  </div>
                  <div className="border-t border-slate-800/80 pt-4 flex justify-between items-end">
                    <span className="text-sm font-semibold text-slate-400">Total Amount</span>
                    <span className="text-2xl font-bold text-white font-mono">
                      ${draftSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={draftItems.length === 0 || submittingAction}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-blue-600/15 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    Complete Order Sell
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateQuotation}
                    disabled={draftItems.length === 0 || submittingAction}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {submittingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Generate Quotation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Past Orders */}
        {activeTab === "past_orders" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/20 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Placed Orders List</h3>
              <button
                onClick={fetchPastOrders}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Products Included</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-sm">
                  {loadingOrders ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-16 ml-auto bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 mx-auto bg-slate-800/80 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : pastOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        No orders placed yet. Go to Order Desk to sell.
                      </td>
                    </tr>
                  ) : (
                    pastOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/20 transition-all text-xs sm:text-sm">
                        <td className="px-6 py-4 font-mono text-slate-400 font-semibold">{order.id}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-slate-300">
                                {item.product?.name}{" "}
                                <span className="text-xs text-slate-500">
                                  ({item.enteredQuantity} {item.enteredUnit} @ ${parseFloat(item.unitPrice).toFixed(2)})
                                </span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-white">
                          ${parseFloat(order.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Past Quotes */}
        {activeTab === "past_quotes" && (
          <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur">
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/20 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Compiled Quotations List</h3>
              <button
                onClick={fetchPastQuotes}
                className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Quotation ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Products Included</th>
                    <th className="px-6 py-4 text-right">Total Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-sm">
                  {loadingQuotes ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-16 ml-auto bg-slate-800/80 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-12 mx-auto bg-slate-800/80 rounded" />
                        </td>
                      </tr>
                    ))
                  ) : pastQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        No quotations created yet. Go to Quote Desk to generate.
                      </td>
                    </tr>
                  ) : (
                    pastQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-900/20 transition-all text-xs sm:text-sm">
                        <td className="px-6 py-4 font-mono text-slate-400 font-semibold">{quote.id}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(quote.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {quote.items.map((item) => (
                              <p key={item.id} className="text-slate-300">
                                {item.product?.name}{" "}
                                <span className="text-xs text-slate-500">
                                  ({item.enteredQuantity} {item.enteredUnit} @ ${parseFloat(item.unitPrice).toFixed(2)})
                                </span>
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-white">
                          ${parseFloat(quote.totalAmount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {quote.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}