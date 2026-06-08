import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AllConfigType>) => {
        const redisHost = configService.get('cache.redisHost', { infer: true });
        const ttl =
          (configService.get('cache.ttl', { infer: true }) ?? 300) * 1000;

        if (redisHost) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            return {
              store: await redisStore({
                socket: {
                  host: redisHost,
                  port: configService.get('cache.redisPort', { infer: true }),
                },
              }),
              ttl,
            };
          } catch {
            Logger.warn(
              'Redis unavailable, falling back to in-memory cache',
              'RedisCacheModule',
            );
          }
        }

        return { ttl };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class RedisCacheModule {}
