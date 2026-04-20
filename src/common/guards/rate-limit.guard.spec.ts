import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

function createMockContext(userId: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: userId }, ip: '127.0.0.1' }),
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  it('should allow requests under the limit', () => {
    const guard = new RateLimitGuard(5, 60000);
    const context = createMockContext('user-1');

    for (let i = 0; i < 5; i++) {
      expect(guard.canActivate(context)).toBe(true);
    }
  });

  it('should block requests over the limit', () => {
    const guard = new RateLimitGuard(3, 60000);
    const context = createMockContext('user-2');

    guard.canActivate(context);
    guard.canActivate(context);
    guard.canActivate(context);

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    try {
      guard.canActivate(context);
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('should track users independently', () => {
    const guard = new RateLimitGuard(2, 60000);
    const contextA = createMockContext('user-a');
    const contextB = createMockContext('user-b');

    guard.canActivate(contextA);
    guard.canActivate(contextA);

    expect(() => guard.canActivate(contextA)).toThrow(HttpException);
    expect(guard.canActivate(contextB)).toBe(true);
  });
});
