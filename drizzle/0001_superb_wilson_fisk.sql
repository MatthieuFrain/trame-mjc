CREATE TABLE `voice_limits` (
	`hour` integer PRIMARY KEY NOT NULL,
	`sessions` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `operations_revision_idx` ON `operations` (`revision`);