import { Request, Response } from 'express';
import { z } from 'zod';
import { createUserDtoSchema } from '../dtos/create-user.dto';
import { registerUser } from '../services/user.service';

export async function createUserController(req: Request, res: Response) {
  const parsed = createUserDtoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: z.treeifyError(parsed.error) });
  }
  const user = await registerUser(parsed.data);
  return res.status(201).json(user);
}