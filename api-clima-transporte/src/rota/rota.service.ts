import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';
import { RotaQueryDto } from './dto/rota-query.dto';
import { ModoTransporte } from '@prisma/client';
import { ClimaService } from '../clima/clima.service';
import { RotasService } from '../rotas/rotas.service';

@Injectable()
export class RotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clima: ClimaService,
    private readonly rotas: RotasService,
  ) {}

  private mapModo(modo: string): ModoTransporte {
    return ModoTransporte[modo as keyof typeof ModoTransporte];
  }

  async obterRota(dto: RotaQueryDto, usuarioId?: string) {
    const { distanciaMetros, duracaoSegundos } = await this.rotas.obter(
      dto.origem,
      dto.destino,
      dto.modo,
    );
    const { temperaturaC, climaResumo } = await this.clima.obterPorCidade(
      dto.destino,
    );

    if (usuarioId) {
      await this.prisma.consultaRota.create({
        data: {
          origem: dto.origem,
          destino: dto.destino,
          modo: this.mapModo(dto.modo),
          distanciaMetros,
          duracaoSegundos,
          temperaturaC,
          climaResumo,
          usuarioId,
        },
      });
    }

    return {
      origem: dto.origem,
      destino: dto.destino,
      modo: dto.modo,
      distanciaMetros,
      duracaoSegundos,
      clima: { temperaturaC, resumo: climaResumo },
    };
  }
}
