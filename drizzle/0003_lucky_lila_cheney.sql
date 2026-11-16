CREATE TABLE `subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_token_unique` ON `subscribers` (`token`);