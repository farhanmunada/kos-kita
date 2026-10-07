"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { RoomService } from "@/services/room.service";
import { getSession } from "@/lib/auth";

const roomSchema = z.object({
  roomNumber: z.string().min(1, "Nomor kamar wajib diisi"),
  type: z.string().min(1, "Tipe kamar wajib diisi"),
  basePrice: z.coerce.number().positive("Harga sewa harus lebih dari 0"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).default("AVAILABLE"),
});

export async function createRoomAction(formData: FormData) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  const parsed = roomSchema.safeParse({
    roomNumber: formData.get("roomNumber"),
    type: formData.get("type"),
    basePrice: formData.get("basePrice"),
    status: formData.get("status") || "AVAILABLE",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    await RoomService.createRoom(parsed.data);
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan kamar";
    return { success: false, error: message };
  }
}

export async function updateRoomStatusAction(roomId: string, status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE") {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
    return { success: false, error: "Akses ditolak" };
  }

  try {
    await RoomService.updateRoom(roomId, { status });
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengubah status kamar";
    return { success: false, error: message };
  }
}

export async function deleteRoomAction(roomId: string) {
  const session = await getSession();
  if (!session || session.role !== "OWNER") {
    return { success: false, error: "Hanya Owner yang dapat menghapus kamar" };
  }

  try {
    await RoomService.deleteRoom(roomId);
    revalidatePath("/rooms");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus kamar";
    return { success: false, error: message };
  }
}
