import redisClient from "./redisClient.js"

// Blacklist a token (set with expiry matching token TTL)
export async function blacklistToken(token, expiryInSeconds) {
    await redisClient.setEx(`blacklist:${token}`, expiryInSeconds, 'true')
}

// Check if token is blacklisted
export async function isTokenBlacklisted(token) {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null
}