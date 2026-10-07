import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  DoorClosed, 
  Zap, 
  Gift, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

interface FinancialSummary {
  totalRevenue: number;
  totalUnpaid: number;
  totalDiscounts: number;
  totalElectricityRevenue: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalInvoices: number;
}

interface OccupancyStats {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancyRate: number;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  monthPeriod: Date;
  dueDate: Date;
  rentFee: string;
  discountFee?: string;
  electricityFee: string;
  totalAmount: string;
  status: string;
  paidAt?: Date | null;
  tenant: {
    user: {
      name: string;
    };
    room: {
      roomNumber: string;
      type: string;
    };
  };
}

export function OwnerDashboardView({
  finance,
  occupancy,
  recentInvoices,
}: {
  finance: FinancialSummary;
  occupancy: OccupancyStats;
  recentInvoices: InvoiceItem[];
}) {
  const collectionRate =
    finance.totalInvoices > 0
      ? Math.round((finance.paidCount / finance.totalInvoices) * 100)
      : 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/40">
            Eksekutif Owner View • Read Only
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">
            Laporan Keuangan & Performa Bisnis Kos
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Ikhtisar real-time pendapatan sewa, efisiensi penagihan, okupansi aset kamar, dan audit arus kas.
          </p>
        </div>

        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Baris 1: Kartu Metrik Finansial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Kas Masuk (Lunas)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatRupiah(finance.totalRevenue)}
          </div>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{finance.paidCount} transaksi berhasil diverifikasi</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Piutang Belum Lunas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {formatRupiah(finance.totalUnpaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {finance.unpaidCount} invoice menunggu ({finance.overdueCount} telah lewat tempo)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Penerimaan Listrik</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatRupiah(finance.totalElectricityRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekap klaim beban kWh penghuni
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Diskon Afiliasi Diberikan</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {formatRupiah(finance.totalDiscounts)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reward 10% referral komunitas
          </p>
        </div>
      </div>

      {/* Baris 2: Okupansi & Tingkat Kelancaran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Status Hunian Kamar</h2>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-indigo-600">
              {occupancy.occupancyRate}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {occupancy.occupied} Terisi dari {occupancy.total} Total Kamar
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${occupancy.occupancyRate}%` }}
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <span className="font-bold text-blue-700 block text-base">{occupancy.occupied}</span>
              <span className="text-slate-500 text-[11px]">Terisi</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <span className="font-bold text-emerald-700 block text-base">{occupancy.available}</span>
              <span className="text-slate-500 text-[11px]">Tersedia</span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <span className="font-bold text-amber-700 block text-base">{occupancy.maintenance}</span>
              <span className="text-slate-500 text-[11px]">Perbaikan</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Efisiensi & Kelancaran Penagihan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Tingkat Kolektibilitas</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{collectionRate}%</span>
              <span className="text-xs text-slate-400 block mt-0.5">Persentase tagihan lunas tepat waktu</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-xs text-slate-500 block uppercase tracking-wider">Tunggakan Kritis</span>
              <span className="text-2xl font-bold text-rose-600 block mt-1">{finance.overdueCount} Kamar</span>
              <span className="text-xs text-slate-400 block mt-0.5">Melewati batas jatuh tempo 3 hari</span>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
            💡 <strong>Info Sistem:</strong> Penerimaan kas otomatis tercatat begitu transaksi penghuni diverifikasi secara digital oleh payment gateway Midtrans atau disetujui staf pengelola.
          </div>
        </div>
      </div>

      {/* Baris 3: Rekap Audit Tagihan Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Log Mutasi & Pembayaran Terbaru</h2>
            <p className="text-xs text-slate-400 mt-0.5">Arsip seluruh transaksi invoice penghuni kos</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Menampilkan 10 data terakhir</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Invoice</th>
                <th className="px-6 py-3.5">Penghuni & Kamar</th>
                <th className="px-6 py-3.5">Periode</th>
                <th className="px-6 py-3.5">Sewa Bersih</th>
                <th className="px-6 py-3.5">Listrik</th>
                <th className="px-6 py-3.5">Total Diterima</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.slice(0, 10).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4 font-mono text-xs text-slate-900 font-semibold">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{inv.tenant.user.name}</div>
                    <div className="text-xs text-slate-400">Kamar {inv.tenant.room.roomNumber} ({inv.tenant.room.type})</div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {formatDateIndo(inv.monthPeriod)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">
                    {formatRupiah(inv.rentFee)}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {formatRupiah(inv.electricityFee)}
                  </td>
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
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-xs">
                    Belum ada riwayat transaksi invoice.
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
