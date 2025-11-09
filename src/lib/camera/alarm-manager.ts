/**
 * Alarm Management Module
 * Handles alarm history, motion detection, and alert processing
 */

import {
    AlarmHistory,
    AlarmHistoryEntry,
    AlarmType,
    MotionZone,
    SensitivityLevel,
    SmartMotionConfig
} from '../shared/camera-types';

export class AlarmManager {
  private alarmHistory: AlarmHistory;
  private motionZones: Map<string, MotionZone> = new Map();
  private smartMotionConfig: SmartMotionConfig;
  private alarmCooldowns: Map<string, number> = new Map();

  constructor(
    private readonly maxAlarmHistory: number = 100,
    private readonly alarmCooldownMs: number = 5000
  ) {
    this.alarmHistory = {
      entries: [],
      maxEntries: maxAlarmHistory,
      totalAlarms: 0
    };

    this.smartMotionConfig = {
      enabled: false,
      personDetection: true,
      vehicleDetection: true,
      minimumSize: 50,
      zones: [],
      sensitivity: 'medium',
      filterType: 'all_motion'
    };
  }

  /**
   * Initialize alarm manager
   */
  async initialize(): Promise<void> {
    this.initializeDefaultMotionZones();
    await this.loadAlarmHistory();
  }

  /**
   * Add alarm to history
   */
  addAlarm(alarmEntry: Omit<AlarmHistoryEntry, 'timestamp'>): void {
    const fullEntry: AlarmHistoryEntry = {
      ...alarmEntry,
      timestamp: Date.now()
    };

    // Check cooldown
    const cooldownKey = `${fullEntry.type}_${fullEntry.channel || 0}`;
    const lastAlarm = this.alarmCooldowns.get(cooldownKey);
    const now = Date.now();

    if (lastAlarm && (now - lastAlarm) < this.alarmCooldownMs) {
      return; // Skip due to cooldown
    }

    // Add to history
    this.alarmHistory.entries.unshift(fullEntry);
    this.alarmHistory.totalAlarms++;

    // Maintain max entries
    if (this.alarmHistory.entries.length > this.alarmHistory.maxEntries) {
      this.alarmHistory.entries = this.alarmHistory.entries.slice(0, this.alarmHistory.maxEntries);
    }

    // Set cooldown
    this.alarmCooldowns.set(cooldownKey, now);

    console.log(`Alarm added: ${fullEntry.type} - ${fullEntry.message}`);
  }

  /**
   * Get alarm history
   */
  getAlarmHistory(): AlarmHistory {
    return {
      ...this.alarmHistory,
      entries: [...this.alarmHistory.entries]
    };
  }

  /**
   * Clear alarm history
   */
  clearAlarmHistory(): void {
    this.alarmHistory.entries = [];
    this.alarmHistory.totalAlarms = 0;
    this.alarmCooldowns.clear();
  }

  /**
   * Get recent alarms
   */
  getRecentAlarms(count: number = 10): AlarmHistoryEntry[] {
    return this.alarmHistory.entries.slice(0, count);
  }

  /**
   * Get alarms by type
   */
  getAlarmsByType(type: string): AlarmHistoryEntry[] {
    return this.alarmHistory.entries.filter(entry => entry.type === type);
  }

  /**
   * Mark alarm as resolved
   */
  markAlarmResolved(timestamp: number): boolean {
    const alarm = this.alarmHistory.entries.find(entry => entry.timestamp === timestamp);
    if (alarm) {
      alarm.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Create motion detection zone
   */
  createMotionZone(zone: Omit<MotionZone, 'id'>): string {
    const zoneId = `zone_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fullZone: MotionZone = {
      ...zone,
      id: zoneId
    };

    this.motionZones.set(zoneId, fullZone);
    this.updateSmartMotionZones();

    return zoneId;
  }

  /**
   * Update motion detection zone
   */
  updateMotionZone(zoneId: string, updates: Partial<MotionZone>): boolean {
    const zone = this.motionZones.get(zoneId);
    if (!zone) {
      return false;
    }

    const updatedZone = { ...zone, ...updates };
    this.motionZones.set(zoneId, updatedZone);
    this.updateSmartMotionZones();

    return true;
  }

  /**
   * Delete motion detection zone
   */
  deleteMotionZone(zoneId: string): boolean {
    const deleted = this.motionZones.delete(zoneId);
    if (deleted) {
      this.updateSmartMotionZones();
    }
    return deleted;
  }

  /**
   * Get motion zones
   */
  getMotionZones(): Map<string, MotionZone> {
    return new Map(this.motionZones);
  }

  /**
   * Get motion zone by ID
   */
  getMotionZone(zoneId: string): MotionZone | null {
    return this.motionZones.get(zoneId) || null;
  }

  /**
   * Enable/disable smart motion detection
   */
  setSmartMotionDetection(enabled: boolean): void {
    this.smartMotionConfig.enabled = enabled;
    console.log(`Smart motion detection ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set motion sensitivity
   */
  setMotionSensitivity(sensitivity: SensitivityLevel): void {
    this.smartMotionConfig.sensitivity = sensitivity;
    console.log(`Motion sensitivity set to ${sensitivity}`);
  }

  /**
   * Configure smart motion settings
   */
  configureSmartMotion(config: Partial<SmartMotionConfig>): void {
    this.smartMotionConfig = { ...this.smartMotionConfig, ...config };
    this.updateSmartMotionZones();
  }

  /**
   * Get smart motion configuration
   */
  getSmartMotionConfig(): SmartMotionConfig {
    return { ...this.smartMotionConfig };
  }

  /**
   * Process motion event
   */
  processMotionEvent(action: 'start' | 'stop', zoneId?: string, metadata?: Record<string, unknown>): void {
    const isMotionStart = action === 'start';

    // Create alarm entry
    this.addAlarm({
      type: AlarmType.MOTION,
      severity: 'medium',
      message: `Motion ${action} detected${zoneId ? ` in zone ${zoneId}` : ''}`,
      channel: 1,
      resolved: !isMotionStart
    });

    // Process smart motion if enabled
    if (this.smartMotionConfig.enabled) {
      this.processSmartMotionEvent(action, zoneId, metadata);
    }
  }

  /**
   * Process intrusion event
   */
  processIntrusionEvent(action: 'start' | 'stop', zoneId?: string): void {
    this.addAlarm({
      type: AlarmType.INTRUSION,
      severity: 'high',
      message: `Intrusion ${action} detected${zoneId ? ` in zone ${zoneId}` : ''}`,
      channel: 1,
      resolved: action === 'stop'
    });
  }

  /**
   * Process line crossing event
   */
  processLineCrossingEvent(action: 'start' | 'stop', direction?: string): void {
    this.addAlarm({
      type: AlarmType.LINE_CROSSING,
      severity: 'medium',
      message: `Line crossing ${action} detected${direction ? ` (${direction})` : ''}`,
      channel: 1,
      resolved: action === 'stop'
    });
  }

  /**
   * Process video loss event
   */
  processVideoLossEvent(action: 'start' | 'stop'): void {
    this.addAlarm({
      type: AlarmType.VIDEO_LOSS,
      severity: action === 'start' ? 'high' : 'low',
      message: `Video ${action === 'start' ? 'loss' : 'restored'}`,
      channel: 1,
      resolved: action === 'stop'
    });
  }

  /**
   * Process video blind/tampering event
   */
  processVideoBlindEvent(action: 'start' | 'stop'): void {
    this.addAlarm({
      type: AlarmType.VIDEO_BLIND,
      severity: action === 'start' ? 'high' : 'low',
      message: `Video ${action === 'start' ? 'blocked/tampered' : 'restored'}`,
      channel: 1,
      resolved: action === 'stop'
    });
  }

  /**
   * Get alarm statistics
   */
  getAlarmStatistics(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    unresolved: number;
    recent24h: number;
  } {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const stats = {
      total: this.alarmHistory.totalAlarms,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
      recent24h: 0
    };

    this.alarmHistory.entries.forEach(alarm => {
      // Count by type
      stats.byType[alarm.type] = (stats.byType[alarm.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[alarm.severity] = (stats.bySeverity[alarm.severity] || 0) + 1;

      // Count resolved/unresolved
      if (alarm.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }

      // Count recent alarms
      if ((now - alarm.timestamp) < dayMs) {
        stats.recent24h++;
      }
    });

    return stats;
  }

  /**
   * Initialize default motion zones
   */
  private initializeDefaultMotionZones(): void {
    // Create a default full-frame motion zone
    const defaultZone: Omit<MotionZone, 'id'> = {
      name: 'Full Frame',
      enabled: true,
      sensitivity: 'medium',
      coordinates: {
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100
      },
      notifications: true,
      recording: true
    };

    this.createMotionZone(defaultZone);
  }

  /**
   * Update smart motion zones array
   */
  private updateSmartMotionZones(): void {
    this.smartMotionConfig.zones = Array.from(this.motionZones.values());
  }

  /**
   * Process smart motion event with AI detection
   */
  private processSmartMotionEvent(action: 'start' | 'stop', zoneId?: string, metadata?: Record<string, unknown>): void {
    // This would integrate with AI detection capabilities
    const detectionType = this.determineDetectionType(metadata);
    
    if (this.shouldTriggerSmartAlert(detectionType)) {
      this.addAlarm({
        type: 'smart_motion',
        severity: 'medium',
        message: `Smart motion detected: ${detectionType}${zoneId ? ` in zone ${zoneId}` : ''}`,
        channel: 1,
        resolved: action === 'stop'
      });
    }
  }

  /**
   * Determine detection type from metadata
   */
  private determineDetectionType(metadata?: Record<string, unknown>): string {
    // Simple logic - in real implementation this would use AI analysis
    if (!metadata) {
      return 'general motion';
    }

    // Example detection logic
    if (metadata.personDetected) {
      return 'person';
    }
    if (metadata.vehicleDetected) {
      return 'vehicle';
    }

    return 'unknown object';
  }

  /**
   * Check if smart alert should be triggered based on configuration
   */
  private shouldTriggerSmartAlert(detectionType: string): boolean {
    switch (this.smartMotionConfig.filterType) {
      case 'person_only':
        return detectionType === 'person';
      case 'vehicle_only':
        return detectionType === 'vehicle';
      case 'person_and_vehicle':
        return detectionType === 'person' || detectionType === 'vehicle';
      case 'all_motion':
      default:
        return true;
    }
  }

  /**
   * Load alarm history (placeholder for persistent storage)
   */
  private async loadAlarmHistory(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('Alarm history loaded');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.alarmHistory.entries = [];
    this.motionZones.clear();
    this.alarmCooldowns.clear();
  }
}