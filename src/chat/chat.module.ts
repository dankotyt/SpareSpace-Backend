import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { WsJwtStrategy } from './strategies/ws-jwt.strategy';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    UsersModule,
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, WsJwtStrategy, WsJwtGuard, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
