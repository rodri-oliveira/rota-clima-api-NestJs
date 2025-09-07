import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClimaService } from './clima.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Module({
  imports: [ConfigModule],
  providers: [ClimaService, RedisCacheService],
  exports: [ClimaService],
})
export class ClimaModule {}
