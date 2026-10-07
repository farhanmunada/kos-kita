import Link from "next/link";
import { RoomService } from "@/services/room.service";
import { BillingService } from "@/services/billing.service";
import { TenantService } from "@/services/tenant.service";
import { StatCard } from "@/components/ui/StatCard";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  Building2, 
  DoorClosed, 
  Users, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Zap, 
  ReceiptText 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [occupancy, finance, tenants, recentInvoices] = await Promise.all([
    RoomService.getOccupancyStats(),
    BillingService.getFinancialSummary(),
    TenantService.getAllTenants(true),
    BillingService.getAllInvoices(),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Operasional</h1>
        <p className="text-sm text-slate-500 mt-1">Pantau status hunian, keuangan, dan tagihan kos secara langsung.</p>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tingkat Hunian"
          value={`${occupancy.occupancyRate}%`}
          subtitle={`${occupancy.occupied} terisi dari ${occupancy.total} total kamar`}
          icon={DoorClosed}
        />
        <StatCard
          title="Penghuni Aktif"
          value={tenants.length}
          subtitle="Total penyewa terdaftar"
          icon={Users}
        />
        <StatCard
          title="Pemasukan Terbayar"
          value={formatRupiah(finance.totalRevenue)}
          subtitle={`${finance.paidCount} invoice lunas`}
          icon={Wallet}
          variant="success"
        />
        <StatCard
          title="Tunggakan Belum Lunas"
          value={formatRupiah(finance.totalUnpaid)}
          subtitle={`${finance.unpaidCount} invoice menunggu`}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      {/* Pintasan Cepat */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/rooms"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-sm font-medium transition"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Tambah Kamar</span>
          </Link>
          <Link
            href="/tenants"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-sm font-medium transition"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Daftar Penghuni</span>
          </Link>
          <Link
            href="/meter"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-sm font-medium transition"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Catat Listrik</span>
          </Link>
          <Link
            href="/invoices"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-700 text-sm font-medium transition"
          >
            <ReceiptText className="w-4 h-4 text-indigo-600" />
            <span>Kelola Tagihan</span>
          </Link>
        </div>
      </div>

      {/* Invoice Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Tagihan Terbaru</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar transaksi dan status penagihan kos terkini</p>
          </div>
          <Link href="/invoices" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            Lihat Semua →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Invoice</th>
                <th className="px-6 py-3.5">Penghuni & Kamar</th>
                <th className="px-6 py-3.5">Jatuh Tempo</th>
                <th className="px-6 py-3.5">Total Tagihan</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-mono text-xs text-slate-900 font-medium">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{inv.tenant.user.name}</div>
                    <div className="text-xs text-slate-400">Kamar {inv.tenant.room.roomNumber} ({inv.tenant.room.type})</div>
                  </td>
                  <td className="px-6 py-4 text-xs">{formatDateIndo(inv.dueDate)}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatRupiah(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700"
                          : inv.status === "UNPAID"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {inv.status === "PAID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                    Belum ada invoice yang terbit.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
