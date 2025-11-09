import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Point } from 'geojson';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CurrencyType } from '../common/enums/currency-type.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingType } from '../common/enums/listing-type.enum';

import { User } from './user.entity';

@Entity('listings')
export class Listing {
  @ApiProperty({ description: 'Уникальный идентификатор объявления', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => User, description: 'Владелец объявления' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ enum: ListingType, description: 'Тип помещения', example: ListingType.GARAGE })
  @Column({ type: 'enum', enum: ListingType, enumName: 'listing_type' })
  type: ListingType;

  @ApiProperty({ description: 'Заголовок объявления', example: 'Гараж в центре города' })
  @Column()
  title: string;

  @ApiPropertyOptional({ description: 'Подробное описание', example: 'Просторный гараж с охраной' })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ description: 'Цена за период', example: 1500.5 })
  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @ApiProperty({
    enum: ListingPeriodType,
    description: 'Период ценообразования',
    example: ListingPeriodType.DAY,
  })
  @Column({
    type: 'enum',
    enum: ListingPeriodType,
    enumName: 'listing_period_type',
    default: ListingPeriodType.DAY,
  })
  pricePeriod: ListingPeriodType;

  @ApiProperty({ enum: CurrencyType, description: 'Валюта', example: CurrencyType.RUB })
  @Column({
    type: 'enum',
    enum: CurrencyType,
    enumName: 'currency_type',
    default: CurrencyType.RUB,
  })
  currency: CurrencyType;

  @ApiPropertyOptional({
    description: 'Географические координаты',
    example: { type: 'Point', coordinates: [37.6194, 55.7526] },
  })
  @Column({ type: 'geometry', srid: 4326, nullable: true })
  location?: Point | null;

  @ApiProperty({ description: 'Адрес', example: 'ул. Тверская, 10' })
  @Column()
  address: string;

  @ApiPropertyOptional({ description: 'Размер площади (кв.м)', example: 25.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size?: number | null;

  @ApiPropertyOptional({
    type: [String],
    description: 'Фотографии',
    example: ['https://example.com/test1.jpg', 'https://example.com/test2.jpg'],
  })
  @Column({ type: 'jsonb', nullable: true })
  photosJson?: string[] | null;

  @ApiPropertyOptional({
    description: 'Удобства',
    example: { electricity: 'true', heating: 'false' },
  })
  @Column({ type: 'jsonb', nullable: true })
  amenities?: Record<string, string> | null;

  @ApiProperty({
    type: [String],
    description: 'Доступные периоды',
    example: ['[2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.999Z)'],
  })
  @Column({ type: 'tsrange', array: true, default: '{}' })
  availability: string[];

  @ApiProperty({
    enum: ListingStatus,
    description: 'Статус объявления',
    example: ListingStatus.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: ListingStatus,
    enumName: 'listing_status',
    default: ListingStatus.DRAFT,
  })
  status: ListingStatus;

  @ApiProperty({ description: 'Количество просмотров', example: 150 })
  @Column({ default: 0 })
  viewsCount: number;

  @ApiProperty({ description: 'Количество репостов', example: 5 })
  @Column({ default: 0 })
  repostsCount: number;

  @ApiProperty({ description: 'Количество добавлений в избранное', example: 12 })
  @Column({ default: 0 })
  favoritesCount: number;

  @ApiProperty({ description: 'Дата создания', example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления', example: '2024-01-02T00:00:00.000Z' })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
