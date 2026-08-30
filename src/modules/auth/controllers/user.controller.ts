import {Request, Response} from 'express';
import {z} from 'zod';
import {Prisma} from '@prisma/client';
import {createUserDtoSchema} from '../dtos/create-user.dto';
import {registerUser} from '../services/user.service';

function isDuplicateEmail(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createUserController(req: Request, res: Response){
    try {
        const parsed = createUserDtoSchema.safeParse(req.body);
        if (!parsed.success){
            return res.status(400).json({ errors: z.treeifyError(parsed.error) });
        }
        const user = await registerUser(parsed.data);
        return res.status(201).json(user);
    } catch (error) {
        if (isDuplicateEmail(error)) {
            return res.status(409).json({ message: 'Email already registered' });
        }
        return res.status(500).json({ message: 'Error creating user' });
    }
}