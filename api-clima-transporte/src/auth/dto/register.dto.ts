import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@exemplo.com', description: 'E-mail do usuário' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!', minLength: 6, description: 'Senha (mín. 6 caracteres)' })
  @IsString()
  @MinLength(6)
  senha!: string;

  @ApiProperty({ example: 'João da Silva', minLength: 2, description: 'Nome completo' })
  @IsString()
  @MinLength(2)
  nome!: string;
}
