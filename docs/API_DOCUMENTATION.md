# Hikvision Camera App - API Documentation

## Table of Contents
1. [Device Class API](#device-class-api)
2. [Performance Monitoring API](#performance-monitoring-api)
3. [Configuration Management API](#configuration-management-api)
4. [System Integration API](#system-integration-api)
5. [Flow Card API](#flow-card-api)
6. [Error Handling](#error-handling)
7. [Data Structures](#data-structures)
8. [Examples](#examples)

## Device Class API

### HikvisionCameraDevice

The main device class that extends Homey's Device class and provides all camera functionality.

#### Constructor
```typescript
constructor(driver: HikvisionCameraDriver)
```

#### Core Methods

##### `onInit(): Promise<void>`
Initializes the device with settings, establishes connections, and starts monitoring.

**Returns:** Promise that resolves when initialization is complete

**Throws:** 
- `Error` if settings are invalid
- `ConnectionError` if camera is unreachable

##### `onDeleted(): Promise<void>`
Cleans up resources and connections when device is removed.

**Returns:** Promise that resolves when cleanup is complete

##### `onSettings(oldSettings: any, newSettings: any, changedKeys: string[]): Promise<void>`
Handles settings changes and applies new configuration.

**Parameters:**
- `oldSettings`: Previous settings object
- `newSettings`: New settings object  
- `changedKeys`: Array of changed setting keys

**Returns:** Promise that resolves when settings are applied

#### Connection Methods

##### `checkConnection(): Promise<ConnectionStatus>`
Tests the connection to the camera and returns status information.

**Returns:** Promise resolving to connection status object

```typescript
interface ConnectionStatus {
  status: 'online' | 'offline' | 'unstable';
  responseTime: number;
  lastCheck?: number;
  errorMessage?: string;
}
```

#### Camera Control Methods

##### `takeSnapshot(): Promise<SnapshotResult>`
Captures a still image from the camera.

**Returns:** Promise resolving to snapshot result

```typescript
interface SnapshotResult {
  success: boolean;
  imageId?: string;
  timestamp: number;
  error?: string;
}
```

##### `startRecording(duration?: number): Promise<RecordingResult>`
Starts manual recording for specified duration.

**Parameters:**
- `duration`: Recording duration in seconds (optional, default: 60)

**Returns:** Promise resolving to recording result

##### `stopRecording(): Promise<RecordingResult>`
Stops current recording.

**Returns:** Promise resolving to recording result

##### `moveToPTZPreset(preset: number): Promise<PTZResult>`
Moves PTZ camera to specified preset position.

**Parameters:**
- `preset`: Preset number (1-255)

**Returns:** Promise resolving to PTZ operation result

## Performance Monitoring API

### Performance Status

##### `getPerformanceStatus(): PerformanceStatus`
Returns current performance metrics and status.

**Returns:** Performance status object

```typescript
interface PerformanceStatus {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  summary: PerformanceSummary;
  isMonitoring: boolean;
}

interface PerformanceMetrics {
  responseTime: number;           // Average response time (ms)
  errorRate: number;              // Error rate (0-1)
  memoryUsage: number;            // Memory usage (MB)
  cpuUsage: number;               // CPU usage percentage
  requestCount: number;           // Total requests made
  successRate: number;            // Success rate (0-1)
}

interface PerformanceAlert {
  type: 'performance_degradation' | 'memory_warning' | 'connection_issue';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface PerformanceSummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  trend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
}
```

##### `optimizePerformance(): Promise<OptimizationResult>`
Performs automatic performance optimization.

**Returns:** Promise resolving to optimization result

## Configuration Management API

### Configuration Profiles

##### `applyConfigurationProfile(profile: ConfigurationProfile): Promise<ConfigurationResult>`
Applies a predefined configuration profile to the camera.

**Parameters:**
- `profile`: Configuration profile object

**Returns:** Promise resolving to configuration result

```typescript
interface ConfigurationProfile {
  name: string;
  settings: {
    resolution?: string;
    fps?: number;
    bitrate?: number;
    quality?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
}

interface ConfigurationResult {
  success: boolean;
  appliedSettings?: string[];
  errors?: string[];
  warnings?: string[];
}
```

##### `backupConfiguration(): Promise<ConfigurationBackup>`
Creates a backup of current camera configuration.

**Returns:** Promise resolving to configuration backup

```typescript
interface ConfigurationBackup {
  settings: any;
  timestamp: number;
  version: string;
  deviceId: string;
}
```

##### `restoreConfiguration(backup: ConfigurationBackup): Promise<ConfigurationResult>`
Restores camera configuration from backup.

**Parameters:**
- `backup`: Configuration backup object

**Returns:** Promise resolving to restoration result

## System Integration API

### System Integration Status

##### `getSystemIntegrationStatus(): SystemIntegrationStatus`
Returns current system integration status and metrics.

**Returns:** System integration status object

```typescript
interface SystemIntegrationStatus {
  enabled: boolean;
  discoveredDevices: number;
  onlineDevices: number;
  activeRules: number;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  coordinatedActions: number;
  pendingMessages: number;
}
```

### Coordinated Actions

##### `executeCoordinatedAction(action: CoordinatedAction): Promise<ActionResult>`
Executes a coordinated action across multiple devices.

**Parameters:**
- `action`: Coordinated action definition

**Returns:** Promise resolving to action result

```typescript
interface CoordinatedAction {
  id: string;
  type: 'start_recording' | 'stop_recording' | 'take_snapshot' | 'ptz_preset' | 'toggle_detection';
  devices: string[];
  settings?: any;
  condition?: string;
  timeout?: number;
}

interface ActionResult {
  success: boolean;
  executedDevices: string[];
  failedDevices: string[];
  errors?: string[];
}
```

### Orchestration Rules

##### `addOrchestrationRule(rule: OrchestrationRule): Promise<RuleResult>`
Adds a new orchestration rule to the system.

**Parameters:**
- `rule`: Orchestration rule definition

**Returns:** Promise resolving to rule result

```typescript
interface OrchestrationRule {
  id: string;
  name: string;
  trigger: {
    type: 'motion_detected' | 'recording_started' | 'camera_online' | 'performance_alert';
    deviceId: string;
    conditions?: any;
  };
  conditions: Array<{
    type: 'time_range' | 'device_status' | 'performance_threshold';
    [key: string]: any;
  }>;
  actions: Array<{
    type: 'start_recording' | 'send_notification' | 'ptz_preset';
    devices: string[];
    settings: any;
  }>;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
}
```

##### `removeOrchestrationRule(ruleId: string): Promise<RuleResult>`
Removes an orchestration rule from the system.

**Parameters:**
- `ruleId`: Rule identifier

**Returns:** Promise resolving to rule result

## Flow Card API

### Trigger Cards

#### Motion Detection
```typescript
// Register motion detection trigger
this.homey.flow.getDeviceTriggerCard('motion_detected')
  .registerRunListener(async (args, state) => {
    return args.device.getId() === state.deviceId;
  });
```

#### Performance Alerts
```typescript
// Register performance alert trigger
this.homey.flow.getDeviceTriggerCard('performance_alert')
  .registerRunListener(async (args, state) => {
    return args.severity === state.severity;
  });
```

### Condition Cards

#### Connection Status
```typescript
// Register connection status condition
this.homey.flow.getDeviceConditionCard('camera_online')
  .registerRunListener(async (args) => {
    const status = await args.device.checkConnection();
    return status.status === 'online';
  });
```

#### Performance Health
```typescript
// Register performance health condition
this.homey.flow.getDeviceConditionCard('performance_health')
  .registerRunListener(async (args) => {
    const status = args.device.getPerformanceStatus();
    return status.summary.overallHealth === args.health_level;
  });
```

### Action Cards

#### Start Recording
```typescript
// Register start recording action
this.homey.flow.getDeviceActionCard('start_recording')
  .registerRunListener(async (args) => {
    return await args.device.startRecording(args.duration);
  });
```

#### Apply Configuration Profile
```typescript
// Register configuration profile action
this.homey.flow.getDeviceActionCard('apply_config_profile')
  .registerRunListener(async (args) => {
    const profile = {
      name: args.profile_name,
      settings: args.profile_settings
    };
    return await args.device.applyConfigurationProfile(profile);
  });
```

## Error Handling

### Error Types

#### `ConnectionError`
Thrown when camera connection fails.
```typescript
class ConnectionError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ConnectionError';
  }
}
```

#### `ConfigurationError`
Thrown when configuration operations fail.
```typescript
class ConfigurationError extends Error {
  constructor(message: string, public invalidSettings?: string[]) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
```

#### `PerformanceError`
Thrown when performance issues are detected.
```typescript
class PerformanceError extends Error {
  constructor(message: string, public metrics?: PerformanceMetrics) {
    super(message);
    this.name = 'PerformanceError';
  }
}
```

### Error Handling Patterns

```typescript
// Connection error handling
try {
  await device.checkConnection();
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection-specific errors
    console.log(`Connection failed: ${error.message}`);
    if (error.statusCode === 401) {
      // Handle authentication errors
    }
  }
}

// Configuration error handling
try {
  await device.applyConfigurationProfile(profile);
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Handle configuration-specific errors
    console.log(`Invalid settings: ${error.invalidSettings?.join(', ')}`);
  }
}
```

## Data Structures

### Camera Settings
```typescript
interface CameraSettings {
  ip: string;
  port: number;
  username: string;
  password: string;
  model?: string;
  channel?: number;
  protocol?: 'http' | 'https';
  timeout?: number;
  refreshInterval?: number;
  qualitySettings?: {
    resolution: string;
    fps: number;
    bitrate: number;
  };
  motionDetection?: {
    enabled: boolean;
    sensitivity: number;
    zones?: MotionZone[];
  };
  recordingSettings?: {
    enabled: boolean;
    type: 'continuous' | 'motion' | 'schedule';
    location: string;
  };
}
```

### Motion Detection
```typescript
interface MotionZone {
  id: string;
  name: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sensitivity: number;
  enabled: boolean;
}

interface MotionEvent {
  timestamp: number;
  zone?: string;
  confidence: number;
  coordinates?: {
    x: number;
    y: number;
  };
}
```

### System Messages
```typescript
interface SystemMessage {
  type: 'device_discovery' | 'status_sync' | 'coordinated_action' | 'health_check' | 'alert_broadcast' | 'performance_sync';
  payload: any;
  priority: 'low' | 'medium' | 'high';
  timestamp?: number;
  deviceId?: string;
}
```

## Examples

### Basic Device Usage

```typescript
// Initialize device
const device = new HikvisionCameraDevice(driver);
await device.onInit();

// Check connection
const status = await device.checkConnection();
console.log(`Camera status: ${status.status}`);

// Take snapshot
const snapshot = await device.takeSnapshot();
if (snapshot.success) {
  console.log(`Snapshot taken: ${snapshot.imageId}`);
}

// Start recording
const recording = await device.startRecording(300); // 5 minutes
console.log(`Recording started: ${recording.success}`);
```

### Performance Monitoring

```typescript
// Get performance status
const performance = device.getPerformanceStatus();
console.log(`Health: ${performance.summary.overallHealth}`);
console.log(`Response time: ${performance.metrics.responseTime}ms`);

// Check for alerts
performance.alerts.forEach(alert => {
  if (!alert.acknowledged && alert.severity === 'high') {
    console.log(`High severity alert: ${alert.message}`);
  }
});

// Optimize performance
const optimization = await device.optimizePerformance();
console.log(`Optimization result: ${optimization.success}`);
```

### Configuration Management

```typescript
// Create backup
const backup = await device.backupConfiguration();
console.log(`Backup created at: ${new Date(backup.timestamp)}`);

// Apply profile
const profile = {
  name: 'Night Mode',
  settings: {
    resolution: '1920x1080',
    fps: 15,
    bitrate: 2048,
    quality: 'medium'
  }
};

const result = await device.applyConfigurationProfile(profile);
if (result.success) {
  console.log(`Applied settings: ${result.appliedSettings?.join(', ')}`);
}
```

### System Integration

```typescript
// Check integration status
const integration = device.getSystemIntegrationStatus();
console.log(`Discovered devices: ${integration.discoveredDevices}`);
console.log(`System health: ${integration.systemHealth}`);

// Execute coordinated action
const action = {
  id: 'emergency-recording',
  type: 'start_recording',
  devices: ['camera1', 'camera2', 'camera3'],
  settings: { duration: 600 },
  condition: 'motion_detected'
};

const actionResult = await device.executeCoordinatedAction(action);
console.log(`Action executed on ${actionResult.executedDevices.length} devices`);

// Add orchestration rule
const rule = {
  id: 'motion-alert-rule',
  name: 'Motion Detection Alert',
  trigger: {
    type: 'motion_detected',
    deviceId: 'camera1'
  },
  conditions: [
    {
      type: 'time_range',
      startTime: '22:00',
      endTime: '06:00'
    }
  ],
  actions: [
    {
      type: 'start_recording',
      devices: ['camera1', 'camera2'],
      settings: { duration: 300 }
    }
  ],
  enabled: true,
  priority: 'high'
};

const ruleResult = await device.addOrchestrationRule(rule);
console.log(`Rule added: ${ruleResult.success}`);
```

---

This API documentation provides comprehensive coverage of all public methods and interfaces available in the Hikvision Camera App. For additional examples and advanced usage patterns, refer to the source code and test files.