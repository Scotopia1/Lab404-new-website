CREATE TYPE "public"."verification_code_type" AS ENUM('password_reset', 'email_verification', 'account_unlock');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"type" "verification_code_type" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_codes_email_idx" ON "verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_codes_expires_at_idx" ON "verification_codes" USING btree ("expires_at");