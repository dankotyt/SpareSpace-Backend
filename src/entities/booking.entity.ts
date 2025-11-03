import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn  } from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';
import { CurrencyType } from '../common/enums/currency-type.enum';
import { BookingStatus } from '../common/enums/booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @Column({ type: 'tsrange' })
  period: string;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  priceTotal: number;

  @Column({ type: 'enum', enum: CurrencyType, enumName: 'currency_type', default: CurrencyType.RUB })
  currency: CurrencyType;

  @Column({ type: 'enum', enum: BookingStatus, enumName: 'booking_status', default: BookingStatus.PENDING })
  status: BookingStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
