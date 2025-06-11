import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HealthDto } from './dto/health.dto';
import { config } from 'process';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  getHealthCheck(): HealthDto {
    console.log(
      `getHealthCheck in version %o`,
      `${HealthService.name}:${this.getHealthCheck.name}`,
    );

    return {
      author: 'Preiti Matias',
      date: 'Mayo 2025',
      environment: this.configService.get('NODE_ENV'),
      service: this.configService.get('npm_package_name'),
      appVersionPackage: this.configService.get('npm_package_version'),
    };
  }

  getOk(): string {
    return 'Service Running OK';
  }
}
