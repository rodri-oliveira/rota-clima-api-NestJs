import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodingService } from '../geocoding/geocoding.service';

export interface RotaInfo {
  distanciaMetros: number;
  duracaoSegundos: number;
}

class MemoryCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

@Injectable()
export class RotasService {
  private readonly logger = new Logger(RotasService.name);
  private readonly cache = new MemoryCache<RotaInfo>(5 * 60 * 1000); // 5 minutos
  private readonly apiKey?: string;

  constructor(
    private readonly config: ConfigService,
    private readonly geocoding: GeocodingService,
  ) {
    this.apiKey = this.config.get<string>('ORS_API_KEY');
  }

  private mock(origem: string, destino: string): RotaInfo {
    const base = Math.abs(origem.length - destino.length) + origem.length + destino.length;
    const distanciaMetros = 1000 * base;
    const duracaoSegundos = 60 * base;
    return { distanciaMetros, duracaoSegundos };
  }

  private mapProfile(modo: string): string {
    const m = (modo || '').toUpperCase();
    if (m === 'WALKING') return 'foot-walking';
    if (m === 'BICYCLING') return 'cycling-regular';
    // TRANSIT não é suportado diretamente pelo ORS; cair para driving
    return 'driving-car';
  }

  async getRouteInfo(origem: string, destino: string, modo: string): Promise<RotaInfo> {
    const key = `${origem}|${destino}|${modo}`.toLowerCase();
    const cached = this.cache.get(key);
    if (cached) return cached;

    // Se não houver API key, manter mock
    if (!this.apiKey) {
      const data = this.mock(origem, destino);
      this.cache.set(key, data);
      return data;
    }

    try {
      // Geocodificar origem e destino
      const [coordsOrigem, coordsDestino] = await Promise.all([
        this.geocoding.geocodePlace(origem),
        this.geocoding.geocodePlace(destino),
      ]);

      if (!coordsOrigem || !coordsDestino) {
        this.logger.warn('Geocoding falhou ou não encontrou coordenadas — usando mock.');
        const data = this.mock(origem, destino);
        this.cache.set(key, data);
        return data;
      }

      const profile = this.mapProfile(modo);
      const url = new URL(`https://api.openrouteservice.org/v2/directions/${profile}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      // eslint-disable-next-line no-undef
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [coordsOrigem.lon, coordsOrigem.lat],
            [coordsDestino.lon, coordsDestino.lat],
          ],
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        this.logger.warn(`ORS respondeu ${res.status} — fallback mock.`);
        const data = this.mock(origem, destino);
        this.cache.set(key, data);
        return data;
      }

      const json: any = await res.json();
      const feat = json?.features?.[0];
      const summary = feat?.properties?.summary;
      const distanciaMetros = Number(summary?.distance) || this.mock(origem, destino).distanciaMetros;
      const duracaoSegundos = Number(summary?.duration) || this.mock(origem, destino).duracaoSegundos;
      const data: RotaInfo = { distanciaMetros, duracaoSegundos };
      this.cache.set(key, data);
      return data;
    } catch (err) {
      this.logger.error(`Falha ORS/geocoding: ${String(err)}`);
      const data = this.mock(origem, destino);
      this.cache.set(key, data);
      return data;
    }
  }
}
