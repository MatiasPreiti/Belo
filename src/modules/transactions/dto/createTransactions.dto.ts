import { IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID of the user receiving the transaction',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  destinationUserId: number;

  @ApiProperty({
    description: 'Amount of money to be transferred',
    example: 10000.5,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;
}
