import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

/**
 * Start the server
 */
async function start() {
  try {
    // Validate configuration
    validateConfig();

    // Validate CRON_SECRET
    if (!process.env.CRON_SECRET) {
      logger.warn('CRON_SECRET not set - cron endpoints will be disabled');
    } else if (process.env.CRON_SECRET.length < 32) {
      logger.warn('CRON_SECRET should be at least 32 characters for security');
    }

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server started`, {
        port: config.port,
        environment: config.env,
        url: config.apiUrl,
      });

      if (config.isDev) {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   Lab404Electronics API Server                                ║
║                                                               ║
║   Local:    http://localhost:${config.port}                        ║
║   API:      http://localhost:${config.port}/api                    ║
║   Health:   http://localhost:${config.port}/health                 ║
║                                                               ║
║   Environment: ${config.env.padEnd(45)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
        `);
      }
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason as Error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
start();
