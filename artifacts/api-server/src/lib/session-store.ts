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
  private redisReady = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 5000,
        // Limit reconnection attempts so failures don't spin forever
        retryStrategy: (times: number) => (times < 5 ? Math.min(times * 500, 5000) : null),
      });

      this.redis.on("ready", () => {
        this.redisReady = true;
        logger.info("Redis connected — using Redis-backed session storage");
      });

      this.redis.on("error", (err) => {
        this.redisReady = false;
        logger.warn({ err: err.message }, "Redis error — falling back to PostgreSQL for this operation");
      });

      this.redis.on("close", () => {
        this.redisReady = false;
      });
    } else {
      logger.warn(
        "REDIS_URL not configured — using PostgreSQL for session storage." +
        " Set REDIS_URL for Redis-backed high-throughput sessions.",
      );
    }
  }

  private get hasRedis(): boolean {
    return this.redisReady && this.redis !== null;
  }

  async store(userId: number, token: string, expiresAt: Date): Promise<void> {
    const ttl = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    // Always persist to PostgreSQL for durability
    await db.insert(sessionsTable).values({ userId, token, expiresAt });

    if (this.hasRedis) {
      const pipeline = this.redis!.pipeline();
      // Cache session token → userId with TTL
      pipeline.set(makeSessionKey(token), String(userId), "EX", ttl);
      // Track user's active sessions for bulk invalidation support
      pipeline.sadd(makeUserSessionsKey(userId), token);
      pipeline.expire(makeUserSessionsKey(userId), SESSION_TTL_SECONDS);
      await pipeline.exec();
    }
  }

  async verify(token: string): Promise<number | null> {
    if (this.hasRedis) {
      const cached = await this.redis!.get(makeSessionKey(token));
      if (cached !== null) {
        // Redis cache hit — fast path, no DB query needed
        return parseInt(cached, 10);
      }
      // Cache miss — fall through to DB lookup
    }

    // DB fallback (also repopulates Redis on cache miss for warm-up)
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

    // Repopulate Redis on miss
    if (this.hasRedis) {
      const ttl = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
      await this.redis!.set(makeSessionKey(token), String(session.userId), "EX", ttl);
    }

    return session.userId;
  }

  async invalidate(token: string, userId: number): Promise<void> {
    // Delete from DB first (source of truth)
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));

    if (this.hasRedis) {
      const pipeline = this.redis!.pipeline();
      pipeline.del(makeSessionKey(token));
      pipeline.srem(makeUserSessionsKey(userId), token);
      await pipeline.exec();
    }
  }

  async invalidateAll(userId: number): Promise<void> {
    // Gather all Redis session tokens before the DB delete
    const redisTokens: string[] = this.hasRedis
      ? ((await this.redis!.smembers(makeUserSessionsKey(userId))) ?? [])
      : [];

    // Delete all DB sessions for this user
    await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));

    if (this.hasRedis && redisTokens.length > 0) {
      const pipeline = this.redis!.pipeline();
      for (const t of redisTokens) {
        pipeline.del(makeSessionKey(t));
      }
      pipeline.del(makeUserSessionsKey(userId));
      await pipeline.exec();
    }
  }
}

export const sessionStore = new SessionStore();
