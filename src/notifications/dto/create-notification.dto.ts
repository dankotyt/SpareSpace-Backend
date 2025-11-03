import { IsEnum, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsOptional()
  userId?: number;
}
