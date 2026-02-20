import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Seed Script
 * Creates the initial Super Admin user and default system settings.
 * 
 * Usage:
 *   npx ts-node prisma/seed.ts
 * 
 * Environment variables:
 *   ADMIN_EMAIL    - Super admin email (default: admin@t2.com)
 *   ADMIN_PASSWORD - Super admin password (default: Admin123!)
 *   ADMIN_NAME     - Super admin name (default: System Admin)
 */
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@t2.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'System Admin';

    console.log('🌱 Seeding database...\n');

    // 1. Create Super Admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
        where: { clerkId: 'seed_super_admin' },
        update: {
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
        },
        create: {
            clerkId: 'seed_super_admin',
            email: adminEmail,
            name: adminName,
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
        },
    });

    console.log(`✅ Super Admin created/updated:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   ID:    ${admin.id}\n`);

    // 2. Create default system settings
    const defaultSettings = [
        { key: 'commission_rate_bp', value: '500', description: 'Ambassador commission rate in basis points (500 = 5%)' },
        { key: 'customer_discount_percent', value: '5', description: 'Customer discount when using referral code (%)' },
        { key: 'commission_hold_days', value: '14', description: 'Days to hold commission before available for withdrawal' },
        { key: 'max_file_size_mb', value: '5', description: 'Maximum file upload size in megabytes' },
        { key: 'max_bulk_order_qty', value: '10000', description: 'Maximum quantity allowed in a single order' },
        { key: 'min_order_amount_cents', value: '1000', description: 'Minimum order amount in cents ($10)' },
        { key: 'payment_timeout_minutes', value: '30', description: 'Payment session timeout in minutes' },
        { key: 'refund_window_days', value: '14', description: 'Days within which refunds are allowed' },
    ];

    let settingsCreated = 0;
    for (const setting of defaultSettings) {
        await prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: {}, // Don't overwrite if already exists
            create: setting,
        });
        settingsCreated++;
    }

    console.log(`✅ ${settingsCreated} system settings initialized\n`);

    // 3. Create sample products (for development)
    if (process.env.NODE_ENV !== 'production') {
        const sampleProducts = [
            {
                name: 'Ethiopian Yirgacheffe Coffee',
                slug: 'ethiopian-yirgacheffe-coffee',
                description: 'Premium single-origin coffee from the Yirgacheffe region. Known for its bright acidity and floral notes.',
                singlePriceCents: 2500,
                stock: 500,
                isActive: true,
            },
            {
                name: 'Sidamo Natural Process',
                slug: 'sidamo-natural-process',
                description: 'Sun-dried Sidamo beans with rich berry and chocolate flavors. Full-bodied and smooth.',
                singlePriceCents: 3000,
                stock: 300,
                isActive: true,
            },
            {
                name: 'Ethiopian Spice Collection',
                slug: 'ethiopian-spice-collection',
                description: 'A curated collection of authentic Ethiopian spices including Berbere, Mitmita, and Korerima.',
                singlePriceCents: 4500,
                stock: 200,
                isActive: true,
            },
        ];

        for (const product of sampleProducts) {
            await prisma.product.upsert({
                where: { slug: product.slug },
                update: {},
                create: product,
            });
        }

        console.log(`✅ ${sampleProducts.length} sample products created\n`);
    }

    console.log('🎉 Seed completed successfully!');
    console.log(`\n📋 Login credentials:`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
}

main()
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
