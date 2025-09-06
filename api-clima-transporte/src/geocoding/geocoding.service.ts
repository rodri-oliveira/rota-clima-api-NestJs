import { Injectable, Logger } from '@nestjs/common';

export interface Coordenadas {
  lat: number;
  lon: number;
}

class MemoryCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return item.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly cache = new MemoryCache<Coordenadas | null>(24 * 60 * 60 * 1000); // 24h

  async geocodeLocal(nome: string): Promise<Coordenadas | null> {
    const key = nome.trim().toLowerCase();
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      // cache pode ter null para "não encontrado"
      return cached;
    }

    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('q', nome);
      url.searchParams.set('limit', '1');

      // eslint-disable-next-line no-undef
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'api-clima-transporte/1.0 (e2e-tests)'
        },
      });
      if (!res.ok) {
        this.logger.warn(`Nominatim respondeu ${res.status} para q='${nome}'`);
        this.cache.set(key, null);
        return null;
      }
      const json: any[] = await res.json();
      const first = json?.[0];
      if (!first?.lat || !first?.lon) {
        this.cache.set(key, null);
        return null;
      }
      const coords: Coordenadas = { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
      this.cache.set(key, coords);
      return coords;
    } catch (err) {
      this.logger.error(`Falha ao geocodificar '${nome}': ${String(err)}`);
      this.cache.set(key, null);
      return null;
    }
  }
}
