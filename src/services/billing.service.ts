import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, tenants, users, rooms } from "@/db/schema";
import { MeterService } from "./meter.service";
import type { InvoiceStatus } from "@/types";

export class BillingService {
  static generateInvoiceNumber(roomNumber: string, date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${y}${m}${d}-${roomNumber}-${rand}`;
  }

  static async generateInvoiceForTenant(tenantId: string, monthPeriod: Date) {
    const tenantRows = await db
      .select({
        tenant: tenants,
        room: rooms,
      })
      .from(tenants)
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (tenantRows.length === 0) throw new Error("Data penghuni tidak ditemukan");
    const { tenant, room } = tenantRows[0];
    if (!tenant.isActive) throw new Error("Penghuni sudah tidak aktif");

    // Idempotency: cek jika invoice bulan ini sudah dibuat
    const existingInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.tenantId, tenantId));

    const alreadyGenerated = existingInvoices.some((inv) => {
      const d = new Date(inv.monthPeriod);
      return (
        d.getFullYear() === monthPeriod.getFullYear() &&
        d.getMonth() === monthPeriod.getMonth()
      );
    });

    if (alreadyGenerated) {
      throw new Error("Invoice untuk periode bulan ini sudah pernah dibuat");
    }

    // Ambil data meteran listrik untuk periode terkait
    const meter = await MeterService.getReadingForRoomAndPeriod(tenant.roomId, monthPeriod);
    let electricityFee = 0;
    if (meter) {
      const { totalCost } = MeterService.calculateUsage(
        Number(meter.startKwh),
        Number(meter.endKwh),
        Number(meter.ratePerKwh)
      );
      electricityFee = totalCost;
    }

    const rentFee = Number(room.basePrice);
    const totalAmount = rentFee + electricityFee;

    // Jatuh tempo: 3 hari dari tanggal siklus penagihan
    const dueDate = new Date(monthPeriod);
    dueDate.setDate(dueDate.getDate() + 3);

    const invoiceNumber = this.generateInvoiceNumber(room.roomNumber, monthPeriod);

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        tenantId: tenant.id,
        invoiceNumber: invoiceNumber,
        monthPeriod: monthPeriod,
        dueDate: dueDate,
        rentFee: String(rentFee),
        electricityFee: String(electricityFee),
        totalAmount: String(totalAmount),
        status: "UNPAID",
      })
      .returning();

    return newInvoice;
  }

  static async processDailyBillingCron(targetDate = new Date()) {
    const currentDay = targetDate.getDate();
    const createdInvoices = [];

    const activeTenants = await db
      .select({
        id: tenants.id,
        billingDay: tenants.billingDay,
      })
      .from(tenants)
      .where(eq(tenants.isActive, true));

    for (const tenant of activeTenants) {
      if (tenant.billingDay === currentDay) {
        try {
          const inv = await this.generateInvoiceForTenant(tenant.id, targetDate);
          createdInvoices.push(inv);
        } catch {
          continue;
        }
      }
    }

    return {
      success: true,
      processedDate: targetDate,
      totalGenerated: createdInvoices.length,
      invoices: createdInvoices,
    };
  }

  static async getAllInvoices(statusFilter?: InvoiceStatus) {
    const query = db
      .select({
        invoice: invoices,
        tenant: tenants,
        user: users,
        room: rooms,
      })
      .from(invoices)
      .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .orderBy(desc(invoices.createdAt));

    let rows;
    if (statusFilter) {
      rows = await query.where(eq(invoices.status, statusFilter));
    } else {
      rows = await query;
    }

    return rows.map((r) => ({
      ...r.invoice,
      tenant: {
        ...r.tenant,
        user: r.user,
        room: r.room,
      },
    }));
  }

  static async getInvoiceById(id: string) {
    const rows = await db
      .select({
        invoice: invoices,
        tenant: tenants,
        user: users,
        room: rooms,
      })
      .from(invoices)
      .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      ...r.invoice,
      tenant: {
        ...r.tenant,
        user: r.user,
        room: r.room,
      },
    };
  }

  static async getInvoicesByTenantUserId(userId: string) {
    const rows = await db
      .select({
        invoice: invoices,
        room: rooms,
      })
      .from(invoices)
      .innerJoin(tenants, eq(invoices.tenantId, tenants.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(eq(tenants.userId, userId))
      .orderBy(desc(invoices.createdAt));

    return rows.map((r) => ({
      ...r.invoice,
      room: {
        roomNumber: r.room.roomNumber,
        type: r.room.type,
      },
    }));
  }

  static async getFinancialSummary() {
    const allInvoices = await db.select().from(invoices);
    let totalRevenue = 0;
    let totalUnpaid = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    for (const inv of allInvoices) {
      const amount = Number(inv.totalAmount);
      if (inv.status === "PAID") {
        totalRevenue += amount;
        paidCount++;
      } else if (inv.status === "UNPAID") {
        totalUnpaid += amount;
        unpaidCount++;
      }
    }

    return {
      totalRevenue,
      totalUnpaid,
      paidCount,
      unpaidCount,
      totalInvoices: allInvoices.length,
    };
  }
}
