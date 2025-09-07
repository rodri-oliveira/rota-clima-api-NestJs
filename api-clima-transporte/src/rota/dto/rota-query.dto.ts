import { IsDefined, IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ModoTransporteDto } from '../../favoritos/dto/criar-favorito.dto';

export class RotaQueryDto {
  @ApiProperty({
    description: 'Cidade de origem',
    example: 'Sao Paulo',
    minLength: 2,
  })
  @IsDefined()
  @IsString()
  @MinLength(2)
  origem!: string;

  @ApiProperty({
    description: 'Cidade de destino',
    example: 'Rio de Janeiro',
    minLength: 2,
  })
  @IsDefined()
  @IsString()
  @MinLength(2)
  destino!: string;

  @ApiProperty({
    description: 'Modo de transporte',
    enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'],
    example: 'DRIVING',
  })
  @IsDefined()
  @IsEnum(ModoTransporteDto)
  modo!: ModoTransporteDto;
}
