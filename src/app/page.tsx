"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Package,
  Scale,
  FileSpreadsheet,
  Activity,
  ArrowUpRight
} from "lucide-react";

interface Stats {
  products: number;
  orders: number;
  quotations: number;
  transactions: number;
}

export default function LandingPage() {
  const { data: session } = useSession();

  // Dynamic statistics
  const [stats, setStats] = useState<Stats>({
    products: 12,
    orders: 8,
    quotations: 15,
    transactions: 34
  });

  // Interactive Conversion Engine Showcase Widget state
  const [showcaseQty, setShowcaseQty] = useState("2.5");
  const [showcaseUnit, setShowcaseUnit] = useState<"KG" | "G" | "L" | "ML" | "ITEM">("KG");
  const mockPricePerBase = 0.5; // ₹0.50 per Gram or Milliliter or Item

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.error("Error fetching stats:", err));
  }, []);

  // Compute conversion math for the showcase
  let baseUnit = "G";
  let convertedQty = 0;
  let computedPrice = 0;
  const parsedQty = parseFloat(showcaseQty);

  if (!isNaN(parsedQty) && parsedQty > 0) {
    if (showcaseUnit === "KG") {
      baseUnit = "G";
      convertedQty = parsedQty * 1000;
    } else if (showcaseUnit === "G") {
      baseUnit = "G";
      convertedQty = parsedQty;
    } else if (showcaseUnit === "L") {
      baseUnit = "ML";
      convertedQty = parsedQty * 1000;
    } else if (showcaseUnit === "ML") {
      baseUnit = "ML";
      convertedQty = parsedQty;
    } else {
      baseUnit = "ITEM";
      convertedQty = parsedQty;
    }
    computedPrice = convertedQty * mockPricePerBase;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-100 antialiased">
      {/* 1. Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
                A
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Aasa Inventory</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-500">
              <a href="#features" className="hover:text-slate-950 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-slate-950 transition-colors">How It Works</a>
              <a href="#compliance" className="hover:text-slate-950 transition-colors">Unit Showcase</a>
              <a href="#statistics" className="hover:text-slate-950 transition-colors">Statistics</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href={session.user.role === "ADMIN" ? "/admin" : "/seller"}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 text-white rounded hover:bg-slate-800 transition-all flex items-center gap-1"
              >
                Go to Dashboard
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold uppercase tracking-wider text-slate-650 hover:text-slate-955 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white rounded transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            Designed for Modern Enterprise Standards
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Inventory, quotations, and orders managed in one place.
          </h1>

          <p className="text-base sm:text-lg text-slate-550 max-w-2xl mx-auto font-normal leading-relaxed">
            A comprehensive, high-precision SaaS platform built to unify warehouse inventory tracking, real-time decimal unit conversions, Quotation workflow controls, and transaction-audited orders.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Dashboard Realistic CSS Preview Mockup */}
        <div className="max-w-5xl mx-auto mt-16 border border-slate-200 rounded-xl bg-slate-50 shadow-2xl p-3 md:p-4 overflow-hidden relative">
          <div className="h-3.5 flex items-center gap-1.5 pb-3 px-2 border-b border-slate-200">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-mono ml-4">aasa-inventory.in/workspace</span>
          </div>

          <div className="grid grid-cols-12 min-h-[300px] bg-white rounded-lg border border-slate-200 overflow-hidden font-sans">
            {/* Sidebar Mock */}
            <div className="col-span-3 bg-slate-50 border-r border-slate-200 p-4 space-y-4 hidden md:block">
              <div className="h-8 bg-slate-200 rounded w-5/6" />
              <div className="space-y-2">
                <div className="h-7 bg-slate-200/60 rounded" />
                <div className="h-7 bg-slate-200/30 rounded" />
                <div className="h-7 bg-slate-200/30 rounded" />
                <div className="h-7 bg-slate-200/30 rounded" />
              </div>
            </div>

            {/* Dashboard Content Mock */}
            <div className="col-span-12 md:col-span-9 p-5 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Stock Valuation Desk</h4>
                  <p className="text-[10px] text-slate-400">Overview of warehouse levels</p>
                </div>
                <div className="h-7 w-20 bg-slate-900 rounded text-white flex items-center justify-center text-[10px] font-bold">
                  Active System
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Val.</span>
                  <span className="text-sm font-bold font-mono">₹4,89,500.00</span>
                </div>
                <div className="border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Active Items</span>
                  <span className="text-sm font-bold font-mono">148 Units</span>
                </div>
                <div className="border border-slate-200 p-3 rounded">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pending Quotes</span>
                  <span className="text-sm font-bold font-mono">3 Submissions</span>
                </div>
              </div>

              {/* Table Mock */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-50 p-2 text-[10px] border-b border-slate-200 font-bold grid grid-cols-4">
                  <span>Product</span>
                  <span className="text-right">Entered Qty</span>
                  <span className="text-right">Converted (Base)</span>
                  <span className="text-right">Grand Total</span>
                </div>
                <div className="p-2 text-[11px] grid grid-cols-4 text-slate-600 border-b border-slate-100">
                  <span className="font-semibold text-slate-900">Alphonso Mangoes</span>
                  <span className="text-right font-mono">2.5 KG</span>
                  <span className="text-right font-mono">2500 G</span>
                  <span className="text-right font-mono font-bold text-slate-900">₹1,250.00</span>
                </div>
                <div className="p-2 text-[11px] grid grid-cols-4 text-slate-600">
                  <span className="font-semibold text-slate-900">Organic Castor Oil</span>
                  <span className="text-right font-mono">4 L</span>
                  <span className="text-right font-mono">4000 ML</span>
                  <span className="text-right font-mono font-bold text-slate-900">₹800.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section */}
      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Core Enterprise Features
            </h2>
            <p className="text-slate-500 text-sm">
              Real capabilities engineered for robust, audit-compliant business tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3">
              <Package className="h-6 w-6 text-slate-800" />
              <h3 className="font-bold text-slate-900 text-base">Inventory Management</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Complete catalog oversight with product activation toggles, soft-deletions to preserve historical orders, and categorizations.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3">
              <Scale className="h-6 w-6 text-slate-800" />
              <h3 className="font-bold text-slate-900 text-base">Unit Conversion Engine</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                High-precision conversion utility supporting weight (G/KG), volume (ML/L), and counts (ITEM) using strict Decimal.js math.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3">
              <FileSpreadsheet className="h-6 w-6 text-slate-800" />
              <h3 className="font-bold text-slate-900 text-base">Quotation Management</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Seller draft cart compilation with review approvals, rejections, and direct approved-quotation-to-order conversions.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl space-y-3">
              <Activity className="h-6 w-6 text-slate-800" />
              <h3 className="font-bold text-slate-900 text-base">Order Tracking</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Workflow status transitions from Pending to Processing and Completed, triggering automatic warehouse inventory deductions and ledger transactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Conversion Showcase Section */}
      <section id="compliance" className="py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Interactive Unit Conversion Engine
            </h2>
            <p className="text-slate-505 text-sm">
              Try the live simulator below to experience how the Decimal.js engine handles conversion normalization and cost calculation.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Input Config side */}
            <div className="md:col-span-5 p-6 bg-slate-50 border-r border-slate-200 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Showcase Control</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Enter Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={showcaseQty}
                    onChange={(e) => setShowcaseQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-250 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Unit</label>
                  <select
                    value={showcaseUnit}
                    onChange={(e) => setShowcaseUnit(e.target.value as "KG" | "G" | "L" | "ML" | "ITEM")}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-250 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="KG">Kilograms (KG)</option>
                    <option value="G">Grams (G)</option>
                    <option value="L">Liters (L)</option>
                    <option value="ML">Milliliters (ML)</option>
                    <option value="ITEM">Count (ITEM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pricing Rate</label>
                  <div className="px-3 py-2 bg-slate-200/50 rounded-lg text-xs font-mono text-slate-650">
                    ₹{mockPricePerBase.toFixed(2)} / base unit ({baseUnit})
                  </div>
                </div>
              </div>
            </div>

            {/* Math flow output side */}
            <div className="md:col-span-7 p-6 flex flex-col justify-center space-y-4 bg-white">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Processing</div>
              
              <div className="grid grid-cols-3 items-center gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Entered</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{parsedQty || 0} {showcaseUnit}</span>
                </div>
                <div className="flex justify-center text-slate-300">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Converted</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{convertedQty.toLocaleString()} {baseUnit}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pricing Formula</p>
                  <p className="text-xs text-slate-600 font-mono mt-1">
                    {convertedQty.toLocaleString()} {baseUnit} × ₹{mockPricePerBase.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Calculated Total</p>
                  <p className="font-mono text-xl font-extrabold text-slate-900">
                    ₹{computedPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Workflow Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-y border-slate-200 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              System Roles & Workflows
            </h2>
            <p className="text-slate-500 text-sm">
              Strict role-based segregation ensures absolute operational accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Seller flow */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  S
                </span>
                <h3 className="font-bold text-slate-900 text-lg">Seller Workflow</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Browse Products</h4>
                    <p className="text-slate-505 text-xs mt-0.5">Explore active products matching weights or counts.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Create Quotation</h4>
                    <p className="text-slate-550 text-xs mt-0.5">Submit quotations using customized entry quantities and units.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Convert to Order</h4>
                    <p className="text-slate-550 text-xs mt-0.5">Once approved by administration, convert to a pending warehouse order.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin flow */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  A
                </span>
                <h3 className="font-bold text-slate-900 text-lg">Admin Workflow</h3>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Manage Inventory</h4>
                    <p className="text-slate-505 text-xs mt-0.5">Control pricing, active toggles, and base stocks securely.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Review Quotations</h4>
                    <p className="text-slate-550 text-xs mt-0.5">Audit itemizations and transition quotation states (Approve / Reject).</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 bg-white">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Track Orders & Audit Logs</h4>
                    <p className="text-slate-550 text-xs mt-0.5">Transition orders to Complete, updating stock balances and generating immutable ledger records.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. System Statistics Section */}
      <section id="statistics" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">{stats.products}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Products Listed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">{stats.orders}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Orders Processed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">{stats.quotations}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Quotations Created</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">{stats.transactions}</p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Warehouse Transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer Section */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center text-white font-extrabold text-[10px]">
              A
            </div>
            <span className="text-xs font-bold text-slate-900">Aasa Inventory Platform</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-semibold">
            <Link href="/login" className="hover:text-slate-900">Login</Link>
            <Link href="/register" className="hover:text-slate-900">Register</Link>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-400">Release v1.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
