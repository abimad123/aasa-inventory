"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to workspace dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "ADMIN") router.replace("/admin");
      else if (session.user.role === "SELLER") router.replace("/seller");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end validations
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
      } else {
        // Redirect on success with query param to trigger success notification
        router.push("/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
            Enterprise Merchant Registration
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight max-w-md">
            Join the automated workspace.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-normal">
            Create your seller credentials to gain access to real-time unit conversions, quotation drafts, and direct billing workflows.
          </p>
        </div>
        <p className="text-xs text-slate-505 relative z-10">© 2026 Aasa Inventory Systems</p>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded bg-slate-900 flex items-center justify-center text-white font-extrabold text-sm">
              A
            </div>
            <span className="text-lg font-bold text-slate-900">Aasa Inventory</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-950">Create an account</h2>
            <p className="text-sm text-slate-500 mt-1">Register as a seller to build quotations and orders</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                disabled={loading}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="text-center text-xs">
            <span className="text-slate-400">Already have an account? </span>
            <Link href="/login" className="font-semibold text-slate-950 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
