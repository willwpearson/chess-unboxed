DROP INDEX "matchmaking_queue_pairing_idx";--> statement-breakpoint
CREATE INDEX "games_white_player_status_idx" ON "games" USING btree ("white_player_id","status");--> statement-breakpoint
CREATE INDEX "games_black_player_status_idx" ON "games" USING btree ("black_player_id","status");--> statement-breakpoint
CREATE INDEX "matchmaking_queue_pairing_idx" ON "matchmaking_queue" USING btree ("queue_type","time_control","initial_time_sec","increment_sec","status","created_at");