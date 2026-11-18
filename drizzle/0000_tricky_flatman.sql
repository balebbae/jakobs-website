CREATE TABLE "board_save_chunks" (
	"user_id" uuid NOT NULL,
	"upload_id" uuid NOT NULL,
	"index" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "board_save_chunks_user_id_upload_id_index_pk" PRIMARY KEY("user_id","upload_id","index")
);
--> statement-breakpoint
CREATE TABLE "board_save_slots" (
	"user_id" uuid NOT NULL,
	"slot" integer NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "board_save_slots_user_id_slot_pk" PRIMARY KEY("user_id","slot"),
	CONSTRAINT "board_save_slots_slot_check" CHECK ("board_save_slots"."slot" BETWEEN 1 AND 10)
);
--> statement-breakpoint
CREATE INDEX "board_save_chunks_created_at_idx" ON "board_save_chunks" USING btree ("created_at");