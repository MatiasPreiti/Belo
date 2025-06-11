import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
  @ApiProperty()
  author: string;

  @ApiProperty()
  date: string;

  @ApiProperty()
  environment: string;

  @ApiProperty()
  service: string;

  @ApiProperty()
  appVersionPackage: string;
}
