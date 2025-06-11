import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../user/users.entity';
import { TransactionStatus } from '../../utils/enum/transactionsStatus.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'origin_user_id' })
  originUserId: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'origin_user_id' })
  originUser: Users;

  @Column({ name: 'destination_user_id' })
  destinationUserId: number;

  @ManyToOne(() => Users)
  @JoinColumn({ name: 'destination_user_id' })
  destinationUser: Users;

  @Column({ type: 'numeric', precision: 25, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  rejected_reason: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
