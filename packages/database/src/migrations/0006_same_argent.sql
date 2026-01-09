CREATE TABLE IF NOT EXISTS "security_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"actor_type" varchar(20) NOT NULL,
	"actor_id" uuid,
	"actor_email" varchar(255),
	"target_type" varchar(50),
	"target_id" uuid,
	"action" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" uuid,
	"request_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "security_audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_event_type_idx" ON "security_audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "security_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_ip_address_idx" ON "security_audit_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_session_idx" ON "security_audit_logs" USING btree ("session_id");