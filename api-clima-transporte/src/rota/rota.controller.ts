import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Obter rota e clima (com cache) e registrar histórico se autenticado' })
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({ name: 'origem', type: String, required: true, example: 'Sao Paulo', description: 'Cidade de origem' })
  @ApiQuery({ name: 'destino', type: String, required: true, example: 'Rio de Janeiro', description: 'Cidade de destino' })
  @ApiQuery({ name: 'modo', enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'], required: true, example: 'DRIVING', description: 'Modo de transporte' })
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
            cidade: { type: 'string', example: 'Rio de Janeiro' },
            temperaturaC: { type: 'number', example: 27.3 },
            resumo: { type: 'string', example: 'céu limpo' },
            obtidoEm: { type: 'string', format: 'date-time', example: '2025-09-06T16:23:40.123Z' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos (origem, destino, modo)' })
  @ApiUnauthorizedResponse({ description: 'Token inválido/ausente (histórico não será gravado)' })
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
