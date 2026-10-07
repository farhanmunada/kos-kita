import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import type { RoomStatus } from "@/types";

export interface CreateRoomInput {
  roomNumber: string;
  type: string;
  basePrice: string | number;
  status?: RoomStatus;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  type?: string;
  basePrice?: string | number;
  status?: RoomStatus;
}

export class RoomService {
  static async getAllRooms() {
    return db.select().from(rooms).orderBy(rooms.roomNumber);
  }

  static async getRoomById(id: string) {
    const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0] || null;
  }

  static async createRoom(input: CreateRoomInput) {
    const [newRoom] = await db
      .insert(rooms)
      .values({
        roomNumber: input.roomNumber,
        type: input.type,
        basePrice: String(input.basePrice),
        status: input.status || "AVAILABLE",
      })
      .returning();
    return newRoom;
  }

  static async updateRoom(id: string, input: UpdateRoomInput) {
    const valuesToUpdate: Record<string, unknown> = {};
    if (input.roomNumber !== undefined) valuesToUpdate.roomNumber = input.roomNumber;
    if (input.type !== undefined) valuesToUpdate.type = input.type;
    if (input.basePrice !== undefined) valuesToUpdate.basePrice = String(input.basePrice);
    if (input.status !== undefined) valuesToUpdate.status = input.status;

    const [updatedRoom] = await db
      .update(rooms)
      .set(valuesToUpdate)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  static async deleteRoom(id: string) {
    return db.delete(rooms).where(eq(rooms.id, id)).returning();
  }

  static async getOccupancyStats() {
    const allRooms = await db.select().from(rooms);
    const total = allRooms.length;
    const occupied = allRooms.filter((r) => r.status === "OCCUPIED").length;
    const available = allRooms.filter((r) => r.status === "AVAILABLE").length;
    const maintenance = allRooms.filter((r) => r.status === "MAINTENANCE").length;

    return {
      total,
      occupied,
      available,
      maintenance,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    };
  }
}
