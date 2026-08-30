import type { User } from '@prisma/client';
import { UserEntity } from '../entities/user.entity';

type UserRow = User;

//Solo para lectura 
export function toEntity(row: UserRow): UserEntity {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    createdAt: row.createdAt,
    isActive: row.isActive,
  };
}

//Solo para escritura
export function toRow(entity: UserEntity, passwordHash: string): UserRow {
  return {
    id: entity.id,
    email: entity.email,
    fullName: entity.fullName,
    password: passwordHash,
    role: entity.role,
    createdAt: entity.createdAt,
    isActive: entity.isActive,
  };
}
