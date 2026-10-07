"use client";

import { useState } from "react";
import { recordMeterAction } from "@/actions/meter.actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import type { RoomMeterContext } from "@/services/meter.service";
import { Zap, Plus, AlertCircle, X, User, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

interface MeterReadingItem {
  id: string;
  roomId: string;
  periodDate: Date;
  periodStartDate?: Date | null;
  periodEndDate?: Date | null;
  startKwh: string;
  endKwh: string;
  ratePerKwh: string;
  room: {
    id: string;
    roomNumber: string;
    name?: string | null;
    type: string;
  };
}

export function MeterClient({
  readings,
  meterContexts,
}: {
  readings: MeterReadingItem[];
  meterContexts: RoomMeterContext[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [endKwh, setEndKwh] = useState<number | "">("");
  const [ratePerKwh, setRatePerKwh] = useState<number>(2000);

  // Find active room context
  const selectedContext = meterContexts.find((c) => c.roomId === selectedRoomId);
  const startKwh = selectedContext ? selectedContext.suggestedStartKwh : 0;

  const currentEnd = typeof endKwh === "number" ? endKwh : 0;
  const usageKwh = Math.max(0, currentEnd - startKwh);
  const estimatedCost = Math.round(usageKwh * ratePerKwh);

  function handleSelectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    const ctx = meterContexts.find((c) => c.roomId === roomId);
    if (ctx) {
      setEndKwh(ctx.suggestedStartKwh > 0 ? ctx.suggestedStartKwh + 10 : "");
    }
  }

  async function handleRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRoomId) {
      setError("Silakan pilih kamar terlebih dahulu");
      return;
    }
    if (typeof endKwh !== "number" || endKwh < startKwh) {
      setError("kWh akhir tidak boleh lebih kecil dari kWh awal");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("roomId", selectedRoomId);
    formData.append("startKwh", String(startKwh));
    formData.append("endKwh", String(endKwh));
    formData.append("ratePerKwh", String(ratePerKwh));

    if (selectedContext) {
      formData.append("periodDate", selectedContext.cycleEndDate.toISOString().split("T")[0]);
      formData.append("periodStartDate", selectedContext.cycleStartDate.toISOString().split("T")[0]);
      formData.append("periodEndDate", selectedContext.cycleEndDate.toISOString().split("T")[0]);
    }

    const res = await recordMeterAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal mencatat meteran");
    } else {
      setIsOpen(false);
      setSelectedRoomId("");
      setEndKwh("");
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pencatatan Meteran Listrik Siklus Check-in</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Sistem otomatis menarik angka kWh terakhir & siklus masuk penghuni. Anda hanya perlu input angka meteran saat ini.
            </p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Input Angka Meteran Baru</span>
          </button>
        </div>

        {/* Tabel Riwayat Pencatatan Listrik */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Kamar</th>
                  <th className="px-6 py-3.5">Periode Siklus</th>
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
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">Kamar {r.room.roomNumber}</span>
                        <span className="text-xs text-slate-400">{r.room.name ? `${r.room.name} • ` : ""}{r.room.type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {r.periodStartDate && r.periodEndDate ? (
                          <span>
                            {formatDateIndo(r.periodStartDate)} - {formatDateIndo(r.periodEndDate)}
                          </span>
                        ) : (
                          <span>{formatDateIndo(r.periodDate)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.startKwh}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">{r.endKwh}</td>
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

      {/* MODAL INPUT DENGAN AUTO-FILL SIKLUS & KWH AWAL */}
      {isOpen && (
        <div className="fixed inset-0 !m-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Catat Meteran Listrik</h2>
                  <p className="text-xs text-slate-400">Pilih kamar untuk memuat data siklus otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRecord} className="mt-4 space-y-4">
              {/* Dropdown Kamar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Kamar *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => handleSelectRoom(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="">-- Pilih Kamar --</option>
                  {meterContexts.map((ctx) => (
                    <option key={ctx.roomId} value={ctx.roomId}>
                      Kamar {ctx.roomNumber} {ctx.roomName ? `(${ctx.roomName})` : ""} - {ctx.tenant ? `Penghuni: ${ctx.tenant.name}` : "(Kosong)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Banner Informasi Konteks Siklus Masuk & Meter Kemarin */}
              {selectedContext && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Penghuni:
                    </span>
                    <span className="font-bold text-slate-900">
                      {selectedContext.tenant ? selectedContext.tenant.name : "Kamar belum ada penghuni"}
                    </span>
                  </div>

                  {selectedContext.tenant && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Tanggal Masuk (Check-In):
                      </span>
                      <span className="font-semibold text-indigo-700">
                        {formatDateIndo(selectedContext.tenant.rentStartDate)} (Siklus tgl {selectedContext.tenant.billingDay})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Rentang Periode Siklus:</span>
                    <span className="font-medium text-slate-700">
                      {formatDateIndo(selectedContext.cycleStartDate)} s/d {formatDateIndo(selectedContext.cycleEndDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Angka kWh Meteran Kemarin:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {startKwh} kWh
                    </span>
                  </div>
                </div>
              )}

              {/* Input Angka kWh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    kWh Awal (Terkunci)
                  </label>
                  <input
                    type="number"
                    readOnly
                    disabled
                    value={startKwh}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-slate-100 font-mono font-bold text-slate-600 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Otomatis dari angka sebelumnya</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    kWh Akhir Saat Ini *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={startKwh}
                    required
                    placeholder="Contoh: 185.50"
                    value={endKwh}
                    onChange={(e) => setEndKwh(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Ketik angka meteran fisik</span>
                </div>
              </div>

              {/* Tarif Listrik */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tarif Listrik per kWh (Rp)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={ratePerKwh}
                  onChange={(e) => setRatePerKwh(parseFloat(e.target.value) || 2000)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 space-y-1">
                <div className="flex justify-between text-xs text-indigo-950">
                  <span>Pemakaian Listrik Periode Ini:</span>
                  <span className="font-mono font-bold">{usageKwh.toFixed(2)} kWh</span>
                </div>
                <div className="flex justify-between text-xs text-indigo-950 pt-1 border-t border-indigo-100">
                  <span>Total Tagihan Listrik:</span>
                  <span className="font-bold text-sm text-indigo-700">{formatRupiah(estimatedCost)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedRoomId}
                  className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Angka Meteran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
