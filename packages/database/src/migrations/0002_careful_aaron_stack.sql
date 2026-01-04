CREATE TYPE "public"."quotation_activity_type" AS ENUM('created', 'updated', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'duplicated', 'pdf_generated', 'note_added', 'status_changed');--> statement-breakpoint
CREATE TYPE "public"."quotation_actor_type" AS ENUM('system', 'admin', 'customer');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"activity_type" "quotation_activity_type" NOT NULL,
	"description" text NOT NULL,
	"actor_type" "quotation_actor_type" DEFAULT 'system' NOT NULL,
	"actor_id" uuid,
	"actor_name" varchar(255),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_description" text,
	"created_by" uuid,
	"created_by_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_discount" numeric(10, 2),
	"default_discount_type" varchar(20),
	"default_tax_rate" numeric(5, 4),
	"default_valid_days" integer DEFAULT 30,
	"default_terms" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pdf_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"logo_url" varchar(500),
	"primary_color" varchar(7) DEFAULT '#1a1a2e' NOT NULL,
	"accent_color" varchar(7) DEFAULT '#0066cc' NOT NULL,
	"show_company_logo" boolean DEFAULT true NOT NULL,
	"show_line_item_images" boolean DEFAULT false NOT NULL,
	"show_line_item_description" boolean DEFAULT false NOT NULL,
	"show_sku" boolean DEFAULT true NOT NULL,
	"header_text" text,
	"footer_text" text,
	"thank_you_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotation_items" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "valid_days" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "discount_type" varchar(20);--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "discount_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "pdf_template_id" uuid;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "acceptance_token" varchar(64);--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "viewed_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_activities" ADD CONSTRAINT "quotation_activities_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quotations" ADD CONSTRAINT "quotations_pdf_template_id_pdf_templates_id_fk" FOREIGN KEY ("pdf_template_id") REFERENCES "public"."pdf_templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_acceptance_token_unique" UNIQUE("acceptance_token");