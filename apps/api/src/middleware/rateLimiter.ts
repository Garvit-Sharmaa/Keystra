import rateLimit       from 'express-rate-limit';
import { RedisStore }  from 'rate-limit-redis';
import { redis }       from '../config/redis';
import { createError } from './errorHandler';
import { logger }      from '../utils/logger';

// ── Shared Redis store factory ────────────────────────────────────────────────
// Counters live in Redis → survives horizontal scaling (multiple Node instances
// behind a load balancer all read/write the same counter per user IP).
// Falls back to in-memory if Redis is unhealthy — prevents rate-limiter from
// hard-blocking the entire app on a Redis blip.
function makeRedisStore(prefix: string) {
  try {
    return new RedisStore({
      // rate-limit-redis v4 compatible with ioredis via sendCommand adapter
      sendCommand: (...args: string[]) => (redis as any).call(...args),
      prefix,
    });
  } catch (err) {
    logger.warn({ err, prefix }, '[RateLimit] Redis store init failed — falling back to memory store');
    return undefined; // express-rate-limit uses in-memory when store is undefined
  }
}

// ── General API rate limiter ──────────────────────────────────────────────────
export const apiRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,   // 15 minutes
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeRedisStore('rl:api:'),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many requests. Slow down.', code: 'RATE_LIMIT_EXCEEDED' },
    });
  },
});

// ── Auth rate limiter (stricter — prevents brute force) ───────────────────────
export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeRedisStore('rl:auth:'),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many auth attempts. Try again later.', code: 'AUTH_RATE_LIMIT' },
    });
  },
});

// ── Session submission limiter (one session per ~10 seconds minimum) ──────────
export const sessionSubmitLimiter = rateLimit({
  windowMs:        10 * 1000,   // 10 seconds
  max:             3,           // allow burst of 3 but not rapid-fire cheating
  standardHeaders: true,
  legacyHeaders:   false,
  store:           makeRedisStore('rl:session:'),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Session submitted too quickly.', code: 'SESSION_RATE_LIMIT' },
    });
  },
});

