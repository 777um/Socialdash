import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, userTemplates, scriptExecutions,
  InsertUserTemplate, InsertScriptExecution,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { getRedisClient } from './redis-client';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const TEMPLATE_TTL = 300; // 5 minutos

function templateListKey(userId: number)           { return `cache:templates:user:${userId}`; }
function templateSingleKey(tId: number, uId: number) { return `cache:templates:${tId}:${uId}`; }

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedisClient().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

async function cacheSet(key: string, value: unknown, ttl = TEMPLATE_TTL): Promise<void> {
  try { await getRedisClient().setex(key, ttl, JSON.stringify(value)); }
  catch { /* ignore — cache miss é aceitável */ }
}

async function cacheInvalidateUser(userId: number): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`cache:templates:*:${userId}`);
    if (keys.length) await redis.del(...keys);
    await redis.del(templateListKey(userId));
  } catch { /* ignore */ }
}

// ============================================================================
// USERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }

  if (user.role !== undefined) {
    values.role = user.role; updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin'; updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TEMPLATES — com cache Redis Cache-Aside
// ============================================================================

export async function saveTemplate(template: InsertUserTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userTemplates).values(template);
  // Invalidar cache após escrita
  await cacheInvalidateUser(template.userId);
  return result;
}

export async function getTemplatesByUserId(userId: number) {
  // 1. Tentar cache
  const cached = await cacheGet<typeof userTemplates.$inferSelect[]>(templateListKey(userId));
  if (cached) return cached;

  // 2. Buscar no banco
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(userTemplates).where(eq(userTemplates.userId, userId));

  // 3. Salvar no cache
  await cacheSet(templateListKey(userId), rows);
  return rows;
}

export async function getTemplateById(templateId: number, userId: number) {
  // 1. Tentar cache
  const cached = await cacheGet<typeof userTemplates.$inferSelect>(templateSingleKey(templateId, userId));
  if (cached) return cached;

  // 2. Buscar no banco
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select().from(userTemplates)
    .where(and(eq(userTemplates.id, templateId), eq(userTemplates.userId, userId)))
    .limit(1);

  const row = result.length > 0 ? result[0] : undefined;
  if (row) await cacheSet(templateSingleKey(templateId, userId), row);
  return row;
}

export async function deleteTemplate(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .delete(userTemplates)
    .where(and(eq(userTemplates.id, templateId), eq(userTemplates.userId, userId)));
  // Invalidar cache após deleção
  await cacheInvalidateUser(userId);
  return result;
}

// ============================================================================
// EXECUTIONS
// ============================================================================

export async function saveExecution(execution: InsertScriptExecution) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(scriptExecutions).values(execution);
}

export async function getExecutionsByUserId(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scriptExecutions)
    .where(eq(scriptExecutions.userId, userId))
    .orderBy(desc(scriptExecutions.createdAt))
    .limit(limit);
}

export async function getExecutionById(executionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scriptExecutions)
    .where(and(eq(scriptExecutions.id, executionId), eq(scriptExecutions.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
