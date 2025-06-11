import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let configService: ConfigService;

  beforeEach(async () => {
    const healthModule: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [HealthService, ConfigService],
    }).compile();

    healthService = healthModule.get<HealthService>(HealthService);
    configService = healthModule.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(healthService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('function getOk', () => {
    it('should return "Ok!"', () => {
      expect(healthService.getOk()).toBe('Service Running OK');
    });
  });

  describe('function getHealthCheck', () => {
    it('should return health', () => {
      jest.spyOn(configService, 'get').mockImplementation(() => 'test');
      expect(healthService.getHealthCheck().environment).toBe('test');
    });
  });
});
