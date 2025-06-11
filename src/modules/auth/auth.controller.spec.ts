import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../user/users.service';
import { UnauthorizedException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/users.dto';
import { Users } from '../user/users.entity';

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
};

const mockUsersService = {
  create: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  let bcryptHashSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
    bcryptHashSpy = jest.spyOn(bcrypt, 'hash');
  });

  afterEach(() => {
    bcryptHashSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const validatedUser = { id: 1, email: 'test@example.com', role: 'user' };
      const accessToken = { access_token: 'mocked_jwt_token' };

      (mockAuthService.validateUser as jest.Mock).mockResolvedValue(
        validatedUser,
      );
      (mockAuthService.login as jest.Mock).mockResolvedValue(accessToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual(accessToken);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(validatedUser);
    });

    it('should throw UnauthorizedException on failed login', async () => {
      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      (mockAuthService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user and return the created user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        account: 'newaccount',
        password: 'newpassword123',
      };
      const hashedPassword = 'hashedPasswordForNewUser';
      const createdUser: Users = {
        id: 2,
        email: 'newuser@example.com',
        account: 'newaccount',
        password: hashedPassword,
        role: 'user',
        balance: 0,
        transactionsSent: [],
        transactionsReceived: [],
      };

      (bcryptHashSpy as jest.Mock<Promise<string>>).mockResolvedValue(
        hashedPassword,
      );
      (mockUsersService.create as jest.Mock).mockResolvedValue(createdUser);

      const result = await controller.register(createUserDto);

      expect(result).toEqual({ data: createdUser });
      expect(bcryptHashSpy).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
    });

    it('should handle registration failure (e.g., duplicate email)', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        account: 'account',
        password: 'password',
      };
      const hashedPassword = 'hashedPasswordForExistingUser';

      (bcryptHashSpy as jest.Mock<Promise<string>>).mockResolvedValue(
        hashedPassword,
      );
      (mockUsersService.create as jest.Mock).mockRejectedValue(
        new Error('Duplicate email'),
      );

      await expect(controller.register(createUserDto)).rejects.toThrow(
        'Duplicate email',
      );
      expect(bcryptHashSpy).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
    });
  });
});
