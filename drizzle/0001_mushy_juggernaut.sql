CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`person_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`url` text,
	`file_name` text,
	`size` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `documents_person_idx` ON `documents` (`person_id`);--> statement-breakpoint
CREATE INDEX `documents_request_idx` ON `documents` (`request_id`);