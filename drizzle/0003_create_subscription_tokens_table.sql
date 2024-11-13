CREATE TABLE IF NOT EXISTS "subscription_tokens" (
	"subscription_token" text PRIMARY KEY NOT NULL,
	"subscriber_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_tokens" ADD CONSTRAINT "subscription_tokens_subscriber_id_subscriptions_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
