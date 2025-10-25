import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
    });
    
    redisClient.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
    
    redisClient.on('connect', () => {
      logger.info('Connected to Redis successfully');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    await redisClient.connect();
    
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.disconnect();
      logger.info('Disconnected from Redis');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

// Cache utility functions
export class CacheService {
  private static client = () => getRedisClient();
  
  static async get(key: string): Promise<string | null> {
    try {
      return await this.client().get(key);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }
  
  static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client().setEx(key, ttlSeconds, value);
      } else {
        await this.client().set(key, value);
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }
  
  static async del(key: string): Promise<void> {
    try {
      await this.client().del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }
  
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client().exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
}