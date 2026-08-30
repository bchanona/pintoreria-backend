import {z} from 'zod';

export const createUserDtoSchema = z.object({
  email: z.email(),
  fullName: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ALMACENERO']),
});

export type CreateUserDto = z.infer<typeof createUserDtoSchema>;
