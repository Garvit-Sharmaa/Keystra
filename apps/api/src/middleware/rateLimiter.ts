import rateLimit from 'express-rate-limit';
import { createError } from './errorHandler';

export const apiRateLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many requests. Slow down.', code: 'RATE_LIMIT_EXCEEDED' },
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many auth attempts. Try again later.', code: 'AUTH_RATE_LIMIT' },
    });
  },
});

export const sessionSubmitLimiter = rateLimit({
  windowMs:        10 * 1000, // 10 seconds
  max:             3,         // allow burst of 3 but not rapid-fire cheating
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { message: 'Session submitted too quickly.', code: 'SESSION_RATE_LIMIT' },
    });
  },
});

