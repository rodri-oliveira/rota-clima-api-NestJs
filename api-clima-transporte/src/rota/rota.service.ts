import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';
import { RotaQueryDto } from './dto/rota-query.dto';
import { ModoTransporte } from '@prisma/client';

@Injectable()
export class RotaService {
  constructor(private readonly prisma: PrismaService) {}

  private mapModo(modo: string): ModoTransporte {
    return ModoTransporte[modo as keyof typeof ModoTransporte];
  }

  private calcularMock(origem: string, destino: string) {
    // Mock simples: distância e duração proporcionais aos comprimentos
    const base = Math.abs(origem.length - destino.length) + origem.length + destino.length;
    const distanciaMetros = 1000 * base; // ex.: 10-100km
    const duracaoSegundos = 60 * base; // ex.: minutos
    return { distanciaMetros, duracaoSegundos };
  }

  private climaMock(destino: string) {
    // Mock simples: temperatura baseada no comprimento do destino
    const temperaturaC = 15 + (destino.length % 15); // 15 a 29
    const climaResumo = 'Céu limpo';
    return { temperaturaC, climaResumo };
  }

  async obterRota(dto: RotaQueryDto, usuarioId?: string) {
    const { distanciaMetros, duracaoSegundos } = this.calcularMock(
      dto.origem,
      dto.destino,
    );
    const { temperaturaC, climaResumo } = this.climaMock(dto.destino);

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
