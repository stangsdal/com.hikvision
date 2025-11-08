# Hikvision Camera App for Homey - User Guide

## Table of Contents
1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Device Configuration](#device-configuration)
4. [Flow Cards](#flow-cards)
5. [Advanced Features](#advanced-features)
6. [System Integration](#system-integration)
7. [Performance Monitoring](#performance-monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Installation

### Requirements
- Homey Pro (2019 or later) with firmware v8.0.0+
- Hikvision IP Camera with firmware v5.4.0+
- Network connectivity between Homey and camera
- Administrator credentials for the camera

### Installation Steps
1. Open the Homey app on your smartphone
2. Navigate to "More" → "Apps" → "App Store"
3. Search for "Hikvision Camera"
4. Tap "Install" and wait for completion
5. Return to the main screen and tap "Devices"
6. Tap the "+" to add a new device
7. Select "Hikvision Camera" from the list

## Initial Setup

### Camera Discovery
The app supports both automatic and manual device discovery:

**Automatic Discovery:**
1. Ensure your camera is on the same network as Homey
2. Select "Search for devices" during pairing
3. Choose your camera from the discovered devices
4. Enter administrator credentials when prompted

**Manual Setup:**
1. Select "Add device manually"
2. Enter the camera's IP address
3. Configure port (default: 80)
4. Provide administrator username and password
5. Test connection and complete setup

### Initial Configuration
After successful pairing:
1. **Device Name**: Set a descriptive name (e.g., "Front Door Camera")
2. **Room Assignment**: Assign to appropriate room
3. **Basic Settings**: Configure refresh intervals and quality settings
4. **Test Functionality**: Verify live stream and basic controls work

## Device Configuration

### Connection Settings
- **IP Address**: Camera's static IP address (recommended)
- **Port**: HTTP port (usually 80 or 8080)
- **Username/Password**: Administrator credentials
- **Protocol**: HTTP or HTTPS (if supported)
- **Timeout**: Request timeout (5-30 seconds)

### Video Settings
- **Main Stream**: Primary video stream configuration
  - Resolution: 4K, 1080p, 720p, etc.
  - Frame Rate: 1-30 FPS
  - Bitrate: 512-8192 Kbps
  - Encoding: H.264/H.265
- **Sub Stream**: Secondary stream for mobile viewing
  - Lower resolution for bandwidth efficiency
  - Optimized for remote access

### Recording Settings
- **Continuous Recording**: 24/7 recording to NAS/SD card
- **Motion Recording**: Record only when motion detected
- **Schedule Recording**: Time-based recording schedules
- **Storage Location**: Local SD card or NAS configuration

### Motion Detection
- **Sensitivity**: Adjust detection sensitivity (1-100)
- **Detection Areas**: Define specific zones for monitoring
- **Filtering**: Size and time-based filtering
- **Notifications**: Configure alert preferences

## Flow Cards

### Trigger Cards (When...)
1. **Motion Detected**: Triggers when camera detects motion
   - Tokens: timestamp, confidence level, detection area
2. **Recording Started**: When recording begins
   - Tokens: recording type, duration, storage location
3. **Recording Stopped**: When recording ends
   - Tokens: file size, duration, reason
4. **Camera Online**: When camera comes online
   - Tokens: connection time, IP address
5. **Camera Offline**: When camera goes offline
   - Tokens: last seen, disconnect reason
6. **Performance Alert**: When performance issues detected
   - Tokens: alert type, severity, metrics
7. **Configuration Changed**: When settings are modified
   - Tokens: setting name, old value, new value

### Condition Cards (And...)
1. **Motion Currently Detected**: Check if motion is active
2. **Camera Online**: Check connection status
3. **Recording Active**: Check if currently recording
4. **Night Mode Active**: Check infrared status
5. **Performance Health**: Check system health status
   - Options: excellent, good, fair, poor
6. **Memory Usage**: Check memory consumption level
7. **Response Time**: Check connection speed
8. **Error Rate**: Check system reliability

### Action Cards (Then...)
1. **Start Recording**: Begin manual recording
   - Duration: 1-300 seconds
   - Quality: High/Medium/Low
2. **Stop Recording**: End current recording
3. **Take Snapshot**: Capture still image
   - Quality settings
   - Timestamp overlay
4. **Enable/Disable Motion Detection**: Toggle detection
5. **Move to PTZ Preset**: For PTZ cameras
   - Preset number (1-255)
   - Movement speed
6. **Send Notification**: Custom alerts
   - Message text
   - Image attachment
7. **Apply Configuration Profile**: Load preset settings
   - Profile selection
   - Validation options
8. **Test Connection**: Verify camera connectivity
9. **Restart Camera**: Reboot device (if supported)
10. **Create Smart Motion Zone**: Dynamic zone creation
    - Zone coordinates
    - Sensitivity settings
11. **Performance Optimization**: Automatic tuning
    - Memory cleanup
    - Connection optimization

## Advanced Features

### Performance Monitoring
The app continuously monitors camera performance:
- **Response Times**: Connection speed tracking
- **Memory Usage**: System resource monitoring  
- **Error Rates**: Reliability metrics
- **Success Rates**: Operation success tracking
- **Trend Analysis**: Long-term performance trends

### Configuration Profiles
Save and apply different camera configurations:
- **High Quality**: Maximum resolution and bitrate
- **Balanced**: Optimized for general use
- **Low Bandwidth**: Minimal data usage
- **Night Mode**: Optimized for low-light conditions
- **Custom**: User-defined settings

### Adaptive Streaming
Automatic quality adjustment based on:
- Network conditions
- Device capabilities
- Usage patterns
- Time of day

## System Integration

### Multi-Device Coordination
For users with multiple cameras:
- **Synchronized Recording**: Record on all cameras simultaneously
- **Coordinated PTZ**: Move multiple PTZ cameras together
- **System-wide Settings**: Apply configurations to all devices
- **Cross-device Triggers**: Actions on one camera affect others

### Device Discovery
Automatic discovery of Hikvision cameras on the network:
- Network scanning for compatible devices
- Status monitoring of discovered cameras
- Health aggregation across all devices
- Coordinated actions and orchestration rules

### Health Monitoring
System-wide health monitoring:
- Overall system health status
- Device online/offline tracking
- Performance aggregation
- Alert management and notifications

## Performance Monitoring

### Metrics Dashboard
Monitor key performance indicators:
- **Connection Status**: Online/Offline/Unstable
- **Response Time**: Current and average latency
- **Memory Usage**: Current consumption and trends
- **CPU Usage**: Processing load
- **Network Bandwidth**: Data transfer rates
- **Error Rate**: Failed operations percentage
- **Success Rate**: Successful operations percentage

### Alerts and Notifications
Automatic alerts for:
- Performance degradation
- Connection issues
- Memory warnings
- High error rates
- Configuration changes
- System events

### Optimization Features
Automatic performance optimization:
- Memory cleanup routines
- Connection pool management
- Request throttling
- Circuit breaker patterns
- Adaptive retry mechanisms

## Troubleshooting

### Common Issues

**Camera Not Found During Pairing:**
1. Verify camera is powered on and connected to network
2. Check IP address and ensure it's accessible from Homey
3. Confirm camera is not in sleep mode
4. Try manual IP address entry

**Connection Timeouts:**
1. Check network stability between Homey and camera
2. Increase timeout settings in device configuration
3. Verify camera isn't overloaded with other connections
4. Restart both Homey and camera

**Poor Video Quality:**
1. Check network bandwidth availability
2. Adjust bitrate and resolution settings
3. Verify camera lens is clean
4. Check lighting conditions

**Motion Detection Not Working:**
1. Verify motion detection is enabled
2. Adjust sensitivity settings
3. Check detection areas configuration
4. Ensure adequate lighting for detection

**Recording Issues:**
1. Check available storage space
2. Verify recording settings and schedules
3. Confirm proper permissions on storage location
4. Check camera's internal recording status

### Performance Issues

**Slow Response Times:**
1. Check network latency and bandwidth
2. Reduce concurrent connections to camera
3. Optimize video settings for lower bandwidth
4. Consider upgrading network infrastructure

**High Memory Usage:**
1. Enable automatic memory cleanup
2. Reduce image refresh frequency
3. Lower video quality settings temporarily
4. Restart the Homey app if needed

**Frequent Disconnections:**
1. Check camera power supply stability
2. Verify network infrastructure reliability
3. Update camera firmware if available
4. Configure connection retry settings

### Advanced Diagnostics

**Connection Testing:**
Use the built-in connection test feature:
1. Go to device settings
2. Select "Test Connection"
3. Review detailed connection report
4. Check response times and error rates

**Performance Reports:**
Access detailed performance metrics:
1. Open device settings
2. Navigate to "Performance"
3. Review current metrics and trends
4. Export performance data if needed

**Log Analysis:**
Enable detailed logging for troubleshooting:
1. Enable debug mode in app settings
2. Reproduce the issue
3. Export logs from Homey developer tools
4. Contact support with log files

## Best Practices

### Network Configuration
1. **Use Static IP Addresses**: Prevent connection issues
2. **Dedicated VLAN**: Isolate camera traffic for security
3. **Quality of Service**: Prioritize camera traffic
4. **Regular Network Monitoring**: Check for congestion

### Camera Maintenance
1. **Regular Firmware Updates**: Keep cameras up to date
2. **Lens Cleaning**: Maintain image quality
3. **Physical Security**: Protect cameras from tampering
4. **Backup Configurations**: Save settings before changes

### Performance Optimization
1. **Right-size Video Settings**: Balance quality vs. bandwidth
2. **Strategic Motion Detection**: Use zones effectively
3. **Scheduled Recording**: Optimize storage usage
4. **Regular Performance Reviews**: Monitor trends

### Security Considerations
1. **Strong Passwords**: Use complex administrator passwords
2. **Network Segmentation**: Isolate cameras from main network
3. **Regular Security Audits**: Check for vulnerabilities
4. **Access Control**: Limit who can modify camera settings

### Flow Design
1. **Efficient Triggers**: Avoid excessive motion detection flows
2. **Conditional Logic**: Use conditions to reduce unnecessary actions
3. **Error Handling**: Include fallback actions in flows
4. **Testing**: Thoroughly test flows before deployment

### Monitoring and Maintenance
1. **Regular Health Checks**: Monitor performance metrics
2. **Proactive Maintenance**: Address issues before they become problems
3. **Documentation**: Keep records of configurations and changes
4. **Backup Strategies**: Regular backups of Homey and camera configs

---

For additional support, visit the Homey Community Forum or contact the app developer through the Homey App Store.