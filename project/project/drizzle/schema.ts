import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table.
 *
 * Roles disponíveis (5 níveis):
 *   viewer   — somente leitura (substitui o legado 'user')
 *   analyst  — leitura + analytics
 *   editor   — criar/editar conteúdo
 *   manager  — gerenciar usuários e configurações
 *   admin    — acesso total
 *
 * Usuários antigos com role='user' no banco são normalizados para 'viewer'
 * em runtime via getUserByOpenId (sem quebrar registros existentes).
 * A migration 0002 altera o enum no MySQL para incluir os novos valores.
 */
export const users = mysqlTable("users", {
  id:           int("id").autoincrement().primaryKey(),
  openId:       varchar("openId", { length: 64 }).notNull().unique(),
  name:         text("name"),
  email:        varchar("email", { length: 320 }),
  loginMethod:  varchar("loginMethod", { length: 64 }),
  role:         mysqlEnum("role", ["viewer", "analyst", "editor", "manager", "admin"]).default("viewer").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User       = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Hierarquia de permissões — índice mais alto = mais privilégio */
export const ROLE_HIERARCHY = {
  viewer:  0,
  analyst: 1,
  editor:  2,
  manager: 3,
  admin:   4,
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

/** Verificar se um role tem no mínimo o nível exigido */
export function hasRole(userRole: string, required: Role): boolean {
  const userLevel    = ROLE_HIERARCHY[userRole as Role] ?? 0;
  const neededLevel  = ROLE_HIERARCHY[required];
  return userLevel >= neededLevel;
}

/** Normalizar role legado 'user' → 'viewer' em runtime */
export function normalizeRole(role: string): Role {
  if (role === 'user') return 'viewer';
  return (role as Role) in ROLE_HIERARCHY ? (role as Role) : 'viewer';
}

// ============================================================================
// TEMPLATES
// ============================================================================

export const userTemplates = mysqlTable("user_templates", {
  id:          int("id").autoincrement().primaryKey(),
  userId:      int("userId").notNull(),
  name:        varchar("name", { length: 255 }).notNull(),
  scriptType:  varchar("scriptType", { length: 64 }).notNull(),
  parameters:  json("parameters").notNull(),
  description: text("description"),
  isPublic:    int("isPublic").default(0).notNull(),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserTemplate       = typeof userTemplates.$inferSelect;
export type InsertUserTemplate = typeof userTemplates.$inferInsert;

// ============================================================================
// EXECUTIONS
// ============================================================================

export const scriptExecutions = mysqlTable("script_executions", {
  id:            int("id").autoincrement().primaryKey(),
  userId:        int("userId").notNull(),
  scriptType:    varchar("scriptType", { length: 64 }).notNull(),
  parameters:    json("parameters").notNull(),
  output:        text("output"),
  error:         text("error"),
  status:        mysqlEnum("status", ["pending", "success", "failed"]).default("pending").notNull(),
  executionTime: int("executionTime"),
  createdAt:     timestamp("createdAt").defaultNow().notNull(),
});

export type ScriptExecution       = typeof scriptExecutions.$inferSelect;
export type InsertScriptExecution = typeof scriptExecutions.$inferInsert;
