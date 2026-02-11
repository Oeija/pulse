import { createClient } from 'redis';
import logger from '../utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;
let pubClient: ReturnType<typeof createClient> | null = null;
let subClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis connection
 */
export async function connectRedis(): Promise<void> {
    const config = {
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
    };

    // Main Redis client
    redisClient = createClient(config);
    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    await redisClient.connect();
    logger.info('Redis connected');

    // Pub/Sub clients for GraphQL subscriptions
    pubClient = createClient(config);
    subClient = createClient(config);

    await pubClient.connect();
    await subClient.connect();
    logger.info('Redis Pub/Sub clients connected');
}

/**
 * Get Redis client
 */
export function getRedisClient(): ReturnType<typeof createClient> {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call connectRedis() first.');
    }
    return redisClient;
}

/**
 * Get Pub/Sub clients
 */
export function getPubSubClients(): {
    pub: ReturnType<typeof createClient>;
    sub: ReturnType<typeof createClient>;
} {
    if (!pubClient || !subClient) {
        throw new Error('Redis Pub/Sub clients not initialized.');
    }
    return { pub: pubClient, sub: subClient };
}

/**
 * Update real-time stats in Redis
 */
export async function updateRealtimeStats(stats: {
    currentRps: number;
    avgResponseTime: number;
    errorRate: number;
    activeUsers: number;
}): Promise<void> {
    const client = getRedisClient();
    const key = 'realtime:stats';

    await client.set(
        key,
        JSON.stringify({
            ...stats,
            timestamp: new Date().toISOString(),
        }),
        { EX: 60 } // Expire after 60 seconds
    );
}

/**
 * Get real-time stats from Redis
 */
export async function getRealtimeStats(): Promise<any> {
    const client = getRedisClient();
    const key = 'realtime:stats';

    const data = await client.get(key);

    if (!data) {
        // Return default stats if not found
        return {
            currentRps: 0,
            avgResponseTime: 0,
            errorRate: 0,
            activeUsers: 0,
            timestamp: new Date().toISOString(),
        };
    }

    return JSON.parse(data);
}

/**
 * Publish event to Redis channel for GraphQL subscriptions
 */
export async function publishEvent(channel: string, data: any): Promise<void> {
    const { pub } = getPubSubClients();
    await pub.publish(channel, JSON.stringify(data));
}

/**
 * Subscribe to Redis channel
 */
export async function subscribeToChannel(
    channel: string,
    callback: (message: string) => void
): Promise<void> {
    const { sub } = getPubSubClients();
    await sub.subscribe(channel, callback);
}

/**
 * Increment counter in Redis
 */
export async function incrementCounter(key: string, expireSeconds: number = 60): Promise<number> {
    const client = getRedisClient();
    const value = await client.incr(key);

    // Set expiration on first increment
    if (value === 1) {
        await client.expire(key, expireSeconds);
    }

    return value;
}

/**
 * Track active users (using HyperLogLog for memory efficiency)
 */
export async function trackActiveUser(userId: string): Promise<void> {
    const client = getRedisClient();
    const key = 'active:users';
    await client.pfAdd(key, userId);
    await client.expire(key, 300); // 5 minutes
}

/**
 * Get active user count
 */
export async function getActiveUserCount(): Promise<number> {
    const client = getRedisClient();
    const key = 'active:users';
    return await client.pfCount(key);
}

/**
 * Close Redis connections
 */
export async function closeRedis(): Promise<void> {
    if (redisClient) await redisClient.quit();
    if (pubClient) await pubClient.quit();
    if (subClient) await subClient.quit();
    logger.info('Redis connections closed');
}
