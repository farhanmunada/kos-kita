CREATE TYPE "public"."room_change_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_tenant_id" uuid NOT NULL,
	"referee_tenant_id" uuid NOT NULL,
	"discount_percentage" integer DEFAULT 10 NOT NULL,
	"months_remaining" integer DEFAULT 6 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target_room_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"status" "room_change_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount_fee" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD COLUMN "period_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "meter_readings" ADD COLUMN "period_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "facilities" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_tenant_id_tenants_id_fk" FOREIGN KEY ("referrer_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_tenant_id_tenants_id_fk" FOREIGN KEY ("referee_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_change_requests" ADD CONSTRAINT "room_change_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_change_requests" ADD CONSTRAINT "room_change_requests_target_room_id_rooms_id_fk" FOREIGN KEY ("target_room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_referral_code_unique" UNIQUE("referral_code");