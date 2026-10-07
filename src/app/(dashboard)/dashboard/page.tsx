import Link from "next/link";
import { getSession } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { BillingService } from "@/services/billing.service";
import { TenantService } from "@/services/tenant.service";
import { StatCard } from "@/components/ui/StatCard";
import { AlertTicker, type AlertItem } from "@/components/dashboard/AlertTicker";
import { InteractiveRoomGrid } from "@/components/dashboard/InteractiveRoomGrid";
import { OwnerDashboardView } from "@/components/dashboard/OwnerDashboardView";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  DoorClosed, 
  Users, 
  Wallet, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Zap, 
  ReceiptText,
  Clock,
  ShieldAlert
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  const [occupancy, finance, tenants, recentInvoices, monitoringRooms] = await Promise.all([
    RoomService.getOccupancyStats(),
    BillingService.getFinancialSummary(),
    TenantService.getAllTenants(true),
    BillingService.getAllInvoices(),
    RoomService.getMonitoringRooms(),
  ]);

  // Jika Owner: Tampilkan 1 halaman penuh informasi eksekutif (Read-Only)
  if (session?.role === "OWNER") {
    return (
      <OwnerDashboardView
        finance={finance}
        occupancy={occupancy}
        recentInvoices={recentInvoices}
      />
    );
  }

  // Jika Staff / Pengelola: Dashboard Operasional Terpadu dengan Urgent Alert Center
  const today = new Date();
  const alerts: AlertItem[] = [];

  monitoringRooms.forEach((r) => {
    if (r.urgencyStatus === "OVERDUE" && r.latestInvoice) {
      alerts.push({
        id: `overdue-${r.id}`,
        type: "overdue",
        message: `Tagihan Overdue ${formatRupiah(r.latestInvoice.totalAmount)} (${r.activeTenant?.name || "Penghuni"})`,
        roomNumber: r.roomNumber,
        href: "/invoices",
      });
    } else if (r.urgencyStatus === "NEED_METER") {
      alerts.push({
        id: `meter-${r.id}`,
        type: "need_meter",
        message: `Waktunya catat meteran kWh listrik untuk periode ini`,
        roomNumber: r.roomNumber,
        href: "/meter",
      });
    } else if (r.urgencyStatus === "DUE_SOON" && r.latestInvoice) {
      alerts.push({
        id: `due-${r.id}`,
        type: "due_soon",
        message: `Jatuh tempo pada ${formatDateIndo(r.latestInvoice.dueDate)}`,
        roomNumber: r.roomNumber,
        href: "/invoices",
      });
    }
  });

  const needMeterCount = monitoringRooms.filter((r) => r.urgencyStatus === "NEED_METER").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Running Alert Marquee Ticker */}
      <AlertTicker alerts={alerts} />

      {/* Header Operasional Staff */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pusat Operasional Kos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitoring hunian, pencatatan meteran, dan penagihan aktif.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/meter"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Catat Listrik</span>
          </Link>
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Terbitkan Invoice</span>
          </Link>
        </div>
      </div>

      {/* 2. Banner Sorotan Mendesak (Urgent Action Center) */}
      {(finance.overdueCount > 0 || needMeterCount > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-950">Tindakan Mendesak Memerlukan Tindak Lanjut</h2>
              <div className="text-xs text-rose-800 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {finance.overdueCount > 0 && (
                  <span>
                    • <strong>{finance.overdueCount} tagihan</strong> telah melewati tanggal jatuh tempo!
                  </span>
                )}
                {needMeterCount > 0 && (
                  <span>
                    • <strong>{needMeterCount} kamar</strong> belum dicatat angka meteran listrik siklus ini!
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {finance.overdueCount > 0 && (
              <Link
                href="/invoices"
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Follow-up WA
              </Link>
            )}
            {needMeterCount > 0 && (
              <Link
                href="/meter"
                className="px-3 py-1.5 bg-white text-rose-900 border border-rose-200 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
              >
                Catat kWh Sekarang
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. Grid Statistik Ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Okupansi"
          value={`${occupancy.occupancyRate}%`}
          subtitle={`${occupancy.occupied}/${occupancy.total} Kamar`}
          icon={DoorClosed}
        />
        <StatCard
          title="Penghuni Aktif"
          value={tenants.length}
          subtitle="Penyewa terdaftar"
          icon={Users}
        />
        <StatCard
          title="Kas Terkumpul"
          value={formatRupiah(finance.totalRevenue)}
          subtitle={`${finance.paidCount} Lunas`}
          icon={Wallet}
          variant="success"
        />
        <StatCard
          title="Menunggu Bayar"
          value={formatRupiah(finance.totalUnpaid)}
          subtitle={`${finance.unpaidCount} Belum Lunas`}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* 4. Live Visual Interactive Room Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Monitoring Kamar Interaktif</h2>
            <p className="text-xs text-slate-500">
              Status warna: 🟢 Tersedia, 🔵 Terisi & Aman, 🟡 Perlu Catat Listrik/Batas Tempo, 🔴 Menunggak.
            </p>
          </div>
          <Link href="/rooms" className="text-xs font-semibold text-indigo-600 hover:underline">
            Kelola Kamar →
          </Link>
        </div>

        <InteractiveRoomGrid rooms={monitoringRooms} />
      </div>

      {/* 5. Daftar Invoice Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tagihan Terbit Terakhir</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pantau status pembayaran dan pengiriman pesan WhatsApp</p>
          </div>
          <Link href="/invoices" className="text-xs font-semibold text-indigo-600 hover:underline">
            Lihat Semua Tagihan →
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
                  <td className="px-6 py-4 font-mono text-xs text-slate-900 font-semibold">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{inv.tenant.user.name}</div>
                    <div className="text-xs text-slate-400">Kamar {inv.tenant.room.roomNumber} ({inv.tenant.room.type})</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">{formatDateIndo(inv.dueDate)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {formatRupiah(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.status === "UNPAID"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
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
