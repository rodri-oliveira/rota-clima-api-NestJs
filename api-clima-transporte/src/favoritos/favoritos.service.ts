import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';
import { CriarFavoritoDto, ModoTransporteDto } from './dto/criar-favorito.dto';
import { ModoTransporte } from '@prisma/client';

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  private mapModo(modo: ModoTransporteDto): ModoTransporte {
    return ModoTransporte[modo as keyof typeof ModoTransporte];
  }

  async criar(usuarioId: string, dto: CriarFavoritoDto) {
    try {
      const favorito = await this.prisma.favorito.create({
        data: {
          origem: dto.origem,
          destino: dto.destino,
          modo: this.mapModo(dto.modo),
          apelido: dto.apelido,
          usuarioId,
        },
      });
      return favorito;
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('Favorito já existe para este usuário');
      }
      throw err;
    }
  }

  async listar(usuarioId: string) {
    return this.prisma.favorito.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
    });
  }
}
