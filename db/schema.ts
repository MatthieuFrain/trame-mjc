import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
// Une seule salle privée, partagée entre les appareils du propriétaire du Site.
export const atelier = sqliteTable("atelier", {
  id: text("id").primaryKey(),
  document: text("document").notNull(),
  revision: integer("revision").notNull().default(0),
  lastOperation: text("last_operation"),
  controller: text("controller"),
  controllerName: text("controller_name"),
  leaseUntil: integer("lease_until").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
export const operations = sqliteTable(
  "operations",
  {
    id: text("id").primaryKey(),
    revision: integer("revision").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("operations_revision_idx").on(table.revision)],
);
export const voiceLimits = sqliteTable("voice_limits", {
  hour: integer("hour").primaryKey(),
  sessions: integer("sessions").notNull(),
});
