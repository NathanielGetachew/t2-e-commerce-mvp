import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'superadmin@t2.com';
    const password = 'SuperSecretPassword123!';

    const existingAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    if (existingAdmin) {
        console.log(`\nSuper Admin already exists!\nEmail: ${existingAdmin.email}\n`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: 'Natty Super Admin',
            role: 'SUPER_ADMIN',
            isEmailVerified: true,
            clerkId: `local_superadmin_${Date.now()}`,
        }
    });

    console.log('\n=======================================');
    console.log('Super Admin created successfully!');
    console.log('=======================================');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('======================================= \n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
