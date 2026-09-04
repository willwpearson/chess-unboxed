CREATE TABLE "matchmaking_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"queue_type" text NOT NULL,
	"variant" text DEFAULT 'unboxed' NOT NULL,
	"time_control" text NOT NULL,
	"initial_time_sec" integer NOT NULL,
	"increment_sec" integer NOT NULL,
	"rating_snapshot" integer,
	"status" text DEFAULT 'waiting' NOT NULL,
	"matched_game_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"matched_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"time_control" text NOT NULL,
	"rating" integer DEFAULT 1200 NOT NULL,
	"peak_rating" integer DEFAULT 1200 NOT NULL,
	"games_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"draws" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_matched_game_id_games_id_fk" FOREIGN KEY ("matched_game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matchmaking_queue_pairing_idx" ON "matchmaking_queue" USING btree ("queue_type","time_control","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_ratings_user_id_time_control_idx" ON "user_ratings" USING btree ("user_id","time_control");