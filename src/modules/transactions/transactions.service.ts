import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Transaction } from './transactions.entity';
import { UsersService } from '../user/users.service';
import { Users } from '../user/users.entity';
import { TransactionStatus } from '../../utils/enum/transactionsStatus.enum';
import { CreateTransactionDto } from './dto/createTransactions.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async createTransaction(
    originUserId: number,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { destinationUserId, amount } = createTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let newTransaction: Transaction;

    try {
      if (originUserId === destinationUserId) {
        throw new BadRequestException('Cannot send money to the same account.');
      }

      const originUser = await queryRunner.manager.findOne(Users, {
        where: { id: originUserId },
        lock: { mode: 'pessimistic_write' },
      });
      const destinationUser = await queryRunner.manager.findOne(Users, {
        where: { id: destinationUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!originUser) {
        throw new NotFoundException(
          `Origin user with ID ${originUserId} not found.`,
        );
      }
      if (!destinationUser) {
        throw new NotFoundException(
          `Destination user with ID ${destinationUserId} not found.`,
        );
      }

      if (originUser.balance < amount) {
        throw new BadRequestException('Insufficient balance.');
      }

      const pendingOriginTransactions = await queryRunner.manager.count(
        Transaction,
        {
          where: {
            originUserId: originUser.id,
            status: TransactionStatus.PENDING,
          },
        },
      );

      if (pendingOriginTransactions > 0) {
        throw new ConflictException(
          'There is already a pending transaction from this origin. Please wait.',
        );
      }

      newTransaction = this.transactionsRepository.create({
        originUserId: originUser.id,
        destinationUserId: destinationUser.id,
        amount,
        status: TransactionStatus.PENDING,
      });

      let transactionStatus: TransactionStatus;
      if (amount <= 50000) {
        transactionStatus = TransactionStatus.CONFIRMED;
        originUser.balance = Number(originUser.balance) - Number(amount);
        destinationUser.balance =
          Number(destinationUser.balance) + Number(amount);

        if (originUser.balance < 0) {
          throw new InternalServerErrorException(
            'Origin user balance became negative. Transaction aborted.',
          );
        }

        await queryRunner.manager.save(originUser);
        await queryRunner.manager.save(destinationUser);
      } else {
        transactionStatus = TransactionStatus.PENDING;
      }

      newTransaction.status = transactionStatus;
      const savedTransaction = await queryRunner.manager.save(newTransaction);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        if (newTransaction && newTransaction.id) {
          newTransaction.status = TransactionStatus.REJECTED;
          newTransaction.rejected_reason =
            error.message || 'Internal processing error.';
          await this.transactionsRepository.save(newTransaction);
          return newTransaction;
        } else {
          const finalRejectedTransaction = this.transactionsRepository.create({
            originUserId: originUserId,
            destinationUserId: destinationUserId,
            amount: amount,
            status: TransactionStatus.REJECTED,
            rejected_reason:
              error.message || 'Pre-validation or unknown error occurred.',
          });
          await this.transactionsRepository.save(finalRejectedTransaction);
          return finalRejectedTransaction;
        }
      }

      console.error('Unhandled transaction creation error:', error);
      const unexpectedRejectedTransaction = this.transactionsRepository.create({
        originUserId: originUserId,
        destinationUserId: destinationUserId,
        amount: amount,
        status: TransactionStatus.REJECTED,
        rejected_reason:
          'An unexpected internal error occurred: ' +
          (error.message || 'Unknown error.'),
      });
      await this.transactionsRepository.save(unexpectedRejectedTransaction);
      return unexpectedRejectedTransaction;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionsForUser(userId: number): Promise<Transaction[]> {
    const userExists = await this.usersService.findOne(userId);
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    return this.transactionsRepository.find({
      where: [{ originUserId: userId }, { destinationUserId: userId }],
      order: { created_at: 'DESC' },
      relations: ['originUser', 'destinationUser'],
    });
  }

  async approveTransaction(transactionId: number): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundException(
          `Transaction with ID ${transactionId} not found.`,
        );
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(
          'Only pending transactions can be approved.',
        );
      }

      const originUser = await queryRunner.manager.findOne(Users, {
        where: { id: transaction.originUserId },
        lock: { mode: 'pessimistic_write' },
      });
      const destinationUser = await queryRunner.manager.findOne(Users, {
        where: { id: transaction.destinationUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!originUser || !destinationUser) {
        throw new InternalServerErrorException(
          'Origin or destination user not found during approval.',
        );
      }

      if (Number(originUser.balance) < Number(transaction.amount)) {
        throw new BadRequestException(
          'Insufficient balance in origin account to approve transaction.',
        );
      }

      originUser.balance =
        Number(originUser.balance) - Number(transaction.amount);
      destinationUser.balance =
        Number(destinationUser.balance) + Number(transaction.amount);

      if (originUser.balance < 0) {
        throw new InternalServerErrorException(
          'Origin user balance became negative during approval. Transaction aborted.',
        );
      }

      await queryRunner.manager.save(originUser);
      await queryRunner.manager.save(destinationUser);

      transaction.status = TransactionStatus.CONFIRMED;
      const approvedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return approvedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to approve transaction.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async rejectTransaction(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found.`,
      );
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Only pending transactions can be rejected.',
      );
    }

    transaction.status = TransactionStatus.REJECTED;
    return this.transactionsRepository.save(transaction);
  }
}
