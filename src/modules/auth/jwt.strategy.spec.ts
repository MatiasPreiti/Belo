import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_SECRET = 'secret-key';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user information on a valid payload', async () => {
      const payload = {
        sub: 123,
        username: 'testuser@example.com',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600,
      };

      const result = await strategy.validate(payload);
      expect(result).toEqual({
        userId: payload.sub,
        email: payload.username,
        role: payload.role,
      });
    });

    it('should throw UnauthorizedException for an invalid (null) payload', async () => {
      await expect(strategy.validate(null)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });

    it('should throw UnauthorizedException for an invalid (empty) payload', async () => {
      await expect(strategy.validate({})).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });

    it('should throw UnauthorizedException if payload is missing "sub"', async () => {
      const payload = {
        username: 'testuser@example.com',
        role: 'user',
      };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });

    it('should throw UnauthorizedException if payload is missing "username"', async () => {
      const payload = {
        sub: 123,
        role: 'user',
      };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });

    it('should throw UnauthorizedException if payload is missing "role"', async () => {
      const payload = {
        sub: 123,
        username: 'testuser@example.com',
      };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
    });
  });
});
