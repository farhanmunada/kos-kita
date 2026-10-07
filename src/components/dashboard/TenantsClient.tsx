"use client";

import { useState } from "react";
import { createTenantAction, deactivateTenantAction } from "@/actions/tenant.actions";
import { formatDateIndo } from "@/lib/utils";
import { Plus, UserPlus, Phone, Mail, Calendar, UserX, X } from "lucide-react";

interface TenantWithDetails {
  id: string;
  rentStartDate: Date;
  billingDay: number;
  ktpNumber: string | null;
  emergencyPhone: string | null;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  room: {
    id: string;
    roomNumber: string;
    type: string;
  };
}

interface AvailableRoom {
  id: string;
  roomNumber: string;
  type: string;
  basePrice: string;
  status: string;
}

export function TenantsClient({
  tenants,
  availableRooms,
}: {
  tenants: TenantWithDetails[];
  availableRooms: AvailableRoom[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createTenantAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal mendaftarkan penghuni");
    } else {
      setIsOpen(false);
    }
  }

  async function handleDeactivate(tenantId: string, name: string) {
    if (confirm(`Nonaktifkan penghuni ${name}? Kamar akan otomatis diset kembali ke status Tersedia.`)) {
      await deactivateTenantAction(tenantId);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Penghuni Kos</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar penyewa aktif, kamar huni, kontak darurat, dan siklus tanggal penagihan.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftarkan Penghuni</span>
        </button>
      </div>

      {/* Modal Daftarkan Penghuni */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Registrasi Penghuni Baru</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Budi Santoso"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    No. Handphone (WhatsApp)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="budi@email.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pilih Kamar
                  </label>
                  <select
                    name="roomId"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Pilih Kamar Tersedia --</option>
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Kamar {r.roomNumber} ({r.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Masuk (Check-In)
                  </label>
                  <input
                    type="date"
                    name="rentStartDate"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Siklus Tagihan (Tgl 1-31)
                  </label>
                  <input
                    type="number"
                    name="billingDay"
                    required
                    min="1"
                    max="31"
                    defaultValue={new Date().getDate()}
                    placeholder="Contoh: 15"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    No. KTP / NIK (Opsional)
                  </label>
                  <input
                    type="text"
                    name="ktpNumber"
                    placeholder="3201xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kontak Darurat (Opsional)
                  </label>
                  <input
                    type="text"
                    name="emergencyPhone"
                    placeholder="081987654321 (Orang Tua)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  {loading ? "Menyimpan..." : "Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Penghuni */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Nama & Kontak</th>
                <th className="px-6 py-3.5">Kamar Terhubung</th>
                <th className="px-6 py-3.5">Mulai Sewa</th>
                <th className="px-6 py-3.5">Siklus Tagihan</th>
                <th className="px-6 py-3.5">Kontak Darurat</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{t.user.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {t.user.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.user.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700">
                      Kamar {t.room.roomNumber}
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">{t.room.type}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">
                    {formatDateIndo(t.rentStartDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-800">
                      Tiap tanggal {t.billingDay}
                    </span>
                    <span className="block text-[11px] text-slate-400">Jatuh tempo tgl {t.billingDay + 3}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {t.emergencyPhone || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeactivate(t.id, t.user.name)}
                      title="Check-Out / Nonaktifkan"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-100 transition"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Check-Out</span>
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Belum ada penghuni aktif terdaftar.
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
