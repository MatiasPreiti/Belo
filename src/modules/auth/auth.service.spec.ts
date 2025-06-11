import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../user/users.service';
import { UnauthorizedException } from '@nestjs/common';

const mockUsersService = {
  findByEmail: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  let bcryptCompareSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();

    bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
  });

  afterEach(() => {
    bcryptCompareSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if password matches', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
      };
      mockUsersService.findByEmail.mockResolvedValue(testUser);

      bcryptCompareSpy.mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'plainPassword123',
      );
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'user',
      });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        'plainPassword123',
        'hashedPassword123',
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      bcryptCompareSpy.mockResolvedValue(false);

      await expect(
        service.validateUser('nonexistent@example.com', 'anypassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const testUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
      };
      mockUsersService.findByEmail.mockResolvedValue(testUser);
      (bcryptCompareSpy as jest.Mock<Promise<boolean>>).mockResolvedValue(
        false,
      );

      await expect(
        service.validateUser('test@example.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(bcryptCompareSpy).toHaveBeenCalledWith(
        'wrongPassword',
        'hashedPassword123',
      );
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'user' };
      const expectedToken = 'mocked_jwt_token';

      (mockJwtService.sign as jest.Mock).mockReturnValue(expectedToken);

      const result = await service.login(user);
      expect(result).toEqual({ access_token: expectedToken });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: user.email,
        sub: user.id,
        role: user.role,
      });
    });
  });
});
