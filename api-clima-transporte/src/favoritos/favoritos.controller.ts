import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario.decorator';
import type { UsuarioJwtPayload } from '../common/decorators/usuario.decorator';
import { CriarFavoritoDto } from './dto/criar-favorito.dto';
import { FavoritosService } from './favoritos.service';

@ApiTags('Favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar favorito' })
  @ApiCreatedResponse({
    description: 'Favorito criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'fav_01J7Z6G9Y5' },
        origem: { type: 'string', example: 'São Paulo' },
        destino: { type: 'string', example: 'Rio de Janeiro' },
        modo: { type: 'string', example: 'DRIVING' },
        apelido: { type: 'string', nullable: true, example: 'SP-RJ' },
        usuarioId: { type: 'string', example: 'user_01J7Z6FZ2A' },
        criadoEm: { type: 'string', format: 'date-time' },
      },
    },
  })
  async criar(
    @UsuarioAtual() usuario: UsuarioJwtPayload,
    @Body() dto: CriarFavoritoDto,
  ) {
    return this.favoritosService.criar(usuario.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar favoritos do usuário' })
  @ApiOkResponse({
    description: 'Lista de favoritos',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'fav_01J7Z6G9Y5' },
          origem: { type: 'string', example: 'São Paulo' },
          destino: { type: 'string', example: 'Rio de Janeiro' },
          modo: { type: 'string', example: 'DRIVING' },
          apelido: { type: 'string', nullable: true, example: 'SP-RJ' },
          usuarioId: { type: 'string', example: 'user_01J7Z6FZ2A' },
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async listar(@UsuarioAtual() usuario: UsuarioJwtPayload) {
    return this.favoritosService.listar(usuario.userId);
  }
}
