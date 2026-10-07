"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { MeterService } from "@/services/meter.service";
import { getSession } from "@/lib/auth";

const meterSchema = z.object({
  roomId: z.string().uuid("Pilih kamar yang valid"),
  periodDate: z.string().transform((val) => new Date(val)),
  startKwh: z.coerce.number().min(0, "kWh awal tidak boleh negatif"),
  endKwh: z.coerce.number().min(0, "kWh akhir tidak boleh negatif"),
  ratePerKwh: z.coerce.number().positive("Tarif per kWh harus lebih dari 0"),
});

export async function recordMeterAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = meterSchema.safeParse({
    roomId: formData.get("roomId"),
    periodDate: formData.get("periodDate"),
    startKwh: formData.get("startKwh"),
    endKwh: formData.get("endKwh"),
    ratePerKwh: formData.get("ratePerKwh"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    await MeterService.recordMeterReading(parsed.data);
    revalidatePath("/meter");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan pencatatan listrik";
    return { success: false, error: message };
  }
}
