import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModoTransporteDto {
  DRIVING = 'DRIVING',
  WALKING = 'WALKING',
  BICYCLING = 'BICYCLING',
  TRANSIT = 'TRANSIT',
}

export class CriarFavoritoDto {
  @ApiProperty({ description: 'Cidade de origem', example: 'São Paulo', minLength: 2 })
  @IsString()
  @MinLength(2)
  origem!: string;

  @ApiProperty({ description: 'Cidade de destino', example: 'Rio de Janeiro', minLength: 2 })
  @IsString()
  @MinLength(2)
  destino!: string;

  @ApiProperty({ description: 'Modo de transporte', enum: ['DRIVING','WALKING','BICYCLING','TRANSIT'], example: 'DRIVING' })
  @IsEnum(ModoTransporteDto)
  modo!: ModoTransporteDto;

  @ApiPropertyOptional({ description: 'Apelido do favorito', example: 'SP-RJ' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  apelido?: string;
}
