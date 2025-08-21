import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pino from 'pino';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import cron from 'node-cron';

import { DatabaseService } from './services/DatabaseService';
import { RedisService } from './services/RedisService';
import { ChannelManager } from './services/ChannelManager';
import { MessageProcessor } from './services/MessageProcessor';
import { RiskManager } from './services/RiskManager';
import { MetricsCollector } from './services/MetricsCollector';
import { SettlementService } from './services/SettlementService';
import { WebSocketHandler } from './services/WebSocketHandler';

import { channelRoutes } from './controllers/ChannelController';
import { settlementRoutes } from './controllers/SettlementController';
import { metricsRoutes } from './controllers/MetricsController';
import { healthRoutes } from './controllers/HealthController';

import { errorHandler } from './middleware/ErrorHandler';
import { authMiddleware } from './middleware/AuthMiddleware';
import { validationMiddleware } from './middleware/ValidationMiddleware';
import { rateLimitMiddleware } from './middleware/RateLimitMiddleware';

import { CONSTANTS } from '@photonx/proto';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

/**
 * PhotonX Coordinator Service
 * 
 * Core service that manages ERC-7824 state channels for PhotonX DEX
 * Handles channel lifecycle, message routing, risk management, and settlement coordination
 */
class PhotonXCoordinator {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;

  // Core services
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private channelManager: ChannelManager;
  private messageProcessor: MessageProcessor;
  private riskManager: RiskManager;
  private metricsCollector: MetricsCollector;
  private settlementService: SettlementService;
  private webSocketHandler: WebSocketHandler;

  // Rate limiting
  private rateLimiter: RateLimiterRedis;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupCronJobs();
    this.setupErrorHandling();
  }

  /**
   * Initialize all core services
   */
  private async initializeServices(): Promise<void> {
    try {
      logger.info('Initializing PhotonX Coordinator services...');

      // Initialize database connection
      this.databaseService = new DatabaseService({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/photonx',
        options: {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      });
      await this.databaseService.connect();

      // Initialize Redis connection
      this.redisService = new RedisService({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });
      await this.redisService.connect();

      // Initialize rate limiter
      this.rateLimiter = new RateLimiterRedis({
        storeClient: this.redisService.getClient(),
        keyPrefix: 'photonx_rl',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds
        blockDuration: 60, // Block for 60 seconds if limit exceeded
      });

      // Initialize core business services
      this.channelManager = new ChannelManager(
        this.databaseService,
        this.redisService,
        logger.child({ service: 'ChannelManager' })
      );

      this.messageProcessor = new MessageProcessor(
        this.channelManager,
        this.redisService,
        logger.child({ service: 'MessageProcessor' })
      );

      this.riskManager = new RiskManager(
        this.databaseService,
        this.redisService,
        logger.child({ service: 'RiskManager' })
      );

      this.metricsCollector = new MetricsCollector(
        this.databaseService,
        this.redisService,
        logger.child({ service: 'MetricsCollector' })
      );

      this.settlementService = new SettlementService(
        this.channelManager,
        this.databaseService,
        logger.child({ service: 'SettlementService' })
      );

      this.webSocketHandler = new WebSocketHandler(
        this.io,
        this.channelManager,
        this.messageProcessor,
        this.riskManager,
        logger.child({ service: 'WebSocketHandler' })
      );

      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize services');
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Rate limiting
    this.app.use(rateLimitMiddleware(this.rateLimiter));

    // Custom middleware
    this.app.use(validationMiddleware);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check (no auth required)
    this.app.use('/health', healthRoutes);

    // API routes with authentication
    this.app.use('/api/channels', authMiddleware, channelRoutes(
      this.channelManager,
      this.messageProcessor,
      this.riskManager,
      this.metricsCollector
    ));

    this.app.use('/api/settlement', authMiddleware, settlementRoutes(
      this.settlementService,
      this.channelManager
    ));

    this.app.use('/api/metrics', authMiddleware, metricsRoutes(
      this.metricsCollector
    ));

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'PhotonX Coordinator API',
        version: '1.0.0',
        description: 'ERC-7824 State Channel Coordinator for PhotonX DEX',
        endpoints: {
          channels: '/api/channels',
          settlement: '/api/settlement',
          metrics: '/api/metrics',
          health: '/health',
          websocket: '/socket.io'
        },
        documentation: 'https://docs.photonx.network/api'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup WebSocket handling
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'New WebSocket connection');

      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          await this.webSocketHandler.handleAuthentication(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Authentication failed');
          socket.emit('auth_error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Handle channel operations
      socket.on('join_channel', async (data) => {
        try {
          await this.webSocketHandler.handleJoinChannel(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to join channel');
          socket.emit('error', { message: 'Failed to join channel' });
        }
      });

      socket.on('leave_channel', async (data) => {
        try {
          await this.webSocketHandler.handleLeaveChannel(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to leave channel');
        }
      });

      // Handle trading messages
      socket.on('quote_request', async (data) => {
        try {
          await this.webSocketHandler.handleQuoteRequest(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to process quote request');
          socket.emit('quote_error', { message: 'Failed to process quote request' });
        }
      });

      socket.on('quote_response', async (data) => {
        try {
          await this.webSocketHandler.handleQuoteResponse(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to process quote response');
          socket.emit('quote_error', { message: 'Failed to process quote response' });
        }
      });

      socket.on('fill_request', async (data) => {
        try {
          await this.webSocketHandler.handleFillRequest(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to process fill request');
          socket.emit('fill_error', { message: 'Failed to process fill request' });
        }
      });

      socket.on('cancel_request', async (data) => {
        try {
          await this.webSocketHandler.handleCancelRequest(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Failed to process cancel request');
          socket.emit('cancel_error', { message: 'Failed to process cancel request' });
        }
      });

      // Handle heartbeat
      socket.on('heartbeat', async (data) => {
        try {
          await this.webSocketHandler.handleHeartbeat(socket, data);
        } catch (error) {
          logger.error({ error, socketId: socket.id }, 'Heartbeat failed');
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info({ socketId: socket.id, reason }, 'WebSocket disconnected');
        this.webSocketHandler.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error({ error, socketId: socket.id }, 'WebSocket error');
      });
    });

    logger.info('WebSocket server initialized');
  }

  /**
   * Setup cron jobs for maintenance tasks
   */
  private setupCronJobs(): void {
    // Channel timeout monitoring (every minute)
    cron.schedule('* * * * *', async () => {
      try {
        await this.channelManager.checkChannelTimeouts();
      } catch (error) {
        logger.error({ error }, 'Channel timeout check failed');
      }
    });

    // Metrics collection (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.metricsCollector.collectMetrics();
      } catch (error) {
        logger.error({ error }, 'Metrics collection failed');
      }
    });

    // Settlement batch processing (every 10 minutes)
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.settlementService.processPendingSettlements();
      } catch (error) {
        logger.error({ error }, 'Settlement processing failed');
      }
    });

    // Risk monitoring (every 2 minutes)
    cron.schedule('*/2 * * * *', async () => {
      try {
        await this.riskManager.monitorRiskLimits();
      } catch (error) {
        logger.error({ error }, 'Risk monitoring failed');
      }
    });

    // Database cleanup (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.databaseService.cleanup();
        await this.redisService.cleanup();
      } catch (error) {
        logger.error({ error }, 'Database cleanup failed');
      }
    });

    // Health check reporting (every 30 seconds)
    cron.schedule('*/30 * * * * *', async () => {
      try {
        const health = await this.getHealthStatus();
        await this.redisService.set('coordinator:health', JSON.stringify(health), 60);
      } catch (error) {
        logger.error({ error }, 'Health check failed');
      }
    });

    logger.info('Cron jobs scheduled');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Express error handler
    this.app.use(errorHandler);

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Promise Rejection');
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception');
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  /**
   * Get health status of all services
   */
  private async getHealthStatus(): Promise<any> {
    const status = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        websocket: 'unknown'
      },
      metrics: {
        activeChannels: 0,
        totalMessages: 0,
        avgResponseTime: 0
      }
    };

    try {
      // Check database
      await this.databaseService.ping();
      status.services.database = 'healthy';
    } catch (error) {
      status.services.database = 'unhealthy';
    }

    try {
      // Check Redis
      await this.redisService.ping();
      status.services.redis = 'healthy';
    } catch (error) {
      status.services.redis = 'unhealthy';
    }

    try {
      // Check WebSocket
      status.services.websocket = this.io.engine.clientsCount > 0 ? 'active' : 'idle';
    } catch (error) {
      status.services.websocket = 'unhealthy';
    }

    try {
      // Get metrics
      const metrics = await this.metricsCollector.getCurrentMetrics();
      status.metrics = {
        activeChannels: metrics.activeChannels || 0,
        totalMessages: metrics.totalMessages || 0,
        avgResponseTime: metrics.avgResponseTime || 0
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get metrics for health check');
    }

    return status;
  }

  /**
   * Start the coordinator service
   */
  public async start(): Promise<void> {
    try {
      await this.initializeServices();

      this.server.listen(this.port, () => {
        logger.info({
          port: this.port,
          env: process.env.NODE_ENV || 'development',
          version: '1.0.0'
        }, 'PhotonX Coordinator started successfully');
      });

      // Log startup metrics
      const health = await this.getHealthStatus();
      logger.info({ health }, 'Initial health status');

    } catch (error) {
      logger.error({ error }, 'Failed to start PhotonX Coordinator');
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    logger.info('Starting graceful shutdown...');

    try {
      // Close WebSocket connections
      this.io.close();

      // Close HTTP server
      this.server.close();

      // Close database connections
      await this.databaseService.disconnect();
      await this.redisService.disconnect();

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  }
}

// Start the coordinator if this file is run directly
if (require.main === module) {
  const coordinator = new PhotonXCoordinator();
  coordinator.start().catch((error) => {
    console.error('Failed to start coordinator:', error);
    process.exit(1);
  });
}

export { PhotonXCoordinator };