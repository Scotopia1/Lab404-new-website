CREATE TABLE IF NOT EXISTS "ip_reputation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"reputation_score" integer DEFAULT 100 NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"successful_logins" integer DEFAULT 0 NOT NULL,
	"rate_limit_violations" integer DEFAULT 0 NOT NULL,
	"abuse_reports" integer DEFAULT 0 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_reason" varchar(255),
	"blocked_at" timestamp,
	"blocked_until" timestamp,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"country" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ip_reputation_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_reputation_ip_address_idx" ON "ip_reputation" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_reputation_is_blocked_idx" ON "ip_reputation" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_reputation_score_idx" ON "ip_reputation" USING btree ("reputation_score");