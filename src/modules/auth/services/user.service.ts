import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { DuplicateEmailError } from '../../../common/errors/';
import { hashPassword } from '../../../common/security/password';
import { userRepository } from '../repositories/user.repository';

export async function registerUser(input: CreateUserDto): Promise<UserEntity> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new DuplicateEmailError(email);
  }

  const hashedPassword = await hashPassword(input.password);

  return userRepository.create({ ...input, email, fullName, password: hashedPassword });
}