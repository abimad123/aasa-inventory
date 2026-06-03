"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col md:p-12 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 mb-8 max-w-6xl w-full mx-auto">
        <div>
          <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Admin Area
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Aasa Management System</h1>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-sm font-medium transition-all"
        >
          Sign Out
        </button>
      </header>

      {/* Dashboard Overview */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mx-auto">
        {/* Profile Card */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur">
          <h3 className="text-lg font-bold text-slate-200 mb-4 font-sans">Logged In As</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Name</p>
              <p className="font-semibold text-white">{session?.user?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Email Address</p>
              <p className="font-semibold text-white">{session?.user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">System Role</p>
              <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded font-mono mt-1">
                {session?.user?.role || "N/A"}
              </span>
            </div>
          </div>
        </section>

        {/* Stats Placeholder */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur md:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-200 mb-2 font-sans">Welcome Back!</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              As an administrator, you have full access to management tools. Use these systems to track seller transactions, audit inventory logs, and modify product SKUs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-lg">
              <span className="text-2xl font-bold text-emerald-500">Active</span>
              <p className="text-xs text-slate-400 mt-1">Database connection</p>
            </div>
            <div className="bg-slate-950/50 border border-slate-900 p-4 rounded-lg">
              <span className="text-2xl font-bold text-blue-500">JWT</span>
              <p className="text-xs text-slate-400 mt-1">Session protection</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}