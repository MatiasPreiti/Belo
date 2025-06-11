import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<Users> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<Users> {
    const existing = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    try {
      const user = this.usersRepository.create(createUserDto);
      return await this.usersRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.usersRepository.update(id, updateUserDto);
      return this.usersRepository.findOneBy({ id });
    } catch (error) {
      throw new InternalServerErrorException('Error updating user');
    }
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.usersRepository.findOneBy({ email });
  }
}
