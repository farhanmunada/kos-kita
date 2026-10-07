import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/dashboard/Header";
import { Building2 } from "lucide-react";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-sm">Portal Penghuni</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Kos Kita</span>
          </div>
        </div>

        <Header userName={session.name} userEmail={session.email} />
      </header>

      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
