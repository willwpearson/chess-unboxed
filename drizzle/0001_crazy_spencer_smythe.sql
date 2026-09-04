ALTER TABLE "games" ADD COLUMN "time_control" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "initial_time_sec" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "increment_sec" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "white_time_ms" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "black_time_ms" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "fen" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "turn" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "lobby_id" uuid;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "rating_change_white" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "rating_change_black" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "last_move_at" timestamp with time zone;