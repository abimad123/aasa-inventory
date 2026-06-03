"use client";
import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Aasa Inventory</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold tracking-tight leading-tight mb-4">Manage your inventory<br />with confidence.</h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            A premium enterprise platform for real-time stock tracking, order management, and inventory analytics.
          </p>
        </div>
        <p className="text-sm text-slate-600">© 2026 Aasa Inventory Systems</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Aasa Inventory</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account to continue</p>

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /><span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none text-sm">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing In...</> : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-505">
            Don&apos;t have an account? <Link href="/register" className="font-semibold text-slate-900 hover:underline">Register as Seller</Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1">
            <p>Demo: admin@aasa.com / Admin123</p>
            <p>Demo: seller@aasa.com / Seller123</p>
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