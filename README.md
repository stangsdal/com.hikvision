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

This app is built with modern technologies:

- **TypeScript**: Fully typed codebase for better reliability and maintainability
- **Homey SDK 3**: Latest Homey development framework
- **Modern Build System**: Automated compilation and asset management
- **Type Safety**: Custom type definitions for Homey SDK integration

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
├── src/                     # TypeScript source code
│   ├── app.ts              # Main application entry point
│   └── drivers/
│       └── hikvision-camnvr/
│           ├── driver.ts    # Device driver logic
│           ├── device.ts    # Individual device management
│           └── hikvision.js # Legacy utility functions
├── dist/                   # Compiled JavaScript output
├── drivers/                # Runtime driver files
│   └── hikvision-camnvr/
│       ├── pair/
│       │   └── start.html  # Device pairing interface
│       └── assets/         # Device icons and images
├── locales/               # Internationalization files
├── app.json              # App configuration and metadata
├── package.json          # Dependencies and build scripts
└── tsconfig.json         # TypeScript configuration
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

- **Martin P** - Original developer ([@mapulu](https://github.com/mapulu))
- **Peter Kristensen** - Co-author and TypeScript migration ([@stangsdal](https://github.com/stangsdal))

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚧 Development Status

This software is in active development. While stable for most use cases, some features may be experimental or incomplete. We welcome feedback and contributions from the community.

---

## 📋 Changelog

### Version 0.2.3 (Current)
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
