import app from './app';
import config from './config/env';
import Database from './config/database';
import { logger } from './utils/logger';
import { createSuperAdminOnStartup } from './utils/createSuperAdmin';

async function startServer() {
    try {
        // Connect to database
        await Database.connect();

        // Auto-create super admin if env vars are present
        await createSuperAdminOnStartup();

        // Start server
        const server = app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port}`);
            logger.info(`📝 Environment: ${config.nodeEnv}`);
            logger.info(`🌐 CORS origin: ${config.cors.origin}`);
            logger.info(`✅ Server is ready to accept connections`);
        });

        // Graceful shutdown
        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                logger.info('HTTP server closed');

                await Database.disconnect();

                logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // Force shutdown after 10s
            setTimeout(() => {
                logger.error('Forcing shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
