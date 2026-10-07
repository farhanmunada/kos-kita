CREATE TYPE "public"."invoice_status" AS ENUM('UNPAID', 'PAID', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('OWNER', 'STAFF', 'TENANT');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_number" text NOT NULL,
	"month_period" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"rent_fee" numeric(12, 2) NOT NULL,
	"electricity_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'UNPAID' NOT NULL,
	"midtrans_snap_token" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "meter_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"period_date" timestamp NOT NULL,
	"start_kwh" numeric(10, 2) NOT NULL,
	"end_kwh" numeric(10, 2) NOT NULL,
	"rate_per_kwh" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_number" text NOT NULL,
	"type" text NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"status" "room_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"rent_start_date" timestamp NOT NULL,
	"billing_day" integer NOT NULL,
	"ktp_number" text,
	"emergency_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"role" "role" DEFAULT 'TENANT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD CONSTRAINT "meter_readings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE restrict ON UPDATE no action;