import { formatRupiah, formatDateIndo } from "./utils";

export interface WhatsAppReminderParams {
  phone: string;
  tenantName: string;
  roomNumber: string;
  invoiceNumber: string;
  totalAmount: number | string;
  dueDate: Date | string;
  portalUrl?: string;
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned;
}

export function generateWhatsAppReminderUrl(params: WhatsAppReminderParams): string {
  const targetPhone = formatPhoneNumber(params.phone);
  const formattedAmount = formatRupiah(params.totalAmount);
  const formattedDueDate = formatDateIndo(params.dueDate);
  const portalLink = params.portalUrl || "https://kos-kita.local/portal";

  const message = `Halo Kak ${params.tenantName},

Pengingat tagihan kos untuk *Kamar ${params.roomNumber}* telah terbit.
- No. Invoice: ${params.invoiceNumber}
- Total Tagihan: *${formattedAmount}*
- Batas Waktu: *${formattedDueDate}*

Detail rincian sewa & pemakaian listrik serta pembayaran online dapat diakses di:
${portalLink}

Terima kasih 🙏`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
