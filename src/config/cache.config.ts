import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  redisHost: process.env.REDIS_HOST ?? 'redis',
  redisPort: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  ttl: parseInt(process.env.CACHE_TTL ?? '300', 10),
}));
