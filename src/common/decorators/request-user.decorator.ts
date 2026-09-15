import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { IAuthUser } from '@/common/interfaces/auth-user.interface';

interface RequestWithUser extends Omit<Request, 'user'> {
  user?: IAuthUser;
}

export const ReqUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data && user ? (user as Record<string, any>)[data] : user;
  },
);
