import { User } from '@prisma/client';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserEntity } from '../entities/user.entity';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<UserEntity>;
}