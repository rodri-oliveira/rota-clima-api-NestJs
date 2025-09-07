import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';
import { RotaQueryDto } from './dto/rota-query.dto';
import { ModoTransporte } from '@prisma/client';
import { ClimaService } from '../clima/clima.service';
import { RotasService } from '../rotas/rotas.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Injectable()
export class RotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clima: ClimaService,
    private readonly rotas: RotasService,
    private readonly cache: RedisCacheService,
  ) {}

  private mapTransportMode(mode: string): ModoTransporte {
    return ModoTransporte[mode as keyof typeof ModoTransporte];
  }

  async getRoute(dto: RotaQueryDto, usuarioId?: string) {
    const cacheKey = `${dto.origem}|${dto.destino}|${dto.modo}`;
    const cached = await this.cache.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }
    const { distanciaMetros, duracaoSegundos } = await this.rotas.getRouteInfo(
      dto.origem,
      dto.destino,
      dto.modo,
    );
    const { temperaturaC, climaResumo } = await this.clima.getByCity(
      dto.destino,
    );

    if (usuarioId) {
      await this.prisma.consultaRota.create({
        data: {
          origem: dto.origem,
          destino: dto.destino,
          modo: this.mapTransportMode(dto.modo),
          distanciaMetros,
          duracaoSegundos,
          temperaturaC,
          climaResumo,
          usuarioId,
        },
      });
    }

    const response = {
      origem: dto.origem,
      destino: dto.destino,
      modo: dto.modo,
      distanciaMetros,
      duracaoSegundos,
      clima: {
        cidade: dto.destino,
        temperaturaC,
        resumo: climaResumo,
        obtidoEm: new Date().toISOString(),
      },
    };
    await this.cache.setJson(cacheKey, response);
    return response;
  }
}
