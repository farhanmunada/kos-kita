import { pgTable, text, timestamp, boolean, integer, numeric, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OWNER", "STAFF", "TENANT"]);
export const roomStatusEnum = pgEnum("room_status", ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["UNPAID", "PAID", "EXPIRED", "CANCELLED"]);
export const roomChangeStatusEnum = pgEnum("room_change_status", ["PENDING", "APPROVED", "REJECTED"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: roleEnum("role").default("TENANT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  name: text("name"), // Misal: "Kamar Mawar 01"
  type: text("type").notNull(), // Misal: "AC Standard", "VIP", "Non-AC"
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  facilities: text("facilities").array().default([]).notNull(), // Multi-fasilitas: ['AC', 'WiFi', 'KM Dalam', ...]
  status: roomStatusEnum("status").default("AVAILABLE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "restrict" }).notNull(),
  rentStartDate: timestamp("rent_start_date").notNull(),
  billingDay: integer("billing_day").notNull(), // 1 - 31 (sesuai tgl masuk check-in)
  ktpNumber: text("ktp_number"),
  emergencyPhone: text("emergency_phone"),
  referralCode: text("referral_code").unique(), // Kode unik untuk mengajak teman
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerTenantId: uuid("referrer_tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  refereeTenantId: uuid("referee_tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  discountPercentage: integer("discount_percentage").default(10).notNull(), // 10% diskon
  monthsRemaining: integer("months_remaining").default(6).notNull(), // 6 bulan diskon
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomChangeRequests = pgTable("room_change_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  targetRoomId: uuid("target_room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  status: roomChangeStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meterReadings = pgTable("meter_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  periodStartDate: timestamp("period_start_date"),
  periodEndDate: timestamp("period_end_date"),
  periodDate: timestamp("period_date").notNull(),
  startKwh: numeric("start_kwh", { precision: 10, scale: 2 }).notNull(),
  endKwh: numeric("end_kwh", { precision: 10, scale: 2 }).notNull(),
  ratePerKwh: numeric("rate_per_kwh", { precision: 10, scale: 2 }).notNull(), // default Rp / kWh
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  monthPeriod: timestamp("month_period").notNull(),
  dueDate: timestamp("due_date").notNull(),
  rentFee: numeric("rent_fee", { precision: 12, scale: 2 }).notNull(),
  discountFee: numeric("discount_fee", { precision: 12, scale: 2 }).default("0").notNull(), // Potongan referral
  electricityFee: numeric("electricity_fee", { precision: 12, scale: 2 }).default("0").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("UNPAID").notNull(),
  midtransSnapToken: text("midtrans_snap_token"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relasi Antar Tabel
export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.id],
    references: [tenants.userId],
  }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  tenants: many(tenants),
  meterReadings: many(meterReadings),
  roomChangeRequests: many(roomChangeRequests),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(users, {
    fields: [tenants.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [tenants.roomId],
    references: [rooms.id],
  }),
  invoices: many(invoices),
  givenReferrals: many(referrals, { relationName: "referrer" }),
  receivedReferrals: many(referrals, { relationName: "referee" }),
  roomChangeRequests: many(roomChangeRequests),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(tenants, {
    fields: [referrals.referrerTenantId],
    references: [tenants.id],
    relationName: "referrer",
  }),
  referee: one(tenants, {
    fields: [referrals.refereeTenantId],
    references: [tenants.id],
    relationName: "referee",
  }),
}));

export const roomChangeRequestsRelations = relations(roomChangeRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [roomChangeRequests.tenantId],
    references: [tenants.id],
  }),
  targetRoom: one(rooms, {
    fields: [roomChangeRequests.targetRoomId],
    references: [rooms.id],
  }),
}));

export const meterReadingsRelations = relations(meterReadings, ({ one }) => ({
  room: one(rooms, {
    fields: [meterReadings.roomId],
    references: [rooms.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
}));
