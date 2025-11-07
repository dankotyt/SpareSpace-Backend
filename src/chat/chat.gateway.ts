import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { UserRoleType } from '../common/enums/user-role-type.enum';

interface ExtendedSocket extends Socket {
  data: {
    user: { userId: number; roles: UserRoleType[] };
  };
}

@WebSocketGateway({ namespace: 'chat', cors: true })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger('ChatGateway');

  constructor(private chatService: ChatService) {}

  afterInit(server: Namespace) {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: ExtendedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client connected: ${user.userId}`);
    }
  }

  handleDisconnect(client: ExtendedSocket) {
    const user = client.data.user;
    if (user) {
      this.logger.log(`Client disconnected: ${user.userId}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody('conversationId') conversationId: number,
    @ConnectedSocket() client: ExtendedSocket,
  ) {
    const userId = client.data.user.userId;
    const conversation = await this.chatService.getConversationById(conversationId, userId);
    if (!conversation) {
      client.emit('error', { message: 'Conversation not found or access denied' });
      return;
    }

    client.join(conversationId.toString());
    client.emit('joinedRoom', { conversationId });
    this.logger.log(`User ${userId} joined room ${conversationId}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { conversationId: number; text: string },
    @ConnectedSocket() client: ExtendedSocket,
  ) {
    const { conversationId, text } = data;
    const senderId = client.data.user.userId;

    // Проверка доступа
    const conversation = await this.chatService.getConversationById(conversationId, senderId);
    if (!conversation) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    // Сохранение сообщения и уведомление
    const message = await this.chatService.sendMessage(conversationId, senderId, text);
    const room = conversationId.toString();

    // Эмиссия всем в комнате, кроме отправителя
    client.to(room).emit('newMessage', { message });

    // Отправка подтверждения отправителю
    client.emit('messageSent', { message });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody('conversationId') conversationId: number,
    @ConnectedSocket() client: ExtendedSocket,
  ) {
    const userId = client.data.user.userId;
    await this.chatService.markMessagesAsRead(conversationId, userId);
    client.to(conversationId.toString()).emit('messagesRead', { conversationId, userId });
  }
}
