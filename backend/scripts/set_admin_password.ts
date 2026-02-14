import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'owner@example.com';
  const password = process.env.ADMIN_PASSWORD || 'AdminPass123!';

  const hashed = bcrypt.hashSync(password, 12);

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  console.log(`Updated password for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
