import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClimaService } from './clima.service';

@Module({
  imports: [ConfigModule],
  providers: [ClimaService],
  exports: [ClimaService],
})
export class ClimaModule {}
