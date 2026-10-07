"use client";

import { useState } from "react";
import { recordMeterAction } from "@/actions/meter.actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Zap, Plus, AlertCircle, X } from "lucide-react";

interface MeterReadingItem {
  id: string;
  roomId: string;
  periodDate: Date;
  startKwh: string;
  endKwh: string;
  ratePerKwh: string;
  room: {
    id: string;
    roomNumber: string;
    type: string;
  };
}

interface RoomOption {
  id: string;
  roomNumber: string;
}

export function MeterClient({
  readings,
  rooms,
}: {
  readings: MeterReadingItem[];
  rooms: RoomOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live calculation state
  const [startKwh, setStartKwh] = useState<number>(0);
  const [endKwh, setEndKwh] = useState<number>(0);
  const [ratePerKwh, setRatePerKwh] = useState<number>(2000);

  const usageKwh = Math.max(0, endKwh - startKwh);
  const estimatedCost = Math.round(usageKwh * ratePerKwh);

  async function handleRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (endKwh < startKwh) {
      setError("kWh akhir tidak boleh lebih kecil dari kWh awal");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await recordMeterAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal mencatat meteran");
    } else {
      setIsOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pencatatan Meteran Listrik</h1>
          <p className="text-sm text-slate-500 mt-1">Catat penggunaan kWh bulanan per kamar untuk kalkulasi otomatis tagihan listrik.</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Meteran Baru</span>
        </button>
      </div>

      {/* Modal Input Meteran */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Input Angka Meteran</h2>
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

            <form onSubmit={handleRecord} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Kamar
                </label>
                <select
                  name="roomId"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Pilih Kamar --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Kamar {r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Bulan Periode
                </label>
                <input
                  type="date"
                  name="periodDate"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    kWh Awal
                  </label>
                  <input
                    type="number"
                    name="startKwh"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={startKwh}
                    onChange={(e) => setStartKwh(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    kWh Akhir
                  </label>
                  <input
                    type="number"
                    name="endKwh"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={endKwh}
                    onChange={(e) => setEndKwh(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tarif Listrik per kWh (Rp)
                </label>
                <input
                  type="number"
                  name="ratePerKwh"
                  required
                  min="500"
                  step="100"
                  value={ratePerKwh}
                  onChange={(e) => setRatePerKwh(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                <div className="flex justify-between text-xs text-indigo-900">
                  <span>Pemakaian Bersih:</span>
                  <span className="font-bold">{usageKwh.toFixed(2)} kWh</span>
                </div>
                <div className="flex justify-between text-xs text-indigo-900">
                  <span>Perkiraan Biaya Listrik:</span>
                  <span className="font-bold text-sm text-indigo-700">{formatRupiah(estimatedCost)}</span>
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
                  {loading ? "Menyimpan..." : "Simpan Angka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Riwayat Pencatatan Listrik */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Kamar</th>
                <th className="px-6 py-3.5">Periode Bulan</th>
                <th className="px-6 py-3.5">kWh Awal</th>
                <th className="px-6 py-3.5">kWh Akhir</th>
                <th className="px-6 py-3.5">Pemakaian</th>
                <th className="px-6 py-3.5">Tarif / kWh</th>
                <th className="px-6 py-3.5">Total Biaya Listrik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {readings.map((r) => {
                const used = Math.max(0, Number(r.endKwh) - Number(r.startKwh));
                const total = Math.round(used * Number(r.ratePerKwh));
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      Kamar {r.room.roomNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {formatDateIndo(r.periodDate)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{r.startKwh}</td>
                    <td className="px-6 py-4 font-mono text-xs">{r.endKwh}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                        {used.toFixed(2)} kWh
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatRupiah(r.ratePerKwh)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatRupiah(total)}
                    </td>
                  </tr>
                );
              })}
              {readings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs">
                    Belum ada riwayat pencatatan meteran listrik.
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
