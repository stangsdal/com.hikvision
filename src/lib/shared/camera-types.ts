/**
 * Comprehensive Type Definitions for Hikvision Camera Integration
 *
 * This module contains all TypeScript interfaces and type definitions used throughout
 * the Hikvision camera integration. It provides type safety and documentation for:
 * - Camera configuration and settings
 * - PTZ control and preset management
 * - Video streaming and quality profiles
 * - Alarm and motion detection systems
 * - Performance optimization and caching
 * - Network and resource management
 *
 * @fileoverview Centralized type definitions for Hikvision camera functionality
 * @version 1.0.0
 * @author Your Name <your.email@example.com>
 * @since 1.0.0
 */

// Basic Camera Configuration
export interface CameraSettings {
  channel: number;
  name: string;
  nvrDeviceId: string;
  streamQuality: 'low' | 'medium' | 'high';
  streamResolution: string;
  refreshRate: number;
  enableSubStream: boolean;
  snapshotResolution: 'low' | 'medium' | 'high';
  enableAlarmForwarding: boolean;
  motionSensitivity: 'low' | 'medium' | 'high';
  autoSnapshot: boolean;
  alarmCooldown: number;
}

// Streaming Interfaces
export interface StreamInfo {
  url: string;
  type: 'main' | 'sub';
  quality: string;
  resolution: string;
  bitrate?: number;
}

export interface StreamProfile {
  id: string;
  name: string;
  resolution: string;
  bitrate: number;
  fps: number;
  codec: string;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  adaptive: boolean;
}

export interface AdaptiveStreamingConfig {
  enabled: boolean;
  targetBandwidth: number;
  minQuality: string;
  maxQuality: string;
  adaptationInterval: number;
  bufferThreshold: number;
}

export interface StreamingStats {
  bytesReceived: number;
  framesReceived: number;
  dropRate: number;
  averageBitrate: number;
  currentQuality: string;
  adaptations: number;
  lastAdaptation: number;
  buffering: boolean;
  averageResponseTime: number;
}

export interface ConnectionStats {
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastConnectionTime: number;
  isConnected: boolean;
  connectionUptime: number;
}

// Alarm and History Management
export interface AlarmHistoryEntry {
  timestamp: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  channel?: number;
  resolved: boolean;
}

export interface AlarmHistory {
  entries: AlarmHistoryEntry[];
  maxEntries: number;
  totalAlarms: number;
}

// PTZ (Pan-Tilt-Zoom) Management
export interface PTZPreset {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  description?: string;
  createdAt: number;
  lastUsed?: number;
}

export interface PTZPresetManager {
  presets: Map<number, PTZPreset>;
  maxPresets: number;
  currentPosition: { pan: number; tilt: number; zoom: number } | null;
}

// Motion Detection
export interface MotionZone {
  id: string;
  name: string;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  coordinates: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  schedule?: {
    enabled: boolean;
    timeRanges: Array<{
      start: string;
      end: string;
      days: number[];
    }>;
  };
  notifications: boolean;
  recording: boolean;
}

export interface SmartMotionConfig {
  enabled: boolean;
  personDetection: boolean;
  vehicleDetection: boolean;
  minimumSize: number;
  zones: MotionZone[];
  sensitivity: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  filterType: 'person_only' | 'vehicle_only' | 'person_and_vehicle' | 'all_motion';
}

// Health Monitoring
export interface HealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  temperature: number;
  networkLatency: number;
  errorRate: number;
  uptime: number;
  lastHealthCheck: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface HealthAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface HealthConfig {
  monitoring: boolean;
  checkInterval: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
    temperature: number;
    errorRate: number;
  };
  notifications: boolean;
}

// Recording Management
export interface RecordingSchedule {
  id: string;
  name: string;
  enabled: boolean;
  timeRanges: Array<{
    start: string;
    end: string;
    days: number[];
  }>;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  duration?: number;
}

export interface RecordingTrigger {
  id: string;
  name: string;
  type: 'motion' | 'alarm' | 'schedule' | 'manual';
  enabled: boolean;
  conditions: {
    motionZones?: string[];
    alarmTypes?: string[];
    schedule?: string;
    duration?: number;
    preRecording?: number;
    postRecording?: number;
  };
  actions: {
    record: boolean;
    notify: boolean;
    snapshot: boolean;
  };
}

export interface RecordingSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number;
  triggerType: string;
  quality: string;
  fileSize: number;
  status: 'recording' | 'completed' | 'failed' | 'stopped';
  filePath?: string;
}

export interface RecordingConfig {
  enabled: boolean;
  defaultQuality: 'ultra' | 'high' | 'medium' | 'low';
  maxDuration: number;
  preRecordingBuffer: number;
  postRecordingBuffer: number;
  storageLocation: string;
  autoCleanup: boolean;
  maxStorageSize: number;
}

// Performance & Optimization
export interface ConnectionPool {
  maxConnections: number;
  activeConnections: number;
  connectionTimeout: number;
  keepAliveTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  connections: Map<string, PooledConnection>;
  lastCleanup: number;
}

export interface PooledConnection {
  id: string;
  url: string;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
}

export interface MemoryManager {
  maxMemoryUsage: number;
  currentUsage: number;
  cacheSize: number;
  bufferSize: number;
  gcInterval: number;
  lastGC: number;
  highWaterMark: number;
  lowWaterMark: number;
  autoCleanup: boolean;
}

export interface ResourceMonitor {
  enabled: boolean;
  checkInterval: number;
  thresholds: {
    memory: number;
    cpu: number;
    disk: number;
    network: number;
  };
  actions: {
    cleanup: boolean;
    throttle: boolean;
    alert: boolean;
  };
  history: Array<{
    timestamp: number;
    memory: number;
    cpu: number;
    connections: number;
  }>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

// Error Handling
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

export interface ErrorContext {
  operation: string;
  url?: string;
  method?: string;
  statusCode?: number;
  timestamp: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByOperation: Map<string, number>;
  recentErrors: ErrorContext[];
  errorRate: number;
  lastError?: ErrorContext;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailure?: number;
  nextAttempt?: number;
}

// System Integration
export interface SystemMessage {
  id: string;
  type: 'device_discovery' | 'status_sync' | 'coordinated_action' | 'health_check' | 'alert_broadcast' | 'performance_sync';
  source: string;
  target?: string;
  timestamp: number;
  payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface SystemIntegrationManager {
  messageHandlers: Map<string, (message: SystemMessage) => void>;
  messageQueue: SystemMessage[];
  processingInterval: number;
  maxQueueSize: number;
  lastSync: number;
}

// Advanced Flow Control
export interface FlowControlConfig {
  maxConcurrentRequests: number;
  requestTimeout: number;
  queueTimeout: number;
  throttleDelay: number;
}

export interface QueuedRequest {
  id: string;
  operation: () => Promise<unknown>;
  priority: number;
  timeout: number;
  timestamp: number;
  retries: number;
}

// Configuration Profile System
export interface ConfigurationProfile {
  id: string;
  name: string;
  description: string;
  settings: Partial<CameraSettings>;
  streamingConfig: Partial<AdaptiveStreamingConfig>;
  healthConfig: Partial<HealthConfig>;
  recordingConfig: Partial<RecordingConfig>;
  optimizationConfig: {
    memoryManager: Partial<MemoryManager>;
    connectionPool: Partial<ConnectionPool>;
    resourceMonitor: Partial<ResourceMonitor>;
  };
}

// Device Status Enums
export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export enum RecordingStatus {
  RECORDING = 'recording',
  STOPPED = 'stopped',
  PAUSED = 'paused',
  ERROR = 'error'
}

export enum AlarmType {
  MOTION = 'motion',
  INTRUSION = 'intrusion',
  LINE_CROSSING = 'line_crossing',
  VIDEO_LOSS = 'video_loss',
  VIDEO_BLIND = 'video_blind',
  SYSTEM = 'system'
}

// Utility Types
export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';
export type SensitivityLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';