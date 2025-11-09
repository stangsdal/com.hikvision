# Architecture Documentation

## Overview

The Hikvision Homey app follows a modular, type-safe architecture designed for maintainability, performance, and extensibility. The codebase has been transformed from a monolithic structure to a modern, well-organized system following best practices.

## Core Architecture Principles

### 1. Separation of Concerns
Each module has a single, well-defined responsibility:
- **PTZ Manager**: Camera movement and preset management
- **Streaming Manager**: Video streaming and image capture
- **Alarm Manager**: Motion detection and alarm processing
- **Performance Optimizer**: Resource management and optimization

### 2. Type Safety
Comprehensive TypeScript coverage with:
- 50+ custom interfaces for Hikvision API integration
- Strict type checking for all camera operations
- Generic types for flexible yet safe operations
- Runtime type validation where needed

### 3. Performance First
Built-in performance optimization:
- Connection pooling for HTTP requests
- Intelligent caching with automatic cleanup
- Memory management with configurable limits
- Real-time resource monitoring

### 4. Extensibility
Modular design allows easy addition of:
- New camera features and capabilities
- Additional device types (cameras, NVRs, doorbells)
- Enhanced streaming profiles
- Custom alarm processing logic

## Module Architecture

### Core Modules (`src/lib/`)

#### 1. Shared Types (`src/lib/shared/camera-types.ts`)
**Purpose**: Centralized type definitions for all camera functionality

**Key Interfaces**:
- `CameraSettings`: Core camera configuration
- `PTZPreset`: Position presets for PTZ cameras
- `StreamProfile`: Video streaming configurations
- `AlarmEvent`: Motion detection and alarm data
- `PerformanceMetrics`: Resource usage tracking

**Design Features**:
- Generic types for flexible API responses
- Strict typing for camera capabilities
- Extensible interfaces for future features

#### 2. PTZ Manager (`src/lib/camera/ptz-manager.ts`)
**Purpose**: Pan-Tilt-Zoom control and preset management

**Key Features**:
- Real-time camera movement control
- Named preset creation and management
- Position tracking and validation
- PTZ capability detection

**API Methods**:
```typescript
controlPTZ(pan: number, tilt: number, zoom: number): Promise<void>
goToPreset(presetId: number): Promise<void>
setPreset(presetId: number, name?: string): Promise<void>
createNamedPreset(id: number, name: string): Promise<void>
```

#### 3. Streaming Manager (`src/lib/camera/streaming-manager.ts`)
**Purpose**: Video streaming and adaptive quality management

**Key Features**:
- Multiple quality profiles (Ultra, High, Medium, Low)
- Adaptive streaming based on network conditions
- Real-time image capture and caching
- Streaming statistics and monitoring

**API Methods**:
```typescript
getCameraImage(quality?: QualityLevel): Promise<Buffer>
switchToProfile(profileId: string): Promise<void>
setAdaptiveStreaming(enabled: boolean): Promise<void>
```

#### 4. Alarm Manager (`src/lib/camera/alarm-manager.ts`)
**Purpose**: Motion detection and alarm event processing

**Key Features**:
- Smart motion zone management
- Alarm history tracking
- Event filtering and cooldown management
- Integration with Homey flow triggers

**API Methods**:
```typescript
processMotionEvent(event: MotionEvent): Promise<void>
addAlarm(type: AlarmType, data: AlarmData): Promise<void>
createMotionZone(name: string, sensitivity: Sensitivity): Promise<void>
```

#### 5. Performance Optimizer (`src/lib/camera/performance-optimizer.ts`)
**Purpose**: Resource management and performance optimization

**Key Features**:
- Memory management with automatic cleanup
- HTTP connection pooling
- Real-time resource monitoring
- Performance metrics tracking

**API Methods**:
```typescript
cacheImage(key: string, image: Buffer): Promise<void>
getCachedImage(key: string): Buffer | null
optimizeMemoryUsage(): Promise<void>
generatePerformanceReport(): PerformanceReport
```

### Device Drivers (`src/drivers/`)

#### Camera Driver (`src/drivers/hikvision-camera/`)
- **device.ts**: Individual IP camera management
- **driver.ts**: Camera driver logic and pairing

#### NVR Driver (`src/drivers/hikvision-camnvr/`)
- **device.ts**: Network Video Recorder management
- **driver.ts**: NVR driver logic and multi-camera support
- **hikvision.ts**: Hikvision API utility functions

## Data Flow Architecture

### 1. Camera Initialization
```
Device Pairing → Driver Registration → Device Creation → Module Initialization
```

### 2. PTZ Control Flow
```
Homey Flow Action → PTZ Manager → HTTP Request → Camera Response → Position Update
```

### 3. Streaming Flow
```
Image Request → Streaming Manager → Quality Selection → Cache Check → HTTP Request → Image Processing → Cache Store → Response
```

### 4. Alarm Processing Flow
```
Camera Event → Alarm Manager → Event Filtering → Motion Processing → Homey Trigger → Flow Execution
```

### 5. Performance Monitoring Flow
```
Resource Monitor → Memory Check → Connection Pool Status → Cache Cleanup → Performance Report
```

## Configuration Management

### App Configuration (`.homeycompose/`)
- **app.json**: Main app metadata and settings
- **capabilities/**: Custom capability definitions
- **drivers/**: Driver-specific configurations

### Build Configuration
- **tsconfig.json**: TypeScript compiler settings
- **package.json**: Dependencies and build scripts
- **eslint.config.js**: Code quality and style rules

## Performance Optimizations

### 1. Memory Management
- Configurable memory limits (default: 100MB)
- Automatic garbage collection
- Cache size monitoring and cleanup
- Memory usage alerts and reporting

### 2. Connection Pooling
- Reusable HTTP connections
- Configurable pool size (default: 10 connections)
- Connection timeout handling
- Automatic connection cleanup

### 3. Caching Strategy
- Image caching with TTL expiration
- Stream URL caching
- Performance metrics caching
- Cache size limits and cleanup

### 4. Resource Monitoring
- Real-time memory usage tracking
- Response time monitoring
- Error rate calculation
- Performance health scoring

## Error Handling Strategy

### 1. Graceful Degradation
- Fallback to cached images when camera unavailable
- Automatic retry with exponential backoff
- Quality reduction under resource constraints
- Partial feature availability during issues

### 2. Error Recovery
- Automatic reconnection attempts
- Cache invalidation on errors
- Resource cleanup on failures
- Health monitoring and alerts

### 3. Logging and Diagnostics
- Structured error logging
- Performance metrics collection
- Debug information for troubleshooting
- Health check endpoints

## Security Considerations

### 1. Credential Management
- Encrypted credential storage
- Secure HTTP authentication
- Connection timeout enforcement
- SSL/TLS certificate validation

### 2. Network Security
- Input validation for all API calls
- URL sanitization and validation
- Rate limiting for API requests
- Secure image data handling

## Extensibility Points

### 1. Adding New Camera Features
1. Define interfaces in `camera-types.ts`
2. Implement functionality in appropriate manager
3. Add flow cards in `.homeycompose/`
4. Update device capabilities

### 2. Supporting New Device Types
1. Create new driver directory
2. Implement driver and device classes
3. Reuse existing managers where possible
4. Add device-specific configurations

### 3. Enhancing Performance
1. Add new metrics to `PerformanceOptimizer`
2. Implement new caching strategies
3. Add resource monitoring capabilities
4. Create optimization algorithms

## Testing Strategy

### 1. Unit Testing
- Individual module testing
- Mock external dependencies
- Type safety validation
- Error condition testing

### 2. Integration Testing
- End-to-end camera operations
- Flow card functionality
- Performance under load
- Error recovery testing

### 3. Performance Testing
- Memory usage validation
- Response time benchmarks
- Concurrent operation testing
- Resource cleanup verification

## Development Guidelines

### 1. Code Organization
- Follow the established module structure
- Use appropriate TypeScript types
- Implement comprehensive error handling
- Add JSDoc documentation for all public APIs

### 2. Performance Considerations
- Always use the Performance Optimizer for resource-intensive operations
- Implement caching for frequently accessed data
- Monitor memory usage in long-running operations
- Use connection pooling for HTTP requests

### 3. Type Safety
- Define interfaces for all external API responses
- Use generic types for flexible yet safe operations
- Validate runtime data against TypeScript interfaces
- Avoid `any` types except for legacy integrations

This architecture provides a solid foundation for maintaining and extending the Hikvision Homey app while ensuring performance, reliability, and developer productivity.