CREATE TABLE "lobbies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"host_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"variant" text DEFAULT 'unboxed' NOT NULL,
	"time_control" text,
	"initial_time_sec" integer,
	"increment_sec" integer,
	"host_color_preference" text DEFAULT 'random' NOT NULL,
	"game_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"joined_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "lobbies_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
ALTER TABLE "lobbies" ADD CONSTRAINT "lobbies_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobbies" ADD CONSTRAINT "lobbies_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "public"."lobbies"("id") ON DELETE no action ON UPDATE no action;