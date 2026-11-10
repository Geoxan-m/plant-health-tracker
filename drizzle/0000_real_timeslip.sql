CREATE TABLE `logs` (
	`id` text PRIMARY KEY NOT NULL,
	`plant_id` text NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	`status` text,
	`amount` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_logs_plant_date` ON `logs` (`plant_id`,`date`);--> statement-breakpoint
CREATE TABLE `plants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`location` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
