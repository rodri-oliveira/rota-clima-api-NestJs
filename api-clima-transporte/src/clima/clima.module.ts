import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClimaService } from './clima.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { ClimaController } from './clima.controller';

@Module({
  imports: [ConfigModule],
  providers: [ClimaService, RedisCacheService],
  controllers: [ClimaController],
  exports: [ClimaService],
})
export class ClimaModule {}
