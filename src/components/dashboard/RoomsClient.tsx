"use client";

import { useState } from "react";
import { createRoomAction, updateRoomStatusAction, deleteRoomAction } from "@/actions/room.actions";
import { formatRupiah } from "@/lib/utils";
import { Plus, DoorClosed, Trash2, Check, X, Sparkles } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  name?: string | null;
  type: string;
  basePrice: string;
  facilities: string[];
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}

const AVAILABLE_FACILITIES = [
  "AC",
  "WiFi Cepat",
  "Kamar Mandi Dalam",
  "Water Heater",
  "Kasur Springbed",
  "Lemari Pakaian",
  "Meja & Kursi Kerja",
  "Smart TV",
  "Kipas Angin",
  "Balkon",
  "Jendela Luar",
  "Kloset Duduk",
];

const ROOM_TYPES = [
  "Standard Non-AC",
  "AC Standard",
  "VIP Kamar Mandi Dalam",
  "Suite Eksekutif",
];

export function RoomsClient({ initialRooms, role }: { initialRooms: Room[]; role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    "WiFi Cepat",
    "Kasur Springbed",
    "Lemari Pakaian",
  ]);
  const [selectedType, setSelectedType] = useState<string>("AC Standard");

  function toggleFacility(item: string) {
    if (selectedFacilities.includes(item)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== item));
    } else {
      setSelectedFacilities([...selectedFacilities, item]);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Masukkan fasilitas terpilih ke formData
    selectedFacilities.forEach((f) => formData.append("facilities", f));

    const res = await createRoomAction(formData);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Gagal membuat kamar");
    } else {
      setIsOpen(false);
      setSelectedFacilities(["WiFi Cepat", "Kasur Springbed", "Lemari Pakaian"]);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventaris & Fasilitas Kamar</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar kamar, spesifikasi fasilitas, penetapan harga dasar, dan status ketersediaan.
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
          <span>Tambah Kamar Baru</span>
        </button>
      </div>

      {/* MODAL FULL-VIEWPORT BACKDROP FIX */}
      {isOpen && (
        <div className="fixed inset-0 z-50 w-screen h-screen min-h-screen bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tambah Kamar Kos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Lengkapi spesifikasi kamar dan centang fasilitas</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor Kamar *
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    required
                    placeholder="Contoh: 101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama / Label Kamar (Opsional)
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Contoh: Mawar VIP Lt. 1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tipe Kamar (Pilihan Cepat) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Kamar *
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ROOM_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedType(t)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                        selectedType === t
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="type" value={selectedType} />
              </div>

              {/* Fasilitas Kamar (Pilihan Chips Interaktif - Minim Ketik) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Fasilitas Kamar (Klik untuk Memilih)</span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    {selectedFacilities.length} dipilih
                  </span>
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-36 overflow-y-auto">
                  {AVAILABLE_FACILITIES.map((fac) => {
                    const isSelected = selectedFacilities.includes(fac);
                    return (
                      <button
                        key={fac}
                        type="button"
                        onClick={() => toggleFacility(fac)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-medium transition ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        <span>{fac}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Harga Sewa Dasar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Sewa Bulanan (Rp) *
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    required
                    min="100000"
                    step="50000"
                    defaultValue="1500000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Kamar
                  </label>
                  <select
                    name="status"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="AVAILABLE">Tersedia (Siap Huni)</option>
                    <option value="OCCUPIED">Terisi</option>
                    <option value="MAINTENANCE">Dalam Perbaikan</option>
                  </select>
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
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Kamar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid Kamar yang Ditingkatkan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
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
                  <p className="text-xs text-slate-500 mt-0.5">
                    {room.name ? `${room.name} • ` : ""}{room.type}
                  </p>
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

              {/* Fasilitas Pills */}
              {room.facilities && room.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {room.facilities.map((fac) => (
                    <span
                      key={fac}
                      className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
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
                <option value="AVAILABLE">Tersedia</option>
                <option value="OCCUPIED">Terisi</option>
                <option value="MAINTENANCE">Perbaikan</option>
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
