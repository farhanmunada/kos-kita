"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { LogOut, User as UserIcon } from "lucide-react";

export function Header({ userName, userEmail }: { userName: string; userEmail: string }) {
  const router = useRouter();

  async function handleLogout() {
    await logoutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0">
      <div>
        {/* Placeholder breadcrumb or page status */}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-right">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900">{userName}</div>
            <div className="text-[11px] text-slate-400">{userEmail}</div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
