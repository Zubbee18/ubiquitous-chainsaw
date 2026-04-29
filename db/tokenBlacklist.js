import redisClient from "./redisClient.js";

// Blacklist a token (set with expiry matching token TTL)
export async function blacklistToken(token, decodedToken) {
  const currentTime = Math.floor(Date.now() / 1000);
  const expiryInSeconds = decodedToken.exp - currentTime;

  // Token already expired — no need to blacklist, jwt.verify will reject it anyway
  if (expiryInSeconds <= 0) return;

  await redisClient.setEx(`blacklist:${token}`, expiryInSeconds, "true");
}

// Check if token is blacklisted
export async function isTokenBlacklisted(token) {
  const result = await redisClient.get(`blacklist:${token}`);
  return result !== null;
}
