import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario.decorator';
import type { UsuarioJwtPayload } from '../common/decorators/usuario.decorator';
import type { CriarFavoritoDto } from './dto/criar-favorito.dto';
import { FavoritosService } from './favoritos.service';

@ApiTags('Favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar favorito' })
  async criar(
    @UsuarioAtual() usuario: UsuarioJwtPayload,
    @Body() dto: CriarFavoritoDto,
  ) {
    return this.favoritosService.criar(usuario.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar favoritos do usuário' })
  async listar(@UsuarioAtual() usuario: UsuarioJwtPayload) {
    return this.favoritosService.listar(usuario.userId);
  }
}
