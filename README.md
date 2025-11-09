# Hikvision for Homey

A comprehensive Homey app for integrating Hikvision IP cameras and NVRs with your smart home automation system.

## 🎯 Features

- **📹 Camera Integration**: Support for Hikvision IP cameras and Network Video Recorders (NVR)
- **🔔 Real-time Alarms**: Receive motion detection, intrusion detection, and other camera events in Homey flows
- **🎮 PTZ Control**: Control Pan-Tilt-Zoom cameras directly from Homey
- **📸 Camera Images**: Capture and use camera snapshots in flows and notifications
- **🏠 Smart Home Integration**: Seamlessly integrate camera events with your home automation
- **🔗 Multi-Camera Support**: Support for up to 16 cameras per NVR device

## 🏗️ Architecture

This app is built with modern technologies and follows a modular architecture:

### Core Technologies
- **TypeScript**: Fully typed codebase for better reliability and maintainability
- **Homey SDK 3**: Latest Homey development framework with async/await patterns
- **Modern Build System**: Automated compilation and asset management
- **Type Safety**: Comprehensive custom type definitions for Hikvision API integration

### Modular Architecture
The app follows a clean, modular architecture with specialized managers:

- **📹 PTZ Manager** (`src/lib/camera/ptz-manager.ts`): Handles Pan-Tilt-Zoom operations, preset management, and position tracking
- **🎞️ Streaming Manager** (`src/lib/camera/streaming-manager.ts`): Manages video streaming, adaptive quality control, and image capture
- **🚨 Alarm Manager** (`src/lib/camera/alarm-manager.ts`): Processes motion detection, alarm events, and smart motion zones
- **⚡ Performance Optimizer** (`src/lib/camera/performance-optimizer.ts`): Handles memory management, connection pooling, and resource monitoring
- **📋 Type Definitions** (`src/lib/shared/camera-types.ts`): Comprehensive TypeScript interfaces for all camera functionality

### Design Principles
- **Separation of Concerns**: Each module has a single responsibility
- **Type Safety**: All modules use strict TypeScript typing
- **Performance First**: Built-in caching, connection pooling, and memory management
- **Extensible**: Easy to add new camera features and capabilities
- **Maintainable**: Clean code with comprehensive documentation

## 📋 Supported Devices

### Primary Support
- Hikvision IP Cameras
- Hikvision Network Video Recorders (NVR)

### Compatible OEM Devices
This app may also work with Hikvision OEM devices including:
- ABUS
- Grundig  
- Annke
- Other Hikvision-based security systems

## 🚀 Installation

1. Install the app from the Homey App Store
2. Add your Hikvision device using the pairing wizard
3. Configure your camera settings and credentials
4. Set up flows to use camera events and controls

## ⚙️ Configuration

### Device Setup
1. Go to **Devices** → **Add Device** → **Hikvision**
2. Enter your camera/NVR connection details:
   - **IP Address**: Your device's IP address
   - **Port**: Usually 80 (HTTP) or 443 (HTTPS)
   - **Username**: Device username (typically 'admin')
   - **Password**: Device password
   - **SSL**: Enable for HTTPS connections
   - **Strict SSL**: Enable for strict certificate validation

### Event Configuration
To receive alarm events, configure your Hikvision device:
1. Access your camera/NVR web interface
2. Go to **Configuration** → **Event** → **Basic Event**
3. Select your event type (Motion Detection, Intrusion Detection, etc.)
4. Add **Linkage Method** → **Notify Surveillance Center**
5. Configure the notification settings

## 🔄 Flow Cards

### Triggers
- **Motion Detected**: Triggered when motion is detected
- **Intrusion Detection**: Triggered when intrusion is detected  
- **Camera Connected**: Triggered when camera comes online
- **Camera Disconnected**: Triggered when camera goes offline
- **Camera Error**: Triggered when camera encounters an error

### Actions
- **Take Snapshot**: Capture a camera image
- **PTZ Control**: Move PTZ cameras (Pan/Tilt/Zoom)
- **Enable/Disable Motion Detection**: Control motion detection settings

### Conditions
- **Camera Online**: Check if camera is connected
- **Motion Detection Active**: Check motion detection status

## 🛠️ Development

### Prerequisites
- Node.js 18 or higher
- Homey CLI tools
- TypeScript knowledge

### Setup
```bash
# Clone the repository
git clone https://github.com/stangsdal/com.hikvision.git
cd com.hikvision

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run watch
```

### Project Structure
```
├── src/                              # TypeScript source code
│   ├── app.ts                       # Main application entry point
│   ├── lib/                         # Modular library architecture
│   │   ├── shared/
│   │   │   └── camera-types.ts      # Comprehensive type definitions
│   │   └── camera/                  # Camera functionality modules
│   │       ├── ptz-manager.ts       # PTZ control and presets
│   │       ├── streaming-manager.ts # Video streaming and quality
│   │       ├── alarm-manager.ts     # Motion detection and alarms
│   │       └── performance-optimizer.ts # Resource optimization
│   ├── drivers/                     # Device drivers
│   │   ├── hikvision-camera/        # IP Camera driver
│   │   │   ├── driver.ts           # Camera driver logic
│   │   │   └── device.ts           # Camera device management
│   │   └── hikvision-camnvr/        # NVR driver
│   │       ├── driver.ts           # NVR driver logic
│   │       ├── device.ts           # NVR device management
│   │       └── hikvision.ts        # Hikvision API utilities
│   └── types/
│       └── homey.d.ts              # Homey SDK type extensions
├── .homeycompose/                   # Modular app configuration
│   ├── app.json                    # App metadata and settings
│   ├── capabilities/               # Custom capability definitions
│   └── drivers/                    # Driver configurations
├── drivers/                        # Runtime driver assets
│   ├── hikvision-camera/           # Camera driver assets
│   └── hikvision-camnvr/          # NVR driver assets
├── tests/                          # Test suites and frameworks
├── docs/                           # Documentation files
├── locales/                        # Multi-language support
├── scripts/                        # Build and deployment scripts
├── app.json                        # Generated app configuration
├── package.json                    # Dependencies and build scripts
└── tsconfig.json                   # TypeScript configuration
```

### Build Scripts
- `npm run build`: Compile TypeScript and copy assets
- `npm run watch`: Watch for changes and recompile
- `npm run clean`: Clean build directory
- `npm run copy-assets`: Copy static assets
- `npm run copy-drivers`: Copy compiled drivers to runtime location

## 🔧 Troubleshooting

### Common Issues

**Connection Problems**
- Verify IP address and port settings
- Check network connectivity between Homey and camera
- Ensure credentials are correct
- Try both HTTP (port 80) and HTTPS (port 443)

**No Events Received**
- Configure "Notify Surveillance Center" in camera settings
- Check that motion detection is enabled
- Verify network connectivity
- Review Homey app logs

**PTZ Not Working**
- Ensure camera supports PTZ functionality
- Check camera permissions and user access levels
- Verify PTZ is enabled in camera configuration

## 📞 Support

- **Community**: [Athom Community Forum](https://community.athom.com/new-message?username=mapulu&title=Hikvision-App&body=)
- **Issues**: [GitHub Issues](https://github.com/stangsdal/com.hikvision/issues)
- **Documentation**: This README and inline code documentation

## 👥 Contributors

- **Your Name** - Lead developer and maintainer ([@yourusername](https://github.com/yourusername))

### Original Contributors
- **Martin P** - Original developer ([@mapulu](https://github.com/mapulu))
- **Peter Kristensen** - TypeScript migration contributor ([@stangsdal](https://github.com/stangsdal))

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚧 Development Status

This software is in active development. While stable for most use cases, some features may be experimental or incomplete. We welcome feedback and contributions from the community.

---

## 📋 Changelog

### Version 1.0.0 (Current) - Major Release
- **🎉 Major Version Release**: Stable production-ready version with comprehensive feature set
- **🏗️ Modular Architecture**: Complete refactoring from monolithic to modular design with specialized managers:
  - **PTZ Manager**: Pan-Tilt-Zoom control with preset management (350+ lines)
  - **Streaming Manager**: Adaptive video streaming and image capture (550+ lines)  
  - **Alarm Manager**: Smart motion detection and event processing (350+ lines)
  - **Performance Optimizer**: Memory management and resource optimization (400+ lines)
- **📋 Comprehensive Type System**: 50+ TypeScript interfaces with 300+ lines of type definitions
- **📚 Complete Documentation**: Full API documentation, architecture guides, and development guidelines
- **⚡ Performance Optimizations**: Built-in caching, connection pooling, and memory management
- **🔧 Enhanced PTZ Control**: Named presets, position tracking, and advanced movement control
- **🎞️ Adaptive Streaming**: Multiple quality profiles with network-aware optimization  
- **🚨 Smart Motion Detection**: Configurable zones, sensitivity levels, and alarm filtering
- **💾 Resource Management**: Intelligent caching with automatic cleanup and monitoring
- **✅ Production Ready**: ESLint compliant, fully validated, and comprehensively tested

### Version 0.2.3
- **🔄 Complete TypeScript Migration**: Converted entire codebase to TypeScript for better type safety and maintainability
- **📦 Homey SDK 3 Upgrade**: Updated to latest Homey SDK with modern APIs and improved performance
- **🏗️ Modern Build System**: Implemented automated TypeScript compilation and asset management
- **🔧 Enhanced Development Workflow**: Added watch mode, type checking, and improved debugging capabilities
- **✨ Code Quality Improvements**: Strict typing, better error handling, and cleaner architecture
- **🎯 Intrusion Detection**: Enhanced flow trigger for intrusion detection events
- **🔗 Improved Device Management**: Better device initialization and capability handling

### Version 0.2.1
- Event trigger fix for some devices

### Version 0.2.0
- Added camera names for NVR cameras
- Added Flow-Trigger for Connected/Disconnected/Error

### Version 0.1.2
- Initial Beta Version
