"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { TenantService } from "@/services/tenant.service";
import { getSession } from "@/lib/auth";

const tenantSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(8, "Nomor telepon tidak valid"),
  password: z.string().optional(),
  roomId: z.string().uuid("Pilih kamar yang valid"),
  rentStartDate: z.string().transform((val) => new Date(val)),
  billingDay: z.coerce.number().min(1).max(31, "Tanggal siklus antara 1 sampai 31"),
  ktpNumber: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export async function createTenantAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = tenantSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password") || undefined,
    roomId: formData.get("roomId"),
    rentStartDate: formData.get("rentStartDate"),
    billingDay: formData.get("billingDay"),
    ktpNumber: formData.get("ktpNumber") || undefined,
    emergencyPhone: formData.get("emergencyPhone") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    await TenantService.createTenant(parsed.data);
    revalidatePath("/tenants");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mendaftarkan penghuni";
    return { success: false, error: message };
  }
}

export async function deactivateTenantAction(tenantId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  try {
    await TenantService.deactivateTenant(tenantId);
    revalidatePath("/tenants");
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menonaktifkan penghuni";
    return { success: false, error: message };
  }
}
