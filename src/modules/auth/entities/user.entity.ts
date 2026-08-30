export type UserRole = 'ADMIN' | 'VENDEDOR' | 'ALMACENERO';

export interface UserEntity {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: Date;
    isActive: boolean;
}