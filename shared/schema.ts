import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Player table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(),
  school: text("school").notNull(),
  grade: integer("grade").notNull().default(75),
  tier: integer("tier").notNull().default(3),
  notes: text("notes").default(""),
  order: integer("order").notNull(),
});

// DraftBoard table to store the ordered list of player IDs
export const draftBoard = pgTable("draft_board", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  order: integer("order").notNull(),
  tierId: integer("tier_id").notNull(),
});

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertDraftBoardSchema = createInsertSchema(draftBoard).omit({
  id: true,
});

// Zod schemas for validation
export const playerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required"),
  position: z.string().min(1, "Position is required"),
  school: z.string(),
  grade: z.number().min(0).max(100),
  tier: z.number().min(1).max(5),
  notes: z.string().optional(),
  order: z.number(),
});

export const updatePlayerSchema = playerSchema.partial().pick({
  name: true,
  position: true,
  school: true,
  grade: true,
  tier: true,
  notes: true,
});

export const reorderPlayersSchema = z.array(
  z.object({
    id: z.number(),
    order: z.number(),
  })
);

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type UpdatePlayer = z.infer<typeof updatePlayerSchema>;
export type DraftBoard = typeof draftBoard.$inferSelect;
export type InsertDraftBoard = z.infer<typeof insertDraftBoardSchema>;
export type ReorderPlayers = z.infer<typeof reorderPlayersSchema>;
