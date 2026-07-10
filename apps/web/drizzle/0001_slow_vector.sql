CREATE TABLE `progress_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`chapter_slug` text NOT NULL,
	`event` text NOT NULL,
	`from_status` text NOT NULL,
	`to_status` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `progress_event_user_idx` ON `progress_event` (`user_id`);--> statement-breakpoint
CREATE INDEX `progress_event_user_chapter_idx` ON `progress_event` (`user_id`,`chapter_slug`);