CREATE TABLE "puzzle_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"puzzle_id" uuid NOT NULL,
	"solved" boolean NOT NULL,
	"moves_played" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"rating_change" integer,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puzzles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"slug" text NOT NULL,
	"starting_fen" text NOT NULL,
	"side_to_move" text NOT NULL,
	"solution_moves" jsonb NOT NULL,
	"is_wraparound_mode" boolean DEFAULT true NOT NULL,
	"rating" integer DEFAULT 1200 NOT NULL,
	"themes" text[],
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "puzzles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_puzzle_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer DEFAULT 1200 NOT NULL,
	"peak_rating" integer DEFAULT 1200 NOT NULL,
	"puzzles_attempted" integer DEFAULT 0 NOT NULL,
	"puzzles_solved" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puzzle_attempts" ADD CONSTRAINT "puzzle_attempts_puzzle_id_puzzles_id_fk" FOREIGN KEY ("puzzle_id") REFERENCES "public"."puzzles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_puzzle_ratings" ADD CONSTRAINT "user_puzzle_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "puzzle_attempts_user_puzzle_idx" ON "puzzle_attempts" USING btree ("user_id","puzzle_id");--> statement-breakpoint
CREATE INDEX "puzzle_attempts_user_created_idx" ON "puzzle_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "puzzles_rating_idx" ON "puzzles" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "puzzles_active_idx" ON "puzzles" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "user_puzzle_ratings_user_id_idx" ON "user_puzzle_ratings" USING btree ("user_id");