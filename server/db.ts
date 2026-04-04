import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, telegramUsers, conversations, botStats, errorLogs, apiKeys } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users);
}

// Telegram user queries
export async function getTelegramUser(telegramUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.userId, telegramUserId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertTelegramUser(data: any) {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  await db
    .insert(telegramUsers)
    .values({
      ...data,
      createdAt: now,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        ...data,
        updatedAt: now,
      },
    });
}

// Conversation queries
export async function saveConversation(data: any) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(conversations).values(data);
}

export async function getUserConversations(telegramUserId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.telegramUserId, telegramUserId))
    .limit(limit);
  
  return result;
}

// Statistics queries
export async function updateBotStats(date: string, stats: any) {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  await db
    .insert(botStats)
    .values({
      date,
      ...stats,
      createdAt: now,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({
      set: {
        ...stats,
        updatedAt: now,
      },
    });
}

// Error log queries
export async function logError(error: any) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(errorLogs).values({
    ...error,
    createdAt: new Date(),
  });
}

// API key queries
export async function createApiKey(userId: number, name: string, key: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(apiKeys).values({
    userId,
    name,
    key,
    isActive: 1,
    createdAt: new Date(),
  });
}

export async function validateApiKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, key))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getTelegramUserCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(telegramUsers);
  return result.length;
}

export async function getConversationCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select().from(conversations);
  return result.length;
}
