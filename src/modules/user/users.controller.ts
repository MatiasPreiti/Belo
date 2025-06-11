import {
  Controller,
  Get,
  Param,
  HttpStatus,
  Post,
  Body,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Users } from './users.entity';
import { apiResponseWrapper } from '../../utils/factories/apiResponseWrapper.factory';
import { UpdateUserDto } from './dto/users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all users',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Users),
    isArray: true,
    description: 'List of users',
  })
  @Get()
  async findAll(): Promise<Users[]> {
    return this.usersService.findAll();
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a user by their ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Users),
    description: 'User details',
  })
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Users> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description: 'Update a user with the provided details',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: apiResponseWrapper(Users),
    description: 'User updated successfully',
  })
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    return this.usersService.update(id, updateUserDto);
  }
}
