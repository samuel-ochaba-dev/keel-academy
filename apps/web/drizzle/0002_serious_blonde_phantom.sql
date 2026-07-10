CREATE TABLE `enrollment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text NOT NULL,
	`paddle_customer_id` text,
	`paddle_subscription_id` text,
	`paddle_transaction_id` text,
	`price_id` text,
	`current_period_ends_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_user_idx` ON `enrollment` (`user_id`);--> statement-breakpoint
CREATE INDEX `enrollment_paddle_customer_idx` ON `enrollment` (`paddle_customer_id`);--> statement-breakpoint
CREATE INDEX `enrollment_paddle_subscription_idx` ON `enrollment` (`paddle_subscription_id`);--> statement-breakpoint
CREATE TABLE `webhook_event` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`provider_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`payload` text,
	`received_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`processed_at` integer,
	`error_message` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_event_provider_id_idx` ON `webhook_event` (`provider`,`provider_event_id`);--> statement-breakpoint
CREATE INDEX `webhook_event_status_idx` ON `webhook_event` (`status`,`received_at`);