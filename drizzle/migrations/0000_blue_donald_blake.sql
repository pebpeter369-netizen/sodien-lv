CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`meta_description` text NOT NULL,
	`content` text NOT NULL,
	`excerpt` text NOT NULL,
	`topic` text NOT NULL,
	`type` text NOT NULL,
	`source_urls` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`views` integer DEFAULT 0,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`date_month` integer,
	`date_day` integer,
	`date_rule` text,
	`is_public_holiday` integer NOT NULL,
	`description` text NOT NULL,
	`traditions` text,
	`year_dates` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `holidays_slug_unique` ON `holidays` (`slug`);--> statement-breakpoint
CREATE TABLE `name_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_month` integer NOT NULL,
	`date_day` integer NOT NULL,
	`names` text NOT NULL,
	`extended_names` text
);
--> statement-breakpoint
CREATE TABLE `name_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`origin` text,
	`meaning` text,
	`famous_persons` text,
	`popularity` text,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `name_details_name_unique` ON `name_details` (`name`);--> statement-breakpoint
CREATE TABLE `trending_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`source_type` text NOT NULL,
	`source_url` text,
	`first_seen` integer NOT NULL,
	`mention_count` integer DEFAULT 1,
	`is_processed` integer DEFAULT 0,
	`article_id` integer,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trending_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_type` text NOT NULL,
	`source_url` text,
	`last_checked` integer,
	`is_active` integer DEFAULT 1
);
