CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"device_name" varchar(100),
	"device_type" varchar(50),
	"device_browser" varchar(50),
	"browser_version" varchar(50),
	"os_name" varchar(50),
	"os_version" varchar(50),
	"ip_address" varchar(45) NOT NULL,
	"ip_country" varchar(100),
	"ip_city" varchar(100),
	"ip_latitude" numeric(10, 8),
	"ip_longitude" numeric(11, 8),
	"user_agent" text NOT NULL,
	"login_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revoked_at" timestamp,
	"revoke_reason" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"change_reason" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"email" varchar(255) NOT NULL,
	"success" boolean NOT NULL,
	"failure_reason" varchar(100),
	"ip_address" varchar(45) NOT NULL,
	"user_agent" varchar(500),
	"device_type" varchar(50),
	"device_browser" varchar(50),
	"ip_country" varchar(100),
	"ip_city" varchar(100),
	"triggered_lockout" boolean DEFAULT false NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "breach_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"password_hash_prefix" varchar(5) NOT NULL,
	"is_breached" boolean NOT NULL,
	"breach_count" integer DEFAULT 0 NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"check_reason" varchar(50),
	"ip_address" varchar(45)
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_history" ADD CONSTRAINT "password_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "breach_checks" ADD CONSTRAINT "breach_checks_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_customer_idx" ON "sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_active_idx" ON "sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_activity_idx" ON "sessions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_history_customer_idx" ON "password_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_history_changed_at_idx" ON "password_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_customer_idx" ON "login_attempts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_email_idx" ON "login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_attempted_at_idx" ON "login_attempts" USING btree ("attempted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "login_attempts_success_idx" ON "login_attempts" USING btree ("success");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "breach_checks_customer_idx" ON "breach_checks" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "breach_checks_prefix_idx" ON "breach_checks" USING btree ("password_hash_prefix");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "breach_checks_expires_at_idx" ON "breach_checks" USING btree ("expires_at");