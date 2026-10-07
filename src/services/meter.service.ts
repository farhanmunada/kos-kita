import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { meterReadings, rooms } from "@/db/schema";

export interface RecordMeterInput {
  roomId: string;
  periodDate: Date;
  startKwh: number;
  endKwh: number;
  ratePerKwh: number;
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
        startKwh: meterReadings.startKwh,
        endKwh: meterReadings.endKwh,
        ratePerKwh: meterReadings.ratePerKwh,
        createdAt: meterReadings.createdAt,
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          type: rooms.type,
        },
      })
      .from(meterReadings)
      .innerJoin(rooms, eq(meterReadings.roomId, rooms.id))
      .orderBy(desc(meterReadings.periodDate));
  }

  static async getReadingForRoomAndPeriod(roomId: string, periodDate: Date) {
    // Normalisasi awal bulan
    const startOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const endOfMonth = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0, 23, 59, 59);

    const readings = await db
      .select()
      .from(meterReadings)
      .where(eq(meterReadings.roomId, roomId))
      .orderBy(desc(meterReadings.periodDate));

    // Ambil record yang periodDate-nya berada di bulan yang sama
    const match = readings.find((r) => {
      const d = new Date(r.periodDate);
      return d >= startOfMonth && d <= endOfMonth;
    });

    return match || null;
  }
}
