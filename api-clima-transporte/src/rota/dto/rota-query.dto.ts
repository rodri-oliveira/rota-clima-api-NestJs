import { IsDefined, IsEnum, IsString, MinLength } from 'class-validator';
import { ModoTransporteDto } from '../../favoritos/dto/criar-favorito.dto';

export class RotaQueryDto {
  @IsDefined()
  @IsString()
  @MinLength(2)
  origem!: string;

  @IsDefined()
  @IsString()
  @MinLength(2)
  destino!: string;

  @IsDefined()
  @IsEnum(ModoTransporteDto)
  modo!: ModoTransporteDto;
}
