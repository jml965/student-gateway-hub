import Redis from "ioredis";
import { db, sessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { logger } from "./logger";

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function makeSessionKey(token: string): string {
  return `baansy:session:${token}`;
}

function makeUserSessionsKey(userId: number): string {
  return `baansy:user_sessions:${userId}`;
}

class SessionStore {
  private redis: Redis | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 5000,
      });
      this.redis.on("error", (err) => {
        logger.warn({ err: err.message }, "Redis connection error — falling back to PostgreSQL for session operations");
      });
    } else {
      logger.warn("REDIS_URL not configured — using PostgreSQL for session storage. Set REDIS_URL for production-scale session management.");
    }
  }

  private get hasRedis(): boolean {
    return this.redis !== null && this.redis.status === "ready";
  }

  async store(userId: number, token: string, expiresAt: Date): Promise<void> {
    const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    // Always persist to PostgreSQL for durability
    await db.insert(sessionsTable).values({ userId, token, expiresAt });

    if (this.hasRedis) {
      const pipeline = this.redis!.pipeline();
      // Cache session token → userId
      pipeline.set(makeSessionKey(token), String(userId), "EX", ttl);
      // Track user's active sessions for bulk invalidation
      pipeline.sadd(makeUserSessionsKey(userId), token);
      pipeline.expire(makeUserSessionsKey(userId), SESSION_TTL_SECONDS);
      await pipeline.exec();
    }
  }

  async verify(token: string): Promise<number | null> {
    if (this.hasRedis) {
      const cached = await this.redis!.get(makeSessionKey(token));
      if (cached !== null) {
        return parseInt(cached, 10);
      }
      // Cache miss — fall through to DB
    }

    // Database fallback (also repopulates Redis on cache miss)
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.token, token),
          gt(sessionsTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) return null;

    // Repopulate Redis cache on miss
    if (this.hasRedis) {
      const ttl = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      await this.redis!.set(makeSessionKey(token), String(session.userId), "EX", ttl);
    }

    return session.userId;
  }

  async invalidate(token: string, userId: number): Promise<void> {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));

    if (this.hasRedis) {
      const pipeline = this.redis!.pipeline();
      pipeline.del(makeSessionKey(token));
      pipeline.srem(makeUserSessionsKey(userId), token);
      await pipeline.exec();
    }
  }

  async invalidateAll(userId: number): Promise<void> {
    // Fetch all tokens from Redis set before deleting DB records
    const redisTokens: string[] = this.hasRedis
      ? ((await this.redis!.smembers(makeUserSessionsKey(userId))) ?? [])
      : [];

    // Delete all DB sessions for this user
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

    if (this.hasRedis && redisTokens.length > 0) {
      const pipeline = this.redis!.pipeline();
      for (const token of redisTokens) {
        pipeline.del(makeSessionKey(token));
      }
      pipeline.del(makeUserSessionsKey(userId));
      await pipeline.exec();
    }
  }
}

export const sessionStore = new SessionStore();
