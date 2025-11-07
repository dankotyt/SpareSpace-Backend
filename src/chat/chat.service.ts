import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { GetConversationsDto } from './dto/get-conversations.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { UsersService } from '../users/users.service';
import { UserRoleType } from '../common/enums/user-role-type.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async findAllConversations(userId: number, dto: GetConversationsDto) {
    const query = this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participant1', 'participant1')
      .leftJoinAndSelect('conversation.participant2', 'participant2')
      .leftJoinAndSelect('conversation.listing', 'listing')
      .leftJoinAndSelect('listing.user', 'listingUser')
      .where(
        '(conversation.participant1_id = :userId OR conversation.participant2_id = :userId)',
        { userId },
      )
      .orderBy('conversation.lastMessageAt', 'DESC')
      .limit(dto.limit)
      .offset(dto.offset);

    const [conversations, total] = await query.getManyAndCount();
    return { conversations, total, limit: dto.limit, offset: dto.offset };
  }

  async createOrGetConversation(currentUserId: number, dto: CreateConversationDto) {
    const { participantId, listingId } = dto;

    if (currentUserId === participantId) {
      throw new BadRequestException('Cannot create conversation with self');
    }

    const currentUser = await this.usersService.findById(currentUserId);
    const targetUser = await this.usersService.findById(participantId);

    // Проверка ролей: только RENTER/LANDLORD
    const currentRoles = await this.usersService.getUserRoles(currentUserId);
    const targetRoles = await this.usersService.getUserRoles(participantId);
    if (!currentRoles.some(role => [UserRoleType.RENTER, UserRoleType.LANDLORD].includes(role)) ||
        !targetRoles.some(role => [UserRoleType.RENTER, UserRoleType.LANDLORD].includes(role))) {
      throw new UnauthorizedException('Participants must have RENTER or LANDLORD roles');
    }

    // Проверка существования беседы
    let conversation = await this.conversationRepository.findOne({
      where: [
        { participant1: { id: currentUserId }, participant2: { id: participantId }, listing: { id: listingId } },
        { participant1: { id: participantId }, participant2: { id: currentUserId }, listing: { id: listingId } },
      ],
      relations: ['participant1', 'participant2', 'listing'],
    });

    if (!conversation) {
      // Создание новой беседы
      conversation = this.conversationRepository.create({
        participant1: currentUser,
        participant2: targetUser,
        listing: listingId ? { id: listingId } : undefined,
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    return conversation;
  }

  async findMessages(conversationId: number, userId: number, dto: GetMessagesDto) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
      throw new UnauthorizedException('Access denied to this conversation');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.conversation', 'conversation')
      .where('message.conversation_id = :conversationId', { conversationId })
      .orderBy('message.sentAt', 'DESC')
      .limit(dto.limit)
      .offset(dto.offset);

    const [messages, total] = await query.getManyAndCount();
    return { messages: messages.reverse(), total, limit: dto.limit, offset: dto.offset };
  }

  async getConversationById(conversationId: number, userId: number): Promise<Conversation | null> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participant1', 'participant2'],
    });

    if (!conversation) {
      return null;
    }

    if (conversation.participant1.id !== userId && conversation.participant2.id !== userId) {
      return null;
    }

    return conversation;
  }

  async sendMessage(conversationId: number, senderId: number, text: string): Promise<Message> {
    const conversation = await this.getConversationById(conversationId, senderId);
    if (!conversation) {
      throw new UnauthorizedException('Access denied to this conversation');
    }

    if (text.length < 1 || text.length > 1000) {
      throw new BadRequestException('Message text must be between 1 and 1000 characters');
    }

    return this.dataSource.transaction(async (manager) => {
      const message = manager.create(Message, {
        conversation: { id: conversationId },
        sender: { id: senderId },
        text,
        isRead: false,
      });

      const savedMessage = await manager.save(message);

      // Обновление lastMessageAt в беседе
      await manager.update(Conversation, conversationId, {
        lastMessageAt: new Date(),
      });

      return savedMessage;
    });
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);
    if (!conversation) {
      throw new UnauthorizedException('Access denied to this conversation');
    }

    const senderId = conversation.participant1.id === userId ? conversation.participant2.id : conversation.participant1.id;

    await this.messageRepository.update(
      {
        conversation: { id: conversationId },
        sender: { id: senderId },
        isRead: false,
      },
      { isRead: true },
    );
  }
}
