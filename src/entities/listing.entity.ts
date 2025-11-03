import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ListingType } from '../common/enums/listing-type.enum';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ListingPeriodType } from '../common/enums/listing-period-type.enum';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ListingType, enumName: 'listing_type' })
  type: ListingType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  price: number;

  @Column({ type: 'enum', enum: ListingPeriodType, enumName: 'listing_period_type', default: ListingPeriodType.DAY })
  pricePeriod: ListingPeriodType;

  @Column({ type: 'enum', enum: CurrencyType, enumName: 'currency_type', default: CurrencyType.RUB })
  currency: CurrencyType;

  @Column({ type: 'geometry', srid: 4326, nullable: true })
  location?: string;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size?: number;

  @Column({ type: 'jsonb', nullable: true })
  photosJson?: any;

  @Column({ type: 'jsonb', nullable: true })
  amenities?: any;

  @Column({ type: 'tsrange', array: true, default: '{}' })
  availability: string[];

  @Column({ type: 'enum', enum: ListingStatus, enumName: 'listing_status', default: ListingStatus.DRAFT })
  status: ListingStatus;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  repostsCount: number;

  @Column({ default: 0 })
  favoritesCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
