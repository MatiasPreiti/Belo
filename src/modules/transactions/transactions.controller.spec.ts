import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transactions.entity';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { CreateTransactionDto } from './dto/createTransactions.dto';
import { TransactionStatus } from '../../utils/enum/transactionsStatus.enum';
import { Users } from '../user/users.entity';

const mockTransactionsService = {
  createTransaction: jest.fn(),
  getTransactionsForUser: jest.fn(),
  approveTransaction: jest.fn(),
  rejectTransaction: jest.fn(),
};

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        Reflector,
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          request.user = { userId: 1, email: 'test@example.com', role: 'user' };
          return true;
        }),
      })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a transaction and return it', async () => {
      const createTransactionDto: CreateTransactionDto = {
        destinationUserId: 2,
        amount: 100,
      };
      const originUserId = 1;
      const expectedTransaction: Transaction = {
        id: 1,
        originUserId: originUserId,
        destinationUserId: createTransactionDto.destinationUserId,
        amount: createTransactionDto.amount,
        status: TransactionStatus.CONFIRMED,
        rejected_reason: null,
        created_at: new Date(),
        originUser: new Users(),
        destinationUser: new Users(),
      };

      mockTransactionsService.createTransaction.mockResolvedValue(
        expectedTransaction,
      );

      const result = await controller.create(
        { userId: originUserId },
        createTransactionDto,
      );

      expect(service.createTransaction).toHaveBeenCalledWith(
        originUserId,
        createTransactionDto,
      );
      expect(result).toEqual(expectedTransaction);
    });

    it('should return a rejected transaction if service returns one (e.g., insufficient balance)', async () => {
      const createTransactionDto: CreateTransactionDto = {
        destinationUserId: 2,
        amount: 100000,
      };
      const originUserId = 1;
      const rejectedTransaction: Transaction = {
        id: 1,
        originUserId: originUserId,
        destinationUserId: createTransactionDto.destinationUserId,
        amount: createTransactionDto.amount,
        status: TransactionStatus.REJECTED,
        rejected_reason: 'Insufficient balance.',
        created_at: new Date(),
        originUser: null,
        destinationUser: null,
      };

      mockTransactionsService.createTransaction.mockResolvedValue(
        rejectedTransaction,
      );

      const result = await controller.create(
        { userId: originUserId },
        createTransactionDto,
      );

      expect(service.createTransaction).toHaveBeenCalledWith(
        originUserId,
        createTransactionDto,
      );
      expect(result).toEqual(rejectedTransaction);
      expect(result.status).toBe(TransactionStatus.REJECTED);
      expect(result.rejected_reason).toBe('Insufficient balance.');
    });
  });

  describe('getTransactions', () => {
    it('should return an array of transactions for a user', async () => {
      const userId = 1;
      const expectedTransactions: Transaction[] = [
        {
          id: 1,
          originUserId: 1,
          destinationUserId: 2,
          amount: 50,
          status: TransactionStatus.CONFIRMED,
          rejected_reason: null,
          created_at: new Date(),
          originUser: null,
          destinationUser: null,
        },
        {
          id: 2,
          originUserId: 3,
          destinationUserId: 1,
          amount: 75,
          status: TransactionStatus.PENDING,
          rejected_reason: null,
          created_at: new Date(),
          originUser: null,
          destinationUser: null,
        },
      ];

      mockTransactionsService.getTransactionsForUser.mockResolvedValue(
        expectedTransactions,
      );

      const result = await controller.getTransactions(userId);

      expect(service.getTransactionsForUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedTransactions);
    });
  });

  describe('approveTransaction', () => {
    it('should approve a transaction and return it', async () => {
      const transactionId = 1;
      const approvedTransaction: Transaction = {
        id: transactionId,
        originUserId: 1,
        destinationUserId: 2,
        amount: 500,
        status: TransactionStatus.CONFIRMED,
        rejected_reason: null,
        created_at: new Date(),
        originUser: null,
        destinationUser: null,
      };

      mockTransactionsService.approveTransaction.mockResolvedValue(
        approvedTransaction,
      );

      const result = await controller.approveTransaction(transactionId);

      expect(service.approveTransaction).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(approvedTransaction);
      expect(result.status).toBe(TransactionStatus.CONFIRMED);
    });
  });

  describe('rejectTransaction', () => {
    it('should reject a transaction and return it', async () => {
      const transactionId = 1;
      const rejectedTransaction: Transaction = {
        id: transactionId,
        originUserId: 1,
        destinationUserId: 2,
        amount: 500,
        status: TransactionStatus.REJECTED,
        rejected_reason: 'Rejected by admin.',
        created_at: new Date(),
        originUser: null,
        destinationUser: null,
      };

      mockTransactionsService.rejectTransaction.mockResolvedValue(
        rejectedTransaction,
      );

      const result = await controller.rejectTransaction(transactionId);

      expect(service.rejectTransaction).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(rejectedTransaction);
      expect(result.status).toBe(TransactionStatus.REJECTED);
    });
  });
});
