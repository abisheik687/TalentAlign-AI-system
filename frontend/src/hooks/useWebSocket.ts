import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * WebSocket Hook for Real-time Communication
 * Manages WebSocket connection and provides real-time updates
 * Requirements: 4.4, 8.1, 9.5
 */

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastPing: Date | null;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    pingInterval = 30000 // 30 seconds
  } = options;

  const { user, token } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    lastPing: null
  });

  const reconnectCount = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (state.isConnecting || state.isConnected || !token) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || window.location.origin;
      
      const socket = io(socketUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false // We'll handle reconnection manually
      });

      // Connection successful
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        reconnectCount.current = 0;
        
        setState(prev => ({
          ...prev,
          socket,
          isConnected: true,
          isConnecting: false,
          error: null
        }));

        // Start ping interval
        startPingInterval(socket);
      });

      // Connection error
      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: error.message || 'Connection failed'
        }));

        // Attempt reconnection
        attemptReconnect();
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setState(prev => ({
          ...prev,
          socket: null,
          isConnected: false,
          isConnecting: false
        }));

        // Stop ping interval
        stopPingInterval();

        // Attempt reconnection if not intentional
        if (reason !== 'io client disconnect') {
          attemptReconnect();
        }
      });

      // Handle pong response
      socket.on('pong', (data) => {
        setState(prev => ({
          ...prev,
          lastPing: new Date(data.timestamp)
        }));
      });

      // Handle subscription confirmations
      socket.on('subscription:confirmed', (data) => {
        console.log('Subscription confirmed:', data);
      });

      socket.on('subscription:error', (data) => {
        console.error('Subscription error:', data);
        setState(prev => ({
          ...prev,
          error: data.error
        }));
      });

      // Handle authentication errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'WebSocket error'
        }));
      });

    } catch (error: any) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to create connection'
      }));
    }
  }, [token, state.isConnecting, state.isConnected]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (state.socket) {
      state.socket.disconnect();
    }
    
    stopPingInterval();
    clearReconnectTimeout();
    
    setState({
      socket: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      lastPing: null
    });
  }, [state.socket]);

  // Attempt reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectCount.current >= reconnectAttempts) {
      setState(prev => ({
        ...prev,
        error: 'Maximum reconnection attempts reached'
      }));
      return;
    }

    const delay = reconnectDelay * Math.pow(2, reconnectCount.current);
    reconnectCount.current++;

    console.log(`Attempting reconnection ${reconnectCount.current}/${reconnectAttempts} in ${delay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, reconnectAttempts, reconnectDelay]);

  // Start ping interval to keep connection alive
  const startPingInterval = useCallback((socket: Socket) => {
    stopPingInterval(); // Clear any existing interval
    
    pingIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, pingInterval);
  }, [pingInterval]);

  // Stop ping interval
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Subscribe to bias monitoring updates
  const subscribeToBiasMonitoring = useCallback((
    processTypes: string[] = [],
    alertLevels: string[] = []
  ) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('subscribe:bias_monitoring', {
        processTypes,
        alertLevels
      });
    }
  }, [state.socket, state.isConnected]);

  // Subscribe to dashboard updates
  const subscribeToDashboard = useCallback((
    dashboardType: string,
    refreshInterval?: number
  ) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('subscribe:dashboard', {
        dashboardType,
        refreshInterval
      });
    }
  }, [state.socket, state.isConnected]);

  // Unsubscribe from updates
  const unsubscribe = useCallback((type: string, details: any) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('unsubscribe', {
        type,
        details
      });
    }
  }, [state.socket, state.isConnected]);

  // Join collaboration session
  const joinCollaborationSession = useCallback((
    sessionId: string,
    sessionType: string
  ) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('collaboration:join_session', {
        sessionId,
        sessionType
      });
    }
  }, [state.socket, state.isConnected]);

  // Leave collaboration session
  const leaveCollaborationSession = useCallback((sessionId: string) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('collaboration:leave_session', {
        sessionId
      });
    }
  }, [state.socket, state.isConnected]);

  // Send collaboration update
  const sendCollaborationUpdate = useCallback((
    sessionId: string,
    updateType: string,
    updateData: any
  ) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('collaboration:update', {
        sessionId,
        updateType,
        updateData
      });
    }
  }, [state.socket, state.isConnected]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('acknowledge_alert', {
        alertId
      });
    }
  }, [state.socket, state.isConnected]);

  // Add event listener
  const addEventListener = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (state.socket) {
      state.socket.on(event, handler);
      
      // Return cleanup function
      return () => {
        if (state.socket) {
          state.socket.off(event, handler);
        }
      };
    }
    return () => {};
  }, [state.socket]);

  // Remove event listener
  const removeEventListener = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (state.socket) {
      if (handler) {
        state.socket.off(event, handler);
      } else {
        state.socket.removeAllListeners(event);
      }
    }
  }, [state.socket]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (autoConnect && user && token && !state.isConnected && !state.isConnecting) {
      connect();
    }
  }, [autoConnect, user, token, state.isConnected, state.isConnecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  return {
    // State
    socket: state.socket,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastPing: state.lastPing,
    
    // Connection methods
    connect,
    disconnect,
    
    // Subscription methods
    subscribeToBiasMonitoring,
    subscribeToDashboard,
    unsubscribe,
    
    // Collaboration methods
    joinCollaborationSession,
    leaveCollaborationSession,
    sendCollaborationUpdate,
    
    // Alert methods
    acknowledgeAlert,
    
    // Event handling
    addEventListener,
    removeEventListener
  };
};

export default useWebSocket;