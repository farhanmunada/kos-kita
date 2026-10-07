"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  DoorClosed, 
  Users, 
  Zap, 
  ReceiptText,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/rooms", label: "Kelola Kamar", icon: DoorClosed },
  { href: "/tenants", label: "Data Penghuni", icon: Users },
  { href: "/meter", label: "Meteran Listrik", icon: Zap },
  { href: "/invoices", label: "Daftar Tagihan", icon: ReceiptText },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-base block">Kos Kita</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
            {role}
          </span>
        </div>
      </div>

      <nav className="p-4 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
