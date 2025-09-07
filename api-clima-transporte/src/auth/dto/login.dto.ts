import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@exemplo.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SenhaForte123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}
