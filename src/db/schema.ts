import { check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** Ten whole-board save slots per owner. */
export const boardSaveSlots = pgTable(
  "board_save_slots",
  {
    userId: uuid("user_id").notNull(),
    slot: integer("slot").notNull(),
    savedAt: timestamp("saved_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    snapshot: jsonb("snapshot").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.slot] }),
    check("board_save_slots_slot_check", sql`${table.slot} BETWEEN 1 AND 10`),
  ],
);

/** Staging area for snapshots too large to send in one request. */
export const boardSaveChunks = pgTable(
  "board_save_chunks",
  {
    userId: uuid("user_id").notNull(),
    uploadId: uuid("upload_id").notNull(),
    index: integer("index").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.uploadId, table.index] }),
    index("board_save_chunks_created_at_idx").on(table.createdAt),
  ],
);
