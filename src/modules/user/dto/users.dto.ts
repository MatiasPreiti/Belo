import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'myAccountName' })
  account: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'strongPassword123' })
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @ApiProperty()
  email?: string;

  @IsString()
  @ApiProperty()
  account?: string;
}
