"use client";

import { useState } from "react";
import { generateInvoiceAction } from "@/actions/invoice.actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { generateWhatsAppReminderUrl } from "@/lib/whatsapp";
import { 
  ReceiptText, 
  Plus, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink 
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  monthPeriod: Date;
  dueDate: Date;
  rentFee: string;
  electricityFee: string;
  totalAmount: string;
  status: "UNPAID" | "PAID" | "EXPIRED" | "CANCELLED";
  tenant: {
    id: string;
    user: {
      name: string;
      email: string;
      phone: string;
    };
    room: {
      roomNumber: string;
      type: string;
    };
  };
}

interface TenantOption {
  id: string;
  user: {
    name: string;
  };
  room: {
    roomNumber: string;
  };
}

export function InvoicesClient({
  invoices,
  tenants,
}: {
  invoices: InvoiceItem[];
  tenants: TenantOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const tenantId = formData.get("tenantId") as string;
    const monthPeriod = formData.get("monthPeriod") as string;

    const res = await generateInvoiceAction(tenantId, monthPeriod);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal membuat invoice");
    } else {
      setIsOpen(false);
    }
  }

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === "ALL") return true;
    return inv.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Tagihan & Invoice</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar invoice bulanan, pemantauan pembayaran, dan pengiriman pengingat WhatsApp.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Terbitkan Invoice Manual</span>
          </button>
        </div>
      </div>

      {/* Filter Tab Status */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {["ALL", "UNPAID", "PAID"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === status
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {status === "ALL" ? "Semua Tagihan" : status === "UNPAID" ? "Belum Lunas" : "Lunas"}
          </button>
        ))}
      </div>

      {/* Modal Terbitkan Invoice Manual */}
      {isOpen && (
        <div className="fixed inset-0 !m-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Terbitkan Invoice</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleGenerate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Penghuni Aktif
                </label>
                <select
                  name="tenantId"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Pilih Penghuni --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} (Kamar {t.room.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Periode Tagihan
                </label>
                <input
                  type="date"
                  name="monthPeriod"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem otomatis menghitung sewa kamar + meteran listrik yang tercatat pada bulan ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition shadow-sm"
                >
                  {loading ? "Menerbitkan..." : "Terbitkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">No. Invoice</th>
                <th className="px-6 py-3.5">Penghuni & Kamar</th>
                <th className="px-6 py-3.5">Periode & Tempo</th>
                <th className="px-6 py-3.5">Rincian (Sewa + Listrik)</th>
                <th className="px-6 py-3.5">Total Tagihan</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Pengingat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => {
                const waUrl = generateWhatsAppReminderUrl({
                  phone: inv.tenant.user.phone,
                  tenantName: inv.tenant.user.name,
                  roomNumber: inv.tenant.room.roomNumber,
                  invoiceNumber: inv.invoiceNumber,
                  totalAmount: inv.totalAmount,
                  dueDate: inv.dueDate,
                });

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{inv.tenant.user.name}</div>
                      <div className="text-xs text-slate-400">
                        Kamar {inv.tenant.room.roomNumber} ({inv.tenant.room.type})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-700">{formatDateIndo(inv.monthPeriod)}</div>
                      <div className="text-[11px] text-slate-400">Tempo: {formatDateIndo(inv.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>Sewa: {formatRupiah(inv.rentFee)}</div>
                      <div className="text-slate-400">Listrik: {formatRupiah(inv.electricityFee)}</div>
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
                        {inv.status === "PAID" ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === "UNPAID" ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition shadow-sm"
                          title="Kirim pesan penagihan ke WhatsApp penghuni"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Tidak ada tagihan pada filter ini.
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
