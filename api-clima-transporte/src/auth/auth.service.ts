import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../infra/database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegisterDto) {
    const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existente) {
      throw new BadRequestException('E-mail já cadastrado');
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(dto.senha, saltRounds);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        senhaHash,
        nome: dto.nome,
      },
      select: { id: true, email: true, nome: true },
    });

    return usuario;
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const senhaOk = await bcrypt.compare(dto.senha, usuario.senhaHash);
    if (!senhaOk) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email };
    const access_token = await this.jwtService.signAsync(payload);
    return { access_token };
  }
}
