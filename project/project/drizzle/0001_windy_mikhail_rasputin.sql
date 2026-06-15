CREATE TABLE `script_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scriptType` varchar(64) NOT NULL,
	`parameters` json NOT NULL,
	`output` text,
	`error` text,
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`executionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `script_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`scriptType` varchar(64) NOT NULL,
	`parameters` json NOT NULL,
	`description` text,
	`isPublic` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_templates_id` PRIMARY KEY(`id`)
);
