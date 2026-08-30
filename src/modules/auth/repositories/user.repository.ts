import { User } from '@prisma/client';
import { prisma } from '../../../database/client';
import { CreateUserDto } from '../dtos/create-user.dto';
import { toEntity } from '../mappers/user.mapper';
import { UserEntity } from '../entities/user.entity';
import { UserRepository } from '../interfaces/user-repository.interface';

class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.user.findUnique({ where: { email: normalizedEmail } });
  }

  async create(input: CreateUserDto): Promise<UserEntity> {
    const row = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        password: input.password,
        role: input.role,
      },
    });

    return toEntity(row);
  }
}

export const userRepository = new PrismaUserRepository();