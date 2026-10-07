import { pgTable, text, timestamp, boolean, integer, numeric, pgEnum, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OWNER", "STAFF", "TENANT"]);
export const roomStatusEnum = pgEnum("room_status", ["AVAILABLE", "OCCUPIED", "MAINTENANCE"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["UNPAID", "PAID", "EXPIRED", "CANCELLED"]);

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
  type: text("type").notNull(), // misal: "AC Standard", "Non-AC", "VIP"
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
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
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meterReadings = pgTable("meter_readings", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  periodDate: timestamp("period_date").notNull(), // Bulan pencatatan
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
