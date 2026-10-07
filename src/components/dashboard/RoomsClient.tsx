"use client";

import { useState } from "react";
import { createRoomAction, updateRoomStatusAction, deleteRoomAction } from "@/actions/room.actions";
import { formatRupiah } from "@/lib/utils";
import { Plus, DoorClosed, Trash2, CheckCircle2, AlertTriangle, Wrench, X } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  basePrice: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

export function RoomsClient({ initialRooms, role }: { initialRooms: Room[]; role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createRoomAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal membuat kamar");
    } else {
      setIsOpen(false);
    }
  }

  async function handleStatusChange(roomId: string, newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") {
    await updateRoomStatusAction(roomId, newStatus);
  }

  async function handleDelete(roomId: string) {
    if (confirm("Hapus kamar ini?")) {
      await deleteRoomAction(roomId);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kelola Kamar Kos</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar inventaris kamar, tipe fasilitas, harga sewa dasar, dan status okupansi.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kamar</span>
        </button>
      </div>

      {/* Modal Tambah Kamar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Tambah Kamar Baru</h2>
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor Kamar
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  required
                  placeholder="Contoh: A-01"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tipe Kamar
                </label>
                <input
                  type="text"
                  name="type"
                  required
                  placeholder="Contoh: AC Standard / Kamar Mandi Dalam"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Harga Sewa Bulanan (Rp)
                </label>
                <input
                  type="number"
                  name="basePrice"
                  required
                  min="0"
                  step="50000"
                  placeholder="Contoh: 1200000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status Awal
                </label>
                <select
                  name="status"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="AVAILABLE">Tersedia (AVAILABLE)</option>
                  <option value="OCCUPIED">Terisi (OCCUPIED)</option>
                  <option value="MAINTENANCE">Perbaikan (MAINTENANCE)</option>
                </select>
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
                  {loading ? "Menyimpan..." : "Simpan Kamar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid Kamar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900 tracking-tight">Kamar {room.roomNumber}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      room.status === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : room.status === "OCCUPIED"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {room.status === "AVAILABLE" ? "Tersedia" : room.status === "OCCUPIED" ? "Terisi" : "Perbaikan"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{room.type}</p>
              </div>

              {role === "OWNER" && (
                <button
                  onClick={() => handleDelete(room.id)}
                  title="Hapus Kamar"
                  className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Harga Sewa</span>
                <span className="text-base font-bold text-slate-900">{formatRupiah(room.basePrice)}</span>
              </div>

              {/* Status Switcher */}
              <select
                value={room.status}
                onChange={(e) => handleStatusChange(room.id, e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none"
              >
                <option value="AVAILABLE">Set Tersedia</option>
                <option value="OCCUPIED">Set Terisi</option>
                <option value="MAINTENANCE">Set Perbaikan</option>
              </select>
            </div>
          </div>
        ))}

        {initialRooms.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <DoorClosed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">Belum ada kamar</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tambahkan kamar baru untuk mulai mengelola kos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
