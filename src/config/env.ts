import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  PORT_DB: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_HOST: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  PORT: z.string().default('3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('Invalid environment variables:', _env.error.issues);
    process.exit(1);
}

export const env = _env.data;

