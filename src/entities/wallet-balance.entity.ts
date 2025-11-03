import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Wallet } from './wallet.entity';
import { CurrencyType } from '../common/enums/currency-type.enum';

@Entity('wallet_balances')
@Unique(['wallet', 'currency'])
export class WalletBalance {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  walletId: number;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'decimal', precision: 26, scale: 16, default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: CurrencyType })
  currency: CurrencyType;
}
