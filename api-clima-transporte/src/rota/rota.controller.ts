import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    return this.rotaService.obterRota(query, usuario?.userId);
  }
}
