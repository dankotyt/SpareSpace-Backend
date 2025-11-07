import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { GetConversationsDto } from './dto/get-conversations.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleType.RENTER, UserRoleType.LANDLORD)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async findAllConversations(@User('userId') userId: number, @Query() dto: GetConversationsDto) {
    return this.chatService.findAllConversations(userId, dto);
  }

  @Post('conversations')
  async createConversation(@Body() createConversationDto: CreateConversationDto, @User('userId') userId: number) {
    return this.chatService.createOrGetConversation(userId, createConversationDto);
  }

  @Get('conversations/:id/messages')
  async findMessages(
    @Param('id') conversationId: string,
    @Query() getMessagesDto: GetMessagesDto,
    @User('userId') userId: number,
  ) {
    return this.chatService.findMessages(+conversationId, userId, getMessagesDto);
  }
}
