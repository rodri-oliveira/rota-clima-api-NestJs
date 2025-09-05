import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';

@Injectable()
export class HistoricoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(usuarioId: string) {
    return this.prisma.consultaRota.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  }
}
