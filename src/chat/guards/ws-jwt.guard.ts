import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Socket } from 'socket.io';
import { WsJwtStrategy } from '../strategies/ws-jwt.strategy';

@Injectable()
export class WsJwtGuard extends AuthGuard('ws-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth.token || client.handshake.query.token;
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    client.handshake.auth.token = token;

    const result = await super.canActivate(context);
    if (result) {
      const userPayload = result; // { userId, roles } из validate()
      client.data.user = userPayload;
    }
    return !!result;
  }
}
