import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserEntity } from '@/auth/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserEntity | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: UserEntity }>();
    return request.user;
  },
);
