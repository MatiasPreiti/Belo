import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { apiResponseWrapper } from '../../utils/factories/apiResponseWrapper.factory';
import { HealthService } from './health.service';
import { HealthDto } from './dto/health.dto';

@ApiTags('Health')
@Controller('')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @ApiOperation({
    summary: 'Ok',
    description: 'Help endpoint to know if the service is operational',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(String),
    description: 'Ok',
  })
  @Get()
  getOk(): string {
    return this.healthService.getOk();
  }

  @ApiOperation({
    summary: 'Health',
    description: 'Endpoint displaying information about the microservice',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(HealthDto),
    description: 'Ok',
  })
  @Get('/info')
  getHealthCheck(): HealthDto {
    return this.healthService.getHealthCheck();
  }
}
