"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { getSnapTokenAction } from "@/actions/invoice.actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  DoorClosed, 
  ReceiptText, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Zap, 
  Loader2 
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
  room: {
    roomNumber: string;
    type: string;
    basePrice: string;
  };
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  monthPeriod: Date;
  dueDate: Date;
  rentFee: string;
  electricityFee: string;
  totalAmount: string;
  status: "UNPAID" | "PAID" | "EXPIRED" | "CANCELLED";
  paidAt: Date | null;
}

export function PortalClient({
  tenant,
  invoices,
  clientKey,
}: {
  tenant: TenantData | null;
  invoices: InvoiceItem[];
  clientKey: string;
}) {
  const router = useRouter();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

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

      <div className="space-y-8">
        {/* Detail Kamar Saya */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">
                Kamar Saya
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                Kamar {tenant.room.roomNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-1">{tenant.room.type}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Sewa Bulanan</span>
              <span className="text-xl font-bold text-slate-900">
                {formatRupiah(tenant.room.basePrice)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block">Tanggal Masuk:</span>
              <span className="font-semibold text-slate-800">{formatDateIndo(tenant.rentStartDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Siklus Penagihan:</span>
              <span className="font-semibold text-slate-800">Tiap tanggal {tenant.billingDay}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Batas Bayar:</span>
              <span className="font-semibold text-slate-800">Maks. tanggal {tenant.billingDay + 3}</span>
            </div>
          </div>
        </div>

        {payError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{payError}</span>
          </div>
        )}

        {/* Daftar Tagihan */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Tagihan Kos</h2>
            <p className="text-xs text-slate-500">Rincian invoice bulanan dan pembayaran digital otomatis via Midtrans Sandbox.</p>
          </div>

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
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
                  <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                    <span>Sewa: {formatRupiah(inv.rentFee)}</span>
                    <span>•</span>
                    <span>Listrik: {formatRupiah(inv.electricityFee)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Total Tagihan</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatRupiah(inv.totalAmount)}
                    </span>
                  </div>

                  <div>
                    {inv.status === "UNPAID" ? (
                      <button
                        onClick={() => handlePay(inv.id)}
                        disabled={payingId === inv.id}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
      </div>
    </>
  );
}
