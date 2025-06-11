import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Users } from './users.entity';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/users.dto';

const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const usersList: Users[] = [
        {
          id: 1,
          email: 'a@b.com',
          account: 'acc1',
          password: 'p1',
          role: 'user',
          balance: 0,
          transactionsSent: [],
          transactionsReceived: [],
        },
        {
          id: 2,
          email: 'c@d.com',
          account: 'acc2',
          password: 'p2',
          role: 'admin',
          balance: 0,
          transactionsSent: [],
          transactionsReceived: [],
        },
      ];
      (mockUsersService.findAll as jest.Mock).mockResolvedValue(usersList);

      const result = await controller.findAll();
      expect(result).toEqual(usersList);
      expect(mockUsersService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    const user: Users = {
      id: 1,
      email: 'test@example.com',
      account: 'test_acc',
      password: 'hashed',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };

    it('should return a user if found by ID', async () => {
      (mockUsersService.findOne as jest.Mock).mockResolvedValue(user);

      const result = await controller.findOne(1);
      expect(result).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found by ID', async () => {
      (mockUsersService.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = { email: 'updated@example.com' };
    const updatedUser: Users = {
      id: 1,
      email: 'updated@example.com',
      account: 'test_acc',
      password: 'hashed',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };

    it('should return the updated user', async () => {
      (mockUsersService.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      (mockUsersService.update as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      await expect(controller.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(999, updateUserDto);
    });
  });
});
