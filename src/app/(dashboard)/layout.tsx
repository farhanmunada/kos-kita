import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={session.name} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
