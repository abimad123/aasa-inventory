"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  History, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  ShoppingCart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: "overview" | "products" | "logs" | "quotes" | "orders") => void;
  userName?: string | null;
  userEmail?: string | null;
}

export default function Sidebar({ activeTab, setActiveTab, userName, userEmail }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const handleLogout = async () => { 
    await signOut({ redirect: false }); 
    router.push("/login"); 
  };

  const navItems = [
    { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { key: "products" as const, label: "Products", icon: Package },
    { key: "logs" as const, label: "Inventory Logs", icon: History },
    { key: "quotes" as const, label: "Quotations", icon: FileText },
    { key: "orders" as const, label: "Orders", icon: ShoppingCart },
  ];

  return (
    <aside className={`relative ${isCollapsed ? "w-20" : "w-64"} bg-slate-950 text-slate-200 border-r border-slate-900 flex flex-col min-h-screen shrink-0 hidden lg:flex font-sans transition-all duration-300 ease-in-out`}>
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 h-6 w-6 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-50 cursor-pointer hover:border-slate-700"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Header */}
      <div className={`p-5 border-b border-slate-900 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
        <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center text-slate-950 font-extrabold text-base shadow-sm shrink-0">
          A
        </div>
        {!isCollapsed && (
          <div className="min-w-0 transition-opacity duration-200">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">Aasa Inventory</h1>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">Admin Workspace</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3.5 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            title={isCollapsed ? item.label : undefined}
            className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === item.key 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-slate-900/60"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-slate-900">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-4 px-1.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-slate-700">
              {userName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{userName || "Administrator"}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate font-mono mt-0.5">{userEmail || "admin@aasa.com"}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700" title={userName || "Administrator"}>
              {userName?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"} py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-900/60 rounded-lg transition-all`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
