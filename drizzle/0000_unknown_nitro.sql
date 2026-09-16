CREATE TABLE `catalog_cache` (
	`id` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`queue` text,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`lock_token` text,
	`retry_after` integer DEFAULT 0 NOT NULL,
	`error` text
);
