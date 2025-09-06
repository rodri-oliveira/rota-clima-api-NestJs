import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RotaService } from './rota.service';
import { RotaQueryDto } from './dto/rota-query.dto';
import { UsuarioAtual } from '../common/decorators/usuario.decorator';
import type { UsuarioJwtPayload } from '../common/decorators/usuario.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@ApiTags('Rota')
@Controller('rota')
export class RotaController {
  constructor(private readonly rotaService: RotaService) {}

  @Get()
  @ApiOperation({ summary: 'Obter rota e clima (mock) e registrar histórico se autenticado' })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({
    description: 'Dados de rota e clima',
    schema: {
      type: 'object',
      properties: {
        origem: { type: 'string', example: 'São Paulo' },
        destino: { type: 'string', example: 'Rio de Janeiro' },
        modo: { type: 'string', example: 'DRIVING' },
        distanciaMetros: { type: 'number', example: 431245 },
        duracaoSegundos: { type: 'number', example: 18600 },
        clima: {
          type: 'object',
          properties: {
            temperaturaC: { type: 'number', example: 27.3 },
            resumo: { type: 'string', example: 'céu limpo' },
          },
        },
      },
    },
  })
  async obter(
    @Query(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }))
    query: RotaQueryDto,
    @UsuarioAtual() usuario?: UsuarioJwtPayload,
  ) {
    return this.rotaService.getRoute(query, usuario?.userId);
  }
}
