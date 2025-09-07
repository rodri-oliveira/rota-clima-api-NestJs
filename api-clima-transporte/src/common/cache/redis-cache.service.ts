import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Counter } from 'prom-client';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private ttlSeconds: number;
  private prefix: string;
  private static hitsCounter = new Counter({
    name: 'cache_hits_total',
    help: 'Total de acertos no cache',
    labelNames: ['cache'],
  });
  private static missesCounter = new Counter({
    name: 'cache_misses_total',
    help: 'Total de perdas no cache',
    labelNames: ['cache'],
  });

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

  private cacheLabel(key: string): string {
    if (key.startsWith('clima:')) return 'clima';
    return 'rota';
  }

  async getJson<T>(key: string): Promise<T | null> {
    const namespaced = this.k(key);
    const value = await this.client.get(namespaced);
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as T;
      RedisCacheService.hitsCounter.inc({ cache: this.cacheLabel(key) });
      return parsed;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? this.ttlSeconds;
    const namespaced = this.k(key);
    await this.client.set(namespaced, JSON.stringify(value), 'EX', ttl);
    // Registrar miss ao setar (indicativo de preenchimento de cache)
    RedisCacheService.missesCounter.inc({ cache: this.cacheLabel(key) });
  }
}
