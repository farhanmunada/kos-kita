import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { meterReadings, rooms, tenants, users } from "@/db/schema";

export interface RecordMeterInput {
  roomId: string;
  periodDate: Date;
  periodStartDate?: Date;
  periodEndDate?: Date;
  startKwh: number;
  endKwh: number;
  ratePerKwh: number;
}

export interface RoomMeterContext {
  roomId: string;
  roomNumber: string;
  roomName: string | null;
  roomType: string;
  tenant: {
    id: string;
    name: string;
    phone: string;
    rentStartDate: Date;
    billingDay: number;
  } | null;
  latestReading: {
    endKwh: string;
    periodDate: Date;
  } | null;
  suggestedStartKwh: number;
  cycleStartDate: Date;
  cycleEndDate: Date;
}

export class MeterService {
  static calculateUsage(startKwh: number, endKwh: number, ratePerKwh: number) {
    if (endKwh < startKwh) {
      throw new Error("kWh akhir tidak boleh lebih kecil dari kWh awal");
    }
    const usageKwh = Number((endKwh - startKwh).toFixed(2));
    const totalCost = Math.round(usageKwh * ratePerKwh);
    return { usageKwh, totalCost };
  }

  static async recordMeterReading(input: RecordMeterInput) {
    this.calculateUsage(input.startKwh, input.endKwh, input.ratePerKwh);

    const [record] = await db
      .insert(meterReadings)
      .values({
        roomId: input.roomId,
        periodDate: input.periodDate,
        periodStartDate: input.periodStartDate || null,
        periodEndDate: input.periodEndDate || null,
        startKwh: String(input.startKwh),
        endKwh: String(input.endKwh),
        ratePerKwh: String(input.ratePerKwh),
      })
      .returning();

    return record;
  }

  static async getAllMeterReadings() {
    return db
      .select({
        id: meterReadings.id,
        roomId: meterReadings.roomId,
        periodDate: meterReadings.periodDate,
        periodStartDate: meterReadings.periodStartDate,
        periodEndDate: meterReadings.periodEndDate,
        startKwh: meterReadings.startKwh,
        endKwh: meterReadings.endKwh,
        ratePerKwh: meterReadings.ratePerKwh,
        createdAt: meterReadings.createdAt,
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          name: rooms.name,
          type: rooms.type,
        },
      })
      .from(meterReadings)
      .innerJoin(rooms, eq(meterReadings.roomId, rooms.id))
      .orderBy(desc(meterReadings.periodDate));
  }

  static async getReadingForRoomAndPeriod(roomId: string, periodDate: Date) {
    const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

    const readings = await db
      .select()
      .from(meterReadings)
      .where(eq(meterReadings.roomId, roomId))
      .orderBy(desc(meterReadings.periodDate));

    const match = readings.find((r) => {
      const d = new Date(r.periodDate);
      return d >= startOfMonth && d <= endOfMonth;
    });

    return match || null;
  }

  static async getMeterContexts(): Promise<RoomMeterContext[]> {
    const allRooms = await db.select().from(rooms).orderBy(rooms.roomNumber);
    const allTenants = await db
      .select({
        tenant: tenants,
        user: users,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(tenants.isActive, true));

    const allMeters = await db
      .select()
      .from(meterReadings)
      .orderBy(desc(meterReadings.createdAt));

    const now = new Date();

    return allRooms.map((room) => {
      const tenantMatch = allTenants.find((t) => t.tenant.roomId === room.id);
      const roomMeters = allMeters.filter((m) => m.roomId === room.id);
      const latest = roomMeters[0] || null;

      const suggestedStart = latest ? Number(latest.endKwh) : 0;

      // Calculate cycle based on tenant check-in day
      const billingDay = tenantMatch ? tenantMatch.tenant.billingDay : 1;
      const cycleEnd = new Date(now.getFullYear(), now.getMonth(), billingDay);
      const cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, billingDay);

      return {
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomName: room.name,
        roomType: room.type,
        tenant: tenantMatch
          ? {
              id: tenantMatch.tenant.id,
              name: tenantMatch.user.name,
              phone: tenantMatch.user.phone,
              rentStartDate: tenantMatch.tenant.rentStartDate,
              billingDay: tenantMatch.tenant.billingDay,
            }
          : null,
        latestReading: latest
          ? {
              endKwh: latest.endKwh,
              periodDate: latest.periodDate,
            }
          : null,
        suggestedStartKwh: suggestedStart,
        cycleStartDate: tenantMatch ? cycleStart : new Date(now.getFullYear(), now.getMonth(), 1),
        cycleEndDate: tenantMatch ? cycleEnd : now,
      };
    });
  }
}
