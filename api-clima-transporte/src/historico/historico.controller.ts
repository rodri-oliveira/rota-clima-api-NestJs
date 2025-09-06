import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario.decorator';
import type { UsuarioJwtPayload } from '../common/decorators/usuario.decorator';
import { HistoricoService } from './historico.service';

@ApiTags('Histórico')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('historico')
export class HistoricoController {
  constructor(private readonly historicoService: HistoricoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico do usuário' })
  @ApiOkResponse({
    description: 'Lista de consultas de rota do usuário (mais recentes primeiro)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'hist_01J7Z6K8TR' },
          origem: { type: 'string', example: 'São Paulo' },
          destino: { type: 'string', example: 'Rio de Janeiro' },
          modo: { type: 'string', example: 'DRIVING' },
          distanciaMetros: { type: 'number', example: 431245 },
          duracaoSegundos: { type: 'number', example: 18600 },
          temperaturaC: { type: 'number', example: 27.3 },
          climaResumo: { type: 'string', example: 'céu limpo' },
          usuarioId: { type: 'string', example: 'user_01J7Z6FZ2A' },
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async listar(@UsuarioAtual() usuario: UsuarioJwtPayload) {
    return this.historicoService.listar(usuario.userId);
  }
}
