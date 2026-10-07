import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { tenants, users, rooms, referrals, roomChangeRequests } from "@/db/schema";
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
  referralCodeUsed?: string; // Kode referral yang dimasukkan
}

export class TenantService {
  static generateReferralCode(name: string): string {
    const clean = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "KOS";
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `KOS-${clean}${rand}`;
  }

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
        name: r.room.name,
        type: r.room.type,
        basePrice: r.room.basePrice,
        facilities: r.room.facilities,
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
        name: r.room.name,
        type: r.room.type,
        basePrice: r.room.basePrice,
        facilities: r.room.facilities,
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
        name: r.room.name,
        type: r.room.type,
        basePrice: r.room.basePrice,
        facilities: r.room.facilities,
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

    // 2. Generate referral code untuk tenant baru
    const myReferralCode = this.generateReferralCode(input.name);

    // 3. Buat record tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        userId: user.id,
        roomId: input.roomId,
        rentStartDate: input.rentStartDate,
        billingDay: input.billingDay,
        ktpNumber: input.ktpNumber,
        emergencyPhone: input.emergencyPhone,
        referralCode: myReferralCode,
        isActive: true,
      })
      .returning();

    // 4. Update status kamar menjadi OCCUPIED
    await db
      .update(rooms)
      .set({ status: "OCCUPIED" })
      .where(eq(rooms.id, input.roomId));

    // 5. Cek apakah menggunakan kode referral orang lain
    if (input.referralCodeUsed) {
      const [referrer] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.referralCode, input.referralCodeUsed.trim().toUpperCase()))
        .limit(1);

      if (referrer && referrer.id !== newTenant.id) {
        // Berikan bonus diskon 10% selama 6 bulan kepada pemilik kode
        await db.insert(referrals).values({
          referrerTenantId: referrer.id,
          refereeTenantId: newTenant.id,
          discountPercentage: 10,
          monthsRemaining: 6,
          isActive: true,
        });
      }
    }

    return newTenant;
  }

  static async deactivateTenant(tenantId: string) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) throw new Error("Penghuni tidak ditemukan");

    await db.update(tenants).set({ isActive: false }).where(eq(tenants.id, tenantId));
    await db.update(rooms).set({ status: "AVAILABLE" }).where(eq(rooms.id, tenant.roomId));

    return true;
  }

  static async getTenantReferralInfo(tenantId: string) {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) return null;

    const list = await db
      .select({
        referral: referrals,
        refereeTenant: tenants,
        refereeUser: users,
      })
      .from(referrals)
      .innerJoin(tenants, eq(referrals.refereeTenantId, tenants.id))
      .innerJoin(users, eq(tenants.userId, users.id))
      .where(eq(referrals.referrerTenantId, tenantId))
      .orderBy(desc(referrals.createdAt));

    const activeDiscount = list.find((r) => r.referral.isActive && r.referral.monthsRemaining > 0);

    return {
      referralCode: tenant.referralCode || "KOS-MEMBER",
      totalReferred: list.length,
      activeReferral: activeDiscount
        ? {
            monthsRemaining: activeDiscount.referral.monthsRemaining,
            discountPercentage: activeDiscount.referral.discountPercentage,
            friendName: activeDiscount.refereeUser.name,
          }
        : null,
      referralHistory: list.map((item) => ({
        id: item.referral.id,
        friendName: item.refereeUser.name,
        monthsRemaining: item.referral.monthsRemaining,
        isActive: item.referral.isActive,
        createdAt: item.referral.createdAt,
      })),
    };
  }

  static async requestRoomChange(tenantId: string, targetRoomId: string, reason: string) {
    const [request] = await db
      .insert(roomChangeRequests)
      .values({
        tenantId,
        targetRoomId,
        reason,
        status: "PENDING",
      })
      .returning();
    return request;
  }

  static async getRoomChangeRequests() {
    return db
      .select({
        request: roomChangeRequests,
        tenant: tenants,
        user: users,
        currentRoom: rooms,
      })
      .from(roomChangeRequests)
      .innerJoin(tenants, eq(roomChangeRequests.tenantId, tenants.id))
      .innerJoin(users, eq(tenants.userId, users.id))
      .innerJoin(rooms, eq(tenants.roomId, rooms.id))
      .orderBy(desc(roomChangeRequests.createdAt));
  }
}
