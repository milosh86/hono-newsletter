CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"subscribed_at" timestamp NOT NULL,
	CONSTRAINT "subscriptions_email_unique" UNIQUE("email")
);
