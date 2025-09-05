import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async listar(@UsuarioAtual() usuario: UsuarioJwtPayload) {
    return this.historicoService.listar(usuario.userId);
  }
}
