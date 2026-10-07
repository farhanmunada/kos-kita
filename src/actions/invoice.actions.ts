"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { BillingService } from "@/services/billing.service";
import { PaymentService } from "@/services/payment.service";
import { getSession } from "@/lib/auth";

export async function generateInvoiceAction(tenantId: string, monthPeriodStr: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  try {
    const monthPeriod = new Date(monthPeriodStr);
    const invoice = await BillingService.generateInvoiceForTenant(tenantId, monthPeriod);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");
    return { success: true, invoiceId: invoice.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat invoice";
    return { success: false, error: message };
  }
}

export async function getSnapTokenAction(invoiceId: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Silakan login terlebih dahulu" };
  }

  try {
    const { snapToken } = await PaymentService.getOrCreateSnapToken(invoiceId);
    return { success: true, snapToken };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperoleh token pembayaran Midtrans";
    return { success: false, error: message };
  }
}
