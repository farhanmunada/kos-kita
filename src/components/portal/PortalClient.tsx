"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { getSnapTokenAction } from "@/actions/invoice.actions";
import { requestRoomChangeAction } from "@/actions/tenant.actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  DoorClosed, 
  ReceiptText, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Zap, 
  Loader2,
  Gift,
  Copy,
  Check,
  ArrowRightLeft,
  Sparkles,
  Users
} from "lucide-react";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
    };
  }
}

interface TenantData {
  id: string;
  rentStartDate: Date;
  billingDay: number;
  referralCode?: string | null;
  room: {
    id: string;
    roomNumber: string;
    name?: string | null;
    type: string;
    basePrice: string;
    facilities?: string[];
  };
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
  status: "UNPAID" | "PAID" | "EXPIRED" | "CANCELLED";
  paidAt: Date | null;
}

interface RoomOption {
  id: string;
  roomNumber: string;
  name?: string | null;
  type: string;
  basePrice: string;
  facilities?: string[];
}

interface ReferralInfo {
  referralCode: string;
  totalReferred: number;
  activeReferral?: {
    monthsRemaining: number;
    discountPercentage: number;
    friendName: string;
  } | null;
  referralHistory: Array<{
    id: string;
    friendName: string;
    monthsRemaining: number;
    isActive: boolean;
    createdAt: Date;
  }>;
}

export function PortalClient({
  tenant,
  invoices,
  availableRooms = [],
  referralInfo,
  clientKey,
}: {
  tenant: TenantData | null;
  invoices: InvoiceItem[];
  availableRooms?: RoomOption[];
  referralInfo?: ReferralInfo | null;
  clientKey: string;
}) {
  const router = useRouter();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Room change modal state
  const [changeTargetRoom, setChangeTargetRoom] = useState<RoomOption | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [submittingChange, setSubmittingChange] = useState(false);
  const [changeMessage, setChangeMessage] = useState<string | null>(null);

  // Copy referral code state
  const [copied, setCopied] = useState(false);

  function copyReferral() {
    if (!referralInfo?.referralCode) return;
    navigator.clipboard.writeText(referralInfo.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePay(invoiceId: string) {
    setPayError(null);
    setPayingId(invoiceId);

    const res = await getSnapTokenAction(invoiceId);
    setPayingId(null);

    if (!res.success || !res.snapToken) {
      setPayError(res.error || "Gagal memproses pembayaran");
      return;
    }

    if (!window.snap) {
      setPayError("Midtrans Snap belum siap. Silakan muat ulang halaman.");
      return;
    }

    window.snap.pay(res.snapToken, {
      onSuccess: function () {
        alert("Pembayaran berhasil!");
        router.refresh();
      },
      onPending: function () {
        alert("Pembayaran menunggu verifikasi.");
        router.refresh();
      },
      onError: function () {
        alert("Pembayaran gagal.");
      },
      onClose: function () {
        // popup ditutup
      },
    });
  }

  async function handleRoomChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changeTargetRoom) return;

    setSubmittingChange(true);
    setChangeMessage(null);

    const res = await requestRoomChangeAction(changeTargetRoom.id, changeReason);
    setSubmittingChange(false);

    if (!res.success) {
      setChangeMessage(res.error || "Gagal mengajukan pindah kamar");
    } else {
      alert("Pengajuan pindah kamar berhasil dikirimkan ke pengelola kos!");
      setChangeTargetRoom(null);
      setChangeReason("");
    }
  }

  if (!tenant) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Akun Belum Terhubung ke Kamar</h2>
        <p className="text-xs text-slate-500 mt-1">
          Hubungi pengelola kos untuk mendaftarkan kamar dan mengaktifkan akun sewa Anda.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={clientKey}
        strategy="lazyOnload"
      />

      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Detail Kamar Saya & Fasilitas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                Hunian Aktif Anda
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Kamar {tenant.room.roomNumber}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {tenant.room.name ? `${tenant.room.name} • ` : ""}{tenant.room.type}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Sewa Pokok Bulanan</span>
              <span className="text-2xl font-bold text-slate-900">
                {formatRupiah(tenant.room.basePrice)}
              </span>
            </div>
          </div>

          {/* Fasilitas Kamar Terpasang */}
          {tenant.room.facilities && tenant.room.facilities.length > 0 && (
            <div className="pt-4 pb-4 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Fasilitas Kamar
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tenant.room.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="text-xs font-medium px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg border border-slate-200"
                  >
                    ✓ {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block">Tanggal Check-In:</span>
              <span className="font-semibold text-slate-800 text-sm">{formatDateIndo(tenant.rentStartDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Siklus Penagihan:</span>
              <span className="font-semibold text-indigo-700 text-sm">Tiap tanggal {tenant.billingDay}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Batas Jatuh Tempo:</span>
              <span className="font-semibold text-rose-700 text-sm">Maks. tanggal {tenant.billingDay + 3}</span>
            </div>
          </div>
        </div>

        {/* 2. Program Afiliasi & Referral Diskon Sewa 10% */}
        {referralInfo && (
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  Program Afiliasi Kos
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Ajak Teman Ngekos, Nikmati Diskon Sewa 10% Selama 6 Bulan!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  Bagikan kode referral unik Anda kepada rekan kerja atau teman kuliah. Dapatkan potongan 10% otomatis di tagihan bulanan Anda setiap kali teman Anda bergabung.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <div className="inline-flex items-center justify-between gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 backdrop-blur-md">
                  <span className="text-xs text-slate-300">Kode Unik Anda:</span>
                  <span className="font-mono text-base font-bold text-amber-300 tracking-wider">
                    {referralInfo.referralCode}
                  </span>
                  <button
                    onClick={copyReferral}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs"
                    title="Salin kode"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>

                {referralInfo.activeReferral && (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl px-4 py-2 text-xs text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>
                      Diskon aktif untuk sewa ini: <strong>{referralInfo.activeReferral.discountPercentage}%</strong> (sisa {referralInfo.activeReferral.monthsRemaining} bulan dari {referralInfo.activeReferral.friendName})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        )}

        {/* 3. Daftar Tagihan Bulanan & Pembayaran Midtrans */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tagihan & Riwayat Pembayaran</h2>
            <p className="text-xs text-slate-500">
              Rincian sewa kamar dan pemakaian listrik kWh berdasarkan siklus check-in Anda.
            </p>
          </div>

          {payError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{payError}</span>
            </div>
          )}

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.status === "UNPAID"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {inv.status === "PAID" ? "Lunas" : inv.status === "UNPAID" ? "Belum Dibayar" : inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Periode: {formatDateIndo(inv.monthPeriod)} • Jatuh Tempo: {formatDateIndo(inv.dueDate)}
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-1">
                    <span>Sewa: {formatRupiah(inv.rentFee)}</span>
                    {inv.discountFee && Number(inv.discountFee) > 0 && (
                      <span className="text-purple-600 font-semibold">
                        Diskon Referral: -{formatRupiah(inv.discountFee)}
                      </span>
                    )}
                    <span>•</span>
                    <span>Listrik: {formatRupiah(inv.electricityFee)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Total Bayar</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </span>
                  </div>

                  <div>
                    {inv.status === "UNPAID" ? (
                      <button
                        onClick={() => handlePay(inv.id)}
                        disabled={payingId === inv.id}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                      >
                        {payingId === inv.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyiapkan...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar Sekarang</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Lunas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {invoices.length === 0 && (
              <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <ReceiptText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">Belum ada tagihan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tagihan akan otomatis terbit sesuai tanggal siklus masuk Anda.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Rekomendasi & Katalog Pindah Kamar */}
        {availableRooms.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Pilihan Upgrade & Pindah Kamar</h2>
              </div>
              <p className="text-xs text-slate-500">
                Tertarik pindah tipe kamar lain? Ajukan perpindahan kamar langsung melalui formulir di bawah ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRooms.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Kamar {r.roomNumber}</h3>
                        <p className="text-xs text-slate-500">{r.name ? `${r.name} • ` : ""}{r.type}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Tersedia
                      </span>
                    </div>

                    {r.facilities && r.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {r.facilities.slice(0, 3).map((f) => (
                          <span key={f} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Harga Sewa</span>
                      <span className="text-sm font-bold text-slate-900">{formatRupiah(r.basePrice)}</span>
                    </div>

                    <button
                      onClick={() => setChangeTargetRoom(r)}
                      className="text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
                    >
                      Ajukan Pindah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Pengajuan Pindah Kamar */}
        {changeTargetRoom && (
          <div className="fixed inset-0 !m-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
              <h3 className="text-base font-bold text-slate-900">
                Ajukan Pindah ke Kamar {changeTargetRoom.roomNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {changeTargetRoom.type} • {formatRupiah(changeTargetRoom.basePrice)}/bulan
              </p>

              {changeMessage && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {changeMessage}
                </div>
              )}

              <form onSubmit={handleRoomChangeSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Alasan Ingin Pindah Kamar *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Contoh: Ingin kamar ber-AC di lantai 1 atau kamar mandi dalam."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setChangeTargetRoom(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingChange}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition shadow-xs"
                  >
                    {submittingChange ? "Mengirim..." : "Kirim Pengajuan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
