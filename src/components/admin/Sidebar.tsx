"use client";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, History, LogOut, LayoutDashboard, FileText } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: "products" | "logs" | "quotes") => void;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ activeTab, setActiveTab, userName, userEmail }: SidebarProps) {
  const router = useRouter();
  const handleLogout = async () => { await signOut({ redirect: false }); router.push("/login"); };

  const navItems = [
    { key: "products" as const, label: "Products", icon: Package },
    { key: "logs" as const, label: "Inventory Logs", icon: History },
    { key: "quotes" as const, label: "Quotations", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shrink-0 hidden lg:flex">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Aasa Inventory</h1>
            <p className="text-[11px] text-slate-400 font-medium">Admin Console</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button key={item.key} onClick={() => setActiveTab(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.key ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="mb-3 px-1">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
