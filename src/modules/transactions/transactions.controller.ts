import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transactions.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { apiResponseWrapper } from '../../utils/factories/apiResponseWrapper.factory';
import { CreateTransactionDto } from './dto/createTransactions.dto';
import { JwtAuthGuard } from '../../utils/guard/jwtAuthGuard/jwtAuthGuard';
import { CurrentUser } from '../../utils/guard/user/current-user.decorator';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: apiResponseWrapper(Transaction),
    description: 'Transaction created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or insufficient balance',
  })
  @ApiNotFoundResponse({ description: 'Origin or destination user not found' })
  @ApiConflictResponse({
    description: 'There is already a pending transaction from this origin.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create transaction',
  })
  async create(
    @CurrentUser() user: any,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    return this.transactionsService.createTransaction(
      user.userId,
      createTransactionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions for a user' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
    description:
      'ID of the user to retrieve transactions for (origin or destination)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Transaction),
    isArray: true,
    description: 'List of transactions for the specified user',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getTransactions(
    @Query('userId') userId: number,
  ): Promise<Transaction[]> {
    return this.transactionsService.getTransactionsForUser(userId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Transaction),
    description: 'Transaction approved and funds moved successfully',
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiBadRequestResponse({
    description: 'Transaction is not pending or insufficient balance',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to approve transaction',
  })
  async approveTransaction(@Param('id') id: number): Promise<Transaction> {
    return this.transactionsService.approveTransaction(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Transaction),
    description: 'Transaction rejected successfully',
  })
  @ApiNotFoundResponse({ description: 'Transaction not found' })
  @ApiBadRequestResponse({ description: 'Transaction is not pending' })
  @ApiInternalServerErrorResponse({
    description: 'Failed to reject transaction',
  })
  async rejectTransaction(@Param('id') id: number): Promise<Transaction> {
    return this.transactionsService.rejectTransaction(id);
  }
}
