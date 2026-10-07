import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { rooms, tenants, users, invoices, meterReadings } from "@/db/schema";
import type { RoomStatus } from "@/types";

export interface CreateRoomInput {
  roomNumber: string;
  name?: string;
  type: string;
  basePrice: string | number;
  facilities?: string[];
  status?: RoomStatus;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  name?: string;
  type?: string;
  basePrice?: string | number;
  facilities?: string[];
  status?: RoomStatus;
}

export interface MonitoringRoom {
  id: string;
  roomNumber: string;
  name: string | null;
  type: string;
  basePrice: string;
  facilities: string[];
  status: RoomStatus;
  urgencyStatus: "AVAILABLE" | "OK" | "DUE_SOON" | "OVERDUE" | "NEED_METER" | "MAINTENANCE";
  activeTenant?: {
    id: string;
    name: string;
    phone: string;
    rentStartDate: Date;
    billingDay: number;
    daysUntilBilling: number;
  } | null;
  latestMeterReading?: {
    endKwh: string;
    periodDate: Date;
  } | null;
  latestInvoice?: {
    invoiceNumber: string;
    dueDate: Date;
    totalAmount: string;
    status: string;
  } | null;
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
        name: input.name || null,
        type: input.type,
        basePrice: String(input.basePrice),
        facilities: input.facilities || [],
        status: input.status || "AVAILABLE",
      })
      .returning();
    return newRoom;
  }

  static async updateRoom(id: string, input: UpdateRoomInput) {
    const valuesToUpdate: Record<string, unknown> = {};
    if (input.roomNumber !== undefined) valuesToUpdate.roomNumber = input.roomNumber;
    if (input.name !== undefined) valuesToUpdate.name = input.name;
    if (input.type !== undefined) valuesToUpdate.type = input.type;
    if (input.basePrice !== undefined) valuesToUpdate.basePrice = String(input.basePrice);
    if (input.facilities !== undefined) valuesToUpdate.facilities = input.facilities;
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

  static async getMonitoringRooms(): Promise<MonitoringRoom[]> {
    const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
    const allTenants = await db
      .select({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(tenants.isActive, true));

    const allInvoices = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt));

    const allMeters = await db
      .select()
      .from(meterReadings)
      .orderBy(desc(meterReadings.createdAt));

    const today = new Date();
    const currentDay = today.getDate();

    return allRooms.map((room) => {
      if (room.status === "MAINTENANCE") {
        return {
          ...room,
          urgencyStatus: "MAINTENANCE",
          activeTenant: null,
          latestMeterReading: null,
          latestInvoice: null,
        };
      }

      if (room.status === "AVAILABLE") {
        return {
          ...room,
          urgencyStatus: "AVAILABLE",
          activeTenant: null,
          latestMeterReading: null,
          latestInvoice: null,
        };
      }

      // Room is OCCUPIED
      const tenantMatch = allTenants.find((t) => t.tenant.roomId === room.id);
      const roomMeters = allMeters.filter((m) => m.roomId === room.id);
      const latestMeter = roomMeters[0] || null;

      let tenantData = null;
      let latestInvData = null;
      let urgency: MonitoringRoom["urgencyStatus"] = "OK";

      if (tenantMatch) {
        const t = tenantMatch.tenant;
        const u = tenantMatch.user;
        const daysDiff = t.billingDay - currentDay;

        tenantData = {
          id: t.id,
          name: u.name,
          phone: u.phone,
          rentStartDate: t.rentStartDate,
          billingDay: t.billingDay,
          daysUntilBilling: daysDiff >= 0 ? daysDiff : daysDiff + 30,
        };

        const tenantInvoices = allInvoices.filter((inv) => inv.tenantId === t.id);
        const latestInvoice = tenantInvoices[0] || null;

        if (latestInvoice) {
          latestInvData = {
            invoiceNumber: latestInvoice.invoiceNumber,
            dueDate: latestInvoice.dueDate,
            totalAmount: latestInvoice.totalAmount,
            status: latestInvoice.status,
          };

          const isOverdue =
            latestInvoice.status === "UNPAID" &&
            new Date(latestInvoice.dueDate) < today;

          if (isOverdue) {
            urgency = "OVERDUE";
          } else if (latestInvoice.status === "UNPAID") {
            urgency = "DUE_SOON";
          }
        }

        // Check if meter reading for this cycle is needed
        // If billing day is within next 2 days or today, and no reading recorded for this month
        const hasRecentMeter = latestMeter && (
          new Date(latestMeter.periodDate).getMonth() === today.getMonth() &&
          new Date(latestMeter.periodDate).getFullYear() === today.getFullYear()
        );

        if (!hasRecentMeter && (Math.abs(t.billingDay - currentDay) <= 3 || t.billingDay === currentDay)) {
          if (urgency !== "OVERDUE") {
            urgency = "NEED_METER";
          }
        }
      }

      return {
        ...room,
        urgencyStatus: urgency,
        activeTenant: tenantData,
        latestMeterReading: latestMeter
          ? {
              endKwh: latestMeter.endKwh,
              periodDate: latestMeter.periodDate,
            }
          : null,
        latestInvoice: latestInvData,
      };
    });
  }
}
