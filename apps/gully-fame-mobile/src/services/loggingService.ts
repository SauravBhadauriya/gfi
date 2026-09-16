/**
 * Logging & Monitoring Service
 * Provides structured logging, analytics events, and performance tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export enum EventType {
  // User events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_SIGNUP = 'USER_SIGNUP',
  USER_PROFILE_UPDATE = 'USER_PROFILE_UPDATE',

  // Content events
  REEL_CREATED = 'REEL_CREATED',
  REEL_VIEWED = 'REEL_VIEWED',
  REEL_LIKED = 'REEL_LIKED',
  REEL_COMMENTED = 'REEL_COMMENTED',
  REEL_SHARED = 'REEL_SHARED',

  // Engagement events
  COMPETITION_JOINED = 'COMPETITION_JOINED',
  COMPETITION_COMPLETED = 'COMPETITION_COMPLETED',

  // Performance events
  API_CALL = 'API_CALL',
  API_ERROR = 'API_ERROR',
  PAGE_LOAD = 'PAGE_LOAD',
  CRASH = 'CRASH',

  // Monetization events
  PURCHASE = 'PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  AD_IMPRESSION = 'AD_IMPRESSION',
  AD_CLICK = 'AD_CLICK',
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

interface AnalyticsEvent {
  timestamp: number;
  eventType: EventType;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  duration?: number;
}

const LOGS_STORAGE_KEY = 'gf_logs';
const EVENTS_STORAGE_KEY = 'gf_analytics_events';
const MAX_LOGS = 500;
const MAX_EVENTS = 1000;

export class LoggingService {
  private static sessionId: string = this.generateSessionId();
  private static sessionStartTime: number = Date.now();

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  static getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Log message
   */
  static async log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    stackTrace?: string
  ): Promise<void> {
    try {
      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        message,
        context,
        stackTrace,
      };

      // Also log to console
      const logFn = level === LogLevel.ERROR ? console.error : console.log;
      logFn(`[${level}] ${message}`, context || '');

      // Store in AsyncStorage
      let logs = await this.getLogs();
      logs.push(entry);

      // Keep only recent logs
      if (logs.length > MAX_LOGS) {
        logs = logs.slice(-MAX_LOGS);
      }

      await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('[LoggingService] Failed to log:', error);
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: Record<string, any>): Promise<void> {
    return this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  static info(message: string, context?: Record<string, any>): Promise<void> {
    return this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: Record<string, any>): Promise<void> {
    return this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | unknown, context?: Record<string, any>): Promise<void> {
    let stackTrace: string | undefined;
    let errorContext = context;

    if (error instanceof Error) {
      stackTrace = error.stack;
      errorContext = { ...context, errorName: error.name, errorMessage: error.message };
    }

    return this.log(LogLevel.ERROR, message, errorContext, stackTrace);
  }

  /**
   * Log API call
   */
  static async logApiCall(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number
  ): Promise<void> {
    await this.info(`API ${method} ${url}`, {
      statusCode,
      duration: `${duration}ms`,
    });

    // Also track as analytics event
    await this.trackEvent(EventType.API_CALL, {
      method,
      url,
      statusCode,
      duration,
    });
  }

  /**
   * Log API error
   */
  static async logApiError(
    method: string,
    url: string,
    error: any,
    statusCode?: number
  ): Promise<void> {
    await this.error(`API Error ${method} ${url}`, error, {
      statusCode,
      url,
    });

    // Also track as analytics event
    await this.trackEvent(EventType.API_ERROR, {
      method,
      url,
      statusCode,
      error: error?.message || String(error),
    });
  }

  /**
   * Get all logs
   */
  static async getLogs(): Promise<LogEntry[]> {
    try {
      const logs = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('[LoggingService] Failed to get logs:', error);
      return [];
    }
  }

  /**
   * Clear logs
   */
  static async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
      console.log('[LoggingService] Logs cleared');
    } catch (error) {
      console.error('[LoggingService] Failed to clear logs:', error);
    }
  }

  /**
   * Export logs as string
   */
  static async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs();
      return logs
        .map(
          (log) =>
            `[${new Date(log.timestamp).toISOString()}] [${log.level}] ${log.message} ${
              log.context ? JSON.stringify(log.context) : ''
            }`
        )
        .join('\n');
    } catch (error) {
      console.error('[LoggingService] Failed to export logs:', error);
      return '';
    }
  }

  /**
   * Track analytics event
   */
  static async trackEvent(
    eventType: EventType,
    properties: Record<string, any> = {},
    duration?: number
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        timestamp: Date.now(),
        eventType,
        sessionId: this.sessionId,
        properties,
        duration,
      };

      let events = await this.getEvents();
      events.push(event);

      // Keep only recent events
      if (events.length > MAX_EVENTS) {
        events = events.slice(-MAX_EVENTS);
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));

      console.log(`[Analytics] Event tracked: ${eventType}`, properties);
    } catch (error) {
      console.error('[LoggingService] Failed to track event:', error);
    }
  }

  /**
   * Get all analytics events
   */
  static async getEvents(): Promise<AnalyticsEvent[]> {
    try {
      const events = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('[LoggingService] Failed to get events:', error);
      return [];
    }
  }

  /**
   * Get events by type
   */
  static async getEventsByType(eventType: EventType): Promise<AnalyticsEvent[]> {
    try {
      const events = await this.getEvents();
      return events.filter((e) => e.eventType === eventType);
    } catch (error) {
      console.error('[LoggingService] Failed to filter events:', error);
      return [];
    }
  }

  /**
   * Clear events
   */
  static async clearEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(EVENTS_STORAGE_KEY);
      console.log('[LoggingService] Events cleared');
    } catch (error) {
      console.error('[LoggingService] Failed to clear events:', error);
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary() {
    try {
      const events = await this.getEvents();
      const sessionDuration = Date.now() - this.sessionStartTime;

      const eventCounts: Record<string, number> = {};
      events.forEach((event) => {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      });

      return {
        sessionId: this.sessionId,
        sessionDuration,
        totalEvents: events.length,
        eventCounts,
        timeRange: {
          start: events.length > 0 ? events[0].timestamp : null,
          end: events.length > 0 ? events[events.length - 1].timestamp : null,
        },
      };
    } catch (error) {
      console.error('[LoggingService] Failed to get summary:', error);
      return null;
    }
  }

  /**
   * Track screen view
   */
  static async trackScreenView(screenName: string, params?: Record<string, any>): Promise<void> {
    await this.trackEvent(EventType.PAGE_LOAD, {
      screenName,
      ...params,
    });
  }

  /**
   * Track page performance
   */
  static async trackPagePerformance(screenName: string, duration: number): Promise<void> {
    await this.trackEvent(EventType.PAGE_LOAD, {
      screenName,
      duration,
    });
  }

  /**
   * Track crash
   */
  static async trackCrash(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent(EventType.CRASH, {
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      ...context,
    });
  }
}
