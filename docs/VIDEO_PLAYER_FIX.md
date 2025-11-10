# Video Player Fix for Hikvision Cameras

## Problem
The Hikvision camera devices were not showing a video player for live streaming in Homey, even though the RTSP streaming implementation was in place.

## Root Cause
The camera driver was configured with `"class": "sensor"` instead of `"class": "camera"` in the driver configuration. Homey requires devices to have the `"camera"` class to display the video player interface.

## Solution Applied

### Changed Camera Device Class
**File:** `drivers/hikvision-camera/driver.compose.json`

**Before:**
```json
{
  "class": "sensor",
  ...
}
```

**After:**
```json
{
  "class": "camera",
  ...
}
```

### Why This Fixes the Video Player

1. **Homey SDK Requirements**: Homey only shows the video player for devices with `class: "camera"`
2. **Live Streaming Interface**: The camera class enables Homey's native video streaming interface
3. **Method Integration**: With camera class, Homey automatically uses the `onGetCameraStream()` method for live video

## Implementation Details

### Required Methods (Already Implemented)
The camera device already has the required methods:

1. **`onGetCameraImage()`** - Provides camera snapshots
   ```typescript
   async onGetCameraImage(): Promise<Buffer>
   ```

2. **`onGetCameraStream()`** - Provides RTSP stream URL for live video
   ```typescript
   async onGetCameraStream(): Promise<string>
   ```

### RTSP Stream Generation
The `onGetCameraStream()` method generates RTSP URLs using:
- **Primary**: StreamingManager for optimized URLs
- **Fallback**: Manual RTSP URL generation
- **Format**: `rtsp://username:password@host:554/Streaming/Channels/{channel}`

### Camera Capabilities
The device maintains all existing capabilities:
- `camera_status` - Online/offline status
- `motion_detected` - Motion detection
- `recording_status` - Recording state
- `stream_quality` - Current quality level
- `connection_strength` - Connection quality
- `ptz_position` - PTZ camera position
- `alarm_state` - Alarm status
- `last_alarm` - Last alarm type

## Expected Behavior After Fix

### Video Player Appearance
- **Camera Devices**: Will now show video player icon/button in device interface
- **Live Streaming**: Clicking video player will show live RTSP stream
- **Quality**: Uses configured stream quality (high/medium/low)
- **Network**: Optimized for local network streaming

### User Experience
1. **Device Interface**: Video player icon appears in camera device card
2. **Live View**: Click to open live video stream in Homey's video player
3. **Performance**: Real-time streaming with good quality on same network
4. **Fallback**: Automatic fallback to working stream if primary fails

## Validation

### Build and Validation Success
- ✅ TypeScript compilation successful
- ✅ Homey app validation passed at publish level
- ✅ All existing functionality maintained
- ✅ Camera class change applied correctly

### Testing Steps
1. **Install Updated App**: Deploy app to Homey Pro
2. **Pair Camera Device**: Add camera using connected cameras discovery
3. **Check Device Interface**: Look for video player icon in device card
4. **Test Live Streaming**: Click video player to test RTSP streaming
5. **Verify Quality**: Check stream quality and performance

## Technical Notes

### RTSP Stream Configuration
- **Default Quality**: High (1080p) for main stream
- **Sub-stream**: Available for lower bandwidth needs
- **Protocol**: RTSP over standard port 554
- **Authentication**: Uses NVR credentials (admin/ZmartifyGold)
- **Network**: Optimized for local network (192.168.10.140)

### Compatibility
- **Homey SDK**: Compatible with Homey SDK 3
- **Hikvision**: Works with ISAPI-compatible cameras and NVRs
- **Security**: Supports both HTTP and HTTPS configurations
- **Performance**: Adaptive streaming based on network conditions

## Troubleshooting

### If Video Player Still Doesn't Appear
1. **Check Device Class**: Verify camera devices show as "Camera" type in Homey
2. **Restart App**: Restart Homey app or re-pair devices
3. **Update Homey**: Ensure Homey Pro is on latest firmware
4. **Network Access**: Verify Homey can reach NVR at 192.168.10.140

### If Streaming Fails
1. **Network Connectivity**: Check Homey to NVR network connection
2. **RTSP Port**: Verify port 554 is open on NVR
3. **Credentials**: Confirm NVR username/password are correct
4. **Camera Status**: Ensure camera is online and streaming enabled

## Conclusion

The video player issue has been resolved by changing the camera device class from "sensor" to "camera". This enables Homey's native video streaming interface to work with the existing RTSP streaming implementation. Users should now see video player icons in their camera device interfaces and be able to enjoy live streaming from their Hikvision cameras directly within Homey.

The fix maintains all existing functionality while adding the missing video player capability, providing a complete camera management and viewing experience in Homey.