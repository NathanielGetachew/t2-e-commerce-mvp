import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { logger } from './logger';

export async function createSuperAdminOnStartup() {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;
        const fullName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

        // Only run if the environment variables are explicitly provided
        if (!email || !password) {
            return;
        }

        const existing = await prisma.user.findFirst({ where: { email } });
        if (existing) {
            if (existing.role !== UserRole.SUPER_ADMIN) {
                // Optionally upgrade user to super admin if they somehow already exist
                await prisma.user.update({
                    where: { id: existing.id },
                    data: { role: UserRole.SUPER_ADMIN }
                });
                logger.info(`Updated existing user ${email} to SUPER_ADMIN`);
            }
            return;
        }

        const hashed = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                clerkId: `superadmin_${Date.now()}`,
                email,
                name: fullName,
                password: hashed,
                role: UserRole.SUPER_ADMIN,
                isAmbassador: false,
                isEmailVerified: true,
            },
        });

        logger.info(`✨ Automatically created super-admin on startup: ${user.email}`);
    } catch (err) {
        logger.error('Failed to auto-create super-admin on startup:', err);
    }
}
