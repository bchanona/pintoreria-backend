import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME;

  if (!email || !password || !fullName) {
    console.error('Faltan ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME en el .env');
    process.exit(1);
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      role: 'ADMIN',
    },
  });

  console.log(`Admin asegurado: ${admin.email} (${admin.fullName})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());