import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils/logger';
import { ConsentService } from '@/services/ConsentService';

/**
 * WebSocket Service for Real-time Communication
 * Handles real-time bias monitoring alerts and dashboard updates
 * Requirements: 4.4, 8.1, 9.5
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ClientInfo> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    try {
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      this.setupMiddleware();
      this.setupEventHandlers();

      logger.info('WebSocket service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebSocket service:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  static broadcast(event: string, data: any): void {
    const instance = WebSocketService.getInstance();
    if (instance.io) {
      instance.io.emit(event, data);
      logger.debug('Broadcasted WebSocket event', { event, clientCount: instance.connectedClients.size });
    }
  }

  /**
   * Send message to specific client
   */
  static sendToClient(clientId: string, event: string, data: any): void {
    const instance = WebSocketService.getInstance();
    if (instance.io) {
      instance.io.to(clientId).emit(event, data);
      logger.debug('Sent WebSocket event to client', { clientId, event });
    }
  }

  /**
   * Send message to clients with specific role
   */
  static sendToRole(role: string, event: string, data: any): void {
    const instance = WebSocketService.getInstance();
    if (instance.io) {
      instance.io.to(`role:${role}`).emit(event, data);
      logger.debug('Sent WebSocket event to role', { role, event });
    }
  }

  /**
   * Get connected clients count
   */
  static getConnectedClientsCount(): number {
    const instance = WebSocketService.getInstance();
    return instance.connectedClients.size;
  }

  /**
   * Get connected clients by role
   */
  static getClientsByRole(role: string): ClientInfo[] {
    const instance = WebSocketService.getInstance();
    return Array.from(instance.connectedClients.values()).filter(client => client.role === role);
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Get user information
        const User = require('@/models/User').default;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        // Check if user has consent for real-time updates
        const hasConsent = await ConsentService.hasConsent(user._id, 'real_time_updates');
        if (!hasConsent) {
          return next(new Error('Real-time updates consent required'));
        }

        // Attach user info to socket
        socket.data.user = user;
        socket.data.userId = user._id.toString();
        socket.data.role = user.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      try {
        const user = socket.data.user;
        const clientInfo: ClientInfo = {
          socketId: socket.id,
          userId: user._id.toString(),
          role: user.role,
          connectedAt: new Date(),
          lastActivity: new Date()
        };

        // Store client info
        this.connectedClients.set(socket.id, clientInfo);

        // Join role-based room
        socket.join(`role:${user.role}`);

        // Join user-specific room
        socket.join(`user:${user._id}`);

        logger.info('Client connected to WebSocket', {
          socketId: socket.id,
          userId: user._id,
          role: user.role,
          totalClients: this.connectedClients.size
        });

        // Handle client events
        this.setupClientEventHandlers(socket);

        // Send welcome message
        socket.emit('connected', {
          message: 'Connected to TalentAlign AI real-time service',
          clientId: socket.id,
          timestamp: new Date()
        });

      } catch (error) {
        logger.error('Error handling WebSocket connection:', error);
        socket.disconnect();
      }
    });
  }

  private setupClientEventHandlers(socket: any): void {
    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        logger.info('Client disconnected from WebSocket', {
          socketId: socket.id,
          userId: clientInfo.userId,
          role: clientInfo.role,
          reason,
          duration: Date.now() - clientInfo.connectedAt.getTime()
        });
        this.connectedClients.delete(socket.id);
      }
    });

    // Handle ping for keepalive
    socket.on('ping', () => {
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.lastActivity = new Date();
        socket.emit('pong', { timestamp: new Date() });
      }
    });

    // Handle bias monitoring subscription
    socket.on('subscribe:bias_monitoring', (data: any) => {
      try {
        const { processTypes, alertLevels } = data;
        
        // Join specific monitoring rooms
        if (processTypes && Array.isArray(processTypes)) {
          processTypes.forEach(processType => {
            socket.join(`bias_monitoring:${processType}`);
          });
        }

        if (alertLevels && Array.isArray(alertLevels)) {
          alertLevels.forEach(level => {
            socket.join(`alerts:${level}`);
          });
        }

        socket.emit('subscription:confirmed', {
          type: 'bias_monitoring',
          processTypes,
          alertLevels,
          timestamp: new Date()
        });

        logger.debug('Client subscribed to bias monitoring', {
          socketId: socket.id,
          processTypes,
          alertLevels
        });

      } catch (error) {
        logger.error('Error handling bias monitoring subscription:', error);
        socket.emit('subscription:error', {
          type: 'bias_monitoring',
          error: 'Failed to subscribe to bias monitoring'
        });
      }
    });

    // Handle dashboard subscription
    socket.on('subscribe:dashboard', (data: any) => {
      try {
        const { dashboardType, refreshInterval } = data;
        
        socket.join(`dashboard:${dashboardType}`);
        
        // Set up periodic updates if requested
        if (refreshInterval && refreshInterval > 5000) { // Minimum 5 seconds
          const intervalId = setInterval(() => {
            this.sendDashboardUpdate(socket, dashboardType);
          }, refreshInterval);
          
          socket.data.dashboardInterval = intervalId;
        }

        socket.emit('subscription:confirmed', {
          type: 'dashboard',
          dashboardType,
          refreshInterval,
          timestamp: new Date()
        });

        logger.debug('Client subscribed to dashboard', {
          socketId: socket.id,
          dashboardType,
          refreshInterval
        });

      } catch (error) {
        logger.error('Error handling dashboard subscription:', error);
        socket.emit('subscription:error', {
          type: 'dashboard',
          error: 'Failed to subscribe to dashboard'
        });
      }
    });

    // Handle unsubscription
    socket.on('unsubscribe', (data: any) => {
      try {
        const { type, details } = data;
        
        switch (type) {
          case 'bias_monitoring':
            if (details.processTypes) {
              details.processTypes.forEach((processType: string) => {
                socket.leave(`bias_monitoring:${processType}`);
              });
            }
            if (details.alertLevels) {
              details.alertLevels.forEach((level: string) => {
                socket.leave(`alerts:${level}`);
              });
            }
            break;
            
          case 'dashboard':
            socket.leave(`dashboard:${details.dashboardType}`);
            if (socket.data.dashboardInterval) {
              clearInterval(socket.data.dashboardInterval);
              delete socket.data.dashboardInterval;
            }
            break;
        }

        socket.emit('unsubscription:confirmed', {
          type,
          details,
          timestamp: new Date()
        });

        logger.debug('Client unsubscribed', {
          socketId: socket.id,
          type,
          details
        });

      } catch (error) {
        logger.error('Error handling unsubscription:', error);
        socket.emit('unsubscription:error', {
          type: data.type,
          error: 'Failed to unsubscribe'
        });
      }
    });

    // Handle alert acknowledgment
    socket.on('acknowledge_alert', async (data: any) => {
      try {
        const { alertId } = data;
        const userId = socket.data.userId;

        // Update alert status in database
        const Alert = require('@/models/Alert').default;
        await Alert.findByIdAndUpdate(alertId, {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId
        });

        // Broadcast acknowledgment to other clients
        socket.broadcast.emit('alert_acknowledged', {
          alertId,
          acknowledgedBy: userId,
          acknowledgedAt: new Date()
        });

        socket.emit('alert_acknowledgment:confirmed', {
          alertId,
          timestamp: new Date()
        });

        logger.info('Alert acknowledged via WebSocket', {
          alertId,
          userId,
          socketId: socket.id
        });

      } catch (error) {
        logger.error('Error acknowledging alert:', error);
        socket.emit('alert_acknowledgment:error', {
          alertId: data.alertId,
          error: 'Failed to acknowledge alert'
        });
      }
    });

    // Handle real-time collaboration events
    socket.on('collaboration:join_session', (data: any) => {
      try {
        const { sessionId, sessionType } = data;
        
        socket.join(`collaboration:${sessionId}`);
        
        // Notify other participants
        socket.to(`collaboration:${sessionId}`).emit('collaboration:participant_joined', {
          userId: socket.data.userId,
          role: socket.data.role,
          timestamp: new Date()
        });

        socket.emit('collaboration:session_joined', {
          sessionId,
          sessionType,
          timestamp: new Date()
        });

        logger.debug('Client joined collaboration session', {
          socketId: socket.id,
          sessionId,
          sessionType
        });

      } catch (error) {
        logger.error('Error joining collaboration session:', error);
        socket.emit('collaboration:join_error', {
          sessionId: data.sessionId,
          error: 'Failed to join collaboration session'
        });
      }
    });

    socket.on('collaboration:leave_session', (data: any) => {
      try {
        const { sessionId } = data;
        
        socket.leave(`collaboration:${sessionId}`);
        
        // Notify other participants
        socket.to(`collaboration:${sessionId}`).emit('collaboration:participant_left', {
          userId: socket.data.userId,
          timestamp: new Date()
        });

        socket.emit('collaboration:session_left', {
          sessionId,
          timestamp: new Date()
        });

        logger.debug('Client left collaboration session', {
          socketId: socket.id,
          sessionId
        });

      } catch (error) {
        logger.error('Error leaving collaboration session:', error);
      }
    });

    // Handle collaboration updates
    socket.on('collaboration:update', (data: any) => {
      try {
        const { sessionId, updateType, updateData } = data;
        
        // Broadcast update to other session participants
        socket.to(`collaboration:${sessionId}`).emit('collaboration:update_received', {
          updateType,
          updateData,
          updatedBy: socket.data.userId,
          timestamp: new Date()
        });

        logger.debug('Collaboration update broadcasted', {
          socketId: socket.id,
          sessionId,
          updateType
        });

      } catch (error) {
        logger.error('Error handling collaboration update:', error);
      }
    });

    // Update last activity on any event
    socket.onAny(() => {
      const clientInfo = this.connectedClients.get(socket.id);
      if (clientInfo) {
        clientInfo.lastActivity = new Date();
      }
    });
  }

  private async sendDashboardUpdate(socket: any, dashboardType: string): Promise<void> {
    try {
      // This would fetch current dashboard data and send it
      // Implementation depends on specific dashboard requirements
      const dashboardData = await this.getDashboardData(dashboardType);
      
      socket.emit('dashboard:update', {
        type: dashboardType,
        data: dashboardData,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error('Error sending dashboard update:', error);
    }
  }

  private async getDashboardData(dashboardType: string): Promise<any> {
    // Placeholder for dashboard data fetching
    // Would integrate with BiasMonitoringService and other services
    return {
      type: dashboardType,
      lastUpdated: new Date()
    };
  }

  /**
   * Send bias alert to relevant clients
   */
  static sendBiasAlert(alert: any): void {
    const instance = WebSocketService.getInstance();
    if (!instance.io) return;

    try {
      // Send to all clients monitoring this process type
      instance.io.to(`bias_monitoring:${alert.processType}`).emit('bias_alert', alert);
      
      // Send to clients monitoring this alert level
      instance.io.to(`alerts:${alert.violation.severity}`).emit('bias_alert', alert);
      
      // Send to all admin users for critical alerts
      if (alert.violation.severity === 'critical') {
        instance.io.to('role:admin').emit('critical_bias_alert', alert);
      }

      logger.info('Bias alert sent via WebSocket', {
        alertId: alert.alertId,
        processType: alert.processType,
        severity: alert.violation.severity
      });

    } catch (error) {
      logger.error('Error sending bias alert via WebSocket:', error);
    }
  }

  /**
   * Send bias metrics update
   */
  static sendBiasMetricsUpdate(metrics: any): void {
    const instance = WebSocketService.getInstance();
    if (!instance.io) return;

    try {
      // Send to dashboard subscribers
      instance.io.to('dashboard:bias_monitoring').emit('bias_metrics_update', metrics);
      
      // Send to process-specific subscribers
      instance.io.to(`bias_monitoring:${metrics.processType}`).emit('bias_metrics_update', metrics);

      logger.debug('Bias metrics update sent via WebSocket', {
        processType: metrics.processType,
        overallBiasScore: metrics.overallBiasScore
      });

    } catch (error) {
      logger.error('Error sending bias metrics update via WebSocket:', error);
    }
  }

  /**
   * Cleanup inactive connections
   */
  static cleanupInactiveConnections(): void {
    const instance = WebSocketService.getInstance();
    const now = Date.now();
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [socketId, clientInfo] of instance.connectedClients.entries()) {
      if (now - clientInfo.lastActivity.getTime() > inactivityThreshold) {
        logger.info('Disconnecting inactive WebSocket client', {
          socketId,
          userId: clientInfo.userId,
          inactiveFor: now - clientInfo.lastActivity.getTime()
        });
        
        if (instance.io) {
          const socket = instance.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect(true);
          }
        }
        
        instance.connectedClients.delete(socketId);
      }
    }
  }
}

// Supporting interfaces

export interface ClientInfo {
  socketId: string;
  userId: string;
  role: string;
  connectedAt: Date;
  lastActivity: Date;
}

export default WebSocketService;