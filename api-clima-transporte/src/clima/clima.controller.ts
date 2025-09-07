import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClimaService, ClimaInfo } from './clima.service';

@ApiTags('Clima')
@Controller('clima')
export class ClimaController {
  constructor(private readonly clima: ClimaService) {}

  @Get()
  @ApiOperation({ summary: 'Obter clima atual por cidade (com cache de 5 min)' })
  @ApiQuery({ name: 'cidade', type: String, required: true, example: 'Rio de Janeiro' })
  @ApiOkResponse({
    description: 'Clima atual',
    schema: {
      type: 'object',
      properties: {
        temperaturaC: { type: 'number', example: 26.5 },
        climaResumo: { type: 'string', example: 'céu limpo' },
      },
    },
  })
  async get(@Query('cidade') cidade: string): Promise<ClimaInfo> {
    return this.clima.getByCity(cidade);
  }
}
