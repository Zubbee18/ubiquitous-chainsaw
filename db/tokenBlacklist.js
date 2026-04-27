import redisClient from "./redisClient.js"

// Blacklist a token (set with expiry matching token TTL)
export async function blacklistToken(token) {
    // Calculate TTL for redis
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiryInSeconds = token.exp - currentTime

    // set expiry and store in redis blacklist
    await redisClient.setEx(`blacklist:${token}`, expiryInSeconds, 'true')
}

// Check if token is blacklisted
export async function isTokenBlacklisted(token) {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null
}