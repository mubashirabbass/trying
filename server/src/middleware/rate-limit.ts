import rateLimit from "express-rate-limit";

/**
 * Standard rate limiter for sensitive authentication routes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: {
    status: "error",
    message: "Too many login/registration attempts from this IP. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict 3-attempts limit with 60s cooldown for logins
 */
export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 3, // Limit to 3 requests per 60 seconds
  message: {
    error: "Too many login attempts. Please try again after 60 seconds.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1000 requests per hour
  message: {
    status: "error",
    message: "Too many requests from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
