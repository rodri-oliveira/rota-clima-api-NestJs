import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private ttlSeconds: number;
  private prefix: string;

  constructor() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.ttlSeconds = parseInt(process.env.ROUTE_CACHE_TTL_SECONDS ?? '600', 10);
    this.prefix = process.env.ROUTE_CACHE_PREFIX ?? 'rota_cache:';
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }

  async onModuleInit() {
    if (!this.client.status || this.client.status === 'end') {
      await this.client.connect();
    }
  }

  async onModuleDestroy() {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      await this.client.quit();
    }
  }

  private k(key: string): string {
    return `${this.prefix}${key}`;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(this.k(key));
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.ttlSeconds;
    await this.client.set(this.k(key), JSON.stringify(value), 'EX', ttl);
  }
}
