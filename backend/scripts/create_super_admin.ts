import dotenv from 'dotenv';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'owner@example.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
    const fullName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    const hashed = bcrypt.hashSync(password, 12);

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
        console.log(`Super-admin with email ${email} already exists (id=${existing.id})`);
        process.exit(0);
    }

    const user = await prisma.user.create({
        data: {
            clerkId: `superadmin_${Date.now()}`,
            email,
            name: fullName,
            password: hashed,
            role: UserRole.SUPER_ADMIN,
            isAmbassador: false,
        },
    });

    console.log('Created super-admin:', { id: user.id, email: user.email });
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Failed to create super-admin:', err);
        process.exit(1);
    });
