import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton pattern for Prisma Client
class Database {
    private static instance: PrismaClient | null = null;

    static getInstance(): PrismaClient {
        if (!Database.instance) {
            Database.instance = new PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'error', 'warn']
                    : ['error'],
            });

            // Graceful shutdown
            process.on('beforeExit', async () => {
                await Database.instance?.$disconnect();
                logger.info('Database connection closed');
            });
        }

        return Database.instance;
    }

    static async connect(): Promise<void> {
        try {
            const prisma = Database.getInstance();
            await prisma.$connect();
            logger.info('✅ Database connected successfully');
        } catch (error) {
            logger.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    static async disconnect(): Promise<void> {
        if (Database.instance) {
            await Database.instance.$disconnect();
            Database.instance = null;
            logger.info('Database disconnected');
        }
    }
}

export const prisma = Database.getInstance();
export default Database;
