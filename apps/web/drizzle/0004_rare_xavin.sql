CREATE TABLE `audit_event` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`type` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_event_actor_idx` ON `audit_event` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_event_subject_idx` ON `audit_event` (`subject_type`,`subject_id`);