/**
 * PTZ (Pan-Tilt-Zoom) Management Module
 * Handles all PTZ operations, preset management, and position tracking
 */

import request = require('request');
import { PTZPreset, PTZPresetManager } from '../shared/camera-types';

export class PTZManager {
  private presets: Map<number, PTZPreset> = new Map();
  private currentPosition: { pan: number; tilt: number; zoom: number } | null = null;
  private readonly maxPresets: number = 255;
  private readonly baseUrl: string;
  private readonly auth: { username: string; password: string };

  constructor(baseUrl: string, auth: { username: string; password: string }) {
    this.baseUrl = baseUrl;
    this.auth = auth;
  }

  /**
   * Initialize PTZ manager with existing presets
   */
  async initialize(): Promise<void> {
    await this.loadExistingPresets();
    await this.getCurrentPosition();
  }

  /**
   * Control PTZ movement with relative values
   */
  async controlPTZ(pan: number, tilt: number, zoom: number): Promise<boolean> {
    try {
      const ptzUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/continuous`;
      
      const ptzData = `
        <PTZData>
          <pan>${Math.max(-100, Math.min(100, pan))}</pan>
          <tilt>${Math.max(-100, Math.min(100, tilt))}</tilt>
          <zoom>${Math.max(-100, Math.min(100, zoom))}</zoom>
        </PTZData>
      `;

      const response = await this.makeAuthenticatedRequest('PUT', ptzUrl, ptzData);
      
      if (response.success) {
        // Update current position estimate
        if (this.currentPosition) {
          this.currentPosition.pan += pan;
          this.currentPosition.tilt += tilt;
          this.currentPosition.zoom += zoom;
        }
      }

      return response.success;
    } catch (error) {
      console.error('PTZ control failed:', error);
      return false;
    }
  }

  /**
   * Go to a specific preset position
   */
  async goToPreset(presetNumber: number): Promise<boolean> {
    try {
      if (!this.presets.has(presetNumber)) {
        throw new Error(`Preset ${presetNumber} does not exist`);
      }

      const presetUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/presets/${presetNumber}/goto`;
      const response = await this.makeAuthenticatedRequest('PUT', presetUrl);

      if (response.success) {
        const preset = this.presets.get(presetNumber);
        if (preset) {
          preset.lastUsed = Date.now();
          this.currentPosition = {
            pan: preset.pan,
            tilt: preset.tilt,
            zoom: preset.zoom
          };
        }
      }

      return response.success;
    } catch (error) {
      console.error(`Go to preset ${presetNumber} failed:`, error);
      return false;
    }
  }

  /**
   * Set current position as a preset
   */
  async setPreset(presetNumber: number, name?: string): Promise<boolean> {
    try {
      if (presetNumber < 1 || presetNumber > this.maxPresets) {
        throw new Error(`Preset number must be between 1 and ${this.maxPresets}`);
      }

      const presetUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/presets/${presetNumber}`;
      const response = await this.makeAuthenticatedRequest('PUT', presetUrl);

      if (response.success) {
        await this.getCurrentPosition();
        
        const preset: PTZPreset = {
          id: presetNumber,
          name: name || `Preset ${presetNumber}`,
          pan: this.currentPosition?.pan || 0,
          tilt: this.currentPosition?.tilt || 0,
          zoom: this.currentPosition?.zoom || 0,
          createdAt: Date.now()
        };

        this.presets.set(presetNumber, preset);
      }

      return response.success;
    } catch (error) {
      console.error(`Set preset ${presetNumber} failed:`, error);
      return false;
    }
  }

  /**
   * Create a named preset with current position
   */
  async createNamedPreset(presetId: number, name: string): Promise<boolean> {
    try {
      // First, set the preset at current position
      const setSuccess = await this.setPreset(presetId, name);
      
      if (setSuccess && this.currentPosition) {
        // Update the preset with additional metadata
        const preset: PTZPreset = {
          id: presetId,
          name,
          pan: this.currentPosition.pan,
          tilt: this.currentPosition.tilt,
          zoom: this.currentPosition.zoom,
          description: `Created at ${new Date().toLocaleString()}`,
          createdAt: Date.now()
        };

        this.presets.set(presetId, preset);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Create named preset ${name} failed:`, error);
      return false;
    }
  }

  /**
   * Delete a preset
   */
  async deletePreset(presetId: number): Promise<boolean> {
    try {
      const deleteUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/presets/${presetId}`;
      const response = await this.makeAuthenticatedRequest('DELETE', deleteUrl);

      if (response.success) {
        this.presets.delete(presetId);
      }

      return response.success;
    } catch (error) {
      console.error(`Delete preset ${presetId} failed:`, error);
      return false;
    }
  }

  /**
   * Stop all PTZ movements
   */
  async stopPTZ(): Promise<boolean> {
    try {
      const stopUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/continuous`;
      const stopData = `
        <PTZData>
          <pan>0</pan>
          <tilt>0</tilt>
          <zoom>0</zoom>
        </PTZData>
      `;

      const response = await this.makeAuthenticatedRequest('PUT', stopUrl, stopData);
      return response.success;
    } catch (error) {
      console.error('PTZ stop failed:', error);
      return false;
    }
  }

  /**
   * Get current PTZ position
   */
  async getCurrentPosition(): Promise<{ pan: number; tilt: number; zoom: number } | null> {
    try {
      const statusUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/status`;
      const response = await this.makeAuthenticatedRequest('GET', statusUrl);

      if (response.success && response.data) {
        // Parse XML response to extract position
        const positionMatch = response.data.match(/<pan>(.*?)<\/pan>.*<tilt>(.*?)<\/tilt>.*<zoom>(.*?)<\/zoom>/s);
        
        if (positionMatch) {
          this.currentPosition = {
            pan: parseFloat(positionMatch[1]) || 0,
            tilt: parseFloat(positionMatch[2]) || 0,
            zoom: parseFloat(positionMatch[3]) || 0
          };
          
          return this.currentPosition;
        }
      }

      return null;
    } catch (error) {
      console.error('Get PTZ position failed:', error);
      return null;
    }
  }

  /**
   * Get all presets
   */
  getPresets(): Map<number, PTZPreset> {
    return new Map(this.presets);
  }

  /**
   * Get preset manager status
   */
  getManagerStatus(): PTZPresetManager {
    return {
      presets: new Map(this.presets),
      maxPresets: this.maxPresets,
      currentPosition: this.currentPosition ? { ...this.currentPosition } : null
    };
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: number): PTZPreset | null {
    return this.presets.get(presetId) || null;
  }

  /**
   * Check if preset exists
   */
  hasPreset(presetId: number): boolean {
    return this.presets.has(presetId);
  }

  /**
   * Get preset count
   */
  getPresetCount(): number {
    return this.presets.size;
  }

  /**
   * Load existing presets from camera
   */
  private async loadExistingPresets(): Promise<void> {
    try {
      // This would typically query the camera for existing presets
      // For now, we'll initialize with an empty set
      this.presets.clear();
      
      // TODO: Implement actual preset loading from camera
      // const presetsUrl = `${this.baseUrl}/ISAPI/PTZCtrl/channels/1/presets`;
      // const response = await this.makeAuthenticatedRequest('GET', presetsUrl);
      
    } catch (error) {
      console.error('Failed to load existing presets:', error);
    }
  }

  /**
   * Make an authenticated HTTP request
   */
  private async makeAuthenticatedRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: string
  ): Promise<{ success: boolean; data?: string; statusCode?: number }> {
    
    return new Promise((resolve) => {
      const options: request.Options = {
        url,
        method,
        auth: {
          username: this.auth.username,
          password: this.auth.password,
          sendImmediately: false
        },
        body: data,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/xml'
        }
      };

      request(options, (error: unknown, response: request.Response, body: string) => {
        if (error) {
          resolve({ success: false, statusCode: 0 });
        } else {
          resolve({
            success: response.statusCode >= 200 && response.statusCode < 300,
            data: body,
            statusCode: response.statusCode
          });
        }
      });
    });
  }

  /**
   * Validate preset number
   */
  private validatePresetNumber(presetNumber: number): boolean {
    return presetNumber >= 1 && presetNumber <= this.maxPresets;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.presets.clear();
    this.currentPosition = null;
  }
}