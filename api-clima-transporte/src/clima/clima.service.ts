import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClimaInfo {
  temperaturaC: number;
  climaResumo: string;
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
export class ClimaService {
  private readonly logger = new Logger(ClimaService.name);
  private readonly cache = new MemoryCache<ClimaInfo>(5 * 60 * 1000); // 5 minutos
  private readonly apiKey?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
  }

  private mock(destino: string): ClimaInfo {
    const temperaturaC = 15 + (destino.length % 15);
    return { temperaturaC, climaResumo: 'Céu limpo (mock)' };
  }

  async obterPorCidade(cidade: string): Promise<ClimaInfo> {
    const cacheKey = `cidade:${cidade.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    if (!this.apiKey) {
      const data = this.mock(cidade);
      this.cache.set(cacheKey, data);
      return data;
    }

    try {
      // OpenWeather Current Weather Data (by city name)
      const url = new URL('https://api.openweathermap.org/data/2.5/weather');
      url.searchParams.set('q', cidade);
      url.searchParams.set('appid', this.apiKey);
      url.searchParams.set('units', 'metric');
      url.searchParams.set('lang', 'pt_br');

      // Node 18+ possui fetch global
      // eslint-disable-next-line no-undef
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`OpenWeather respondeu ${res.status} para cidade=${cidade}`);
        const data = this.mock(cidade);
        this.cache.set(cacheKey, data);
        return data;
      }
      const json: any = await res.json();
      const temperaturaC: number = json?.main?.temp ?? this.mock(cidade).temperaturaC;
      const climaResumo: string = json?.weather?.[0]?.description ?? 'Sem dados';
      const data = { temperaturaC, climaResumo };
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      this.logger.error(`Falha ao consultar OpenWeather: ${String(err)}`);
      const data = this.mock(cidade);
      this.cache.set(cacheKey, data);
      return data;
    }
  }
}
