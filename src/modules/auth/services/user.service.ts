import bcrypt from 'bcrypt';
import {UserEntity} from '../entities/user.entity';
import {CreateUserDto} from '../dtos/create-user.dto';
import {createUser} from '../repositories/user.repository';


const SALT_ROUNDS = 10;

export async function registerUser(input: CreateUserDto): Promise<UserEntity>{
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    return createUser({...input, password: hashedPassword});

}