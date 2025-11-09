# API Documentation

## Overview

This document provides comprehensive API documentation for the Hikvision Homey app's modular architecture. All modules provide TypeScript-first APIs with full type safety and comprehensive error handling.

## Core Modules API Reference

### PTZ Manager API

#### Constructor
```typescript
constructor(baseUrl: string, auth: { username: string; password: string })
```
Creates a new PTZ Manager instance for camera control.

**Parameters:**
- `baseUrl`: Camera base URL (e.g., 'http://192.168.1.100')
- `auth`: Authentication object with username and password

#### Methods

##### `initialize(): Promise<void>`
Initializes the PTZ manager by loading existing presets and current position.

**Returns:** Promise that resolves when initialization is complete
**Throws:** Error if camera is unreachable or authentication fails

##### `controlPTZ(pan: number, tilt: number, zoom: number): Promise<void>`
Controls camera movement with relative values.

**Parameters:**
- `pan`: Pan movement (-100 to 100, negative = left, positive = right)
- `tilt`: Tilt movement (-100 to 100, negative = down, positive = up)  
- `zoom`: Zoom movement (-100 to 100, negative = zoom out, positive = zoom in)

**Example:**
```typescript
// Pan right, tilt up slightly, zoom in
await ptzManager.controlPTZ(25, 10, 15);
```

##### `goToPreset(presetId: number): Promise<void>`
Moves camera to a saved preset position.

**Parameters:**
- `presetId`: Preset number (1-255)

**Throws:** Error if preset doesn't exist or movement fails

##### `setPreset(presetId: number, name?: string): Promise<void>`
Saves current camera position as a preset.

**Parameters:**
- `presetId`: Preset number to save (1-255)
- `name`: Optional preset name for identification

##### `createNamedPreset(id: number, name: string): Promise<void>`
Creates a named preset at the current position.

**Parameters:**
- `id`: Preset ID (1-255)
- `name`: Descriptive name for the preset

##### `deletePreset(presetId: number): Promise<void>`
Deletes an existing preset.

**Parameters:**
- `presetId`: Preset number to delete

##### `stopPTZ(): Promise<void>`
Stops all PTZ movements immediately.

##### `getCurrentPosition(): Promise<{ pan: number; tilt: number; zoom: number } | null>`
Gets the current camera position if supported.

**Returns:** Position object or null if not supported

---

### Streaming Manager API

#### Constructor
```typescript
constructor(baseUrl: string, auth: { username: string; password: string }, settings: StreamingSettings)
```

#### Methods

##### `initialize(): Promise<void>`
Initializes streaming profiles and adaptive streaming configuration.

##### `getCameraImage(quality?: QualityLevel): Promise<Buffer>`
Captures a camera image with optional quality specification.

**Parameters:**
- `quality`: Optional quality level ('ultra' | 'high' | 'medium' | 'low')

**Returns:** Promise resolving to image buffer
**Example:**
```typescript
const image = await streamManager.getCameraImage('high');
```

##### `switchToProfile(profileId: string): Promise<void>`
Switches to a specific streaming profile.

**Parameters:**
- `profileId`: Profile identifier ('ultra' | 'high' | 'medium' | 'low')

##### `setAdaptiveStreaming(enabled: boolean): Promise<void>`
Enables or disables adaptive streaming based on network conditions.

**Parameters:**
- `enabled`: Whether to enable adaptive streaming

##### `getStreamingStats(): StreamingStats`
Returns current streaming statistics and performance metrics.

**Returns:** Object containing bitrate, fps, errors, and quality information

##### `createStreamProfile(id: string, config: StreamProfile): Promise<void>`
Creates a custom streaming profile.

**Parameters:**
- `id`: Unique profile identifier
- `config`: Stream configuration object

---

### Alarm Manager API

#### Constructor
```typescript
constructor(baseUrl: string, auth: { username: string; password: string })
```

#### Methods

##### `initialize(): Promise<void>`
Initializes alarm processing and loads existing configuration.

##### `processMotionEvent(event: MotionEvent): Promise<void>`
Processes incoming motion detection events.

**Parameters:**
- `event`: Motion event data from camera

##### `addAlarm(type: AlarmType, data: AlarmData): Promise<void>`
Adds a new alarm to the history.

**Parameters:**
- `type`: Type of alarm ('motion' | 'intrusion' | 'tampering' | 'line_crossing')
- `data`: Alarm-specific data

##### `createMotionZone(name: string, sensitivity: Sensitivity): Promise<void>`
Creates a new motion detection zone.

**Parameters:**
- `name`: Zone identifier/name
- `sensitivity`: Detection sensitivity ('low' | 'medium' | 'high')

##### `getAlarmHistory(hours?: number): AlarmEvent[]`
Retrieves alarm history for specified time period.

**Parameters:**
- `hours`: Hours to look back (default: 24)

**Returns:** Array of alarm events

##### `clearAlarmHistory(): Promise<void>`
Clears all stored alarm history.

##### `enableSmartMotion(enabled: boolean): Promise<void>`
Enables or disables smart motion detection features.

---

### Performance Optimizer API

#### Constructor
```typescript
constructor()
```
Initializes performance optimization with default settings.

#### Methods

##### `initialize(): Promise<void>`
Starts performance monitoring and optimization routines.

##### `cacheImage(key: string, image: Buffer, ttl?: number): Promise<void>`
Caches an image with optional TTL.

**Parameters:**
- `key`: Cache key identifier
- `image`: Image data buffer
- `ttl`: Time to live in milliseconds (default: 5 minutes)

##### `getCachedImage(key: string): Buffer | null`
Retrieves a cached image if available and not expired.

**Parameters:**
- `key`: Cache key identifier

**Returns:** Image buffer or null if not found/expired

##### `optimizeMemoryUsage(): Promise<void>`
Performs manual memory optimization and cleanup.

##### `generatePerformanceReport(hours?: number): PerformanceReport`
Generates a comprehensive performance report.

**Parameters:**
- `hours`: Time period for report (default: 24)

**Returns:** Detailed performance metrics and recommendations

##### `resetPerformanceMetrics(): Promise<void>`
Resets all performance counters and statistics.

##### `configureMemoryLimits(limits: MemoryLimits): Promise<void>`
Updates memory management configuration.

**Parameters:**
- `limits`: New memory limit configuration

---

## Type Definitions

### Core Types

#### `QualityLevel`
```typescript
type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';
```

#### `AlarmType`
```typescript
type AlarmType = 'motion' | 'intrusion' | 'tampering' | 'line_crossing' | 'video_loss';
```

#### `Sensitivity`
```typescript
type Sensitivity = 'low' | 'medium' | 'high';
```

### Interface Definitions

#### `CameraSettings`
```typescript
interface CameraSettings {
  channel: number;
  name: string;
  nvrDeviceId: string;
  streamQuality: QualityLevel;
  streamResolution: string;
  enableSubStream: boolean;
  snapshotResolution: QualityLevel;
  ptzEnabled: boolean;
  motionDetection: boolean;
  alarmEnabled: boolean;
  recordingEnabled: boolean;
  username: string;
  password: string;
  ipAddress: string;
  port: number;
  useSSL: boolean;
}
```

#### `PTZPreset`
```typescript
interface PTZPreset {
  id: number;
  name: string;
  position: {
    pan: number;
    tilt: number;
    zoom: number;
  };
  created: Date;
  lastUsed?: Date;
}
```

#### `StreamProfile`
```typescript
interface StreamProfile {
  id: string;
  name: string;
  resolution: string;
  bitrate: number;
  fps: number;
  codec: string;
  enabled: boolean;
}
```

#### `AlarmEvent`
```typescript
interface AlarmEvent {
  id: string;
  type: AlarmType;
  timestamp: Date;
  channel?: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: Record<string, unknown>;
  acknowledged: boolean;
}
```

#### `PerformanceMetrics`
```typescript
interface PerformanceMetrics {
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRatio: number;
    size: number;
  };
  network: {
    requests: number;
    errors: number;
    averageResponseTime: number;
    errorRate: number;
  };
  streaming: {
    activeStreams: number;
    totalBytesTransferred: number;
    averageBitrate: number;
  };
}
```

---

## Error Handling

### Error Types

All API methods can throw the following error types:

#### `CameraConnectionError`
Thrown when camera is unreachable or authentication fails.

#### `InvalidParameterError`
Thrown when invalid parameters are provided to API methods.

#### `ResourceLimitError`
Thrown when resource limits are exceeded (memory, connections, etc.).

#### `FeatureNotSupportedError`
Thrown when attempting to use features not supported by the camera.

### Error Handling Best Practices

```typescript
try {
  await ptzManager.goToPreset(1);
} catch (error) {
  if (error instanceof CameraConnectionError) {
    // Handle connection issues
    console.log('Camera unreachable, trying fallback');
  } else if (error instanceof InvalidParameterError) {
    // Handle parameter validation
    console.log('Invalid preset number');
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

---

## Usage Examples

### Complete Camera Setup
```typescript
import { PTZManager, StreamingManager, AlarmManager, PerformanceOptimizer } from './lib/camera';

// Initialize all managers
const baseUrl = 'http://192.168.1.100';
const auth = { username: 'admin', password: 'password' };

const ptzManager = new PTZManager(baseUrl, auth);
const streamManager = new StreamingManager(baseUrl, auth, settings);
const alarmManager = new AlarmManager(baseUrl, auth);
const optimizer = new PerformanceOptimizer();

// Initialize all systems
await Promise.all([
  ptzManager.initialize(),
  streamManager.initialize(),
  alarmManager.initialize(),
  optimizer.initialize()
]);
```

### Advanced PTZ Control
```typescript
// Create named presets
await ptzManager.createNamedPreset(1, 'Front Door');
await ptzManager.createNamedPreset(2, 'Backyard');
await ptzManager.createNamedPreset(3, 'Driveway');

// Navigate between presets
await ptzManager.goToPreset(1); // Go to front door
await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
await ptzManager.goToPreset(2); // Go to backyard
```

### Adaptive Streaming Setup
```typescript
// Enable adaptive streaming
await streamManager.setAdaptiveStreaming(true);

// Create custom quality profiles
await streamManager.createStreamProfile('night', {
  id: 'night',
  name: 'Night Mode',
  resolution: '1280x720',
  bitrate: 1024,
  fps: 15,
  codec: 'H.264',
  enabled: true
});

// Switch profiles based on conditions
if (isNightTime) {
  await streamManager.switchToProfile('night');
} else {
  await streamManager.switchToProfile('high');
}
```

### Smart Motion Detection
```typescript
// Create motion zones
await alarmManager.createMotionZone('entrance', 'high');
await alarmManager.createMotionZone('parking', 'medium');

// Enable smart motion
await alarmManager.enableSmartMotion(true);

// Process motion events
alarmManager.on('motionDetected', (event) => {
  console.log(`Motion detected in ${event.zone}: ${event.confidence}%`);
});
```

---

## Performance Guidelines

### Memory Management
- Always use the Performance Optimizer for caching
- Set appropriate cache TTL values
- Monitor memory usage in production
- Implement cleanup routines for long-running operations

### Network Optimization
- Use connection pooling for multiple requests
- Implement retry logic with exponential backoff
- Cache frequently accessed images
- Monitor response times and adjust timeouts

### Error Recovery
- Implement graceful degradation for network issues
- Use cached data when cameras are unavailable
- Provide user feedback for connection problems
- Log errors for debugging and monitoring

This API documentation provides comprehensive coverage of all available functionality in the modular Hikvision camera integration system.