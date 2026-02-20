import { PrismaClient, UserRole } from '@prisma/client';
import { PasswordService } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
    const email = 'superadmin@example.com';
    const password = 'Password@123';
    const name = 'Super Admin';

    console.log('Seeding super admin...');

    const existingUser = await prisma.user.findFirst({
        where: { email },
    });

    if (existingUser) {
        console.log('Super admin already exists.');
        return;
    }

    const hashedPassword = await PasswordService.hash(password);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            clerkId: `superadmin_${Date.now()}`,
            role: UserRole.SUPER_ADMIN,
        },
    });

    console.log(`Super admin created with email: ${user.email} and password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
