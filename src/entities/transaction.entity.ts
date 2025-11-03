import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Booking } from './booking.entity';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { CurrencyType } from '../common/enums/currency-type.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  walletId: number;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 26, scale: 16 })
  amount: number;

  @Column({ type: 'enum', enum: CurrencyType })
  currency: CurrencyType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @Column({ nullable: true })
  bookingId?: number;

  @ManyToOne(() => Booking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @Column({ type: 'decimal', precision: 26, scale: 16, default: 0 })
  commission: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId?: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
