import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum ModoTransporteDto {
  DRIVING = 'DRIVING',
  WALKING = 'WALKING',
  BICYCLING = 'BICYCLING',
  TRANSIT = 'TRANSIT',
}

export class CriarFavoritoDto {
  @IsString()
  @MinLength(2)
  origem!: string;

  @IsString()
  @MinLength(2)
  destino!: string;

  @IsEnum(ModoTransporteDto)
  modo!: ModoTransporteDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  apelido?: string;
}
