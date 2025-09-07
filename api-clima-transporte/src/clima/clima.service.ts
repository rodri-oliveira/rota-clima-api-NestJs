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

  private weatherCodeToPt(code?: number): string {
    // Mapa simples de alguns códigos do Open-Meteo (https://open-meteo.com/en/docs#weathervariables)
    const map: Record<number, string> = {
      0: 'Céu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Nevoeiro',
      48: 'Nevoeiro depositante',
      51: 'Garoa fraca',
      53: 'Garoa',
      55: 'Garoa forte',
      61: 'Chuva fraca',
      63: 'Chuva',
      65: 'Chuva forte',
      71: 'Neve fraca',
      73: 'Neve',
      75: 'Neve forte',
      80: 'Aguaceiros fracos',
      81: 'Aguaceiros',
      82: 'Aguaceiros fortes',
      95: 'Trovoadas',
      96: 'Trovoadas com granizo',
      99: 'Trovoadas com granizo forte',
    };
    if (code === undefined || code === null) return 'Sem dados';
    return map[code] ?? `Tempo (${code})`;
  }

  private async geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.searchParams.set('name', city);
      url.searchParams.set('count', '1');
      url.searchParams.set('language', 'pt');
      url.searchParams.set('format', 'json');
      // eslint-disable-next-line no-undef
      const res = await fetch(url);
      if (!res.ok) return null;
      const json: any = await res.json();
      const result = json?.results?.[0];
      if (!result) return null;
      return { lat: result.latitude, lon: result.longitude };
    } catch (e) {
      this.logger.warn(`Falha no geocoding Open-Meteo para cidade=${city}: ${String(e)}`);
      return null;
    }
  }

  async getByCity(city: string): Promise<ClimaInfo> {
    const cacheKey = `cidade:${city.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Sem API key: usa Open-Meteo (gratuita, sem chave) com geocoding
    if (!this.apiKey) {
      try {
        const coords = await this.geocodeCity(city);
        if (!coords) {
          const data = this.mock(city);
          this.cache.set(cacheKey, data);
          return data;
        }
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', String(coords.lat));
        url.searchParams.set('longitude', String(coords.lon));
        url.searchParams.set('current_weather', 'true');
        url.searchParams.set('timezone', 'auto');
        // eslint-disable-next-line no-undef
        const res = await fetch(url);
        if (!res.ok) {
          this.logger.warn(`Open-Meteo respondeu ${res.status} para cidade=${city}`);
          const data = this.mock(city);
          this.cache.set(cacheKey, data);
          return data;
        }
        const json: any = await res.json();
        const temperaturaC: number = json?.current_weather?.temperature ?? this.mock(city).temperaturaC;
        const weatherCode: number | undefined = json?.current_weather?.weathercode;
        const climaResumo = this.weatherCodeToPt(weatherCode);
        const data = { temperaturaC, climaResumo };
        this.cache.set(cacheKey, data);
        return data;
      } catch (err) {
        this.logger.error(`Falha ao consultar Open-Meteo: ${String(err)}`);
        const data = this.mock(city);
        this.cache.set(cacheKey, data);
        return data;
      }
    }

    try {
      // OpenWeather Current Weather Data (by city name)
      const url = new URL('https://api.openweathermap.org/data/2.5/weather');
      url.searchParams.set('q', city);
      url.searchParams.set('appid', this.apiKey);
      url.searchParams.set('units', 'metric');
      url.searchParams.set('lang', 'pt_br');

      // Node 18+ possui fetch global
      // eslint-disable-next-line no-undef
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`OpenWeather respondeu ${res.status} para cidade=${city}`);
        const data = this.mock(city);
        this.cache.set(cacheKey, data);
        return data;
      }
      const json: any = await res.json();
      const temperaturaC: number = json?.main?.temp ?? this.mock(city).temperaturaC;
      const climaResumo: string = json?.weather?.[0]?.description ?? 'Sem dados';
      const data = { temperaturaC, climaResumo };
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      this.logger.error(`Falha ao consultar OpenWeather: ${String(err)}`);
      const data = this.mock(city);
      this.cache.set(cacheKey, data);
      return data;
    }
  }
}
