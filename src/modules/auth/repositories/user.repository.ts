import { prisma } from '../../../database/client';
import {CreateUserDto} from '../dtos/create-user.dto';
import {toEntity} from '../mappers/user.mapper';
import {UserEntity} from '../entities/user.entity';

export async function createUser(input: CreateUserDto): Promise<UserEntity> {
    const row = await prisma.user.create({
        data: {email: input.email, fullName: input.fullName, password: input.password, role: input.role}
    });

    return toEntity(row);

}