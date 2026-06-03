"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "ADMIN") router.replace("/admin");
      else if (session.user.role === "SELLER") router.replace("/seller");
    }
  }, [status, session, router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "AccessDenied") setError("Access denied. Please log in with the correct role.");
    const registeredParam = searchParams.get("registered");
    if (registeredParam === "true") setSuccessMessage("Account created successfully! Please sign in below.");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) setError("Invalid email or password.");
      else router.refresh();
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white font-sans antialiased text-slate-900">
      {/* Left Panel - Branding (Graphite/Charcoal minimal styling) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-8 w-8 rounded bg-white flex items-center justify-center text-slate-950 font-extrabold text-sm">
            A
          </div>
          <span className="text-lg font-bold tracking-tight">Aasa Inventory</span>
        </div>
        
        <div className="relative z-10 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enterprise Management Workspace
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight max-w-md">
            Manage your inventory with confidence.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-normal">
            A premium enterprise platform for real-time stock tracking, order management, and inventory analytics.
          </p>
        </div>
        <p className="text-xs text-slate-505 relative z-10">© 2026 Aasa Inventory Systems</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
              A
            </div>
            <span className="text-lg font-bold text-slate-900">Aasa Inventory</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Quick Demo Login Helper */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@aasa.com");
                  setPassword("admin123");
                }}
                className="text-left p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-400 rounded-lg shadow-xs transition-all duration-150"
                title="Autofill Admin Credentials"
              >
                <span className="inline-block text-[9px] bg-slate-950 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1">
                  Admin
                </span>
                <span className="block text-xs font-semibold text-slate-700 truncate">admin@aasa.com</span>
                <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">pass: admin123</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("abijiith@gmail.com");
                  setPassword("123456");
                }}
                className="text-left p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-400 rounded-lg shadow-xs transition-all duration-150"
                title="Autofill Seller Credentials"
              >
                <span className="inline-block text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1">
                  Seller
                </span>
                <span className="block text-xs font-semibold text-slate-700 truncate">abijiith@gmail.com</span>
                <span className="block text-[9px] text-slate-400 mt-0.5 font-mono">pass: 123456</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-505">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-slate-900 hover:underline">
              Register as Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}