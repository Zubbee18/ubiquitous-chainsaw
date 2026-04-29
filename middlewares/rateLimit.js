import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "../db/redisClient.js";

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:auth:",
  }),
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Try again in 1 minute.",
  },
  statusCode: 429,
});

// Dedicated in-memory limiter for /auth/github to ensure rate limiting
// even if the Redis store is unavailable
const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Try again later.",
  },
  statusCode: 429,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:api:",
  }),
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Try again in 1 minute.",
  },
  statusCode: 429,
});

export { authLimiter, githubLimiter, apiLimiter };
