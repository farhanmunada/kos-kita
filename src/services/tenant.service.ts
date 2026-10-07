import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { tenants, users, rooms } from "@/db/schema";
import { UserService } from "./user.service";

export interface CreateTenantInput {
  name: string;
  email: string;
  password?: string;
  phone: string;
  roomId: string;
  rentStartDate: Date;
  billingDay: number; // 1-31
  ktpNumber?: string;
  emergencyPhone?: string;
}

export class TenantService {
  static async getAllTenants(activeOnly = true) {
    const rows = await db
      .select({
        tenant: tenants,
        user: users,
        room: rooms,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id));

    const list = rows.map((r) => ({
      ...r.tenant,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
      },
      room: {
        id: r.room.id,
        roomNumber: r.room.roomNumber,
        type: r.room.type,
        basePrice: r.room.basePrice,
        status: r.room.status,
      },
    }));

    if (activeOnly) {
      return list.filter((t) => t.isActive);
    }
    return list;
  }

  static async getTenantById(id: string) {
    const rows = await db
      .select({
        tenant: tenants,
        user: users,
        room: rooms,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(eq(tenants.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      ...r.tenant,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
      },
      room: {
        id: r.room.id,
        roomNumber: r.room.roomNumber,
        type: r.room.type,
        basePrice: r.room.basePrice,
        status: r.room.status,
      },
    };
  }

  static async getTenantByUserId(userId: string) {
    const rows = await db
      .select({
        tenant: tenants,
        user: users,
        room: rooms,
      })
      .from(tenants)
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .where(eq(tenants.userId, userId))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      ...r.tenant,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        phone: r.user.phone,
      },
      room: {
        id: r.room.id,
        roomNumber: r.room.roomNumber,
        type: r.room.type,
        basePrice: r.room.basePrice,
        status: r.room.status,
      },
    };
  }

  static async createTenant(input: CreateTenantInput) {
    // 1. Buat user akun penghuni
    const password = input.password || input.phone || "kos12345";
    const user = await UserService.createUser({
      email: input.email,
      password: password,
      name: input.name,
      phone: input.phone,
      role: "TENANT",
    });

    // 2. Buat record tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        userId: user.id,
        roomId: input.roomId,
        rentStartDate: input.rentStartDate,
        billingDay: input.billingDay,
        ktpNumber: input.ktpNumber,
        emergencyPhone: input.emergencyPhone,
        isActive: true,
      })
      .returning();

    // 3. Update status kamar menjadi OCCUPIED
    await db
      .update(rooms)
      .set({ status: "OCCUPIED" })
      .where(eq(rooms.id, input.roomId));

    return newTenant;
  }

  static async deactivateTenant(tenantId: string) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) throw new Error("Penghuni tidak ditemukan");

    await db.update(tenants).set({ isActive: false }).where(eq(tenants.id, tenantId));
    await db.update(rooms).set({ status: "AVAILABLE" }).where(eq(rooms.id, tenant.roomId));

    return true;
  }
}
