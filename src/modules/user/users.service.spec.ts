import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockUsersRepository = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<Users>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<Users>>(getRepositoryToken(Users));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const usersList: Users[] = [
      {
        id: 1,
        email: 'user1@example.com',
        account: 'acc1',
        password: 'hashed1',
        role: 'user',
        balance: 0,
        transactionsSent: [],
        transactionsReceived: [],
      },
      {
        id: 2,
        email: 'user2@example.com',
        account: 'acc2',
        password: 'hashed2',
        role: 'admin',
        balance: 0,
        transactionsSent: [],
        transactionsReceived: [],
      },
    ];

    it('should return an array of users', async () => {
      (repository.find as jest.Mock).mockResolvedValue(usersList);

      const result = await service.findAll();
      expect(result).toEqual(usersList);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    const existingUser: Users = {
      id: 1,
      email: 'existing@example.com',
      account: 'existing_acc',
      password: 'hashed_password',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };

    it('should return a user if found by ID', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.findOne(1);
      expect(result).toEqual(existingUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException if user not found by ID', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException(`User with ID 999 not found`),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      account: 'new_acc',
      password: 'plain_password',
    };
    const createdUser: Users = {
      id: 3,
      email: 'new@example.com',
      account: 'new_acc',
      password: 'hashed_new_password',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };

    it('should successfully create a new user', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockReturnValue(createUserDto);
      (repository.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);
      expect(result).toEqual(createdUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException if email already in use', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(createdUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already in use'),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error during save', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);
      (repository.create as jest.Mock).mockReturnValue(createUserDto);
      (repository.save as jest.Mock).mockRejectedValue(
        new Error('Database error during save'),
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        new InternalServerErrorException('Error creating user'),
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    const existingUser: Users = {
      id: 1,
      email: 'old@example.com',
      account: 'old_acc',
      password: 'hashed_old_password',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
      account: 'updated_acc',
    };
    const updatedUser: Users = { ...existingUser, ...updateUserDto };

    it('should successfully update an existing user', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as any);
      (repository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (repository.findOneBy as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(1, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(repository.update).not.toHaveBeenCalled();
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error during update', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(existingUser as any);
      (repository.update as jest.Mock).mockRejectedValue(
        new Error('Database update failed'),
      );

      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        new InternalServerErrorException('Error updating user'),
      );
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(repository.findOneBy).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    const existingUser: Users = {
      id: 1,
      email: 'email@example.com',
      account: 'acc',
      password: 'hashed',
      role: 'user',
      balance: 0,
      transactionsSent: [],
      transactionsReceived: [],
    };

    it('should return a user if found by email', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(existingUser);

      const result = await service.findByEmail('email@example.com');
      expect(result).toEqual(existingUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
      });
    });

    it('should return null if user not found by email', async () => {
      (repository.findOneBy as jest.Mock).mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
    });
  });
});
