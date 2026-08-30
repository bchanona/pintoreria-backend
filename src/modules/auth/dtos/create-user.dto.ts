import {z} from 'zod';

export const createUserDtoSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1),
  password: z.string().min(6).max(72),
  role: z.enum(['VENDEDOR', 'ALMACENERO']),
});

export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
