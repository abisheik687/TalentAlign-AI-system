import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { database } from './config/database';

// Import routes
import authRoutes from './routes/auth';

// Import middleware
import { authenticateToken } from './middleware/auth';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression middleware
    this.app.use(compression());

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const dbHealth = await database.healthCheck();
        
        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.nodeEnv,
          database: dbHealth,
          memory: process.memoryUsage(),
          version: process.version
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          message: 'Service unavailable',
          timestamp: new Date().toISOString()
        });
      }
    });

    // API routes
    this.app.use('/api/auth', authRoutes);

    // Protected API info endpoint
    this.app.get('/api/info', authenticateToken, (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'TalentAlign AI API',
        version: '1.0.0',
        user: (req as any).user
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'TalentAlign AI API Server',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/health'
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Global error handler:', error);

      // Mongoose validation error
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values((error as any).errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      // Mongoose duplicate key error
      if (error.name === 'MongoServerError' && (error as any).code === 11000) {
        const field = Object.keys((error as any).keyValue)[0];
        return res.status(409).json({
          success: false,
          message: `${field} already exists`
        });
      }

      // JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      // Default error
      res.status(500).json({
        success: false,
        message: config.nodeEnv === 'production' 
          ? 'Internal server error' 
          : error.message,
        ...(config.nodeEnv !== 'production' && { stack: error.stack })
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process in production
      if (config.nodeEnv !== 'production') {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      // Exit the process as the application is in an undefined state
      process.exit(1);
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Start server
      const port = config.port;
      this.app.listen(port, () => {
        console.log(`🚀 TalentAlign AI API Server running on port ${port}`);
        console.log(`📊 Environment: ${config.nodeEnv}`);
        console.log(`🔗 Health check: http://localhost:${port}/health`);
        console.log(`📚 API docs: http://localhost:${port}/api/docs`);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

export default App;