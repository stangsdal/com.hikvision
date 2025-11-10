# Connected Cameras Discovery Update

## Overview
Updated the Hikvision camera device driver to only show connected cameras during pairing, using the same logic as the NVR device to determine which cameras are actually online and available.

## Changes Made

### 1. Connected Cameras Discovery

**File:** `src/drivers/hikvision-camera/driver.ts`

- **Online Status Detection**: The camera driver now checks which cameras are actually connected and online on the NVR
- **Real Camera Names**: Uses actual configured camera names from the NVR (e.g., "Front Door", "Backyard", "Garage", etc.)
- **Smart Filtering**: Only shows cameras that are both named AND online, eliminating empty slots from pairing list
- **Fallback Mechanism**: If the NVR API is unavailable, falls back to generic options for manual configuration

### 2. Enhanced Camera Discovery Methods

**New Method:** `getConnectedCamerasFromNVR()`

```typescript
/**
 * Get camera information from NVR InputProxy API - names and online status
 */
private async getConnectedCamerasFromNVR(): Promise<Array<{ channel: number; name: string; online: boolean }>>
```

**New Method:** `getCameraOnlineStatus()`

```typescript  
/**
 * Get camera online status from NVR (same logic as NVR device)
 */
private async getCameraOnlineStatus(): Promise<Array<{ channel: number; name: string; online: boolean }>>
```

These methods:
- Connect to both `/ISAPI/ContentMgmt/InputProxy/channels` (for names) and `/ISAPI/ContentMgmt/InputProxy/channels/status` (for online status)
- Use the exact same logic as the NVR device to determine camera availability
- Retrieve actual camera names for each channel
- Check online status (`reschannelOnline === 'true'`) to filter only connected cameras
- Handle both string and array formats from XML parsing
- Return only cameras that are both named AND online

### 3. Updated Discovery Logic

**Method:** `discoverCameras()`

- Now retrieves both camera names AND online status from NVR before creating device options
- Only creates pairing options for cameras that are actually connected (`online: true`)
- Uses format: `"{ActualCameraName} (Channel {X})"` instead of `"Camera {X} (Channel {X})"`
- Maintains channel information for technical reference
- Significantly reduces pairing list from 16 generic options to only connected cameras (e.g., 6 in your case)
- Falls back to limited generic options if NVR discovery fails

## Benefits

### 1. Streamlined Pairing Experience
- **Before**: Shows 16 generic camera options regardless of actual connections
- **After**: Shows only the 6 (or however many) cameras that are actually connected to your NVR
- **Result**: Much cleaner, more relevant pairing list

### 2. Accurate Camera Discovery
- Only shows cameras that are both named AND online on the NVR
- Eliminates confusion from empty camera slots
- Matches exactly what the NVR device shows
- No more guessing which channels have cameras

### 3. Consistent Naming Across Devices
- **NVR Device**: Shows cameras with their actual names (e.g., "Front Door")
- **Individual Camera Devices**: Now also show with actual names (e.g., "Front Door (Channel 1)")
- **Pairing List**: Only shows cameras that actually exist

### 4. Better User Experience
- Users can immediately identify which cameras are available for pairing
- Camera names match their physical locations and purposes
- Reduces pairing time and eliminates trial-and-error
- Professional, clean interface that matches NVR reality

### 5. Smart Filtering
- Automatically filters out disconnected cameras
- Real-time detection of camera availability
- Reduces maintenance overhead for users

## Implementation Details

### Default NVR Configuration
The driver uses these default settings for NVR discovery:
```typescript
nvrAddress: '192.168.10.140'
nvrPort: 80
nvrSsl: false
nvrUsername: 'admin'
nvrPassword: 'ZmartifyGold'
```

### Connected Camera Detection Logic
1. **Step 1**: Query `/ISAPI/ContentMgmt/InputProxy/channels` for camera names
2. **Step 2**: Query `/ISAPI/ContentMgmt/InputProxy/channels/status` for online status
3. **Step 3**: Cross-reference names with online status (`reschannelOnline === 'true'`)
4. **Result**: Only show cameras that are both named AND online

### Camera Resolution Priority
1. **Primary**: Connected cameras with actual names from NVR (e.g., "Front Door (Channel 1)")
2. **Secondary**: Generic fallback options if NVR is unreachable (limited set for manual config)
3. **Filter**: Only cameras with `online: true` status are included in pairing list

### Error Handling
- Graceful degradation if NVR is not accessible during pairing
- Proper TypeScript error handling and logging
- Maintains functionality even without NVR connectivity

## Technical Implementation

### Dependencies Added
```typescript
import request = require('request');
import xml2js = require('xml2js');
```

### API Endpoints Used
```
GET /ISAPI/ContentMgmt/InputProxy/channels        # Get camera names
GET /ISAPI/ContentMgmt/InputProxy/channels/status # Get online status
```

These are the exact same endpoints used by the NVR device to determine camera availability.

### Response Processing
- Parses XML responses using xml2js (same as NVR device)
- Handles both array and single-item responses
- Extracts channel ID, camera name, and online status
- Filters to only include cameras where `reschannelOnline === 'true'`
- Cross-references names with online status to build final list
- Sanitizes names for use in Homey device naming

## Future Enhancements

### Dynamic Name Updates
The foundation is now in place to potentially:
- Update device names when camera names change in NVR
- Sync camera configurations between NVR and individual devices
- Provide real-time name updates

### Extended Discovery
Could be extended to:
- Auto-detect NVR IP addresses on the network
- Support multiple NVRs
- Retrieve additional camera metadata (resolution, capabilities, etc.)

## Testing Recommendations

### 1. Connected Camera Detection
- Test pairing with different numbers of connected cameras (should only show connected ones)
- Verify that disconnected cameras don't appear in pairing list
- Test with cameras being connected/disconnected dynamically
- Check behavior with cameras that have empty names

### 2. Pairing Experience
- Verify pairing list shows only connected cameras (e.g., 6 instead of 16)
- Test pairing process with actual camera names
- Verify fallback behavior when NVR is offline (should show limited generic options)
- Check name formatting with special characters

### 3. Existing Devices
- Existing camera devices will keep their current names and functionality
- New camera pairings will use the updated connected-only discovery
- Re-pairing existing devices will update to show only connected cameras

### 4. Network Scenarios
- Test with NVR on different network configurations
- Verify behavior with SSL/non-SSL configurations
- Test timeout handling for slow network responses
- Verify graceful degradation when NVR APIs are unavailable

## Compatibility

### Homey SDK
- Compatible with Homey SDK 3
- Uses standard request and xml2js libraries
- Maintains backward compatibility

### Hikvision Devices
- Works with Hikvision NVRs supporting ISAPI
- Compatible with existing authentication mechanisms
- Supports both HTTP and HTTPS configurations

## Conclusion

This update dramatically improves the pairing experience by showing only connected cameras with their actual names. Instead of seeing 16 generic camera options during pairing, users will now see only the cameras that are actually connected to their NVR (e.g., 6 cameras in your case) with meaningful names like "Front Door Camera" instead of generic "Camera 1" labels.

### Key Improvements:
- **Focused Pairing**: Only shows cameras that are actually connected and online
- **Real Names**: Uses actual camera names from NVR configuration  
- **Consistent Experience**: Matches what users see in the NVR device
- **Professional Interface**: Clean, relevant options that match the physical setup
- **Reduced Confusion**: Eliminates guesswork about which channels have cameras

The implementation uses the exact same logic as the NVR device to determine camera availability, ensuring perfect consistency across the Homey app while maintaining full backward compatibility and robust error handling.