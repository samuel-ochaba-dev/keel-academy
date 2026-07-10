CREATE TABLE `api_key` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`hashed_key` text NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_key_hash_idx` ON `api_key` (`hashed_key`);--> statement-breakpoint
CREATE INDEX `api_key_user_idx` ON `api_key` (`user_id`);--> statement-breakpoint
CREATE TABLE `test_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`chapter_slug` text NOT NULL,
	`status` text NOT NULL,
	`tests_total` integer NOT NULL,
	`tests_passed` integer NOT NULL,
	`test_suite_version` text NOT NULL,
	`cli_version` text NOT NULL,
	`commit_sha` text,
	`signature_hash` text NOT NULL,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `test_sub_user_idx` ON `test_submission` (`user_id`);--> statement-breakpoint
CREATE INDEX `test_sub_user_chapter_idx` ON `test_submission` (`user_id`,`chapter_slug`);--> statement-breakpoint
CREATE INDEX `test_sub_user_time_idx` ON `test_submission` (`user_id`,`submitted_at`);