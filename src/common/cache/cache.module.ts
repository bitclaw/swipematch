import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { AllConfigType } from '../../config/config.type';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => ({
        store: await redisStore({
          socket: {
            host: configService.get('cache.redisHost', { infer: true }),
            port: configService.get('cache.redisPort', { infer: true }),
          },
        }),
        ttl: (configService.get('cache.ttl', { infer: true }) ?? 300) * 1000,
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisCacheModule {}
