import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { BillingService } from "./billing.service";
import { createSnapToken, verifyMidtransSignature } from "@/lib/midtrans";
import type { InvoiceStatus } from "@/types";

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

export class PaymentService {
  static async getOrCreateSnapToken(invoiceId: string) {
    const invoice = await BillingService.getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Tagihan tidak ditemukan");
    if (invoice.status === "PAID") throw new Error("Tagihan sudah lunas");

    // Jika sudah ada token tersimpan, gunakan kembali
    if (invoice.midtransSnapToken) {
      return { snapToken: invoice.midtransSnapToken, invoice };
    }

    // Buat token baru di Midtrans Sandbox
    const snapToken = await createSnapToken({
      orderId: invoice.invoiceNumber,
      grossAmount: Number(invoice.totalAmount),
      customerDetails: {
        name: invoice.tenant.user.name,
        email: invoice.tenant.user.email,
        phone: invoice.tenant.user.phone,
      },
      itemDetails: [
        {
          id: `RENT-${invoice.id.substring(0, 8)}`,
          price: Number(invoice.rentFee),
          quantity: 1,
          name: `Sewa Kamar ${invoice.tenant.room.roomNumber}`,
        },
        ...(Number(invoice.electricityFee) > 0
          ? [
              {
                id: `ELEC-${invoice.id.substring(0, 8)}`,
                price: Number(invoice.electricityFee),
                quantity: 1,
                name: "Tagihan Listrik",
              },
            ]
          : []),
      ],
    });

    // Simpan token ke database
    await db
      .update(invoices)
      .set({ midtransSnapToken: snapToken })
      .where(eq(invoices.id, invoice.id));

    return { snapToken, invoice };
  }

  static async handleWebhook(payload: MidtransNotificationPayload) {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload;

    // 1. Verifikasi Signature Midtrans
    const isSignatureValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
    if (!isSignatureValid) {
      throw new Error("Invalid signature key from Midtrans webhook");
    }

    // 2. Cari invoice berdasarkan order_id / invoiceNumber
    const matchedInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, order_id))
      .limit(1);

    const invoice = matchedInvoices[0];
    if (!invoice) {
      throw new Error(`Invoice dengan order_id ${order_id} tidak ditemukan`);
    }

    // 3. Tentukan status baru
    let targetStatus: InvoiceStatus | null = null;
    let paidAt: Date | null = null;

    if (transaction_status === "capture") {
      if (fraud_status === "accept") {
        targetStatus = "PAID";
        paidAt = new Date();
      }
    } else if (transaction_status === "settlement") {
      targetStatus = "PAID";
      paidAt = new Date();
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      targetStatus = "CANCELLED";
    } else if (transaction_status === "expire") {
      targetStatus = "EXPIRED";
    }

    // 4. Update status invoice jika ada perubahan
    if (targetStatus && targetStatus !== invoice.status) {
      await db
        .update(invoices)
        .set({
          status: targetStatus,
          paidAt: paidAt,
        })
        .where(eq(invoices.id, invoice.id));
    }

    return { success: true, newStatus: targetStatus };
  }
}
