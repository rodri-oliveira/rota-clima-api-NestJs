import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ORS_API_KEY');
  }

  private mock(origem: string, destino: string): RotaInfo {
    const base = Math.abs(origem.length - destino.length) + origem.length + destino.length;
    const distanciaMetros = 1000 * base;
    const duracaoSegundos = 60 * base;
    return { distanciaMetros, duracaoSegundos };
  }

  async obter(origem: string, destino: string, modo: string): Promise<RotaInfo> {
    const key = `${origem}|${destino}|${modo}`.toLowerCase();
    const cached = this.cache.get(key);
    if (cached) return cached;

    if (!this.apiKey) {
      const data = this.mock(origem, destino);
      this.cache.set(key, data);
      return data;
    }

    try {
      // OpenRouteService Directions API (simple example with "driving-car")
      const profile = modo.toLowerCase() === 'walking' ? 'foot-walking' : 'driving-car';
      const url = new URL(`https://api.openrouteservice.org/v2/directions/${profile}`);
      // For simplest path, we need coordinates; como mock inicial baseado em nomes, manteremos fallback
      // Em um cenário real, geocodificamos origem/destino para lat/lng e montamos o body.
      // Aqui, mantemos mock se não houver coordenadas resolvíveis.
      this.logger.warn('ORS integrado, mas faltando geocodificação — usando mock para nomes de cidades.');
      const data = this.mock(origem, destino);
      this.cache.set(key, data);
      return data;
    } catch (err) {
      this.logger.error(`Falha ao consultar ORS: ${String(err)}`);
      const data = this.mock(origem, destino);
      this.cache.set(key, data);
      return data;
    }
  }
}
