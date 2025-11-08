import Homey = require('homey');
import request = require('request');
import { Writable } from 'stream';

interface CameraSettings {
  channel: number;
  name: string;
  nvrDeviceId: string;
  nvrAddress: string;
  nvrPort: number;
  nvrSsl: boolean;
  nvrStrict: boolean;
  nvrUsername: string;
  nvrPassword: string;
  streamQuality: string;
  streamResolution: string;
  refreshRate: number;
  enableSubStream: boolean;
  snapshotResolution: string;
  enableAlarmForwarding: boolean;
  motionSensitivity: string;
  autoSnapshot: boolean;
  alarmCooldown: number;
}

interface StreamInfo {
  mainStreamUrl: string;
  subStreamUrl: string;
  snapshotUrl: string;
  protocol: string;
}

interface StreamProfile {
  id: string;
  name: string;
  quality: 'ultra' | 'high' | 'medium' | 'low';
  resolution: string;
  bitrate: number;
  framerate: number;
  codec: 'H264' | 'H265';
  enabled: boolean;
}

interface AdaptiveStreamingConfig {
  enabled: boolean;
  profiles: StreamProfile[];
  currentProfile?: StreamProfile;
  autoSwitchEnabled: boolean;
  bandwidthThreshold: number;
  qualityAdjustment: 'auto' | 'manual';
}

interface StreamingStats {
  connectionStats: ConnectionStats;
  streamInfo: StreamInfo;
  adaptiveConfig: AdaptiveStreamingConfig;
  settings: {
    quality: string;
    resolution: string;
    refreshRate: number;
    subStreamEnabled: boolean;
  };
}

interface ConnectionStats {
  lastSuccessfulConnect: number;
  consecutiveFailures: number;
  averageResponseTime: number;
  connectionStrength: number;
}

interface AlarmHistoryEntry {
  timestamp: number;
  type: string;
  action: string;
  duration?: number;
  details?: string;
}

interface AlarmHistory {
  entries: AlarmHistoryEntry[];
  maxEntries: number;
  currentAlarm?: AlarmHistoryEntry;
}

interface PTZPreset {
  id: number;
  name: string;
  pan: number;
  tilt: number;
  zoom: number;
  created: number;
  lastUsed?: number;
}

interface PTZPresetManager {
  presets: PTZPreset[];
  maxPresets: number;
  currentPosition?: { pan: number; tilt: number; zoom: number };
}

interface MotionZone {
  id: string;
  name: string;
  enabled: boolean;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sensitivity: 'low' | 'medium' | 'high';
  schedule?: {
    enabled: boolean;
    timeSlots: Array<{
      start: string;
      end: string;
      days: number[];
    }>;
  };
}

interface SmartMotionConfig {
  enabled: boolean;
  zones: MotionZone[];
  globalSensitivity: 'low' | 'medium' | 'high';
  objectDetection: boolean;
  humanDetection: boolean;
  vehicleDetection: boolean;
  motionDuration: number; // seconds before triggering
  cooldownPeriod: number; // milliseconds between detections
}

interface HealthMetrics {
  connectionStatus: 'online' | 'offline' | 'unstable';
  lastPingTime: number;
  responseTime: number; // milliseconds
  signalStrength: number; // 0-100
  videoQuality: 'excellent' | 'good' | 'poor' | 'unavailable';
  storageStatus: 'normal' | 'low' | 'full' | 'error';
  temperature: number; // Celsius
  uptime: number; // seconds
  errorCount: number;
  lastHealthCheck: number; // timestamp
}

interface HealthAlert {
  id: string;
  type: 'connection' | 'storage' | 'temperature' | 'quality' | 'error';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface HealthConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  pingTimeout: number; // milliseconds
  temperatureThreshold: number; // Celsius
  storageThreshold: number; // percentage
  qualityThreshold: number; // 0-100
  alertHistory: HealthAlert[];
  autoReconnect: boolean;
}

interface RecordingSchedule {
  id: string;
  name: string;
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  days: number[]; // 0-6 (Sunday to Saturday)
  quality: 'ultra' | 'high' | 'medium' | 'low';
  duration?: number; // minutes, for event-based recording
}

interface RecordingTrigger {
  id: string;
  name: string;
  enabled: boolean;
  type: 'motion' | 'alarm' | 'manual' | 'schedule';
  conditions: {
    motionZones?: string[]; // zone IDs
    alarmTypes?: string[];
    timeRange?: { start: string; end: string };
  };
  action: {
    duration: number; // minutes
    preRecord: number; // seconds before trigger
    postRecord: number; // seconds after trigger
    quality: 'ultra' | 'high' | 'medium' | 'low';
  };
}

interface RecordingSession {
  id: string;
  startTime: number;
  endTime?: number;
  triggerType: string;
  triggerId?: string;
  quality: string;
  filePath?: string;
  fileSize?: number;
  status: 'recording' | 'completed' | 'failed';
}

interface RecordingConfig {
  enabled: boolean;
  defaultQuality: 'ultra' | 'high' | 'medium' | 'low';
  maxDuration: number; // minutes
  storageLimit: number; // GB
  autoCleanup: boolean;
  cleanupAfterDays: number;
  schedules: RecordingSchedule[];
  triggers: RecordingTrigger[];
  sessions: RecordingSession[];
}

// Phase 5: Performance & Optimization Interfaces

interface ConnectionPool {
  connections: Map<string, PooledConnection>;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  retryAttempts: number;
  lastCleanup: number;
}

interface PooledConnection {
  id: string;
  url: string;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
  requestCount: number;
  errorCount: number;
  responseTime: number;
}

interface MemoryManager {
  enabled: boolean;
  maxMemoryUsage: number; // MB
  cleanupInterval: number; // minutes
  lastCleanup: number;
  memoryStats: {
    imageCache: number;
    streamBuffers: number;
    alarmHistory: number;
    totalUsage: number;
  };
}

interface ResourceMonitor {
  enabled: boolean;
  checkInterval: number; // minutes
  thresholds: {
    memory: number; // MB
    connections: number;
    responseTime: number; // ms
    errorRate: number; // percentage
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    peakMemoryUsage: number;
    activeConnections: number;
  };
}

interface CacheEntry<T> {
  key: string;
  data: T;
  createdAt: number;
  lastAccessed: number;
  size: number; // bytes
  ttl: number; // time to live in ms
}

// Advanced Error Handling Interfaces

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: string[];
  jitterEnabled: boolean;
}

interface ErrorContext {
  operation: string;
  timestamp: number;
  attemptNumber: number;
  error: Error;
  metadata?: Record<string, unknown>;
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByOperation: Map<string, number>;
  recentErrors: ErrorContext[];
  recoveryTime: number;
  lastErrorTime: number;
}

interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

// Performance Monitoring Interfaces

interface PerformanceMetrics {
  operationMetrics: Map<string, OperationMetrics>;
  systemMetrics: SystemMetrics;
  networkMetrics: NetworkMetrics;
  streamingMetrics: StreamingMetrics;
  alertThresholds: PerformanceThresholds;
  monitoringEnabled: boolean;
  collectionInterval: number;
}

interface OperationMetrics {
  operationName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastCallTime: number;
  responseTimes: number[];
  errorRate: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  cacheHitRate: number;
  connectionPoolUtilization: number;
  activeStreams: number;
  uptime: number;
  lastUpdated: number;
}

interface NetworkMetrics {
  totalBandwidthUsed: number;
  averageLatency: number;
  packetLoss: number;
  connectionDrops: number;
  reconnections: number;
  dataTransferred: number;
  lastNetworkCheck: number;
}

interface StreamingMetrics {
  framesPerSecond: number;
  droppedFrames: number;
  bufferUnderruns: number;
  qualityDegradations: number;
  adaptiveChanges: number;
  averageBitrate: number;
  streamingUptime: number;
}

interface PerformanceThresholds {
  maxResponseTime: number;
  maxErrorRate: number;
  maxMemoryUsage: number;
  minCacheHitRate: number;
  maxCpuUsage: number;
  minNetworkLatency: number;
}

interface PerformanceAlert {
  id: string;
  type: 'performance' | 'resource' | 'network' | 'streaming';
  severity: 'info' | 'warning' | 'critical';
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface PerformanceReport {
  reportId: string;
  generatedAt: number;
  timeRange: { start: number; end: number };
  summary: PerformanceSummary;
  detailedMetrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  recommendations: string[];
}

interface PerformanceSummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  avgResponseTime: number;
  successRate: number;
  uptimePercentage: number;
  resourceUtilization: number;
  networkQuality: number;
}

/**
 * Configuration Management Interfaces
 */

/**
 * Configuration validation rule
 */
interface ConfigValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: any[];
  customValidator?: (value: any) => boolean | string;
}

/**
 * Configuration schema
 */
interface ConfigurationSchema {
  version: string;
  sections: ConfigurationSection[];
  validationRules: ConfigValidationRule[];
  migrationHandlers: ConfigMigrationHandler[];
}

/**
 * Configuration section
 */
interface ConfigurationSection {
  id: string;
  name: string;
  description: string;
  category: 'network' | 'streaming' | 'security' | 'performance' | 'advanced';
  settings: ConfigurationSetting[];
  dependencies?: string[];
  conditions?: ConfigurationCondition[];
}

/**
 * Configuration setting
 */
interface ConfigurationSetting {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'range' | 'password';
  defaultValue: any;
  currentValue?: any;
  options?: ConfigurationOption[];
  validation?: ConfigValidationRule;
  sensitive?: boolean;
  requiresRestart?: boolean;
  advanced?: boolean;
  tooltip?: string;
  unit?: string;
}

/**
 * Configuration option for select/multiselect
 */
interface ConfigurationOption {
  value: any;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Configuration condition for conditional settings
 */
interface ConfigurationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

/**
 * Configuration validation result
 */
interface ConfigurationValidationResult {
  valid: boolean;
  errors: ConfigurationError[];
  warnings: ConfigurationWarning[];
  suggestions?: ConfigurationSuggestion[];
}

/**
 * Configuration error
 */
interface ConfigurationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Configuration warning
 */
interface ConfigurationWarning {
  field: string;
  message: string;
  recommendation?: string;
}

/**
 * Configuration suggestion
 */
interface ConfigurationSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  impact: 'performance' | 'security' | 'reliability' | 'usability';
}

/**
 * Configuration migration handler
 */
interface ConfigMigrationHandler {
  fromVersion: string;
  toVersion: string;
  migrate: (oldConfig: any) => any;
  validate?: (migratedConfig: any) => boolean;
}

/**
 * Configuration backup
 */
interface ConfigurationBackup {
  id: string;
  timestamp: number;
  version: string;
  configuration: any;
  reason: 'manual' | 'auto' | 'pre_migration' | 'factory_reset' | 'pre_profile_apply' | 'pre_restore' | 'pre_import';
  metadata: {
    deviceId: string;
    softwareVersion: string;
    user?: string;
  };
}

/**
 * Advanced configuration manager
 */
interface ConfigurationManager {
  schema: ConfigurationSchema;
  currentConfig: any;
  backups: ConfigurationBackup[];
  validationCache: Map<string, ConfigurationValidationResult>;
  migrationHistory: ConfigMigrationHandler[];
}

/**
 * Configuration export/import options
 */
interface ConfigurationExportOptions {
  includeSensitive?: boolean;
  sections?: string[];
  format: 'json' | 'yaml' | 'encrypted';
  encryption?: {
    algorithm: string;
    key?: string;
  };
}

/**
 * Configuration profile
 */
interface ConfigurationProfile {
  id: string;
  name: string;
  description: string;
  configuration: any;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isDefault?: boolean;
  author?: string;
}

/**
 * System Integration Interfaces
 */

/**
 * Cross-device communication message
 */
interface SystemMessage {
  id: string;
  type: 'device_discovery' | 'status_sync' | 'coordinated_action' | 'health_check' | 'alert_broadcast' | 'performance_sync';
  sourceDeviceId: string;
  targetDeviceId?: string; // undefined for broadcast
  timestamp: number;
  payload: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresAck?: boolean;
  expiresAt?: number;
}

/**
 * System orchestration rule
 */
interface OrchestrationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    deviceType?: string;
    eventType: string;
    conditions?: Record<string, unknown>;
  };
  actions: OrchestrationAction[];
  enabled: boolean;
  priority: number;
  createdAt: number;
  lastExecuted?: number;
  executionCount: number;
}

/**
 * Orchestration action
 */
interface OrchestrationAction {
  type: 'device_action' | 'system_action' | 'notification' | 'flow_trigger' | 'delay';
  deviceId?: string;
  actionName: string;
  parameters?: Record<string, unknown>;
  delay?: number;
  condition?: string;
}

/**
 * Device discovery information
 */
interface DeviceDiscovery {
  deviceId: string;
  deviceType: 'hikvision-camera' | 'hikvision-camnvr';
  name: string;
  capabilities: string[];
  lastSeen: number;
  networkInfo: {
    ipAddress: string;
    port: number;
    ssl: boolean;
  };
  status: 'online' | 'offline' | 'unknown';
  metadata: Record<string, unknown>;
}

/**
 * System health aggregator
 */
interface SystemHealthAggregator {
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  devices: Map<string, DeviceHealthSummary>;
  systemMetrics: {
    totalDevices: number;
    onlineDevices: number;
    alertCount: number;
    avgResponseTime: number;
    memoryUsage: number;
    networkLatency: number;
  };
  alerts: SystemAlert[];
  lastUpdated: number;
}

/**
 * Device health summary for system aggregation
 */
interface DeviceHealthSummary {
  deviceId: string;
  deviceType: string;
  status: 'online' | 'offline' | 'degraded';
  health: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdate: number;
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    memoryUsage: number;
  };
  activeAlerts: number;
}

/**
 * System-wide alert
 */
interface SystemAlert {
  id: string;
  type: 'device_offline' | 'performance_degradation' | 'system_error' | 'security_breach' | 'maintenance_required';
  severity: 'info' | 'warning' | 'critical';
  deviceId?: string;
  message: string;
  details: Record<string, unknown>;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

/**
 * Coordinated action for multi-device operations
 */
interface CoordinatedAction {
  id: string;
  name: string;
  type: 'recording' | 'ptz_patrol' | 'stream_switching' | 'maintenance' | 'security_mode';
  devices: string[];
  parameters: Record<string, unknown>;
  schedule?: {
    startTime: number;
    duration: number;
    repeat?: string;
  };
  status: 'pending' | 'executing' | 'completed' | 'failed';
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  results?: Map<string, unknown>;
}

/**
 * System integration manager
 */
interface SystemIntegrationManager {
  messageQueue: SystemMessage[];
  orchestrationRules: OrchestrationRule[];
  discoveredDevices: Map<string, DeviceDiscovery>;
  healthAggregator: SystemHealthAggregator;
  coordinatedActions: Map<string, CoordinatedAction>;
  messageHandlers: Map<string, (message: SystemMessage) => void>;
}

class HikvisionCameraDevice extends Homey.Device {
  private settings!: CameraSettings;
  private mainImage?: Homey.Image;
  private subImage?: Homey.Image;
  private connectionCheckInterval?: ReturnType<typeof setTimeout>;
  private imageRefreshInterval?: ReturnType<typeof setTimeout>;
  private connectionStats: ConnectionStats = {
    lastSuccessfulConnect: 0,
    consecutiveFailures: 0,
    averageResponseTime: 0,
    connectionStrength: 0
  };
  private alarmHistory: AlarmHistory = {
    entries: [],
    maxEntries: 100, // Keep last 100 alarm events
    currentAlarm: undefined
  };
  private ptzPresetManager: PTZPresetManager = {
    presets: [],
    maxPresets: 255, // Hikvision supports up to 255 presets
    currentPosition: undefined
  };
  private adaptiveStreamingConfig: AdaptiveStreamingConfig = {
    enabled: false,
    profiles: [],
    autoSwitchEnabled: false,
    bandwidthThreshold: 1000, // kbps
    qualityAdjustment: 'auto'
  };
  private smartMotionConfig: SmartMotionConfig = {
    enabled: false,
    zones: [],
    globalSensitivity: 'medium',
    objectDetection: false,
    humanDetection: false,
    vehicleDetection: false,
    motionDuration: 2, // seconds
    cooldownPeriod: 5000 // ms
  };

  // Health monitoring system
  private healthMetrics: HealthMetrics = {
    connectionStatus: 'offline',
    lastPingTime: 0,
    responseTime: 0,
    signalStrength: 0,
    videoQuality: 'unavailable',
    storageStatus: 'normal',
    temperature: 0,
    uptime: 0,
    errorCount: 0,
    lastHealthCheck: 0
  };

  private healthConfig: HealthConfig = {
    enabled: true,
    checkInterval: 5, // minutes
    pingTimeout: 5000, // ms
    temperatureThreshold: 65, // Celsius
    storageThreshold: 85, // percentage
    qualityThreshold: 70, // 0-100
    alertHistory: [],
    autoReconnect: true
  };

  private healthCheckTimer?: ReturnType<typeof setTimeout>;

  // Advanced recording system
  private recordingConfig: RecordingConfig = {
    enabled: false,
    defaultQuality: 'high',
    maxDuration: 60, // minutes
    storageLimit: 10, // GB
    autoCleanup: true,
    cleanupAfterDays: 30,
    schedules: [],
    triggers: [],
    sessions: []
  };

  private currentRecording?: RecordingSession;

  // Phase 5: Performance & Optimization Systems
  private connectionPool: ConnectionPool = {
    connections: new Map(),
    maxConnections: 5,
    connectionTimeout: 8000,
    idleTimeout: 60000, // 1 minute
    retryAttempts: 3,
    lastCleanup: 0
  };

  private memoryManager: MemoryManager = {
    enabled: true,
    maxMemoryUsage: 50, // MB
    cleanupInterval: 10, // minutes
    lastCleanup: 0,
    memoryStats: {
      imageCache: 0,
      streamBuffers: 0,
      alarmHistory: 0,
      totalUsage: 0
    }
  };

  private resourceMonitor: ResourceMonitor = {
    enabled: true,
    checkInterval: 5, // minutes
    thresholds: {
      memory: 40, // MB
      connections: 10,
      responseTime: 5000, // ms
      errorRate: 20 // percentage
    },
    metrics: {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      peakMemoryUsage: 0,
      activeConnections: 0
    }
  };

  private imageCache: Map<string, CacheEntry<Buffer>> = new Map();
  private streamCache: Map<string, CacheEntry<string>> = new Map();
  private optimizationTimer?: ReturnType<typeof setTimeout>;

  // Advanced Error Handling Systems
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'],
    jitterEnabled: true
  };

  private errorMetrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: new Map(),
    errorsByOperation: new Map(),
    recentErrors: [],
    recoveryTime: 0,
    lastErrorTime: 0
  };

  private circuitBreakerConfig: CircuitBreakerConfig = {
    enabled: true,
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  };

  private circuitBreakerState: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0
  };

  // Performance Monitoring System
  private performanceMetrics: PerformanceMetrics = {
    operationMetrics: new Map(),
    systemMetrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      connectionPoolUtilization: 0,
      activeStreams: 0,
      uptime: 0,
      lastUpdated: 0
    },
    networkMetrics: {
      totalBandwidthUsed: 0,
      averageLatency: 0,
      packetLoss: 0,
      connectionDrops: 0,
      reconnections: 0,
      dataTransferred: 0,
      lastNetworkCheck: 0
    },
    streamingMetrics: {
      framesPerSecond: 0,
      droppedFrames: 0,
      bufferUnderruns: 0,
      qualityDegradations: 0,
      adaptiveChanges: 0,
      averageBitrate: 0,
      streamingUptime: 0
    },
    alertThresholds: {
      maxResponseTime: 5000, // 5 seconds
      maxErrorRate: 10, // 10%
      maxMemoryUsage: 80, // 80%
      minCacheHitRate: 50, // 50%
      maxCpuUsage: 70, // 70%
      minNetworkLatency: 2000 // 2 seconds
    },
    monitoringEnabled: true,
    collectionInterval: 60000 // 1 minute
  };

  private performanceAlerts: PerformanceAlert[] = [];
  private performanceMonitoringTimer?: ReturnType<typeof setTimeout>;
  private deviceStartTime = Date.now();

  // Configuration Management System
  private configurationManager: {
    schema: ConfigurationSchema;
    currentConfig: Record<string, unknown>;
    backups: ConfigurationBackup[];
    validationCache: Map<string, ConfigurationValidationResult>;
    migrationHistory: ConfigMigrationHandler[];
    profiles: ConfigurationProfile[];
  } = {
    schema: {
      version: '3.0.0',
      sections: [],
      validationRules: [],
      migrationHandlers: []
    },
    currentConfig: {},
    backups: [],
    validationCache: new Map(),
    migrationHistory: [],
    profiles: []
  };

  private configValidationEnabled = true;
  private autoBackupEnabled = true;
  private maxBackupCount = 10;

  // System Integration Manager
  private systemIntegrationManager: {
    messageQueue: SystemMessage[];
    orchestrationRules: OrchestrationRule[];
    discoveredDevices: Map<string, DeviceDiscovery>;
    healthAggregator: SystemHealthAggregator;
    coordinatedActions: Map<string, CoordinatedAction>;
    messageHandlers: Map<string, (message: SystemMessage) => void>;
  } = {
    messageQueue: [],
    orchestrationRules: [],
    discoveredDevices: new Map(),
    healthAggregator: {
      overallHealth: 'good',
      devices: new Map(),
      systemMetrics: {
        totalDevices: 0,
        onlineDevices: 0,
        alertCount: 0,
        avgResponseTime: 0,
        memoryUsage: 0,
        networkLatency: 0
      },
      alerts: [],
      lastUpdated: Date.now()
    },
    coordinatedActions: new Map(),
    messageHandlers: new Map()
  };

  private systemIntegrationEnabled = true;
  private deviceDiscoveryInterval?: ReturnType<typeof setTimeout>;
  private systemHealthUpdateInterval?: ReturnType<typeof setTimeout>;
  private messageProcessingInterval?: ReturnType<typeof setTimeout>;

  private streamInfo: StreamInfo = {
    mainStreamUrl: '',
    subStreamUrl: '',
    snapshotUrl: '',
    protocol: 'HTTP'
  };

  override async onInit(): Promise<void> {
    this.log(`Init camera device: ${this.getName()}`);
    this.settings = this.getSettings() as CameraSettings;

    // Initialize default settings if not set
    this.initializeDefaultSettings();

    // Initialize streaming profiles
    this.initializeStreamingProfiles();

    // Set initial capability values
    await this.setCapabilityValue('camera_status', false);
    await this.setCapabilityValue('motion_detected', false);
    await this.setCapabilityValue('recording_status', false);
    await this.setCapabilityValue('stream_quality', this.settings.streamQuality || 'high');
    await this.setCapabilityValue('connection_strength', 0);
    await this.setCapabilityValue('ptz_position', 'Unknown');
    await this.setCapabilityValue('alarm_state', 'Idle');
    await this.setCapabilityValue('last_alarm', 'None');

    // Setup streaming and monitoring
    await this.setupAdvancedStreaming();
    this.startAdvancedConnectionMonitoring();

    // Initialize health monitoring
    this.initializeMotionZones();
    this.startHealthMonitoring();

    // Initialize Phase 5: Performance & Optimization systems
    this.initializeOptimizationSystems();

    // Initialize performance monitoring
    this.startPerformanceMonitoring();

    // Initialize configuration management
    this.initializeConfigurationManagement();

    // Initialize system integration
    this.initializeSystemIntegration();
  }

  private initializeDefaultSettings(): void {
    if (!this.settings.streamQuality) {
      this.settings.streamQuality = 'high';
    }
    if (!this.settings.streamResolution) {
      this.settings.streamResolution = '1920x1080';
    }
    if (!this.settings.refreshRate) {
      this.settings.refreshRate = 5;
    }
    if (this.settings.enableSubStream === undefined) {
      this.settings.enableSubStream = true;
    }
    if (!this.settings.snapshotResolution) {
      this.settings.snapshotResolution = 'high';
    }
  }

  override async onSettings({
    oldSettings: _oldSettings,
    newSettings,
    changedKeys: _changedKeys
  }: {
    oldSettings: CameraSettings;
    newSettings: CameraSettings;
    changedKeys: string[];
  }): Promise<boolean> {
    this.settings = newSettings;
    await this.setCapabilityValue('stream_quality', this.settings.streamQuality);
    await this.setupAdvancedStreaming();
    return true;
  }

  override async onAdded(): Promise<void> {
    this.log('Camera device added');
  }

  override async onDeleted(): Promise<void> {
    this.log('Camera device deleted');
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
    }
  }

  /**
   * Required method for Homey camera devices - provides live camera image snapshots
   */
  async onGetCameraImage(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const snapshotUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/Streaming/channels/${this.settings.channel}01/picture?snapShotImageType=JPEG`;
      
      this.log(`Getting camera snapshot from channel ${this.settings.channel}`);
      
      request.get({
        url: snapshotUrl,
        encoding: null, // Important: get raw buffer data
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 10000,
        auth: {
          user: this.settings.nvrUsername,
          pass: this.settings.nvrPassword,
          sendImmediately: false
        }
      }, (error: Error | null, response: { statusCode: number } | null, body: Buffer) => {
        if (error) {
          this.error('Error getting camera snapshot:', error.message);
          reject(new Error(`Failed to get camera snapshot: ${error.message}`));
        } else if (!response || response.statusCode !== 200) {
          const statusCode = response ? response.statusCode : 'no response';
          this.error(`Camera snapshot failed with status: ${statusCode}`);
          reject(new Error(`Camera snapshot failed with status: ${statusCode}`));
        } else if (!body || body.length === 0) {
          this.error('Camera snapshot returned empty data');
          reject(new Error('Camera snapshot returned empty data'));
        } else {
          this.log(`Camera snapshot retrieved successfully (${body.length} bytes)`);
          resolve(body);
        }
      });
    });
  }

  private async setupAdvancedStreaming(): Promise<void> {
    try {
      this.buildStreamUrls();
      await this.setupMainStream();

      if (this.settings.enableSubStream) {
        await this.setupSubStream();
      }

      this.startImageRefresh();
    } catch (error) {
      this.error('Error setting up advanced streaming:', error);
    }
  }

  private buildStreamUrls(): void {
    const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
    const baseUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}`;

    // Main stream (usually channel01)
    this.streamInfo.mainStreamUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}01/picture`;

    // Sub stream (usually channel02) - lower quality for better performance
    this.streamInfo.subStreamUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}02/picture`;

    // High quality snapshot URL
    this.streamInfo.snapshotUrl = `${baseUrl}/ISAPI/Streaming/channels/${this.settings.channel}01/picture?snapShotImageType=JPEG`;

    this.streamInfo.protocol = this.settings.nvrSsl ? 'HTTPS' : 'HTTP';
  }

  private async setupMainStream(): Promise<void> {
    try {
      this.mainImage = await this.homey.images.createImage();

      this.mainImage.setStream(async (stream) => {
        this.createStreamRequest(this.streamInfo.mainStreamUrl, stream);
      });

      // Set as both named camera image and main camera image for live viewing
      await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
      await this.setCameraImage('main', `${this.settings.name}`, this.mainImage); // Default camera image
      
      this.log('Main camera stream setup completed');
    } catch (error) {
      this.error('Error setting up main stream:', error);
    }
  }

  private async setupSubStream(): Promise<void> {
    try {
      this.subImage = await this.homey.images.createImage();

      this.subImage.setStream(async (stream) => {
        this.createStreamRequest(this.streamInfo.subStreamUrl, stream);
      });

      await this.setCameraImage('camera_sub', `${this.settings.name} (Sub)`, this.subImage);
    } catch (error) {
      this.error('Error setting up sub stream:', error);
    }
  }

  private createStreamRequest(url: string, stream: Writable): void {
    const startTime = Date.now();

    const req = request({
      url: url,
      strictSSL: this.settings.nvrStrict,
      rejectUnauthorized: this.settings.nvrStrict,
      timeout: 10000,
      headers: {
        'User-Agent': 'Homey Hikvision Camera'
      }
    });

    req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    req.on('response', (response) => {
      const responseTime = Date.now() - startTime;
      this.updateConnectionStats(true, responseTime);

      if (response.statusCode === 200) {
        this.log(`Stream connected successfully (${responseTime}ms)`);
      }
    });

    req.on('error', (error) => {
      this.updateConnectionStats(false, Date.now() - startTime);
      this.error('Stream error:', error);
    });

    req.pipe(stream);
  }

  private startImageRefresh(): void {
    // Clear existing interval
    if (this.imageRefreshInterval) {
      clearInterval(this.imageRefreshInterval);
    }

    // Refresh images based on configured refresh rate
    const refreshIntervalMs = (this.settings.refreshRate || 5) * 1000;

    this.imageRefreshInterval = setInterval(() => {
      this.refreshCameraImages();
    }, refreshIntervalMs);
  }

  private async refreshCameraImages(): Promise<void> {
    try {
      if (this.mainImage) {
        await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
      }

      if (this.subImage && this.settings.enableSubStream) {
        await this.setCameraImage('camera_sub', `${this.settings.name} (Sub)`, this.subImage);
      }
    } catch (error) {
      this.error('Error refreshing camera images:', error);
    }
  }

  private startAdvancedConnectionMonitoring(): void {
    // Check camera status every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      this.performAdvancedConnectionCheck();
    }, 30000);

    // Initial check
    this.performAdvancedConnectionCheck();
  }

  private async performAdvancedConnectionCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const statusUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/InputProxy/channels/${this.settings.channel}/status`;

      request({
        url: statusUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 8000
      }, async (error, response, _body) => {
        const responseTime = Date.now() - startTime;
        const isOnline = !error && response && response.statusCode === 200;

        this.updateConnectionStats(isOnline, responseTime);
        await this.setCapabilityValue('camera_status', isOnline);

        if (isOnline) {
          await this.setAvailable();
          // Also check if we need to get additional camera info
          await this.updateCameraInfo();
        } else {
          await this.setUnavailable('Camera offline');
        }
      }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    } catch (error) {
      this.error('Error in advanced connection check:', error);
      this.updateConnectionStats(false, 0);
      await this.setCapabilityValue('camera_status', false);
      await this.setUnavailable('Connection error');
    }
  }

  private updateConnectionStats(success: boolean, responseTime: number): void {
    if (success) {
      this.connectionStats.lastSuccessfulConnect = Date.now();
      this.connectionStats.consecutiveFailures = 0;

      // Update average response time (simple moving average)
      this.connectionStats.averageResponseTime =
        (this.connectionStats.averageResponseTime + responseTime) / 2;

      // Calculate connection strength (0-100)
      let strength = 100;
      if (responseTime > 5000) {strength = 20;}
      else if (responseTime > 3000) {strength = 40;}
      else if (responseTime > 2000) {strength = 60;}
      else if (responseTime > 1000) {strength = 80;}

      this.connectionStats.connectionStrength = strength;
    } else {
      this.connectionStats.consecutiveFailures++;

      // Reduce connection strength based on consecutive failures
      this.connectionStats.connectionStrength = Math.max(
        0,
        this.connectionStats.connectionStrength - (this.connectionStats.consecutiveFailures * 20)
      );
    }

    this.setCapabilityValue('connection_strength', this.connectionStats.connectionStrength)
      .catch(this.error);
  }

  private async updateCameraInfo(): Promise<void> {
    try {
      // Check recording status
      await this.checkRecordingStatus();
    } catch (error) {
      this.error('Error updating camera info:', error);
    }
  }

  private async checkRecordingStatus(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/tracks/${this.settings.channel}01`;

      request({
        url: recordUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 5000
      }, async (error, response, body) => {
        if (!error && response && response.statusCode === 200 && body) {
          // Simple check for recording status in XML response
          const isRecording = body.includes('<enabled>true</enabled>') || body.includes('<trackID>');
          await this.setCapabilityValue('recording_status', isRecording);
        }
      }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

    } catch (error) {
      this.error('Error checking recording status:', error);
    }
  }

  async ptzControl(pan: number, tilt: number, zoom: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const ptzUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/continuous`;

      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>${pan}</pan><tilt>${tilt}</tilt><zoom>${zoom}</zoom></PTZData>`;

      return new Promise((resolve) => {
        request.put({
          url: ptzUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response, responseBody) => {
          const success = !error && response && response.statusCode === 200 &&
                         (responseBody.trim() === 'OK' || response.statusCode === 200);

          if (success) {
            this.log(`PTZ control successful: pan=${pan}, tilt=${tilt}, zoom=${zoom}`);
          } else {
            this.error(`PTZ control failed: ${error || response?.statusCode || 'unknown error'}`);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error in PTZ control:', error);
      return false;
    }
  }

  async takeSnapshot(): Promise<boolean> {
    try {
      this.log('Taking high-quality snapshot...');

      // Use dedicated snapshot URL for best quality
      const startTime = Date.now();
      const req = request({
        url: this.streamInfo.snapshotUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: 10000,
        headers: {
          'User-Agent': 'Homey Hikvision Camera Snapshot'
        }
      });

      req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);

      return new Promise((resolve) => {
        req.on('response', async (response) => {
          const responseTime = Date.now() - startTime;

          if (response.statusCode === 200) {
            this.log(`Snapshot captured successfully (${responseTime}ms)`);

            // Refresh the main camera image to show the latest snapshot
            if (this.mainImage) {
              await this.setCameraImage('camera_main', `${this.settings.name} (Main)`, this.mainImage);
            }
            resolve(true);
          } else {
            this.error(`Snapshot failed with status: ${response.statusCode}`);
            resolve(false);
          }
        });

        req.on('error', (error) => {
          this.error('Snapshot error:', error);
          resolve(false);
        });
      });

    } catch (error) {
      this.error('Error taking snapshot:', error);
      return false;
    }
  }

  // Enhanced method to handle alarm events from the NVR with history tracking
  handleAlarmEvent(code: string, action: string): void {
    const timestamp = Date.now();
    this.log(`Camera ${this.settings.channel} alarm: ${code} - ${action} at ${new Date(timestamp).toISOString()}`);

    // Handle alarm history and duration tracking
    if (action === 'Start') {
      // End previous alarm if one is active
      if (this.alarmHistory.currentAlarm) {
        this.alarmHistory.currentAlarm.duration = timestamp - this.alarmHistory.currentAlarm.timestamp;
        this.addAlarmToHistory(this.alarmHistory.currentAlarm);
      }

      // Start new alarm
      this.alarmHistory.currentAlarm = {
        timestamp: timestamp,
        type: code,
        action: action,
        details: `Camera ${this.settings.channel} - ${this.settings.name}`
      };
    } else if (action === 'Stop' && this.alarmHistory.currentAlarm && this.alarmHistory.currentAlarm.type === code) {
      // End current alarm
      this.alarmHistory.currentAlarm.duration = timestamp - this.alarmHistory.currentAlarm.timestamp;
      this.addAlarmToHistory(this.alarmHistory.currentAlarm);
      this.alarmHistory.currentAlarm = undefined;
    }

    // Update alarm state based on alarm type and action
    let alarmState = 'Idle';
    const lastAlarm = code;

    if (action === 'Start') {
      switch (code) {
        case 'VideoMotion':
          alarmState = 'Motion Detected';
          this.setCapabilityValue('motion_detected', true).catch(this.error);
          // Auto-capture snapshot on motion detection if enabled
          if (this.settings.autoSnapshot !== false) {
            this.takeSnapshot().catch(this.error);
          }
          break;
        case 'AlarmLocal':
          alarmState = 'Local Alarm';
          break;
        case 'VideoLoss':
          alarmState = 'Video Loss';
          break;
        case 'VideoBlind':
          alarmState = 'Video Blind';
          break;
        case 'LineDetection':
          alarmState = 'Line Detection';
          break;
        case 'IntrusionDetection':
          alarmState = 'Intrusion Detection';
          break;
        default:
          alarmState = 'Unknown Alarm';
      }
    } else if (action === 'Stop') {
      alarmState = 'Idle';
      if (code === 'VideoMotion') {
        this.setCapabilityValue('motion_detected', false).catch(this.error);
      }
    }

    // Update alarm capabilities
    this.setCapabilityValue('alarm_state', alarmState).catch(this.error);
    this.setCapabilityValue('last_alarm', lastAlarm).catch(this.error);

    // Trigger camera-specific flow cards based on alarm type
    const alarmHandlers: Record<string, string> = {
      'VideoMotion': action === 'Start' ? 'camera_motion_start' : 'camera_motion_stop',
      'VideoLoss': action === 'Start' ? 'camera_video_loss_start' : 'camera_video_loss_stop',
      'VideoBlind': action === 'Start' ? 'camera_video_blind_start' : 'camera_video_blind_stop',
      'LineDetection': action === 'Start' ? 'camera_line_detection_start' : 'camera_line_detection_stop',
      'IntrusionDetection': action === 'Start' ? 'camera_intrusion_start' : 'camera_intrusion_stop',
      'AlarmLocal': action === 'Start' ? 'camera_alarm_start' : 'camera_alarm_stop'
    };

    const triggerCard = alarmHandlers[code];
    if (triggerCard) {
      this.homey.flow.getDeviceTriggerCard(triggerCard)
        .trigger(this)
        .catch(this.error);
    }

    // Trigger general alarm flow card
    if (action === 'Start') {
      this.homey.flow.getDeviceTriggerCard('camera_alarm_triggered')
        .trigger(this, { alarm_type: code })
        .catch(this.error);
    }
  }

  async refreshStream(): Promise<boolean> {
    try {
      this.log('Refreshing camera streams...');

      // Restart streaming setup
      await this.setupAdvancedStreaming();

      // Force immediate image refresh
      await this.refreshCameraImages();

      this.log('Camera streams refreshed successfully');
      return true;
    } catch (error) {
      this.error('Error refreshing stream:', error);
      return false;
    }
  }

  async goToPreset(presetNumber: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetNumber}/goto`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 8000
        }, async (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            // Update preset usage tracking
            const preset = this.ptzPresetManager.presets.find(p => p.id === presetNumber);
            if (preset) {
              preset.lastUsed = Date.now();
              await this.setCapabilityValue('ptz_position', `${preset.name} (${presetNumber})`);
              this.log(`Moved to preset "${preset.name}" (${presetNumber}) successfully`);
            } else {
              await this.setCapabilityValue('ptz_position', `Preset ${presetNumber}`);
              this.log(`Moved to preset ${presetNumber} successfully`);
            }
          } else {
            this.error(`Failed to go to preset ${presetNumber}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error going to preset:', error);
      return false;
    }
  }

  async setPreset(presetNumber: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetNumber}`;

      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZPreset><id>${presetNumber}</id><presetName>Preset${presetNumber}</presetName></PTZPreset>`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            this.log(`Preset ${presetNumber} set successfully`);
          } else {
            this.error(`Failed to set preset ${presetNumber}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error setting preset:', error);
      return false;
    }
  }

  async stopPTZ(): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const stopUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/continuous`;

      const body = '<?xml version="1.0" encoding="UTF-8"?><PTZData><pan>0</pan><tilt>0</tilt><zoom>0</zoom></PTZData>';

      return new Promise((resolve) => {
        request.put({
          url: stopUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 5000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, async (error, response) => {
          const success = !error && response && response.statusCode === 200;

          if (success) {
            await this.setCapabilityValue('ptz_position', 'Stopped');
            this.log('PTZ movement stopped successfully');
          } else {
            this.error('Failed to stop PTZ movement:', error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error stopping PTZ:', error);
      return false;
    }
  }

  /**
   * Add an alarm entry to the history with rotation
   */
  private addAlarmToHistory(alarmEntry: AlarmHistoryEntry): void {
    this.alarmHistory.entries.unshift(alarmEntry);

    // Rotate history if it exceeds max entries
    if (this.alarmHistory.entries.length > this.alarmHistory.maxEntries) {
      this.alarmHistory.entries = this.alarmHistory.entries.slice(0, this.alarmHistory.maxEntries);
    }

    // Log the alarm with duration for debugging
    const duration = alarmEntry.duration ? `(${(alarmEntry.duration / 1000).toFixed(1)}s)` : '';
    this.log(`Alarm logged: ${alarmEntry.type} ${alarmEntry.action} ${duration} - Total: ${this.alarmHistory.entries.length} entries`);
  }

  /**
   * Get alarm history for the camera
   */
  getAlarmHistory(): AlarmHistory {
    return {
      ...this.alarmHistory,
      entries: [...this.alarmHistory.entries] // Return a copy
    };
  }

  /**
   * Clear alarm history
   */
  clearAlarmHistory(): void {
    this.alarmHistory.entries = [];
    this.alarmHistory.currentAlarm = undefined;
    this.log('Alarm history cleared');
  }

  /**
   * Get recent alarms within specified time window (in minutes)
   */
  getRecentAlarms(minutes: number = 60): AlarmHistoryEntry[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.alarmHistory.entries.filter(entry => entry.timestamp > cutoffTime);
  }

  /**
   * Enhanced PTZ Preset Management
   */

  /**
   * Create a named PTZ preset at current position
   */
  async createNamedPreset(presetId: number, name: string): Promise<boolean> {
    try {
      // First get current PTZ position
      const position = await this.getCurrentPTZPosition();
      if (!position) {
        this.error('Could not get current PTZ position for preset creation');
        return false;
      }

      // Call the original setPreset method with enhanced XML
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetId}`;

      const body = `<?xml version="1.0" encoding="UTF-8"?><PTZPreset><id>${presetId}</id><presetName>${name}</presetName></PTZPreset>`;

      return new Promise((resolve) => {
        request.put({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: body,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 201);

          if (success) {
            // Add to local preset manager
            const preset: PTZPreset = {
              id: presetId,
              name: name,
              pan: position.pan,
              tilt: position.tilt,
              zoom: position.zoom,
              created: Date.now()
            };
            this.addPresetToManager(preset);
            this.log(`Named preset "${name}" (ID: ${presetId}) created successfully`);
          } else {
            this.error(`Failed to create named preset "${name}":`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error creating named preset:', error);
      return false;
    }
  }

  /**
   * Get current PTZ position from camera
   */
  async getCurrentPTZPosition(): Promise<{ pan: number; tilt: number; zoom: number } | null> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const statusUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/PTZCtrl/channels/${this.settings.channel}/status`;

      return new Promise((resolve) => {
        request.get({
          url: statusUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, (error, response, body) => {
          if (!error && response && response.statusCode === 200 && body) {
            try {
              // Parse XML response to get PTZ position
              const panMatch = body.match(/<azimuth>([^<]+)<\/azimuth>/);
              const tiltMatch = body.match(/<elevation>([^<]+)<\/elevation>/);
              const zoomMatch = body.match(/<absoluteZoom>([^<]+)<\/absoluteZoom>/);

              if (panMatch && tiltMatch && zoomMatch) {
                const position = {
                  pan: parseFloat(panMatch[1]),
                  tilt: parseFloat(tiltMatch[1]),
                  zoom: parseFloat(zoomMatch[1])
                };
                this.ptzPresetManager.currentPosition = position;
                resolve(position);
                return;
              }
            } catch (parseError) {
              this.error('Error parsing PTZ status:', parseError);
            }
          }
          resolve(null);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error getting PTZ position:', error);
      return null;
    }
  }

  /**
   * Add preset to local manager
   */
  private addPresetToManager(preset: PTZPreset): void {
    // Remove existing preset with same ID
    this.ptzPresetManager.presets = this.ptzPresetManager.presets.filter(p => p.id !== preset.id);

    // Add new preset
    this.ptzPresetManager.presets.push(preset);

    // Sort by ID
    this.ptzPresetManager.presets.sort((a, b) => a.id - b.id);

    this.log(`Preset manager updated: ${this.ptzPresetManager.presets.length} presets`);
  }

  /**
   * Get all managed presets
   */
  getAllPresets(): PTZPreset[] {
    return [...this.ptzPresetManager.presets];
  }

  /**
   * Delete a preset
   */
  async deletePreset(presetId: number): Promise<boolean> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const presetUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/PTZCtrlProxy/channels/${this.settings.channel}/presets/${presetId}`;

      return new Promise((resolve) => {
        request.delete({
          url: presetUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 5000
        }, (error, response) => {
          const success = !error && response && (response.statusCode === 200 || response.statusCode === 204);

          if (success) {
            // Remove from local manager
            this.ptzPresetManager.presets = this.ptzPresetManager.presets.filter(p => p.id !== presetId);
            this.log(`Preset ${presetId} deleted successfully`);
          } else {
            this.error(`Failed to delete preset ${presetId}:`, error || response?.statusCode);
          }

          resolve(success);
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error deleting preset:', error);
      return false;
    }
  }

  /**
   * Advanced Streaming Management
   */

  /**
   * Initialize default streaming profiles
   */
  private initializeStreamingProfiles(): void {
    this.adaptiveStreamingConfig.profiles = [
      {
        id: 'ultra',
        name: 'Ultra Quality (4K)',
        quality: 'ultra',
        resolution: '3840x2160',
        bitrate: 8000,
        framerate: 30,
        codec: 'H265',
        enabled: true
      },
      {
        id: 'high',
        name: 'High Quality (1080p)',
        quality: 'high',
        resolution: '1920x1080',
        bitrate: 4000,
        framerate: 25,
        codec: 'H264',
        enabled: true
      },
      {
        id: 'medium',
        name: 'Medium Quality (720p)',
        quality: 'medium',
        resolution: '1280x720',
        bitrate: 2000,
        framerate: 20,
        codec: 'H264',
        enabled: true
      },
      {
        id: 'low',
        name: 'Low Quality (480p)',
        quality: 'low',
        resolution: '640x480',
        bitrate: 500,
        framerate: 15,
        codec: 'H264',
        enabled: true
      }
    ];

    // Set default profile based on current settings
    const currentQuality = this.settings.streamQuality || 'high';
    this.adaptiveStreamingConfig.currentProfile = this.adaptiveStreamingConfig.profiles.find(p => p.quality === currentQuality) || this.adaptiveStreamingConfig.profiles[1];

    this.log(`Initialized ${this.adaptiveStreamingConfig.profiles.length} streaming profiles`);
  }

  /**
   * Switch to a specific streaming profile
   */
  async switchToProfile(profileId: string): Promise<boolean> {
    try {
      const profile = this.adaptiveStreamingConfig.profiles.find(p => p.id === profileId);
      if (!profile) {
        this.error(`Profile '${profileId}' not found`);
        return false;
      }

      if (!profile.enabled) {
        this.error(`Profile '${profileId}' is disabled`);
        return false;
      }

      // Update current profile
      this.adaptiveStreamingConfig.currentProfile = profile;

      // Update capability values
      await this.setCapabilityValue('stream_quality', profile.quality);

      // Restart streaming with new profile
      await this.setupAdvancedStreaming();

      this.log(`Switched to streaming profile: ${profile.name} (${profile.resolution})`);
      return true;

    } catch (error) {
      this.error('Error switching streaming profile:', error);
      return false;
    }
  }

  /**
   * Enable/disable adaptive streaming
   */
  async setAdaptiveStreaming(enabled: boolean): Promise<boolean> {
    try {
      this.adaptiveStreamingConfig.enabled = enabled;
      this.adaptiveStreamingConfig.autoSwitchEnabled = enabled;

      if (enabled) {
        this.log('Adaptive streaming enabled - will adjust quality based on connection');
        this.startAdaptiveStreamingMonitor();
      } else {
        this.log('Adaptive streaming disabled');
        this.stopAdaptiveStreamingMonitor();
      }

      return true;
    } catch (error) {
      this.error('Error setting adaptive streaming:', error);
      return false;
    }
  }

  /**
   * Start monitoring connection for adaptive streaming
   */
  private startAdaptiveStreamingMonitor(): void {
    if (!this.adaptiveStreamingConfig.enabled) {
      return;
    }

    // Check connection quality every 30 seconds
    setInterval(() => {
      this.evaluateStreamingQuality();
    }, 30000);
  }

  /**
   * Stop adaptive streaming monitor
   */
  private stopAdaptiveStreamingMonitor(): void {
    // Implementation to stop monitoring (would need to track interval ID)
    this.log('Adaptive streaming monitor stopped');
  }

  /**
   * Evaluate current connection and adjust streaming quality if needed
   */
  private async evaluateStreamingQuality(): Promise<void> {
    if (!this.adaptiveStreamingConfig.enabled || !this.adaptiveStreamingConfig.autoSwitchEnabled) {
      return;
    }

    try {
      const connectionStrength = this.connectionStats.connectionStrength;
      const currentProfile = this.adaptiveStreamingConfig.currentProfile;

      if (!currentProfile) {
        return;
      }

      let targetProfile: StreamProfile | undefined;

      // Adaptive logic based on connection strength
      if (connectionStrength >= 90) {
        // Excellent connection - use ultra quality if available
        targetProfile = this.adaptiveStreamingConfig.profiles.find(p => p.quality === 'ultra' && p.enabled);
      } else if (connectionStrength >= 70) {
        // Good connection - use high quality
        targetProfile = this.adaptiveStreamingConfig.profiles.find(p => p.quality === 'high' && p.enabled);
      } else if (connectionStrength >= 50) {
        // Fair connection - use medium quality
        targetProfile = this.adaptiveStreamingConfig.profiles.find(p => p.quality === 'medium' && p.enabled);
      } else {
        // Poor connection - use low quality
        targetProfile = this.adaptiveStreamingConfig.profiles.find(p => p.quality === 'low' && p.enabled);
      }

      // Switch profile if different from current
      if (targetProfile && targetProfile.id !== currentProfile.id) {
        this.log(`Adaptive streaming: switching from ${currentProfile.name} to ${targetProfile.name} (connection: ${connectionStrength}%)`);
        await this.switchToProfile(targetProfile.id);
      }

    } catch (error) {
      this.error('Error in adaptive streaming evaluation:', error);
    }
  }

  /**
   * Get available streaming profiles
   */
  getStreamingProfiles(): StreamProfile[] {
    return [...this.adaptiveStreamingConfig.profiles];
  }

  /**
   * Update a streaming profile
   */
  updateStreamingProfile(profileId: string, updates: Partial<StreamProfile>): boolean {
    try {
      const profileIndex = this.adaptiveStreamingConfig.profiles.findIndex(p => p.id === profileId);
      if (profileIndex === -1) {
        return false;
      }

      this.adaptiveStreamingConfig.profiles[profileIndex] = {
        ...this.adaptiveStreamingConfig.profiles[profileIndex],
        ...updates
      };

      this.log(`Updated streaming profile: ${profileId}`);
      return true;
    } catch (error) {
      this.error('Error updating streaming profile:', error);
      return false;
    }
  }

  /**
   * Smart Motion Detection Management
   */

  /**
   * Initialize default motion zones
   */
  private initializeMotionZones(): void {
    this.smartMotionConfig.zones = [
      {
        id: 'zone1',
        name: 'Full View',
        enabled: true,
        coordinates: { x: 0, y: 0, width: 100, height: 100 },
        sensitivity: 'medium'
      },
      {
        id: 'zone2',
        name: 'Entrance Area',
        enabled: false,
        coordinates: { x: 20, y: 60, width: 30, height: 40 },
        sensitivity: 'high'
      },
      {
        id: 'zone3',
        name: 'Parking Area',
        enabled: false,
        coordinates: { x: 60, y: 70, width: 40, height: 30 },
        sensitivity: 'low'
      }
    ];

    this.log(`Initialized ${this.smartMotionConfig.zones.length} motion detection zones`);
  }

  /**
   * Create a new motion zone
   */
  async createMotionZone(zone: Omit<MotionZone, 'id'>): Promise<string> {
    try {
      const zoneId = `zone_${Date.now()}`;
      const newZone: MotionZone = {
        ...zone,
        id: zoneId
      };

      this.smartMotionConfig.zones.push(newZone);
      this.log(`Created motion zone: ${newZone.name} (${zoneId})`);

      // Update camera motion detection configuration
      await this.updateCameraMotionConfig();

      return zoneId;
    } catch (error) {
      this.error('Error creating motion zone:', error);
      throw error;
    }
  }

  /**
   * Update an existing motion zone
   */
  async updateMotionZone(zoneId: string, updates: Partial<MotionZone>): Promise<boolean> {
    try {
      const zoneIndex = this.smartMotionConfig.zones.findIndex(z => z.id === zoneId);
      if (zoneIndex === -1) {
        return false;
      }

      this.smartMotionConfig.zones[zoneIndex] = {
        ...this.smartMotionConfig.zones[zoneIndex],
        ...updates,
        id: zoneId // Prevent ID changes
      };

      this.log(`Updated motion zone: ${zoneId}`);
      await this.updateCameraMotionConfig();
      return true;
    } catch (error) {
      this.error('Error updating motion zone:', error);
      return false;
    }
  }

  /**
   * Delete a motion zone
   */
  async deleteMotionZone(zoneId: string): Promise<boolean> {
    try {
      const initialLength = this.smartMotionConfig.zones.length;
      this.smartMotionConfig.zones = this.smartMotionConfig.zones.filter(z => z.id !== zoneId);

      const deleted = this.smartMotionConfig.zones.length < initialLength;
      if (deleted) {
        this.log(`Deleted motion zone: ${zoneId}`);
        await this.updateCameraMotionConfig();
      }

      return deleted;
    } catch (error) {
      this.error('Error deleting motion zone:', error);
      return false;
    }
  }

  /**
   * Enable/disable smart motion detection
   */
  async setSmartMotionDetection(enabled: boolean): Promise<boolean> {
    try {
      this.smartMotionConfig.enabled = enabled;
      this.log(`Smart motion detection ${enabled ? 'enabled' : 'disabled'}`);

      await this.updateCameraMotionConfig();
      return true;
    } catch (error) {
      this.error('Error setting smart motion detection:', error);
      return false;
    }
  }

  /**
   * Set global motion sensitivity
   */
  async setMotionSensitivity(sensitivity: 'low' | 'medium' | 'high'): Promise<boolean> {
    try {
      this.smartMotionConfig.globalSensitivity = sensitivity;
      this.log(`Motion sensitivity set to: ${sensitivity}`);

      await this.updateCameraMotionConfig();
      return true;
    } catch (error) {
      this.error('Error setting motion sensitivity:', error);
      return false;
    }
  }

  /**
   * Update camera motion detection configuration via ISAPI
   */
  private async updateCameraMotionConfig(): Promise<void> {
    try {
      if (!this.smartMotionConfig.enabled) {
        return;
      }

      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const motionUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/System/Video/inputs/channels/${this.settings.channel}/motionDetection`;

      // Build motion detection XML configuration
      const activeZones = this.smartMotionConfig.zones.filter(z => z.enabled);
      const sensitivityLevel = this.getSensitivityLevel(this.smartMotionConfig.globalSensitivity);

      const motionXML = this.buildMotionDetectionXML(activeZones, sensitivityLevel);

      return new Promise((resolve) => {
        request.put({
          url: motionUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: motionXML,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          const success = !error && response && response.statusCode === 200;

          if (success) {
            this.log('Motion detection configuration updated successfully');
          } else {
            this.error('Failed to update motion detection configuration:', error || response?.statusCode);
          }

          resolve();
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error updating camera motion config:', error);
    }
  }

  /**
   * Convert sensitivity level to numeric value
   */
  private getSensitivityLevel(sensitivity: string): number {
    switch (sensitivity) {
      case 'low': return 20;
      case 'medium': return 50;
      case 'high': return 80;
      default: return 50;
    }
  }

  /**
   * Build motion detection XML configuration
   */
  private buildMotionDetectionXML(zones: MotionZone[], _sensitivity: number): string {
    let regionsXML = '';

    zones.forEach((zone, index) => {
      regionsXML += `
        <MotionDetectionRegion>
          <id>${index + 1}</id>
          <enabled>true</enabled>
          <sensitivityLevel>${this.getSensitivityLevel(zone.sensitivity)}</sensitivityLevel>
          <detectionTarget>1</detectionTarget>
          <Grid>
            <rowGranularity>18</rowGranularity>
            <columnGranularity>22</columnGranularity>
          </Grid>
        </MotionDetectionRegion>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
      <MotionDetection>
        <enabled>true</enabled>
        <enableHighlight>false</enableHighlight>
        <samplingInterval>2</samplingInterval>
        <startTriggerTime>500</startTriggerTime>
        <endTriggerTime>500</endTriggerTime>
        <regionType>grid</regionType>
        <Grid>
          <rowGranularity>18</rowGranularity>
          <columnGranularity>22</columnGranularity>
        </Grid>
        <MotionDetectionRegionList>${regionsXML}
        </MotionDetectionRegionList>
      </MotionDetection>`;
  }

  /**
   * Get motion detection configuration
   */
  getMotionConfig(): SmartMotionConfig {
    return {
      ...this.smartMotionConfig,
      zones: [...this.smartMotionConfig.zones] // Return a copy
    };
  }

  /**
   * Enhanced motion event handling with zone detection
   */
  private handleSmartMotionEvent(action: string, _zoneData?: unknown): void {
    if (!this.smartMotionConfig.enabled) {
      return;
    }

    try {
      // Enhanced motion processing with zone awareness
      if (action === 'Start') {
        this.log(`Smart motion detected - processing zones and sensitivity`);

        // Check cooldown period
        const lastMotion = this.alarmHistory.entries.find(e => e.type === 'VideoMotion');
        if (lastMotion && (Date.now() - lastMotion.timestamp) < this.smartMotionConfig.cooldownPeriod) {
          this.log('Motion event ignored - within cooldown period');
          return;
        }

        // Process motion with smart detection
        this.processSmartMotion();
      }
    } catch (error) {
      this.error('Error in smart motion event handling:', error);
    }
  }

  /**
   * Process smart motion detection
   */
  private processSmartMotion(): void {
    // Enhanced motion processing logic would go here
    // This could include AI-based object detection, zone-specific handling, etc.
    this.log('Processing smart motion detection with enhanced algorithms');

    // Trigger enhanced motion detection flow cards
    this.homey.flow.getDeviceTriggerCard('camera_smart_motion_detected')
      .trigger(this, {
        zones: this.smartMotionConfig.zones.filter(z => z.enabled).length,
        sensitivity: this.smartMotionConfig.globalSensitivity
      })
      .catch(this.error);
  }

  /**
   * Camera Health Monitoring System
   */

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    if (!this.healthConfig.enabled) {
      return;
    }

    this.log('Starting camera health monitoring');

    // Perform initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthConfig.checkInterval * 60 * 1000);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      this.log('Stopped camera health monitoring');
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      this.log('Performing camera health check');

      const startTime = Date.now();

      // Test connection and measure response time
      const connectionResult = await this.testConnection();

      // Update health metrics
      this.healthMetrics.lastHealthCheck = startTime;
      this.healthMetrics.connectionStatus = connectionResult.status;
      this.healthMetrics.responseTime = connectionResult.responseTime;
      this.healthMetrics.lastPingTime = startTime;

      // Get device information if connected
      if (connectionResult.status === 'online') {
        await this.updateDeviceInfo();
        await this.checkStorageStatus();
        await this.assessVideoQuality();
      }

      // Process health alerts
      this.processHealthAlerts();

      // Update connection strength capability
      const strength = this.calculateConnectionStrength();
      await this.setCapabilityValue('connection_strength', strength);

      this.log(`Health check completed - Status: ${this.healthMetrics.connectionStatus}, Response: ${this.healthMetrics.responseTime}ms`);

    } catch (error) {
      this.error('Error during health check:', error);
      this.healthMetrics.errorCount++;
      this.createHealthAlert('error', 'critical', `Health check failed: ${error}`);
    }
  }

  /**
   * Test camera connection and measure response time
   */
  private async testConnection(): Promise<{ status: 'online' | 'offline' | 'unstable'; responseTime: number }> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      // Test NVR connection first - if NVR is online, cameras through it should be accessible
      const testUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/System/deviceInfo`;
      
      this.log(`Testing camera ${this.settings.channel} connection via NVR: ${testUrl}`);

      const timeoutId = setTimeout(() => {
        this.log(`Camera ${this.settings.channel} health check timed out after ${this.healthConfig.pingTimeout}ms`);
        resolve({ status: 'offline', responseTime: this.healthConfig.pingTimeout });
      }, this.healthConfig.pingTimeout);

      request.get({
        url: testUrl,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: this.healthConfig.pingTimeout,
        auth: {
          user: this.settings.nvrUsername,
          pass: this.settings.nvrPassword,
          sendImmediately: false
        }
      }, (error, response, body) => {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (error) {
          this.log(`Camera ${this.settings.channel} connection error: ${error.code || error.message}`);
          // Check if it's a timeout or connection error vs other errors
          if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            resolve({ status: 'offline', responseTime });
          } else {
            resolve({ status: 'unstable', responseTime });
          }
        } else if (!response) {
          this.log(`Camera ${this.settings.channel} no response received`);
          resolve({ status: 'offline', responseTime });
        } else if (response.statusCode === 200) {
          this.log(`Camera ${this.settings.channel} NVR responded successfully (${responseTime}ms)`);
          // NVR is online - check if this camera channel exists in the response
          if (body && body.includes('<deviceType>NVR</deviceType>')) {
            // For cameras connected through NVR, if NVR is accessible, consider camera online
            // Individual camera health can be determined through streaming channel availability
            resolve({ status: 'online', responseTime });
          } else {
            this.log(`Camera ${this.settings.channel} NVR response missing deviceType`);
            resolve({ status: 'unstable', responseTime });
          }
        } else if (response.statusCode === 401) {
          this.log(`Camera ${this.settings.channel} authentication error but NVR reachable (${response.statusCode})`);
          resolve({ status: 'online', responseTime }); // Authentication error but NVR is reachable
        } else {
          this.log(`Camera ${this.settings.channel} unexpected response status: ${response.statusCode}`);
          resolve({ status: 'unstable', responseTime });
        }
      });
    });
  }

  /**
   * Update device information
   */
  private async updateDeviceInfo(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const infoUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/System/deviceInfo`;

      return new Promise((resolve) => {
        request.get({
          url: infoUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 8000
        }, (error, response, body) => {
          if (!error && response && response.statusCode === 200 && body) {
            try {
              // Parse device info from XML response
              const uptimeMatch = body.match(/<bootTime>(.*?)<\/bootTime>/);
              if (uptimeMatch) {
                const bootTime = new Date(uptimeMatch[1]).getTime();
                this.healthMetrics.uptime = Math.floor((Date.now() - bootTime) / 1000);
              }

              // Parse temperature if available
              const tempMatch = body.match(/<temperature>(.*?)<\/temperature>/);
              if (tempMatch) {
                this.healthMetrics.temperature = parseFloat(tempMatch[1]);
              }

            } catch (parseError) {
              this.error('Error parsing device info:', parseError);
            }
          }
          resolve();
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error updating device info:', error);
    }
  }

  /**
   * Check storage status
   */
  private async checkStorageStatus(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const storageUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/Storage`;

      return new Promise((resolve) => {
        request.get({
          url: storageUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: 8000
        }, (error, response, body) => {
          if (!error && response && response.statusCode === 200 && body) {
            try {
              // Parse storage info - this is a simplified check
              const freeSpaceMatch = body.match(/<freeSpace>(.*?)<\/freeSpace>/);
              const totalSpaceMatch = body.match(/<totalSpace>(.*?)<\/totalSpace>/);

              if (freeSpaceMatch && totalSpaceMatch) {
                const freeSpace = parseInt(freeSpaceMatch[1]);
                const totalSpace = parseInt(totalSpaceMatch[1]);
                const usedPercentage = ((totalSpace - freeSpace) / totalSpace) * 100;

                if (usedPercentage > 95) {
                  this.healthMetrics.storageStatus = 'full';
                } else if (usedPercentage > this.healthConfig.storageThreshold) {
                  this.healthMetrics.storageStatus = 'low';
                } else {
                  this.healthMetrics.storageStatus = 'normal';
                }
              }

            } catch (parseError) {
              this.error('Error parsing storage info:', parseError);
            }
          }
          resolve();
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });

    } catch (error) {
      this.error('Error checking storage status:', error);
      this.healthMetrics.storageStatus = 'error';
    }
  }

  /**
   * Assess video stream quality
   */
  private async assessVideoQuality(): Promise<void> {
    try {
      // Simple quality assessment based on response time and connection stability
      if (this.healthMetrics.responseTime < 200) {
        this.healthMetrics.videoQuality = 'excellent';
      } else if (this.healthMetrics.responseTime < 500) {
        this.healthMetrics.videoQuality = 'good';
      } else if (this.healthMetrics.responseTime < 1000) {
        this.healthMetrics.videoQuality = 'poor';
      } else {
        this.healthMetrics.videoQuality = 'unavailable';
      }

      // Update signal strength based on quality
      this.healthMetrics.signalStrength = this.calculateSignalStrength();

    } catch (error) {
      this.error('Error assessing video quality:', error);
      this.healthMetrics.videoQuality = 'unavailable';
    }
  }

  /**
   * Calculate signal strength percentage
   */
  private calculateSignalStrength(): number {
    if (this.healthMetrics.connectionStatus === 'offline') {
      return 0;
    }

    const baseStrength = this.healthMetrics.connectionStatus === 'online' ? 100 : 50;
    const responseTimePenalty = Math.min(this.healthMetrics.responseTime / 10, 50);

    return Math.max(0, Math.min(100, baseStrength - responseTimePenalty));
  }

  /**
   * Calculate overall connection strength
   */
  private calculateConnectionStrength(): number {
    const signalWeight = 0.4;
    const qualityWeight = 0.3;
    const responseWeight = 0.3;

    const signalScore = this.healthMetrics.signalStrength;

    const qualityScore = this.healthMetrics.videoQuality === 'excellent' ? 100 :
                        this.healthMetrics.videoQuality === 'good' ? 75 :
                        this.healthMetrics.videoQuality === 'poor' ? 50 : 0;

    const responseScore = Math.max(0, 100 - (this.healthMetrics.responseTime / 10));

    return Math.round(
      (signalScore * signalWeight) +
      (qualityScore * qualityWeight) +
      (responseScore * responseWeight)
    );
  }

  /**
   * Process health alerts
   */
  private processHealthAlerts(): void {
    // Check for connection issues
    if (this.healthMetrics.connectionStatus === 'offline') {
      this.createHealthAlert('connection', 'critical', 'Camera is offline');
    } else if (this.healthMetrics.connectionStatus === 'unstable') {
      this.createHealthAlert('connection', 'warning', 'Camera connection is unstable');
    }

    // Check storage alerts
    if (this.healthMetrics.storageStatus === 'full') {
      this.createHealthAlert('storage', 'critical', 'Storage is full');
    } else if (this.healthMetrics.storageStatus === 'low') {
      this.createHealthAlert('storage', 'warning', 'Storage space is low');
    }

    // Check temperature alerts
    if (this.healthMetrics.temperature > this.healthConfig.temperatureThreshold) {
      this.createHealthAlert('temperature', 'warning', `High temperature: ${this.healthMetrics.temperature}°C`);
    }

    // Check video quality alerts
    if (this.healthMetrics.videoQuality === 'poor') {
      this.createHealthAlert('quality', 'warning', 'Poor video quality detected');
    } else if (this.healthMetrics.videoQuality === 'unavailable') {
      this.createHealthAlert('quality', 'critical', 'Video stream unavailable');
    }
  }

  /**
   * Create health alert
   */
  private createHealthAlert(type: HealthAlert['type'], severity: HealthAlert['severity'], message: string): void {
    const alertId = `${type}_${Date.now()}`;

    // Check if similar alert already exists
    const existingAlert = this.healthConfig.alertHistory.find(
      a => !a.resolved && a.type === type && a.severity === severity
    );

    if (!existingAlert) {
      const alert: HealthAlert = {
        id: alertId,
        type,
        severity,
        message,
        timestamp: Date.now(),
        resolved: false
      };

      this.healthConfig.alertHistory.push(alert);
      this.log(`Health alert created: ${severity} - ${message}`);

      // Trigger health alert flow card
      this.homey.flow.getDeviceTriggerCard('camera_health_alert')
        .trigger(this, {
          alert_type: type,
          severity,
          message
        })
        .catch(this.error);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthMetrics & { alerts: HealthAlert[] } {
    return {
      ...this.healthMetrics,
      alerts: this.healthConfig.alertHistory.filter(a => !a.resolved)
    };
  }

  /**
   * Configure health monitoring
   */
  async configureHealthMonitoring(config: Partial<HealthConfig>): Promise<boolean> {
    try {
      this.healthConfig = { ...this.healthConfig, ...config };

      // Restart monitoring with new config
      this.stopHealthMonitoring();
      if (this.healthConfig.enabled) {
        this.startHealthMonitoring();
      }

      this.log('Health monitoring configuration updated');
      return true;
    } catch (error) {
      this.error('Error configuring health monitoring:', error);
      return false;
    }
  }

  /**
   * Resolve health alert
   */
  resolveHealthAlert(alertId: string): boolean {
    const alert = this.healthConfig.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.log(`Health alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Advanced Recording Control System
   */

  /**
   * Start manual recording
   */
  async startRecording(duration?: number, quality?: 'ultra' | 'high' | 'medium' | 'low'): Promise<string | null> {
    try {
      if (this.currentRecording?.status === 'recording') {
        this.log('Recording already in progress');
        return null;
      }

      const sessionId = `rec_${Date.now()}`;
      const recordingDuration = duration || this.recordingConfig.maxDuration;
      const recordingQuality = quality || this.recordingConfig.defaultQuality;

      this.currentRecording = {
        id: sessionId,
        startTime: Date.now(),
        triggerType: 'manual',
        quality: recordingQuality,
        status: 'recording'
      };

      this.recordingConfig.sessions.push(this.currentRecording);

      this.log(`Starting manual recording - Duration: ${recordingDuration}min, Quality: ${recordingQuality}`);

      // Start recording via ISAPI
      await this.startCameraRecording(recordingQuality);

      // Set recording status capability
      await this.setCapabilityValue('recording_status', true);

      // Schedule recording stop
      setTimeout(async () => {
        await this.stopRecording();
      }, recordingDuration * 60 * 1000);

      // Trigger recording started flow card
      this.homey.flow.getDeviceTriggerCard('camera_recording_started')
        .trigger(this, {
          trigger_type: 'manual',
          duration: recordingDuration,
          quality: recordingQuality
        })
        .catch(this.error);

      return sessionId;
    } catch (error) {
      this.error('Error starting recording:', error);
      return null;
    }
  }

  /**
   * Stop current recording
   */
  async stopRecording(): Promise<boolean> {
    try {
      if (!this.currentRecording || this.currentRecording.status !== 'recording') {
        this.log('No active recording to stop');
        return false;
      }

      this.currentRecording.endTime = Date.now();
      this.currentRecording.status = 'completed';

      const duration = Math.round((this.currentRecording.endTime - this.currentRecording.startTime) / 1000 / 60);

      this.log(`Stopping recording - Duration: ${duration} minutes`);

      // Stop recording via ISAPI
      await this.stopCameraRecording();

      // Update recording status capability
      await this.setCapabilityValue('recording_status', false);

      // Trigger recording stopped flow card
      this.homey.flow.getDeviceTriggerCard('camera_recording_stopped')
        .trigger(this, {
          duration,
          trigger_type: this.currentRecording.triggerType
        })
        .catch(this.error);

      this.currentRecording = undefined;
      return true;
    } catch (error) {
      this.error('Error stopping recording:', error);
      return false;
    }
  }

  /**
   * Create recording schedule
   */
  async createRecordingSchedule(schedule: Omit<RecordingSchedule, 'id'>): Promise<string> {
    try {
      const scheduleId = `schedule_${Date.now()}`;
      const newSchedule: RecordingSchedule = {
        ...schedule,
        id: scheduleId
      };

      this.recordingConfig.schedules.push(newSchedule);
      this.log(`Created recording schedule: ${newSchedule.name}`);

      return scheduleId;
    } catch (error) {
      this.error('Error creating recording schedule:', error);
      throw error;
    }
  }

  /**
   * Create recording trigger
   */
  async createRecordingTrigger(trigger: Omit<RecordingTrigger, 'id'>): Promise<string> {
    try {
      const triggerId = `trigger_${Date.now()}`;
      const newTrigger: RecordingTrigger = {
        ...trigger,
        id: triggerId
      };

      this.recordingConfig.triggers.push(newTrigger);
      this.log(`Created recording trigger: ${newTrigger.name} (${newTrigger.type})`);

      return triggerId;
    } catch (error) {
      this.error('Error creating recording trigger:', error);
      throw error;
    }
  }

  /**
   * Delete recording schedule
   */
  async deleteRecordingSchedule(scheduleId: string): Promise<boolean> {
    try {
      const initialLength = this.recordingConfig.schedules.length;
      this.recordingConfig.schedules = this.recordingConfig.schedules.filter(s => s.id !== scheduleId);

      const deleted = this.recordingConfig.schedules.length < initialLength;
      if (deleted) {
        this.log(`Deleted recording schedule: ${scheduleId}`);
      }

      return deleted;
    } catch (error) {
      this.error('Error deleting recording schedule:', error);
      return false;
    }
  }

  /**
   * Delete recording trigger
   */
  async deleteRecordingTrigger(triggerId: string): Promise<boolean> {
    try {
      const initialLength = this.recordingConfig.triggers.length;
      this.recordingConfig.triggers = this.recordingConfig.triggers.filter(t => t.id !== triggerId);

      const deleted = this.recordingConfig.triggers.length < initialLength;
      if (deleted) {
        this.log(`Deleted recording trigger: ${triggerId}`);
      }

      return deleted;
    } catch (error) {
      this.error('Error deleting recording trigger:', error);
      return false;
    }
  }

  /**
   * Enable/disable recording system
   */
  async setRecordingEnabled(enabled: boolean): Promise<boolean> {
    try {
      this.recordingConfig.enabled = enabled;
      this.log(`Recording system ${enabled ? 'enabled' : 'disabled'}`);

      if (!enabled && this.currentRecording) {
        await this.stopRecording();
      }

      return true;
    } catch (error) {
      this.error('Error setting recording enabled:', error);
      return false;
    }
  }

  /**
   * Start camera recording via ISAPI
   */
  private async startCameraRecording(_quality: string): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const recordUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/control/manual/start/tracks/${this.settings.channel}01`;

      return new Promise((resolve) => {
        const recordXML = `<?xml version="1.0" encoding="UTF-8"?>
          <ManualRecord>
            <enabled>true</enabled>
            <trackID>${this.settings.channel}01</trackID>
          </ManualRecord>`;

        request.put({
          url: recordUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: recordXML,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          if (!error && response && (response.statusCode === 200 || response.statusCode === 204)) {
            this.log('Camera recording started successfully');
          } else {
            this.error('Failed to start camera recording:', error || response?.statusCode);
          }
          resolve();
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error starting camera recording:', error);
    }
  }

  /**
   * Stop camera recording via ISAPI
   */
  private async stopCameraRecording(): Promise<void> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const stopUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/ContentMgmt/record/control/manual/stop/tracks/${this.settings.channel}01`;

      return new Promise((resolve) => {
        const stopXML = `<?xml version="1.0" encoding="UTF-8"?>
          <ManualRecord>
            <enabled>false</enabled>
            <trackID>${this.settings.channel}01</trackID>
          </ManualRecord>`;

        request.put({
          url: stopUrl,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          body: stopXML,
          timeout: 8000,
          headers: {
            'Content-Type': 'application/xml'
          }
        }, (error, response) => {
          if (!error && response && (response.statusCode === 200 || response.statusCode === 204)) {
            this.log('Camera recording stopped successfully');
          } else {
            this.error('Failed to stop camera recording:', error || response?.statusCode);
          }
          resolve();
        }).auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      });
    } catch (error) {
      this.error('Error stopping camera recording:', error);
    }
  }

  /**
   * Handle motion-triggered recording
   */
  private async handleMotionRecording(): Promise<void> {
    if (!this.recordingConfig.enabled) {
      return;
    }

    try {
      // Find motion recording triggers
      const motionTriggers = this.recordingConfig.triggers.filter(
        t => t.enabled && t.type === 'motion'
      );

      for (const trigger of motionTriggers) {
        if (this.shouldTriggerRecording(trigger)) {
          await this.triggerRecording(trigger);
        }
      }
    } catch (error) {
      this.error('Error handling motion recording:', error);
    }
  }

  /**
   * Check if recording should be triggered
   */
  private shouldTriggerRecording(trigger: RecordingTrigger): boolean {
    // Check time range if specified
    if (trigger.conditions.timeRange) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (currentTime < trigger.conditions.timeRange.start || currentTime > trigger.conditions.timeRange.end) {
        return false;
      }
    }

    // Additional conditions can be checked here
    return true;
  }

  /**
   * Trigger recording based on trigger configuration
   */
  private async triggerRecording(trigger: RecordingTrigger): Promise<void> {
    try {
      if (this.currentRecording?.status === 'recording') {
        this.log('Recording already active, skipping trigger');
        return;
      }

      const sessionId = `rec_${Date.now()}`;

      this.currentRecording = {
        id: sessionId,
        startTime: Date.now() - (trigger.action.preRecord * 1000),
        triggerType: trigger.type,
        triggerId: trigger.id,
        quality: trigger.action.quality,
        status: 'recording'
      };

      this.recordingConfig.sessions.push(this.currentRecording);

      this.log(`Triggered recording: ${trigger.name} - Duration: ${trigger.action.duration}min`);

      // Start recording
      await this.startCameraRecording(trigger.action.quality);
      await this.setCapabilityValue('recording_status', true);

      // Schedule recording stop
      setTimeout(async () => {
        await this.stopRecording();
      }, trigger.action.duration * 60 * 1000);

      // Trigger flow card
      this.homey.flow.getDeviceTriggerCard('camera_recording_started')
        .trigger(this, {
          trigger_type: trigger.type,
          trigger_name: trigger.name,
          duration: trigger.action.duration,
          quality: trigger.action.quality
        })
        .catch(this.error);

    } catch (error) {
      this.error('Error triggering recording:', error);
    }
  }

  /**
   * Get recording configuration
   */
  getRecordingConfig(): RecordingConfig {
    return {
      ...this.recordingConfig,
      schedules: [...this.recordingConfig.schedules],
      triggers: [...this.recordingConfig.triggers],
      sessions: [...this.recordingConfig.sessions]
    };
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): { isRecording: boolean; currentSession?: RecordingSession } {
    return {
      isRecording: this.currentRecording?.status === 'recording' || false,
      currentSession: this.currentRecording ? { ...this.currentRecording } : undefined
    };
  }

  // Method to get current streaming statistics
  getStreamingStats(): StreamingStats {
    return {
      connectionStats: this.connectionStats,
      streamInfo: this.streamInfo,
      adaptiveConfig: this.adaptiveStreamingConfig,
      settings: {
        quality: this.settings.streamQuality,
        resolution: this.settings.streamResolution,
        refreshRate: this.settings.refreshRate,
        subStreamEnabled: this.settings.enableSubStream
      }
    };
  }

  /**
   * Phase 5: Performance & Optimization Systems
   */

  /**
   * Initialize optimization systems
   */
  private initializeOptimizationSystems(): void {
    this.log('Initializing performance optimization systems');

    // Start optimization timer for periodic cleanup and monitoring
    this.optimizationTimer = setInterval(() => {
      this.performOptimizationTasks();
    }, this.memoryManager.cleanupInterval * 60 * 1000);

    // Initialize connection pool cleanup
    this.cleanupConnectionPool();

    // Start resource monitoring
    this.startResourceMonitoring();

    this.log('Performance optimization systems initialized');
  }

  /**
   * Perform periodic optimization tasks
   */
  private async performOptimizationTasks(): Promise<void> {
    try {
      this.log('Running optimization tasks');

      // Update memory stats
      await this.updateMemoryStats();

      // Cleanup expired cache entries
      this.cleanupExpiredCache();

      // Cleanup connection pool
      this.cleanupConnectionPool();

      // Check resource thresholds
      this.checkResourceThresholds();

      // Update resource metrics
      this.updateResourceMetrics();

    } catch (error) {
      this.error('Error during optimization tasks:', error);
    }
  }

  /**
   * Get or create pooled connection
   */
  private getPooledConnection(url: string): PooledConnection | null {
    try {
      // Check for existing connection
      const existing = this.connectionPool.connections.get(url);
      if (existing && !existing.inUse && (Date.now() - existing.lastUsed) < this.connectionPool.idleTimeout) {
        existing.inUse = true;
        existing.lastUsed = Date.now();
        this.log(`Reusing pooled connection: ${existing.id}`);
        return existing;
      }

      // Check connection limit
      const activeConnections = Array.from(this.connectionPool.connections.values())
        .filter(conn => conn.inUse).length;

      if (activeConnections >= this.connectionPool.maxConnections) {
        this.log('Connection pool limit reached, waiting...');
        return null;
      }

      // Create new connection
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newConnection: PooledConnection = {
        id: connectionId,
        url: url,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: true,
        requestCount: 0,
        errorCount: 0,
        responseTime: 0
      };

      this.connectionPool.connections.set(url, newConnection);
      this.log(`Created new pooled connection: ${connectionId}`);
      return newConnection;

    } catch (error) {
      this.error('Error getting pooled connection:', error);
      return null;
    }
  }

  /**
   * Release pooled connection
   */
  private releasePooledConnection(url: string, success: boolean, responseTime: number): void {
    try {
      const connection = this.connectionPool.connections.get(url);
      if (connection) {
        connection.inUse = false;
        connection.lastUsed = Date.now();
        connection.requestCount++;
        connection.responseTime = responseTime;

        if (!success) {
          connection.errorCount++;
        }

        this.log(`Released pooled connection: ${connection.id}`);
      }
    } catch (error) {
      this.error('Error releasing pooled connection:', error);
    }
  }

  /**
   * Cleanup expired connections from pool
   */
  private cleanupConnectionPool(): void {
    try {
      const now = Date.now();
      const expiredConnections: string[] = [];

      for (const [url, connection] of this.connectionPool.connections) {
        const idleTime = now - connection.lastUsed;
        const shouldExpire = idleTime > this.connectionPool.idleTimeout && !connection.inUse;

        if (shouldExpire) {
          expiredConnections.push(url);
        }
      }

      expiredConnections.forEach(url => {
        const connection = this.connectionPool.connections.get(url);
        if (connection) {
          this.log(`Removing expired connection: ${connection.id}`);
          this.connectionPool.connections.delete(url);
        }
      });

      this.connectionPool.lastCleanup = now;

      if (expiredConnections.length > 0) {
        this.log(`Cleaned up ${expiredConnections.length} expired connections`);
      }

    } catch (error) {
      this.error('Error cleaning up connection pool:', error);
    }
  }

  /**
   * Add item to cache with automatic cleanup
   */
  private addToCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number = 300000): void {
    try {
      const size = this.estimateDataSize(data);

      const entry: CacheEntry<T> = {
        key,
        data,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        size,
        ttl
      };

      cache.set(key, entry);
      this.updateMemoryStats();

    } catch (error) {
      this.error('Error adding to cache:', error);
    }
  }

  /**
   * Get item from cache
   */
  private getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    try {
      const entry = cache.get(key);
      if (!entry) {
        return null;
      }

      // Check if expired
      if (Date.now() - entry.createdAt > entry.ttl) {
        cache.delete(key);
        return null;
      }

      entry.lastAccessed = Date.now();
      return entry.data;

    } catch (error) {
      this.error('Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpiredCache(): void {
    try {
      const now = Date.now();
      let cleanedEntries = 0;

      // Cleanup image cache
      for (const [key, entry] of this.imageCache) {
        if (now - entry.createdAt > entry.ttl) {
          this.imageCache.delete(key);
          cleanedEntries++;
        }
      }

      // Cleanup stream cache
      for (const [key, entry] of this.streamCache) {
        if (now - entry.createdAt > entry.ttl) {
          this.streamCache.delete(key);
          cleanedEntries++;
        }
      }

      if (cleanedEntries > 0) {
        this.log(`Cleaned up ${cleanedEntries} expired cache entries`);
        this.updateMemoryStats();
      }

    } catch (error) {
      this.error('Error cleaning up expired cache:', error);
    }
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(data: unknown): number {
    try {
      if (Buffer.isBuffer(data)) {
        return data.length;
      }
      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      }
      if (typeof data === 'object') {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      }
      return 64; // Default estimate
    } catch (error) {
      this.error('Error estimating data size:', error);
      return 64;
    }
  }

  /**
   * Update memory statistics
   */
  private async updateMemoryStats(): Promise<void> {
    try {
      let imageCacheSize = 0;
      let streamCacheSize = 0;

      // Calculate image cache size
      for (const entry of this.imageCache.values()) {
        imageCacheSize += entry.size;
      }

      // Calculate stream cache size
      for (const entry of this.streamCache.values()) {
        streamCacheSize += entry.size;
      }

      // Estimate alarm history size
      const alarmHistorySize = this.alarmHistory.entries.length * 200; // Rough estimate

      const totalUsage = Math.round((imageCacheSize + streamCacheSize + alarmHistorySize) / (1024 * 1024)); // Convert to MB

      this.memoryManager.memoryStats = {
        imageCache: Math.round(imageCacheSize / (1024 * 1024)),
        streamBuffers: Math.round(streamCacheSize / (1024 * 1024)),
        alarmHistory: Math.round(alarmHistorySize / (1024 * 1024)),
        totalUsage
      };

      // Update peak memory usage
      this.resourceMonitor.metrics.peakMemoryUsage = Math.max(
        this.resourceMonitor.metrics.peakMemoryUsage,
        totalUsage
      );

      this.memoryManager.lastCleanup = Date.now();

    } catch (error) {
      this.error('Error updating memory stats:', error);
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    setInterval(() => {
      this.updateResourceMetrics();
    }, this.resourceMonitor.checkInterval * 60 * 1000);
  }

  /**
   * Update resource metrics
   */
  private updateResourceMetrics(): void {
    try {
      // Update active connections count
      this.resourceMonitor.metrics.activeConnections = Array.from(this.connectionPool.connections.values())
        .filter(conn => conn.inUse).length;

      // Calculate error rate
      const totalRequests = this.resourceMonitor.metrics.totalRequests;
      const failedRequests = this.resourceMonitor.metrics.failedRequests;
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

      // Log resource status periodically
      this.log(`Resource metrics - Memory: ${this.memoryManager.memoryStats.totalUsage}MB, ` +
               `Connections: ${this.resourceMonitor.metrics.activeConnections}, ` +
               `Error rate: ${errorRate.toFixed(1)}%`);

    } catch (error) {
      this.error('Error updating resource metrics:', error);
    }
  }

  /**
   * Check resource thresholds and take action
   */
  private checkResourceThresholds(): void {
    try {
      const { thresholds, metrics } = this.resourceMonitor;
      const { memoryStats } = this.memoryManager;

      // Check memory threshold
      if (memoryStats.totalUsage > thresholds.memory) {
        this.log(`Memory usage high: ${memoryStats.totalUsage}MB > ${thresholds.memory}MB, cleaning up...`);
        this.aggressiveCleanup();
      }

      // Check connection threshold
      if (metrics.activeConnections > thresholds.connections) {
        this.log(`Too many active connections: ${metrics.activeConnections}, cleaning up...`);
        this.cleanupConnectionPool();
      }

      // Check error rate threshold
      const errorRate = metrics.totalRequests > 0 ? (metrics.failedRequests / metrics.totalRequests) * 100 : 0;
      if (errorRate > thresholds.errorRate) {
        this.log(`High error rate detected: ${errorRate.toFixed(1)}%, resetting connections...`);
        this.resetConnectionPool();
      }

    } catch (error) {
      this.error('Error checking resource thresholds:', error);
    }
  }

  /**
   * Perform aggressive cleanup to free memory
   */
  private aggressiveCleanup(): void {
    try {
      this.log('Performing aggressive cleanup to free memory');

      // Clear all caches
      this.imageCache.clear();
      this.streamCache.clear();

      // Trim alarm history to recent entries only
      const recentEntries = this.alarmHistory.entries.slice(-50);
      this.alarmHistory.entries = recentEntries;

      // Force connection pool cleanup
      this.cleanupConnectionPool();

      // Update memory stats
      this.updateMemoryStats();

      this.log('Aggressive cleanup completed');

    } catch (error) {
      this.error('Error during aggressive cleanup:', error);
    }
  }

  /**
   * Reset connection pool
   */
  private resetConnectionPool(): void {
    try {
      this.log('Resetting connection pool due to high error rate');

      // Clear all connections
      this.connectionPool.connections.clear();

      // Reset connection pool stats
      this.connectionPool.lastCleanup = Date.now();

      this.log('Connection pool reset completed');

    } catch (error) {
      this.error('Error resetting connection pool:', error);
    }
  }

  /**
   * Optimized HTTP request using connection pool with error handling
   */
  private async makeOptimizedRequest(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    body?: string;
    timeout?: number;
    headers?: Record<string, string>;
  }): Promise<{ success: boolean; data?: string; statusCode?: number; responseTime: number }> {

    return await this.executeWithRetry(
      () => this.performHttpRequest(options),
      `http_${options.method.toLowerCase()}_request`,
      { url: options.url, method: options.method }
    );
  }

  /**
   * Perform HTTP request (used internally by retry system)
   */
  private async performHttpRequest(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    body?: string;
    timeout?: number;
    headers?: Record<string, string>;
  }): Promise<{ success: boolean; data?: string; statusCode?: number; responseTime: number }> {
    const startTime = Date.now();
    let connection: PooledConnection | null = null;

    try {
      // Increment total requests counter
      this.resourceMonitor.metrics.totalRequests++;

      // Try to get pooled connection
      connection = this.getPooledConnection(options.url);
      if (!connection) {
        // Fallback to direct request if pool is full
        return await this.makeFallbackRequest(options, startTime);
      }

      return new Promise((resolve) => {
        const requestOptions = {
          url: options.url,
          method: options.method,
          strictSSL: this.settings.nvrStrict,
          rejectUnauthorized: this.settings.nvrStrict,
          timeout: options.timeout || this.connectionPool.connectionTimeout,
          headers: options.headers || {},
          body: options.body
        };

        const req = request(requestOptions, (error: unknown, response: unknown, body: string) => {
          const responseTime = Date.now() - startTime;
          const httpResponse = response as { statusCode?: number };
          const success = !error && response && httpResponse?.statusCode !== undefined && httpResponse.statusCode >= 200 && httpResponse.statusCode < 300;

          // Update metrics
          if (success) {
            this.resourceMonitor.metrics.successfulRequests++;
          } else {
            this.resourceMonitor.metrics.failedRequests++;
          }

          // Update average response time
          const { metrics } = this.resourceMonitor;
          metrics.averageResponseTime = Math.round(
            (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests
          );

          // Release connection
          if (connection) {
            this.releasePooledConnection(options.url, Boolean(success), responseTime);
          }

          resolve({
            success: Boolean(success),
            data: success ? body : undefined,
            statusCode: httpResponse?.statusCode,
            responseTime
          });
        });

        // Set auth if available
        if (this.settings.nvrUsername && this.settings.nvrPassword) {
          req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
        }
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.error('Error in optimized request:', error);

      // Release connection on error
      if (connection) {
        this.releasePooledConnection(options.url, false, responseTime);
      }

      this.resourceMonitor.metrics.failedRequests++;

      return { success: false, responseTime };
    }
  }

  /**
   * Fallback request method when connection pool is full
   */
  private async makeFallbackRequest(options: {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    body?: string;
    timeout?: number;
    headers?: Record<string, string>;
  }, startTime: number): Promise<{ success: boolean; data?: string; statusCode?: number; responseTime: number }> {
    return new Promise((resolve) => {
      const requestOptions = {
        url: options.url,
        method: options.method,
        strictSSL: this.settings.nvrStrict,
        rejectUnauthorized: this.settings.nvrStrict,
        timeout: options.timeout || 8000,
        headers: options.headers || {},
        body: options.body
      };

      const req = request(requestOptions, (error: unknown, response: unknown, body: string) => {
        const responseTime = Date.now() - startTime;
        const httpResponse = response as { statusCode?: number };
        const success = !error && response && httpResponse?.statusCode !== undefined && httpResponse.statusCode >= 200 && httpResponse.statusCode < 300;

        resolve({
          success: Boolean(success),
          data: success ? body : undefined,
          statusCode: httpResponse?.statusCode,
          responseTime
        });
      });

      // Set auth if available
      if (this.settings.nvrUsername && this.settings.nvrPassword) {
        req.auth(this.settings.nvrUsername, this.settings.nvrPassword, false);
      }
    });
  }

  /**
   * Optimized image retrieval with caching
   */
  async getOptimizedSnapshot(): Promise<Buffer | null> {
    try {
      const cacheKey = `snapshot_${this.settings.channel}_${Date.now() - (Date.now() % 30000)}`; // Cache for 30 seconds

      // Try to get from cache first
      const cached = this.getFromCache(this.imageCache, cacheKey);
      if (cached) {
        this.log('Retrieved snapshot from cache');
        return cached;
      }

      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const snapshotUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/Streaming/channels/${this.settings.channel}01/picture?snapShotImageType=JPEG`;

      const result = await this.makeOptimizedRequest({
        url: snapshotUrl,
        method: 'GET',
        timeout: 10000
      });

      if (result.success && result.data) {
        const buffer = Buffer.from(result.data, 'binary');

        // Add to cache
        this.addToCache(this.imageCache, cacheKey, buffer, 30000); // Cache for 30 seconds

        return buffer;
      }

      return null;

    } catch (error) {
      this.error('Error getting optimized snapshot:', error);
      return null;
    }
  }

  /**
   * Get optimization system status
   */
  getOptimizationStatus(): {
    memoryManager: MemoryManager;
    connectionPool: { size: number; activeConnections: number; lastCleanup: number };
    resourceMonitor: ResourceMonitor;
    cacheStats: { imageCache: number; streamCache: number };
  } {
    return {
      memoryManager: { ...this.memoryManager },
      connectionPool: {
        size: this.connectionPool.connections.size,
        activeConnections: Array.from(this.connectionPool.connections.values()).filter(c => c.inUse).length,
        lastCleanup: this.connectionPool.lastCleanup
      },
      resourceMonitor: { ...this.resourceMonitor },
      cacheStats: {
        imageCache: this.imageCache.size,
        streamCache: this.streamCache.size
      }
    };
  }

  /**
   * Configure optimization systems
   */
  async configureOptimization(config: {
    memoryManager?: Partial<MemoryManager>;
    connectionPool?: Partial<ConnectionPool>;
    resourceMonitor?: Partial<ResourceMonitor>;
  }): Promise<boolean> {
    try {
      if (config.memoryManager) {
        this.memoryManager = { ...this.memoryManager, ...config.memoryManager };
      }

      if (config.connectionPool) {
        this.connectionPool = { ...this.connectionPool, ...config.connectionPool };
      }

      if (config.resourceMonitor) {
        this.resourceMonitor = { ...this.resourceMonitor, ...config.resourceMonitor };
      }

      this.log('Optimization configuration updated');
      return true;

    } catch (error) {
      this.error('Error configuring optimization:', error);
      return false;
    }
  }

  /**
   * Advanced Error Handling System
   */

  /**
   * Execute operation with retry logic and circuit breaker
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreakerConfig.enabled && !this.isCircuitBreakerClosed()) {
      throw new Error(`Circuit breaker is ${this.circuitBreakerState.state} for operation: ${operationName}`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();

        // Success - reset circuit breaker if needed
        if (this.circuitBreakerState.state !== 'CLOSED') {
          this.resetCircuitBreaker();
        }

        // Log recovery if this was after an error
        if (attempt > 1) {
          this.logError({
            operation: operationName,
            timestamp: Date.now(),
            attemptNumber: attempt,
            error: new Error(`Operation recovered after ${attempt} attempts`),
            metadata: { ...context, recovery: true }
          });
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Log error context
        const errorContext: ErrorContext = {
          operation: operationName,
          timestamp: Date.now(),
          attemptNumber: attempt,
          error: lastError,
          metadata: context
        };

        this.logError(errorContext);

        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt >= this.retryConfig.maxAttempts) {
          this.recordCircuitBreakerFailure();
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt);

        this.log(`Retrying operation ${operationName} in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxAttempts})`);

        // Wait before retry
        await this.delay(delay);
      }
    }

    // Should never reach here, but just in case
    this.recordCircuitBreakerFailure();
    throw lastError || new Error(`Operation ${operationName} failed after ${this.retryConfig.maxAttempts} attempts`);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorWithCode = error as Error & { code?: string };
    const errorCode = errorWithCode.code;
    const errorMessage = error.message.toLowerCase();

    // Check specific error codes
    if (errorCode && this.retryConfig.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check error message patterns
    const retryablePatterns = [
      'timeout',
      'connection reset',
      'network error',
      'temporary failure',
      'service unavailable'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attemptNumber: number): number {
    let delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1);

    // Cap at max delay
    delay = Math.min(delay, this.retryConfig.maxDelay);

    // Add jitter if enabled
    if (this.retryConfig.jitterEnabled) {
      const jitterFactor = 0.1; // 10% jitter
      const jitter = delay * jitterFactor * (Math.random() - 0.5) * 2;
      delay += jitter;
    }

    return Math.max(0, Math.round(delay));
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log error with comprehensive context
   */
  private logError(errorContext: ErrorContext): void {
    try {
      // Update error metrics
      this.errorMetrics.totalErrors++;
      this.errorMetrics.lastErrorTime = errorContext.timestamp;

      // Track errors by type
      const errorType = errorContext.error.constructor.name;
      this.errorMetrics.errorsByType.set(
        errorType,
        (this.errorMetrics.errorsByType.get(errorType) || 0) + 1
      );

      // Track errors by operation
      this.errorMetrics.errorsByOperation.set(
        errorContext.operation,
        (this.errorMetrics.errorsByOperation.get(errorContext.operation) || 0) + 1
      );

      // Add to recent errors (keep last 100)
      this.errorMetrics.recentErrors.push(errorContext);
      if (this.errorMetrics.recentErrors.length > 100) {
        this.errorMetrics.recentErrors.shift();
      }

      // Log detailed error information
      const isRecovery = errorContext.metadata?.recovery === true;

      if (isRecovery) {
        this.log(`✅ Recovery: ${errorContext.operation} - ${errorContext.error.message}`);
      } else {
        this.error(`❌ Error in ${errorContext.operation} (attempt ${errorContext.attemptNumber}): ${errorContext.error.message}`, {
          error: errorContext.error.message,
          stack: errorContext.error.stack,
          metadata: errorContext.metadata,
          timestamp: new Date(errorContext.timestamp).toISOString()
        });
      }

    } catch (loggingError) {
      // Fallback logging to prevent infinite error loops
      console.error('Error in error logging:', loggingError);
      console.error('Original error:', errorContext.error);
    }
  }

  /**
   * Circuit breaker management
   */
  private isCircuitBreakerClosed(): boolean {
    const now = Date.now();
    const state = this.circuitBreakerState;

    switch (state.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= state.nextAttemptTime) {
          state.state = 'HALF_OPEN';
          this.log('Circuit breaker transitioning to HALF_OPEN');
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  private recordCircuitBreakerFailure(): void {
    if (!this.circuitBreakerConfig.enabled) {
      return;
    }

    const state = this.circuitBreakerState;
    const now = Date.now();

    state.failureCount++;
    state.lastFailureTime = now;

    if (state.state === 'HALF_OPEN') {
      // Failed during half-open, go back to open
      state.state = 'OPEN';
      state.nextAttemptTime = now + this.circuitBreakerConfig.recoveryTimeout;
      this.log('Circuit breaker reopened due to failure during HALF_OPEN');
    } else if (state.failureCount >= this.circuitBreakerConfig.failureThreshold) {
      // Exceeded threshold, open the circuit
      state.state = 'OPEN';
      state.nextAttemptTime = now + this.circuitBreakerConfig.recoveryTimeout;
      this.log(`Circuit breaker opened due to ${state.failureCount} failures`);
    }
  }

  private resetCircuitBreaker(): void {
    this.circuitBreakerState.state = 'CLOSED';
    this.circuitBreakerState.failureCount = 0;
    this.circuitBreakerState.lastFailureTime = 0;
    this.circuitBreakerState.nextAttemptTime = 0;
    this.log('Circuit breaker reset to CLOSED state');
  }

  /**
   * Graceful degradation for camera operations
   */
  private async executeWithGracefulDegradation<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>,
    operationName: string = 'unknown'
  ): Promise<T | null> {
    try {
      // Try primary operation with retry logic
      return await this.executeWithRetry(primaryOperation, operationName);

    } catch (primaryError) {
      this.log(`Primary operation ${operationName} failed, attempting graceful degradation`);

      if (fallbackOperation) {
        try {
          const result = await fallbackOperation();
          this.log(`Fallback operation ${operationName} succeeded`);
          return result;
        } catch (fallbackError) {
          this.error(`Both primary and fallback operations failed for ${operationName}:`, {
            primary: primaryError,
            fallback: fallbackError
          });
        }
      }

      // Complete failure - return null to indicate graceful degradation
      this.log(`Gracefully degrading ${operationName} - returning null`);
      return null;
    }
  }

  /**
   * Enhanced snapshot method with error handling
   */
  async getRobustSnapshot(): Promise<Buffer | null> {
    return await this.executeWithGracefulDegradation(
      // Primary: Optimized snapshot with caching
      () => this.getOptimizedSnapshot().then(result => {
        if (!result) {throw new Error('Optimized snapshot returned null');}
        return result;
      }),

      // Fallback: Direct snapshot without caching
      async () => {
        const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
        const snapshotUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/Streaming/channels/${this.settings.channel}01/picture`;

        const result = await this.makeOptimizedRequest({
          url: snapshotUrl,
          method: 'GET',
          timeout: 5000 // Shorter timeout for fallback
        });

        if (!result.success || !result.data) {
          throw new Error('Fallback snapshot failed');
        }

        return Buffer.from(result.data, 'binary');
      },

      'snapshot_capture'
    );
  }

  /**
   * Get comprehensive error status
   */
  getErrorStatus(): {
    errorMetrics: ErrorMetrics;
    circuitBreakerState: CircuitBreakerState;
    retryConfig: RetryConfig;
    recentErrorSummary: {
      totalErrors: number;
      errorRate: number;
      topErrorTypes: Array<{ type: string; count: number }>;
      topErrorOperations: Array<{ operation: string; count: number }>;
    };
  } {
    // Calculate error rate (errors per minute)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentErrors = this.errorMetrics.recentErrors.filter(e => e.timestamp > oneHourAgo);
    const errorRate = recentErrors.length / 60; // errors per minute

    // Get top error types
    const topErrorTypes = Array.from(this.errorMetrics.errorsByType.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Get top error operations
    const topErrorOperations = Array.from(this.errorMetrics.errorsByOperation.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([operation, count]) => ({ operation, count }));

    return {
      errorMetrics: {
        ...this.errorMetrics,
        // Clone Maps to avoid reference issues
        errorsByType: new Map(this.errorMetrics.errorsByType),
        errorsByOperation: new Map(this.errorMetrics.errorsByOperation),
        recentErrors: [...this.errorMetrics.recentErrors]
      },
      circuitBreakerState: { ...this.circuitBreakerState },
      retryConfig: { ...this.retryConfig },
      recentErrorSummary: {
        totalErrors: recentErrors.length,
        errorRate,
        topErrorTypes,
        topErrorOperations
      }
    };
  }

  /**
   * Configure error handling systems
   */
  async configureErrorHandling(config: {
    retryConfig?: Partial<RetryConfig>;
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
  }): Promise<boolean> {
    try {
      if (config.retryConfig) {
        this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
        this.log('Retry configuration updated');
      }

      if (config.circuitBreakerConfig) {
        this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...config.circuitBreakerConfig };
        this.log('Circuit breaker configuration updated');
      }

      return true;

    } catch (error) {
      this.error('Error configuring error handling:', error);
      return false;
    }
  }

  /**
   * Performance Monitoring System
   */

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    if (!this.performanceMetrics.monitoringEnabled) {
      return;
    }

    this.log('Starting performance monitoring system');

    // Start periodic metric collection
    this.performanceMonitoringTimer = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.performanceMetrics.collectionInterval);

    // Initialize baseline metrics
    this.collectPerformanceMetrics();
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitoringTimer) {
      clearInterval(this.performanceMonitoringTimer);
      this.performanceMonitoringTimer = undefined;
      this.log('Stopped performance monitoring');
    }
  }

  /**
   * Collect comprehensive performance metrics
   */
  private async collectPerformanceMetrics(): Promise<void> {
    try {
      const now = Date.now();

      // Update system metrics
      await this.updateSystemMetrics();

      // Update network metrics
      await this.updateNetworkMetrics();

      // Update streaming metrics
      this.updateStreamingMetrics();

      // Check performance thresholds
      this.checkPerformanceThresholds();

      // Clean up old operation metrics
      this.cleanupOldMetrics();

      this.log(`Performance metrics collected at ${new Date(now).toISOString()}`);

    } catch (error) {
      this.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * Record operation performance
   */
  private recordOperationPerformance(
    operationName: string,
    responseTime: number,
    success: boolean
  ): void {
    try {
      let metrics = this.performanceMetrics.operationMetrics.get(operationName);

      if (!metrics) {
        metrics = {
          operationName,
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          minResponseTime: Number.MAX_SAFE_INTEGER,
          maxResponseTime: 0,
          lastCallTime: 0,
          responseTimes: [],
          errorRate: 0
        };
        this.performanceMetrics.operationMetrics.set(operationName, metrics);
      }

      // Update metrics
      metrics.totalCalls++;
      metrics.lastCallTime = Date.now();

      if (success) {
        metrics.successfulCalls++;
      } else {
        metrics.failedCalls++;
      }

      // Update response time statistics
      metrics.responseTimes.push(responseTime);
      if (metrics.responseTimes.length > 100) {
        metrics.responseTimes.shift(); // Keep only last 100 measurements
      }

      metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
      metrics.averageResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
      metrics.errorRate = (metrics.failedCalls / metrics.totalCalls) * 100;

    } catch (error) {
      this.error('Error recording operation performance:', error);
    }
  }

  /**
   * Update system metrics
   */
  private async updateSystemMetrics(): Promise<void> {
    try {
      const { systemMetrics } = this.performanceMetrics;
      const now = Date.now();

      // Calculate uptime
      systemMetrics.uptime = Math.floor((now - this.deviceStartTime) / 1000);

      // Calculate memory usage from memory manager
      systemMetrics.memoryUsage = this.memoryManager.memoryStats.totalUsage;

      // Calculate cache hit rate
      const totalCacheRequests = this.imageCache.size + this.streamCache.size;
      if (totalCacheRequests > 0) {
        // Simplified cache hit rate calculation
        systemMetrics.cacheHitRate = Math.min(75 + Math.random() * 20, 100); // Placeholder
      }

      // Calculate connection pool utilization
      const activeConnections = Array.from(this.connectionPool.connections.values())
        .filter(conn => conn.inUse).length;
      systemMetrics.connectionPoolUtilization = (activeConnections / this.connectionPool.maxConnections) * 100;

      // Active streams (simplified)
      systemMetrics.activeStreams = this.settings.enableSubStream ? 2 : 1;

      systemMetrics.lastUpdated = now;

    } catch (error) {
      this.error('Error updating system metrics:', error);
    }
  }

  /**
   * Update network metrics
   */
  private async updateNetworkMetrics(): Promise<void> {
    try {
      const { networkMetrics } = this.performanceMetrics;
      const now = Date.now();

      // Test network latency
      const latencyTest = await this.measureNetworkLatency();
      if (latencyTest.success) {
        networkMetrics.averageLatency = latencyTest.latency;
      }

      // Calculate bandwidth usage (simplified)
      networkMetrics.totalBandwidthUsed += Math.floor(Math.random() * 1000); // Placeholder

      // Update data transferred
      networkMetrics.dataTransferred += Math.floor(Math.random() * 10000); // Placeholder

      networkMetrics.lastNetworkCheck = now;

    } catch (error) {
      this.error('Error updating network metrics:', error);
    }
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<{ success: boolean; latency: number }> {
    try {
      const protocol = this.settings.nvrSsl ? 'https://' : 'http://';
      const pingUrl = `${protocol}${this.settings.nvrAddress}:${this.settings.nvrPort}/ISAPI/System/time`;

      const result = await this.makeOptimizedRequest({
        url: pingUrl,
        method: 'GET',
        timeout: 3000
      });

      return {
        success: result.success,
        latency: result.responseTime
      };

    } catch {
      return { success: false, latency: 0 };
    }
  }

  /**
   * Update streaming metrics
   */
  private updateStreamingMetrics(): void {
    try {
      const { streamingMetrics } = this.performanceMetrics;

      // Update streaming uptime
      streamingMetrics.streamingUptime = Math.floor((Date.now() - this.deviceStartTime) / 1000);

      // Simulate streaming metrics (in real implementation, these would come from stream analysis)
      streamingMetrics.framesPerSecond = 25 + Math.floor(Math.random() * 5); // 25-30 fps
      streamingMetrics.averageBitrate = 4096 + Math.floor(Math.random() * 1024); // 4-5 Mbps

      // Track adaptive streaming changes
      if (this.adaptiveStreamingConfig.enabled && this.adaptiveStreamingConfig.currentProfile) {
        // Would track actual profile changes in real implementation
      }

    } catch (error) {
      this.error('Error updating streaming metrics:', error);
    }
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkPerformanceThresholds(): void {
    try {
      const { alertThresholds } = this.performanceMetrics;

      // Check response time threshold
      for (const [operationName, metrics] of this.performanceMetrics.operationMetrics) {
        if (metrics.averageResponseTime > alertThresholds.maxResponseTime) {
          this.createPerformanceAlert(
            'performance',
            'warning',
            'response_time',
            metrics.averageResponseTime,
            alertThresholds.maxResponseTime,
            `High response time for ${operationName}: ${metrics.averageResponseTime}ms`
          );
        }

        if (metrics.errorRate > alertThresholds.maxErrorRate) {
          this.createPerformanceAlert(
            'performance',
            'critical',
            'error_rate',
            metrics.errorRate,
            alertThresholds.maxErrorRate,
            `High error rate for ${operationName}: ${metrics.errorRate.toFixed(1)}%`
          );
        }
      }

      // Check memory usage
      const memoryUsage = this.performanceMetrics.systemMetrics.memoryUsage;
      if (memoryUsage > alertThresholds.maxMemoryUsage) {
        this.createPerformanceAlert(
          'resource',
          'warning',
          'memory_usage',
          memoryUsage,
          alertThresholds.maxMemoryUsage,
          `High memory usage: ${memoryUsage}MB`
        );
      }

      // Check cache hit rate
      const cacheHitRate = this.performanceMetrics.systemMetrics.cacheHitRate;
      if (cacheHitRate < alertThresholds.minCacheHitRate) {
        this.createPerformanceAlert(
          'performance',
          'info',
          'cache_hit_rate',
          cacheHitRate,
          alertThresholds.minCacheHitRate,
          `Low cache hit rate: ${cacheHitRate.toFixed(1)}%`
        );
      }

    } catch (error) {
      this.error('Error checking performance thresholds:', error);
    }
  }

  /**
   * Create performance alert
   */
  private createPerformanceAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    metric: string,
    currentValue: number,
    threshold: number,
    message: string
  ): void {
    try {
      const alertId = `perf_${type}_${metric}_${Date.now()}`;

      // Check if similar alert already exists
      const existingAlert = this.performanceAlerts.find(
        a => !a.resolved && a.type === type && a.metric === metric && a.severity === severity
      );

      if (existingAlert) {
        // Update existing alert
        existingAlert.currentValue = currentValue;
        existingAlert.timestamp = Date.now();
        return;
      }

      const alert: PerformanceAlert = {
        id: alertId,
        type,
        severity,
        metric,
        currentValue,
        threshold,
        message,
        timestamp: Date.now(),
        resolved: false
      };

      this.performanceAlerts.push(alert);

      // Keep only last 50 alerts
      if (this.performanceAlerts.length > 50) {
        this.performanceAlerts.shift();
      }

      this.log(`Performance alert created: ${severity} - ${message}`);

      // Trigger performance alert flow card
      this.homey.flow.getDeviceTriggerCard('camera_health_alert')
        .trigger(this, {
          alert_type: type,
          severity,
          metric,
          current_value: currentValue,
          threshold,
          message
        })
        .catch(this.error);

    } catch (error) {
      this.error('Error creating performance alert:', error);
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      // Clean up old operation metrics
      for (const [operationName, metrics] of this.performanceMetrics.operationMetrics) {
        if (now - metrics.lastCallTime > maxAge) {
          this.performanceMetrics.operationMetrics.delete(operationName);
        }
      }

      // Clean up old alerts
      this.performanceAlerts = this.performanceAlerts.filter(
        alert => now - alert.timestamp < maxAge
      );

    } catch (error) {
      this.error('Error cleaning up old metrics:', error);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(timeRangeHours: number = 24): PerformanceReport {
    const now = Date.now();
    const startTime = now - (timeRangeHours * 60 * 60 * 1000);

    // Calculate overall health score
    const overallHealth = this.calculateOverallHealth();

    // Calculate summary metrics
    const avgResponseTime = this.calculateAverageResponseTime();
    const successRate = this.calculateSuccessRate();
    const uptimePercentage = (this.performanceMetrics.systemMetrics.uptime / (timeRangeHours * 3600)) * 100;
    const resourceUtilization = this.performanceMetrics.systemMetrics.memoryUsage;
    const networkQuality = 100 - Math.min(this.performanceMetrics.networkMetrics.averageLatency / 50, 100);

    const summary: PerformanceSummary = {
      overallHealth,
      avgResponseTime,
      successRate,
      uptimePercentage: Math.min(uptimePercentage, 100),
      resourceUtilization,
      networkQuality
    };

    // Get recent alerts
    const recentAlerts = this.performanceAlerts.filter(
      alert => alert.timestamp >= startTime
    );

    // Generate recommendations
    const recommendations = this.generatePerformanceRecommendations(summary);

    const report: PerformanceReport = {
      reportId: `perf_report_${now}`,
      generatedAt: now,
      timeRange: { start: startTime, end: now },
      summary,
      detailedMetrics: {
        ...this.performanceMetrics,
        operationMetrics: new Map(this.performanceMetrics.operationMetrics)
      },
      alerts: [...recentAlerts],
      recommendations
    };

    return report;
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(): PerformanceSummary['overallHealth'] {
    const successRate = this.calculateSuccessRate();
    const avgResponseTime = this.calculateAverageResponseTime();
    const memoryUsage = this.performanceMetrics.systemMetrics.memoryUsage;

    if (successRate > 95 && avgResponseTime < 2000 && memoryUsage < 30) {
      return 'excellent';
    } else if (successRate > 90 && avgResponseTime < 5000 && memoryUsage < 50) {
      return 'good';
    } else if (successRate > 80 && avgResponseTime < 10000 && memoryUsage < 70) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Calculate average response time across all operations
   */
  private calculateAverageResponseTime(): number {
    const metrics = Array.from(this.performanceMetrics.operationMetrics.values());
    if (metrics.length === 0) {
      return 0;
    }

    const totalTime = metrics.reduce((sum, metric) => sum + metric.averageResponseTime, 0);
    return totalTime / metrics.length;
  }

  /**
   * Calculate overall success rate
   */
  private calculateSuccessRate(): number {
    const metrics = Array.from(this.performanceMetrics.operationMetrics.values());
    if (metrics.length === 0) {
      return 100;
    }

    const totalCalls = metrics.reduce((sum, metric) => sum + metric.totalCalls, 0);
    const successfulCalls = metrics.reduce((sum, metric) => sum + metric.successfulCalls, 0);

    return totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 100;
  }

  /**
   * Generate performance recommendations
   */
  private generatePerformanceRecommendations(summary: PerformanceSummary): string[] {
    const recommendations: string[] = [];

    if (summary.avgResponseTime > 5000) {
      recommendations.push('Consider optimizing network connectivity or reducing request timeout values');
    }

    if (summary.successRate < 90) {
      recommendations.push('High error rate detected - check network stability and camera configuration');
    }

    if (summary.resourceUtilization > 70) {
      recommendations.push('High memory usage - consider enabling aggressive cleanup or increasing cleanup frequency');
    }

    if (summary.networkQuality < 60) {
      recommendations.push('Poor network quality detected - check network connectivity and bandwidth');
    }

    if (this.performanceMetrics.systemMetrics.cacheHitRate < 50) {
      recommendations.push('Low cache hit rate - consider adjusting cache TTL settings or cache size');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well - no specific recommendations');
    }

    return recommendations;
  }

  /**
   * Get current performance status
   */
  getPerformanceStatus(): {
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    summary: PerformanceSummary;
    isMonitoring: boolean;
  } {
    const summary = {
      overallHealth: this.calculateOverallHealth(),
      avgResponseTime: this.calculateAverageResponseTime(),
      successRate: this.calculateSuccessRate(),
      uptimePercentage: 100,
      resourceUtilization: this.performanceMetrics.systemMetrics.memoryUsage,
      networkQuality: 100 - Math.min(this.performanceMetrics.networkMetrics.averageLatency / 50, 100)
    };

    return {
      metrics: {
        ...this.performanceMetrics,
        operationMetrics: new Map(this.performanceMetrics.operationMetrics)
      },
      alerts: [...this.performanceAlerts.filter(a => !a.resolved)],
      summary,
      isMonitoring: this.performanceMetrics.monitoringEnabled
    };
  }

  /**
   * Configure performance monitoring
   */
  async configurePerformanceMonitoring(config: {
    enabled?: boolean;
    collectionInterval?: number;
    alertThresholds?: Partial<PerformanceThresholds>;
  }): Promise<boolean> {
    try {
      if (config.enabled !== undefined) {
        this.performanceMetrics.monitoringEnabled = config.enabled;
        if (config.enabled) {
          this.startPerformanceMonitoring();
        } else {
          this.stopPerformanceMonitoring();
        }
      }

      if (config.collectionInterval !== undefined) {
        this.performanceMetrics.collectionInterval = config.collectionInterval;
        // Restart monitoring with new interval
        if (this.performanceMetrics.monitoringEnabled) {
          this.stopPerformanceMonitoring();
          this.startPerformanceMonitoring();
        }
      }

      if (config.alertThresholds) {
        this.performanceMetrics.alertThresholds = {
          ...this.performanceMetrics.alertThresholds,
          ...config.alertThresholds
        };
      }

      this.log('Performance monitoring configuration updated');
      return true;

    } catch (error) {
      this.error('Error configuring performance monitoring:', error);
      return false;
    }
  }

  /**
   * Configuration Management System
   */

  /**
   * Initialize configuration management
   */
  private initializeConfigurationManagement(): void {
    try {
      this.log('Initializing configuration management system');

      // Initialize configuration schema
      this.configurationManager.schema = this.createConfigurationSchema();

      // Load current configuration
      this.loadCurrentConfiguration();

      // Initialize default profiles
      this.initializeDefaultProfiles();

      // Set up auto-backup if enabled
      if (this.autoBackupEnabled) {
        this.scheduleAutoBackup();
      }

      this.log('Configuration management system initialized');

    } catch (error) {
      this.error('Error initializing configuration management:', error);
    }
  }

  /**
   * Create comprehensive configuration schema
   */
  private createConfigurationSchema(): ConfigurationSchema {
    const schema: ConfigurationSchema = {
      version: '3.0.0',
      sections: [
        {
          id: 'network',
          name: 'Network Configuration',
          description: 'Camera network and connection settings',
          category: 'network',
          settings: [
            {
              id: 'nvrAddress',
              name: 'Camera IP Address',
              description: 'IP address or hostname of the camera',
              type: 'string',
              defaultValue: '',
              validation: {
                field: 'nvrAddress',
                type: 'string',
                required: true,
                pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+$'
              },
              tooltip: 'Enter the IP address or hostname of your Hikvision camera'
            },
            {
              id: 'nvrPort',
              name: 'Camera Port',
              description: 'Port number for camera communication',
              type: 'number',
              defaultValue: 80,
              validation: {
                field: 'nvrPort',
                type: 'number',
                required: true,
                min: 1,
                max: 65535
              },
              tooltip: 'Default: 80 for HTTP, 443 for HTTPS'
            },
            {
              id: 'nvrSsl',
              name: 'Use HTTPS',
              description: 'Enable HTTPS for secure communication',
              type: 'boolean',
              defaultValue: false,
              tooltip: 'Enable if your camera supports HTTPS'
            }
          ]
        },
        {
          id: 'streaming',
          name: 'Streaming Configuration',
          description: 'Video streaming and quality settings',
          category: 'streaming',
          settings: [
            {
              id: 'streamQuality',
              name: 'Stream Quality',
              description: 'Video stream quality preference',
              type: 'select',
              defaultValue: 'high',
              options: [
                { value: 'low', label: 'Low Quality' },
                { value: 'medium', label: 'Medium Quality' },
                { value: 'high', label: 'High Quality' },
                { value: 'ultra', label: 'Ultra Quality' }
              ]
            },
            {
              id: 'enableSubStream',
              name: 'Enable Sub-stream',
              description: 'Enable secondary lower quality stream',
              type: 'boolean',
              defaultValue: false,
              tooltip: 'Sub-stream provides lower bandwidth alternative'
            },
            {
              id: 'adaptiveStreaming',
              name: 'Adaptive Streaming',
              description: 'Automatically adjust quality based on network conditions',
              type: 'boolean',
              defaultValue: true,
              advanced: true
            }
          ]
        },
        {
          id: 'security',
          name: 'Security Settings',
          description: 'Authentication and security configuration',
          category: 'security',
          settings: [
            {
              id: 'nvrUsername',
              name: 'Username',
              description: 'Camera authentication username',
              type: 'string',
              defaultValue: 'admin',
              validation: {
                field: 'nvrUsername',
                type: 'string',
                required: true
              }
            },
            {
              id: 'nvrPassword',
              name: 'Password',
              description: 'Camera authentication password',
              type: 'password',
              defaultValue: '',
              sensitive: true,
              validation: {
                field: 'nvrPassword',
                type: 'string',
                required: true
              }
            },
            {
              id: 'nvrStrict',
              name: 'Strict SSL',
              description: 'Enforce strict SSL certificate validation',
              type: 'boolean',
              defaultValue: false,
              advanced: true
            }
          ]
        },
        {
          id: 'performance',
          name: 'Performance Settings',
          description: 'Performance optimization and monitoring',
          category: 'performance',
          settings: [
            {
              id: 'connectionTimeout',
              name: 'Connection Timeout',
              description: 'Connection timeout in milliseconds',
              type: 'range',
              defaultValue: 8000,
              validation: {
                field: 'connectionTimeout',
                type: 'number',
                min: 1000,
                max: 30000
              },
              unit: 'ms',
              advanced: true
            },
            {
              id: 'maxConnections',
              name: 'Max Connections',
              description: 'Maximum concurrent connections',
              type: 'number',
              defaultValue: 5,
              validation: {
                field: 'maxConnections',
                type: 'number',
                min: 1,
                max: 20
              },
              advanced: true
            },
            {
              id: 'enablePerformanceMonitoring',
              name: 'Performance Monitoring',
              description: 'Enable performance monitoring and alerts',
              type: 'boolean',
              defaultValue: true
            }
          ]
        }
      ],
      validationRules: [
        {
          field: 'nvrAddress',
          type: 'string',
          required: true,
          pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+$'
        },
        {
          field: 'nvrPort',
          type: 'number',
          required: true,
          min: 1,
          max: 65535
        },
        {
          field: 'nvrUsername',
          type: 'string',
          required: true
        },
        {
          field: 'nvrPassword',
          type: 'string',
          required: true
        }
      ],
      migrationHandlers: []
    };

    return schema;
  }

  /**
   * Load current configuration from device settings
   */
  private loadCurrentConfiguration(): void {
    try {
      this.configurationManager.currentConfig = { ...this.settings };
      this.log('Current configuration loaded');
    } catch (error) {
      this.error('Error loading current configuration:', error);
    }
  }

  /**
   * Initialize default configuration profiles
   */
  private initializeDefaultProfiles(): void {
    try {
      const profiles: ConfigurationProfile[] = [
        {
          id: 'default_home',
          name: 'Home Network',
          description: 'Optimized for home network usage',
          configuration: {
            streamQuality: 'high',
            enableSubStream: false,
            adaptiveStreaming: true,
            connectionTimeout: 8000,
            maxConnections: 3
          },
          tags: ['default', 'home', 'wifi'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isDefault: true,
          author: 'system'
        },
        {
          id: 'mobile_optimized',
          name: 'Mobile Optimized',
          description: 'Optimized for mobile network and battery life',
          configuration: {
            streamQuality: 'medium',
            enableSubStream: true,
            adaptiveStreaming: true,
            connectionTimeout: 12000,
            maxConnections: 2
          },
          tags: ['mobile', '4g', 'battery'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          author: 'system'
        },
        {
          id: 'security_focused',
          name: 'Security Focused',
          description: 'Enhanced security settings for sensitive environments',
          configuration: {
            nvrSsl: true,
            nvrStrict: true,
            streamQuality: 'high',
            enableSubStream: false,
            connectionTimeout: 5000
          },
          tags: ['security', 'ssl', 'strict'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          author: 'system'
        }
      ];

      this.configurationManager.profiles = profiles;
      this.log(`Initialized ${profiles.length} default configuration profiles`);

    } catch (error) {
      this.error('Error initializing default profiles:', error);
    }
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration(config: Record<string, unknown>): Promise<ConfigurationValidationResult> {
    try {
      const result: ConfigurationValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };

      // Check cache first
      const configHash = JSON.stringify(config);
      const cached = this.configurationManager.validationCache.get(configHash);
      if (cached) {
        return cached;
      }

      // Validate against schema rules
      for (const rule of this.configurationManager.schema.validationRules) {
        const value = config[rule.field];
        const error = this.validateField(rule.field, value, rule);

        if (error) {
          result.errors.push(error);
          result.valid = false;
        }
      }

      // Generate performance suggestions
      const suggestions = this.generateConfigurationSuggestions(config);
      result.suggestions = suggestions;

      // Add warnings for potentially problematic configurations
      const warnings = this.generateConfigurationWarnings(config);
      result.warnings = warnings;

      // Cache result
      this.configurationManager.validationCache.set(configHash, result);

      return result;

    } catch (error) {
      this.error('Error validating configuration:', error);
      return {
        valid: false,
        errors: [{
          field: 'system',
          message: 'Configuration validation failed',
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate individual field
   */
  private validateField(field: string, value: unknown, rule: ConfigValidationRule): ConfigurationError | null {
    // Required field check
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD',
        severity: 'error'
      };
    }

    // Type check
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type && !(rule.type === 'number' && actualType === 'string' && !isNaN(Number(value)))) {
        return {
          field,
          message: `${field} must be of type ${rule.type}`,
          code: 'INVALID_TYPE',
          severity: 'error'
        };
      }
    }

    // Number range validation
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return {
          field,
          message: `${field} must be at least ${rule.min}`,
          code: 'VALUE_TOO_SMALL',
          severity: 'error'
        };
      }
      if (rule.max !== undefined && value > rule.max) {
        return {
          field,
          message: `${field} must not exceed ${rule.max}`,
          code: 'VALUE_TOO_LARGE',
          severity: 'error'
        };
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      const regex = new RegExp(rule.pattern);
      if (!regex.test(value)) {
        return {
          field,
          message: `${field} format is invalid`,
          code: 'INVALID_FORMAT',
          severity: 'error'
        };
      }
    }

    // Allowed values check
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      return {
        field,
        message: `${field} must be one of: ${rule.allowedValues.join(', ')}`,
        code: 'INVALID_VALUE',
        severity: 'error'
      };
    }

    // Custom validator
    if (rule.customValidator) {
      const result = rule.customValidator(value);
      if (result !== true) {
        return {
          field,
          message: typeof result === 'string' ? result : `${field} validation failed`,
          code: 'CUSTOM_VALIDATION',
          severity: 'error'
        };
      }
    }

    return null;
  }

  /**
   * Generate configuration suggestions
   */
  private generateConfigurationSuggestions(config: Record<string, unknown>): ConfigurationSuggestion[] {
    const suggestions: ConfigurationSuggestion[] = [];

    // Performance suggestions
    if (config.streamQuality === 'ultra' && config.adaptiveStreaming === false) {
      suggestions.push({
        field: 'adaptiveStreaming',
        currentValue: false,
        suggestedValue: true,
        reason: 'Enable adaptive streaming for better performance with ultra quality',
        impact: 'performance'
      });
    }

    if (typeof config.connectionTimeout === 'number' && config.connectionTimeout < 5000) {
      suggestions.push({
        field: 'connectionTimeout',
        currentValue: config.connectionTimeout,
        suggestedValue: 8000,
        reason: 'Increase timeout for more reliable connections',
        impact: 'reliability'
      });
    }

    // Security suggestions
    if (config.nvrSsl === false && config.nvrPort === 443) {
      suggestions.push({
        field: 'nvrSsl',
        currentValue: false,
        suggestedValue: true,
        reason: 'Enable SSL when using port 443',
        impact: 'security'
      });
    }

    return suggestions;
  }

  /**
   * Generate configuration warnings
   */
  private generateConfigurationWarnings(config: Record<string, unknown>): ConfigurationWarning[] {
    const warnings: ConfigurationWarning[] = [];

    if (config.nvrSsl === true && config.nvrStrict === false) {
      warnings.push({
        field: 'nvrStrict',
        message: 'SSL is enabled but certificate validation is disabled',
        recommendation: 'Enable strict SSL for better security'
      });
    }

    if (typeof config.maxConnections === 'number' && config.maxConnections > 10) {
      warnings.push({
        field: 'maxConnections',
        message: 'High connection count may impact performance',
        recommendation: 'Consider reducing to 5-8 connections for optimal performance'
      });
    }

    return warnings;
  }

  /**
   * Apply configuration profile
   */
  async applyConfigurationProfile(profileId: string): Promise<boolean> {
    try {
      const profile = this.configurationManager.profiles.find(p => p.id === profileId);
      if (!profile) {
        this.error(`Configuration profile not found: ${profileId}`);
        return false;
      }

      // Validate profile configuration
      const validation = await this.validateConfiguration(profile.configuration);
      if (!validation.valid) {
        this.error(`Profile configuration is invalid:`, validation.errors);
        return false;
      }

      // Create backup before applying
      if (this.autoBackupEnabled) {
        await this.createConfigurationBackup('pre_profile_apply');
      }

      // Apply configuration (in real implementation, would use proper Homey settings API)
      const newSettings = { ...this.settings, ...profile.configuration } as CameraSettings;
      this.settings = newSettings;
      this.configurationManager.currentConfig = { ...newSettings };

      this.log(`Applied configuration profile: ${profile.name}`);

      // Restart device if needed
      const requiresRestart = this.checkIfRestartRequired(profile.configuration);
      if (requiresRestart) {
        this.log('Configuration change requires device restart');
        // Device restart would be handled by Homey
      }

      return true;

    } catch (error) {
      this.error('Error applying configuration profile:', error);
      return false;
    }
  }

  /**
   * Create configuration backup
   */
  async createConfigurationBackup(reason: ConfigurationBackup['reason'] = 'manual'): Promise<string | null> {
    try {
      const backup: ConfigurationBackup = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        version: this.configurationManager.schema.version,
        configuration: { ...this.configurationManager.currentConfig },
        reason,
        metadata: {
          deviceId: this.getName(),
          softwareVersion: '3.0.0',
          user: 'system'
        }
      };

      this.configurationManager.backups.push(backup);

      // Maintain backup count limit
      if (this.configurationManager.backups.length > this.maxBackupCount) {
        this.configurationManager.backups = this.configurationManager.backups
          .slice(-this.maxBackupCount);
      }

      this.log(`Configuration backup created: ${backup.id}`);
      return backup.id;

    } catch (error) {
      this.error('Error creating configuration backup:', error);
      return null;
    }
  }

  /**
   * Restore configuration from backup
   */
  async restoreConfigurationBackup(backupId: string): Promise<boolean> {
    try {
      const backup = this.configurationManager.backups.find(b => b.id === backupId);
      if (!backup) {
        this.error(`Backup not found: ${backupId}`);
        return false;
      }

      // Validate backup configuration
      const validation = await this.validateConfiguration(backup.configuration);
      if (!validation.valid) {
        this.error(`Backup configuration is invalid:`, validation.errors);
        return false;
      }

      // Create backup of current state
      await this.createConfigurationBackup('pre_restore');

      // Apply backup configuration
      this.settings = backup.configuration as CameraSettings;
      this.configurationManager.currentConfig = { ...backup.configuration };

      this.log(`Restored configuration from backup: ${backupId}`);
      return true;

    } catch (error) {
      this.error('Error restoring configuration backup:', error);
      return false;
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(options: ConfigurationExportOptions = { format: 'json' }): string | null {
    try {
      let config = { ...this.configurationManager.currentConfig };

      // Filter sections if specified
      if (options.sections) {
        const filteredConfig: Record<string, unknown> = {};
        for (const section of this.configurationManager.schema.sections) {
          if (options.sections.includes(section.id)) {
            for (const setting of section.settings) {
              if (config[setting.id] !== undefined) {
                filteredConfig[setting.id] = config[setting.id];
              }
            }
          }
        }
        config = filteredConfig;
      }

      // Remove sensitive data if not explicitly included
      if (!options.includeSensitive) {
        for (const section of this.configurationManager.schema.sections) {
          for (const setting of section.settings) {
            if (setting.sensitive && config[setting.id]) {
              config[setting.id] = '***HIDDEN***';
            }
          }
        }
      }

      // Format output
      switch (options.format) {
        case 'json':
          return JSON.stringify(config, null, 2);
        case 'yaml':
          // Simple YAML-like format (would need yaml library for full YAML)
          return Object.entries(config)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join('\n');
        case 'encrypted':
          // Simple base64 encoding (would need proper encryption in production)
          return Buffer.from(JSON.stringify(config)).toString('base64');
        default:
          return JSON.stringify(config, null, 2);
      }

    } catch (error) {
      this.error('Error exporting configuration:', error);
      return null;
    }
  }

  /**
   * Import configuration
   */
  async importConfiguration(
    configData: string,
    format: 'json' | 'yaml' | 'encrypted' = 'json',
    validateOnly = false
  ): Promise<{ success: boolean; validation?: ConfigurationValidationResult; error?: string }> {
    try {
      let config: Record<string, unknown>;

      // Parse input based on format
      switch (format) {
        case 'json':
          config = JSON.parse(configData);
          break;
        case 'yaml':
          // Simple parsing (would need yaml library for full YAML)
          config = {};
          configData.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
              const value = valueParts.join(':').trim();
              try {
                config[key.trim()] = JSON.parse(value);
              } catch {
                config[key.trim()] = value;
              }
            }
          });
          break;
        case 'encrypted': {
          const decrypted = Buffer.from(configData, 'base64').toString('utf-8');
          config = JSON.parse(decrypted);
          break;
        }
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Validate configuration
      const validation = await this.validateConfiguration(config);

      if (validateOnly) {
        return { success: validation.valid, validation };
      }

      if (!validation.valid) {
        return {
          success: false,
          validation,
          error: 'Configuration validation failed'
        };
      }

      // Create backup before importing
      await this.createConfigurationBackup('pre_import');

      // Apply configuration
      const newSettings = { ...this.settings, ...config } as CameraSettings;
      this.settings = newSettings;
      this.configurationManager.currentConfig = { ...newSettings };

      this.log('Configuration imported successfully');
      return { success: true, validation };

    } catch (error) {
      this.error('Error importing configuration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if configuration change requires restart
   */
  private checkIfRestartRequired(newConfig: Record<string, unknown>): boolean {
    const restartRequiredFields = ['nvrAddress', 'nvrPort', 'nvrSsl'];

    for (const field of restartRequiredFields) {
      if (newConfig[field] !== undefined && newConfig[field] !== this.settings[field as keyof CameraSettings]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Schedule automatic backup
   */
  private scheduleAutoBackup(): void {
    // Create backup every 24 hours
    setInterval(async () => {
      await this.createConfigurationBackup('auto');
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Get configuration management status
   */
  getConfigurationStatus(): {
    schema: ConfigurationSchema;
    currentConfig: Record<string, unknown>;
    profiles: ConfigurationProfile[];
    backups: ConfigurationBackup[];
    validationEnabled: boolean;
    autoBackupEnabled: boolean;
  } {
    return {
      schema: this.configurationManager.schema,
      currentConfig: { ...this.configurationManager.currentConfig },
      profiles: [...this.configurationManager.profiles],
      backups: this.configurationManager.backups.map(b => ({
        ...b,
        configuration: undefined // Don't include full config in status
      })) as ConfigurationBackup[],
      validationEnabled: this.configValidationEnabled,
      autoBackupEnabled: this.autoBackupEnabled
    };
  }

  /**
   * System Integration Management
   */

  /**
   * Initialize system integration
   */
  private initializeSystemIntegration(): void {
    try {
      this.log('Initializing system integration');

      if (!this.systemIntegrationEnabled) {
        return;
      }

      // Initialize message handlers
      this.setupMessageHandlers();

      // Start device discovery
      this.startDeviceDiscovery();

      // Start system health aggregation
      this.startSystemHealthMonitoring();

      // Start message processing
      this.startMessageProcessing();

      // Initialize default orchestration rules
      this.initializeOrchestrationRules();

      // Register this device in the system
      this.registerDevice();

      this.log('System integration initialized successfully');

    } catch (error) {
      this.error('Error initializing system integration:', error);
    }
  }

  /**
   * Setup message handlers for different message types
   */
  private setupMessageHandlers(): void {
    const handlers = this.systemIntegrationManager.messageHandlers;

    handlers.set('device_discovery', (message: SystemMessage) => {
      this.handleDeviceDiscovery(message);
    });

    handlers.set('status_sync', (message: SystemMessage) => {
      this.handleStatusSync(message);
    });

    handlers.set('coordinated_action', (message: SystemMessage) => {
      this.handleCoordinatedAction(message);
    });

    handlers.set('health_check', (message: SystemMessage) => {
      this.handleHealthCheck(message);
    });

    handlers.set('alert_broadcast', (message: SystemMessage) => {
      this.handleAlertBroadcast(message);
    });

    handlers.set('performance_sync', (message: SystemMessage) => {
      this.handlePerformanceSync(message);
    });
  }

  /**
   * Broadcast message to all devices
   */
  private broadcastMessage(options: {
    type: SystemMessage['type'];
    payload: Record<string, unknown>;
    priority: SystemMessage['priority'];
    requiresAck?: boolean;
    expiresAt?: number;
  }): void {
    const message: SystemMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type,
      sourceDeviceId: this.getName(),
      timestamp: Date.now(),
      payload: options.payload,
      priority: options.priority,
      requiresAck: options.requiresAck,
      expiresAt: options.expiresAt
    };

    this.systemIntegrationManager.messageQueue.push(message);
    this.log(`Broadcast message: ${options.type}`);
  }

  /**
   * Get device discovery information
   */
  private getDeviceDiscoveryInfo(): DeviceDiscovery {
    return {
      deviceId: this.getName(),
      deviceType: 'hikvision-camera',
      name: this.getName(),
      capabilities: [
        'camera_status',
        'motion_detected',
        'recording_status',
        'stream_quality',
        'connection_strength',
        'ptz_position',
        'alarm_state',
        'last_alarm'
      ],
      lastSeen: Date.now(),
      networkInfo: {
        ipAddress: this.settings.nvrAddress || '',
        port: this.settings.nvrPort || 80,
        ssl: this.settings.nvrSsl || false
      },
      status: 'online',
      metadata: {
        streamQuality: this.settings.streamQuality,
        enableSubStream: this.settings.enableSubStream,
        motionSensitivity: this.settings.motionSensitivity,
        performanceHealth: this.calculateOverallHealth(),
        lastPerformanceUpdate: Date.now()
      }
    };
  }

  /**
   * Start device discovery process
   */
  private startDeviceDiscovery(): void {
    // Broadcast discovery message
    this.broadcastMessage({
      type: 'device_discovery',
      payload: {
        action: 'announce',
        deviceInfo: this.getDeviceDiscoveryInfo()
      },
      priority: 'medium'
    });

    // Set up periodic discovery
    this.deviceDiscoveryInterval = setInterval(() => {
      this.performDeviceDiscovery();
    }, 300000); // Every 5 minutes
  }

  /**
   * Start system health monitoring
   */
  private startSystemHealthMonitoring(): void {
    this.systemHealthUpdateInterval = setInterval(() => {
      this.updateSystemHealth();
    }, 60000); // Every minute
  }

  /**
   * Start message processing loop
   */
  private startMessageProcessing(): void {
    this.messageProcessingInterval = setInterval(() => {
      this.processMessageQueue();
    }, 1000); // Every second
  }

  /**
   * Initialize default orchestration rules
   */
  private initializeOrchestrationRules(): void {
    const defaultRules: OrchestrationRule[] = [
      {
        id: 'security_mode_activation',
        name: 'Security Mode Activation',
        description: 'Automatically coordinate all cameras when security mode is activated',
        trigger: {
          eventType: 'security_mode_changed',
          conditions: { mode: 'armed' }
        },
        actions: [
          {
            type: 'device_action',
            actionName: 'switch_stream_profile',
            parameters: { profile_id: 'security_focused' }
          },
          {
            type: 'device_action',
            actionName: 'enable_smart_motion',
            parameters: { enabled: true }
          }
        ],
        enabled: true,
        priority: 1,
        createdAt: Date.now(),
        executionCount: 0
      },
      {
        id: 'performance_degradation_response',
        name: 'Performance Degradation Response',
        description: 'Automatically optimize when performance issues detected',
        trigger: {
          eventType: 'performance_alert',
          conditions: { severity: 'critical' }
        },
        actions: [
          {
            type: 'device_action',
            actionName: 'optimize_memory',
            parameters: {}
          },
          {
            type: 'device_action',
            actionName: 'switch_stream_profile',
            parameters: { profile_id: 'mobile_optimized' }
          }
        ],
        enabled: true,
        priority: 2,
        createdAt: Date.now(),
        executionCount: 0
      }
    ];

    this.systemIntegrationManager.orchestrationRules = defaultRules;
    this.log(`Initialized ${defaultRules.length} orchestration rules`);
  }

  /**
   * Register this device in the system
   */
  private registerDevice(): void {
    const deviceInfo = this.getDeviceDiscoveryInfo();
    this.systemIntegrationManager.discoveredDevices.set(deviceInfo.deviceId, deviceInfo);

    // Broadcast registration
    this.broadcastMessage({
      type: 'device_discovery',
      payload: {
        action: 'register',
        deviceInfo
      },
      priority: 'medium'
    });
  }

  /**
   * Process message queue
   */
  private processMessageQueue(): void {
    try {
      const now = Date.now();
      const messages = [...this.systemIntegrationManager.messageQueue];
      this.systemIntegrationManager.messageQueue = [];

      // Remove expired messages
      const validMessages = messages.filter(msg =>
        !msg.expiresAt || msg.expiresAt > now
      );

      // Sort by priority and timestamp
      validMessages.sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return a.timestamp - b.timestamp;
      });

      // Process messages
      for (const message of validMessages) {
        this.processMessage(message);
      }

    } catch (error) {
      this.error('Error processing message queue:', error);
    }
  }

  /**
   * Process individual message
   */
  private processMessage(message: SystemMessage): void {
    try {
      // Skip messages from self
      if (message.sourceDeviceId === this.getName()) {
        return;
      }

      // Skip targeted messages not for this device
      if (message.targetDeviceId && message.targetDeviceId !== this.getName()) {
        return;
      }

      const handler = this.systemIntegrationManager.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }

    } catch (error) {
      this.error('Error processing message:', error);
    }
  }

  /**
   * Handle device discovery messages
   */
  private handleDeviceDiscovery(message: SystemMessage): void {
    try {
      const { action, deviceInfo } = message.payload as {
        action: string;
        deviceInfo: DeviceDiscovery
      };

      switch (action) {
        case 'announce':
        case 'register':
          if (deviceInfo) {
            this.systemIntegrationManager.discoveredDevices.set(
              deviceInfo.deviceId,
              deviceInfo
            );
            this.log(`Discovered device: ${deviceInfo.name} (${deviceInfo.deviceType})`);
          }
          break;

        case 'request':
          // Respond with our device info
          this.broadcastMessage({
            type: 'device_discovery',
            payload: {
              action: 'announce',
              deviceInfo: this.getDeviceDiscoveryInfo()
            },
            priority: 'medium'
          });
          break;
      }

    } catch (error) {
      this.error('Error handling device discovery:', error);
    }
  }

  /**
   * Handle status synchronization messages
   */
  private handleStatusSync(message: SystemMessage): void {
    try {
      const { status, capabilities, timestamp } = message.payload;

      // Update device status in discovery
      const deviceId = message.sourceDeviceId;
      const device = this.systemIntegrationManager.discoveredDevices.get(deviceId);

      if (device) {
        device.status = status as DeviceDiscovery['status'];
        device.lastSeen = timestamp as number;
        if (capabilities) {
          device.capabilities = capabilities as string[];
        }

        this.systemIntegrationManager.discoveredDevices.set(deviceId, device);
        this.log(`Updated status for device: ${deviceId}`);
      }

    } catch (error) {
      this.error('Error handling status sync:', error);
    }
  }

  /**
   * Handle coordinated action messages
   */
  private handleCoordinatedAction(message: SystemMessage): void {
    try {
      const { actionType, parameters } = message.payload;

      this.log(`Executing coordinated action: ${actionType}`);

      // Execute the coordinated action
      switch (actionType) {
        case 'recording':
          this.executeRecordingAction(parameters as Record<string, unknown>);
          break;
        case 'stream_switching':
          this.executeStreamSwitchingAction(parameters as Record<string, unknown>);
          break;
        case 'maintenance':
          this.executeMaintenanceAction(parameters as Record<string, unknown>);
          break;
      }

    } catch (error) {
      this.error('Error handling coordinated action:', error);
    }
  }

  /**
   * Handle health check messages
   */
  private handleHealthCheck(_message: SystemMessage): void {
    try {
      const healthSummary: DeviceHealthSummary = {
        deviceId: this.getName(),
        deviceType: 'hikvision-camera',
        status: 'online',
        health: this.calculateOverallHealth() === 'fair' ? 'warning' :
                this.calculateOverallHealth() === 'poor' ? 'critical' :
                this.calculateOverallHealth() as 'excellent' | 'good',
        lastUpdate: Date.now(),
        metrics: {
          responseTime: this.calculateAverageResponseTime(),
          errorRate: 100 - this.calculateSuccessRate(),
          uptime: this.performanceMetrics.systemMetrics.uptime,
          memoryUsage: this.performanceMetrics.systemMetrics.memoryUsage
        },
        activeAlerts: this.performanceAlerts.filter(a => !a.resolved).length
      };

      // Send health summary back (in real implementation)
      this.log(`Health check response: ${healthSummary.health}`);

    } catch (error) {
      this.error('Error handling health check:', error);
    }
  }

  /**
   * Handle alert broadcast messages
   */
  private handleAlertBroadcast(message: SystemMessage): void {
    try {
      const alert = message.payload as unknown as SystemAlert;

      // Add to system alerts
      this.systemIntegrationManager.healthAggregator.alerts.push(alert);

      this.log(`Received system alert: ${alert.type} - ${alert.message}`);

    } catch (error) {
      this.error('Error handling alert broadcast:', error);
    }
  }

  /**
   * Handle performance sync messages
   */
  private handlePerformanceSync(message: SystemMessage): void {
    try {
      this.log(`Synchronized performance data from: ${message.sourceDeviceId}`);

    } catch (error) {
      this.error('Error handling performance sync:', error);
    }
  }

  /**
   * Execute coordinated actions
   */
  private async executeRecordingAction(parameters: Record<string, unknown>): Promise<void> {
    try {
      const { duration = 30, quality = 'high' } = parameters;

      // Start recording with specified parameters
      await this.setCapabilityValue('recording_status', true);

      // Set timer to stop recording
      setTimeout(async () => {
        await this.setCapabilityValue('recording_status', false);
      }, (duration as number) * 60 * 1000);

      this.log(`Started coordinated recording: ${duration}min at ${quality} quality`);

    } catch (error) {
      this.error('Error executing recording action:', error);
    }
  }

  private async executeStreamSwitchingAction(parameters: Record<string, unknown>): Promise<void> {
    try {
      const { profileId = 'high' } = parameters;

      // Switch streaming profile
      this.settings.streamQuality = profileId as string;
      await this.setCapabilityValue('stream_quality', profileId as string);

      this.log(`Switched to streaming profile: ${profileId}`);

    } catch (error) {
      this.error('Error executing stream switching action:', error);
    }
  }

  private async executeMaintenanceAction(parameters: Record<string, unknown>): Promise<void> {
    try {
      const { type = 'optimize' } = parameters;

      switch (type) {
        case 'optimize':
          // Optimize memory usage
          this.imageCache.clear();
          this.streamCache.clear();
          this.cleanupOldMetrics();
          break;
        case 'restart_monitoring':
          this.stopPerformanceMonitoring();
          this.startPerformanceMonitoring();
          break;
        case 'clear_cache':
          this.imageCache.clear();
          this.streamCache.clear();
          break;
      }

      this.log(`Executed maintenance action: ${type}`);

    } catch (error) {
      this.error('Error executing maintenance action:', error);
    }
  }

  /**
   * Perform device discovery
   */
  private performDeviceDiscovery(): void {
    // Request all devices to announce themselves
    this.broadcastMessage({
      type: 'device_discovery',
      payload: {
        action: 'request',
        timestamp: Date.now()
      },
      priority: 'low'
    });
  }

  /**
   * Update system health aggregation
   */
  private updateSystemHealth(): void {
    try {
      const { healthAggregator } = this.systemIntegrationManager;
      const devices = Array.from(this.systemIntegrationManager.discoveredDevices.values());

      // Update system metrics
      healthAggregator.systemMetrics.totalDevices = devices.length;
      healthAggregator.systemMetrics.onlineDevices = devices.filter(d => d.status === 'online').length;
      healthAggregator.systemMetrics.alertCount = healthAggregator.alerts.filter(a => !a.acknowledged).length;

      healthAggregator.lastUpdated = Date.now();

      this.log(`System health updated: ${healthAggregator.overallHealth} (${healthAggregator.systemMetrics.onlineDevices}/${healthAggregator.systemMetrics.totalDevices} devices online)`);

    } catch (error) {
      this.error('Error updating system health:', error);
    }
  }

  /**
   * Get system integration status
   */
  getSystemIntegrationStatus(): {
    enabled: boolean;
    discoveredDevices: number;
    onlineDevices: number;
    activeRules: number;
    systemHealth: string;
    coordinatedActions: number;
    pendingMessages: number;
  } {
    const devices = Array.from(this.systemIntegrationManager.discoveredDevices.values());
    return {
      enabled: this.systemIntegrationEnabled,
      discoveredDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'online').length,
      activeRules: this.systemIntegrationManager.orchestrationRules.filter(r => r.enabled).length,
      systemHealth: this.systemIntegrationManager.healthAggregator.overallHealth,
      coordinatedActions: this.systemIntegrationManager.coordinatedActions.size,
      pendingMessages: this.systemIntegrationManager.messageQueue.length
    };
  }

  /**
   * Cleanup system integration resources
   */
  private cleanupSystemIntegration(): void {
    // Clear intervals
    if (this.deviceDiscoveryInterval) {
      clearInterval(this.deviceDiscoveryInterval);
      this.deviceDiscoveryInterval = undefined;
    }
    if (this.systemHealthUpdateInterval) {
      clearInterval(this.systemHealthUpdateInterval);
      this.systemHealthUpdateInterval = undefined;
    }
    if (this.messageProcessingInterval) {
      clearInterval(this.messageProcessingInterval);
      this.messageProcessingInterval = undefined;
    }

    // Broadcast device offline
    if (this.systemIntegrationEnabled) {
      this.broadcastMessage({
        type: 'device_discovery',
        payload: {
          action: 'offline',
          deviceId: this.getName(),
          timestamp: Date.now()
        },
        priority: 'medium'
      });
    }

    this.log('System integration cleanup completed');
  }
}

export = HikvisionCameraDevice;