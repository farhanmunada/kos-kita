"use client";

import Link from "next/link";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { generateWhatsAppReminderUrl } from "@/lib/whatsapp";
import type { MonitoringRoom } from "@/services/room.service";
import { 
  DoorClosed, 
  User, 
  Calendar, 
  Zap, 
  ReceiptText, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle2, 
  Wrench,
  ExternalLink
} from "lucide-react";

export function InteractiveRoomGrid({ rooms }: { rooms: MonitoringRoom[] }) {
  const statusStyles = {
    AVAILABLE: {
      border: "border-emerald-200 bg-white hover:border-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Tersedia",
      dot: "bg-emerald-500",
    },
    OK: {
      border: "border-blue-200 bg-white hover:border-blue-400",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      label: "Terisi & Lancar",
      dot: "bg-blue-500",
    },
    NEED_METER: {
      border: "border-amber-300 bg-amber-50/20 hover:border-amber-400",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      label: "Wajib Catat Listrik",
      dot: "bg-amber-500 animate-ping",
    },
    DUE_SOON: {
      border: "border-amber-300 bg-amber-50/20 hover:border-amber-400",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      label: "Mendekati Tempo",
      dot: "bg-amber-500",
    },
    OVERDUE: {
      border: "border-rose-300 bg-rose-50/20 hover:border-rose-400",
      badge: "bg-rose-100 text-rose-800 border-rose-300",
      label: "Menunggak",
      dot: "bg-rose-500 animate-pulse",
    },
    MAINTENANCE: {
      border: "border-slate-200 bg-slate-50",
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      label: "Perbaikan",
      dot: "bg-slate-400",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room) => {
        const style = statusStyles[room.urgencyStatus] || statusStyles.AVAILABLE;

        let waReminderUrl: string | null = null;
        if (room.activeTenant && room.latestInvoice && room.latestInvoice.status === "UNPAID") {
          waReminderUrl = generateWhatsAppReminderUrl({
            phone: room.activeTenant.phone,
            tenantName: room.activeTenant.name,
            roomNumber: room.roomNumber,
            invoiceNumber: room.latestInvoice.invoiceNumber,
            totalAmount: room.latestInvoice.totalAmount,
            dueDate: room.latestInvoice.dueDate,
          });
        }

        return (
          <div
            key={room.id}
            className={`rounded-2xl border ${style.border} p-5 shadow-xs transition-all duration-200 flex flex-col justify-between`}
          >
            <div>
              {/* Header Card: Nomor & Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      Kamar {room.roomNumber}
                    </h3>
                    <span className="relative flex h-2 w-2">
                      <span className={`rounded-full h-2 w-2 ${style.dot}`} />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {room.name ? `${room.name} • ` : ""}{room.type}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badge}`}
                >
                  {style.label}
                </span>
              </div>

              {/* Fasilitas Chips */}
              {room.facilities && room.facilities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.facilities.slice(0, 3).map((f) => (
                    <span
                      key={f}
                      className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium"
                    >
                      {f}
                    </span>
                  ))}
                  {room.facilities.length > 3 && (
                    <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                      +{room.facilities.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Data Penghuni / Status Ruang */}
              {room.activeTenant ? (
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Penghuni:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {room.activeTenant.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Siklus Masuk:
                    </span>
                    <span className="font-medium text-slate-700">
                      Tiap tgl {room.activeTenant.billingDay}
                    </span>
                  </div>

                  {room.latestMeterReading ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Meter Terakhir:
                      </span>
                      <span className="font-mono text-slate-700">
                        {room.latestMeterReading.endKwh} kWh
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-amber-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Meteran:
                      </span>
                      <span>Belum dicatat</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 mb-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <DoorClosed className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <span>Kamar Kosong / Siap Huni</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Harga Sewa
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {formatRupiah(room.basePrice)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {room.urgencyStatus === "NEED_METER" && (
                  <Link
                    href="/meter"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    title="Input angka meteran listrik"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Catat kWh</span>
                  </Link>
                )}

                {waReminderUrl && (
                  <a
                    href={waReminderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                    title="Kirim pesan tagihan via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </a>
                )}

                {room.status === "AVAILABLE" && (
                  <Link
                    href="/tenants"
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    + Penghuni
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
