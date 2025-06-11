import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Transaction } from '../transactions/transactions.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  account: string;

  @Column()
  password: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  balance: number;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Transaction, (transaction) => transaction.originUser)
  transactionsSent: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.destinationUser)
  transactionsReceived: Transaction[];
}
