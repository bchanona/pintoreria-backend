import {User} from '@prisma/client';
import {CreateUserDto} from '../dtos/create-user.dto';


export interface UserRepository {
    create(data: CreateUserDto, passwordHash: string): Promise<User>;
}
