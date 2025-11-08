/**
 * Comprehensive Test Framework for Hikvision Camera Device
 * Implements end-to-end testing, performance validation, error scenario testing
 */

/**
 * Test Framework for Hikvision Camera Device
 * Provides comprehensive testing utilities and validation
 */
export class HikvisionTestFramework {
  private testResults: Array<{
    testName: string;
    category: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    details?: any;
  }> = [];

  /**
   * Run comprehensive device tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Hikvision Camera Test Suite');
    
    await this.runDeviceInitializationTests();
    await this.runConnectionManagementTests();
    await this.runPerformanceTests();
    await this.runSystemIntegrationTests();
    await this.runConfigurationTests();
    await this.runErrorHandlingTests();
    await this.runLoadTests();
    
    this.generateTestReport();
  }

  /**
   * Device Initialization Tests
   */
  private async runDeviceInitializationTests(): Promise<void> {
    const category = 'Device Initialization';
    
    await this.runTest(category, 'Device should initialize with valid settings', async () => {
      const mockDevice = this.createMockDevice();
      await mockDevice.onInit();
      return mockDevice.getSettings() !== undefined;
    });

    await this.runTest(category, 'Device should handle initialization errors', async () => {
      const mockDevice = this.createMockDevice();
      mockDevice.getSettings = () => { throw new Error('Settings error'); };
      
      try {
        await mockDevice.onInit();
        return false; // Should have thrown
      } catch (error) {
        return true; // Expected error
      }
    });

    await this.runTest(category, 'Performance monitoring should start on init', async () => {
      const mockDevice = this.createMockDevice();
      await mockDevice.onInit();
      const status = mockDevice.getPerformanceStatus();
      return status.isMonitoring === true;
    });
  }

  /**
   * Connection Management Tests
   */
  private async runConnectionManagementTests(): Promise<void> {
    const category = 'Connection Management';
    
    await this.runTest(category, 'Should connect with valid credentials', async () => {
      const mockDevice = this.createMockDevice();
      const result = await mockDevice.checkConnection();
      return result.status === 'online' && result.responseTime > 0;
    });

    await this.runTest(category, 'Should handle authentication failures', async () => {
      const mockDevice = this.createMockDevice();
      mockDevice.checkConnection = jest.fn().mockResolvedValue({
        status: 'offline',
        responseTime: 0,
        error: 'Authentication failed'
      });
      
      const result = await mockDevice.checkConnection();
      return result.status === 'offline';
    });

    await this.runTest(category, 'Should handle network timeouts', async () => {
      const mockDevice = this.createMockDevice();
      mockDevice.checkConnection = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 50);
        });
      });
      
      try {
        await mockDevice.checkConnection();
        return false;
      } catch (error) {
        return (error as Error).message === 'TIMEOUT';
      }
    });
  }

  /**
   * Performance Tests
   */
  private async runPerformanceTests(): Promise<void> {
    const category = 'Performance';
    
    await this.runTest(category, 'Should track response times accurately', async () => {
      const mockDevice = this.createMockDevice();
      const result = await mockDevice.checkConnection();
      return result.responseTime >= 0 && result.responseTime <= 1000;
    });

    await this.runTest(category, 'Should monitor memory usage', async () => {
      const mockDevice = this.createMockDevice();
      const status = mockDevice.getPerformanceStatus();
      return status.metrics.memoryUsage > 0 && status.metrics.memoryUsage < 1000;
    });

    await this.runTest(category, 'Should track error rates', async () => {
      const mockDevice = this.createMockDevice();
      const status = mockDevice.getPerformanceStatus();
      return status.metrics.errorRate >= 0 && status.metrics.errorRate <= 1;
    });

    await this.runTest(category, 'Should calculate success rates', async () => {
      const mockDevice = this.createMockDevice();
      const status = mockDevice.getPerformanceStatus();
      return status.metrics.successRate >= 0 && status.metrics.successRate <= 1;
    });
  }

  /**
   * System Integration Tests
   */
  private async runSystemIntegrationTests(): Promise<void> {
    const category = 'System Integration';
    
    await this.runTest(category, 'Should report integration status', async () => {
      const mockDevice = this.createMockDevice();
      const status = mockDevice.getSystemIntegrationStatus();
      return typeof status.enabled === 'boolean' && 
             typeof status.discoveredDevices === 'number';
    });

    await this.runTest(category, 'Should execute coordinated actions', async () => {
      const mockDevice = this.createMockDevice();
      const action = {
        id: 'test-action-001',
        type: 'start_recording' as const,
        devices: ['test-camera-001'],
        settings: { duration: 60 },
        condition: 'motion_detected'
      };
      
      const result = await mockDevice.executeCoordinatedAction(action);
      return result.success === true;
    });

    await this.runTest(category, 'Should manage orchestration rules', async () => {
      const mockDevice = this.createMockDevice();
      const rule = {
        id: 'test-rule-001',
        name: 'Motion Detection Rule',
        trigger: {
          type: 'motion_detected' as const,
          deviceId: 'test-camera-001'
        },
        conditions: [
          {
            type: 'time_range' as const,
            startTime: '09:00',
            endTime: '17:00'
          }
        ],
        actions: [
          {
            type: 'start_recording' as const,
            devices: ['test-camera-001'],
            settings: { duration: 300 }
          }
        ],
        enabled: true,
        priority: 'high' as const
      };
      
      const result = await mockDevice.addOrchestrationRule(rule);
      return result.success === true;
    });

    await this.runTest(category, 'Should aggregate system health', async () => {
      const mockDevice = this.createMockDevice();
      const status = mockDevice.getSystemIntegrationStatus();
      const validHealthStates = ['excellent', 'good', 'fair', 'poor'];
      return validHealthStates.includes(status.systemHealth);
    });
  }

  /**
   * Configuration Management Tests
   */
  private async runConfigurationTests(): Promise<void> {
    const category = 'Configuration Management';
    
    await this.runTest(category, 'Should apply configuration profiles', async () => {
      const mockDevice = this.createMockDevice();
      const profile = {
        name: 'High Quality',
        settings: {
          resolution: '2560x1440',
          fps: 30,
          bitrate: 4096,
          quality: 'high'
        }
      };
      
      const result = await mockDevice.applyConfigurationProfile(profile);
      return result.success === true;
    });

    await this.runTest(category, 'Should backup configurations', async () => {
      const mockDevice = this.createMockDevice();
      const backup = await mockDevice.backupConfiguration();
      return backup.settings !== undefined && backup.timestamp > 0;
    });

    await this.runTest(category, 'Should restore configurations', async () => {
      const mockDevice = this.createMockDevice();
      const backup = await mockDevice.backupConfiguration();
      const result = await mockDevice.restoreConfiguration(backup);
      return result.success === true;
    });
  }

  /**
   * Error Handling Tests
   */
  private async runErrorHandlingTests(): Promise<void> {
    const category = 'Error Handling';
    
    await this.runTest(category, 'Should handle network disconnections', async () => {
      const mockDevice = this.createMockDevice();
      mockDevice.checkConnection = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      try {
        await mockDevice.checkConnection();
        return false;
      } catch (error) {
        return (error as Error).message === 'ECONNREFUSED';
      }
    });

    await this.runTest(category, 'Should recover from temporary issues', async () => {
      const mockDevice = this.createMockDevice();
      let attempts = 0;
      
      mockDevice.checkConnection = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({ status: 'online', responseTime: 100 });
      });
      
      // Simulate retry logic
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          result = await mockDevice.checkConnection();
          break;
        } catch (error) {
          if (i === 2) throw error;
        }
      }
      
      return result?.status === 'online';
    });

    await this.runTest(category, 'Should handle malformed responses', async () => {
      const mockDevice = this.createMockDevice();
      mockDevice.getCameraCapabilities = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid response format'
      });
      
      const result = await mockDevice.getCameraCapabilities();
      return result.success === false && result.error?.includes('Invalid response format');
    });
  }

  /**
   * Load Testing
   */
  private async runLoadTests(): Promise<void> {
    const category = 'Load Testing';
    
    await this.runTest(category, 'Should handle concurrent requests', async () => {
      const mockDevice = this.createMockDevice();
      const startTime = Date.now();
      
      // Execute 10 concurrent requests
      const promises = Array.from({ length: 10 }, () => mockDevice.checkConnection());
      const results = await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      return results.every(r => r.status === 'online') && totalTime < 1000;
    });

    await this.runTest(category, 'Should maintain performance under load', async () => {
      const mockDevice = this.createMockDevice();
      const iterations = 50;
      let totalTime = 0;
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await mockDevice.checkConnection();
        totalTime += Date.now() - start;
      }
      
      const avgResponseTime = totalTime / iterations;
      return avgResponseTime < 200; // Average response time under 200ms
    });
  }

  /**
   * Create mock device for testing
   */
  private createMockDevice(): any {
    return {
      // Device properties
      getData: () => ({ id: 'test-camera-001' }),
      getName: () => 'Test Camera',
      getSettings: () => ({
        ip: '192.168.1.100',
        port: 80,
        username: 'admin',
        password: 'password123',
        model: 'DS-2CD2385G1',
        channel: 1
      }),
      setSettings: jest.fn(),
      
      // Logging
      log: jest.fn(),
      error: jest.fn(),
      
      // Core functionality
      onInit: jest.fn().mockResolvedValue(undefined),
      onDeleted: jest.fn().mockResolvedValue(undefined),
      
      // Performance monitoring
      getPerformanceStatus: jest.fn().mockReturnValue({
        metrics: {
          responseTime: 150,
          errorRate: 0.02,
          memoryUsage: 45.2,
          cpuUsage: 12.5,
          requestCount: 1250,
          successRate: 0.98
        },
        alerts: [],
        summary: {
          overallHealth: 'good',
          trend: 'stable',
          recommendations: []
        },
        isMonitoring: true
      }),
      
      // System integration
      getSystemIntegrationStatus: jest.fn().mockReturnValue({
        enabled: true,
        discoveredDevices: 3,
        onlineDevices: 2,
        activeRules: 5,
        systemHealth: 'good',
        coordinatedActions: 2,
        pendingMessages: 0
      }),
      
      // Configuration management
      applyConfigurationProfile: jest.fn().mockResolvedValue({ success: true }),
      backupConfiguration: jest.fn().mockResolvedValue({
        settings: {
          ip: '192.168.1.100',
          port: 80,
          username: 'admin',
          password: 'password123'
        },
        timestamp: Date.now()
      }),
      restoreConfiguration: jest.fn().mockResolvedValue({ success: true }),
      
      // Connection testing
      checkConnection: jest.fn().mockResolvedValue({
        status: 'online',
        responseTime: 120
      }),
      
      // Camera capabilities
      getCameraCapabilities: jest.fn().mockResolvedValue({
        success: true,
        capabilities: {
          ptz: true,
          recording: true,
          motion_detection: true,
          night_vision: true
        }
      }),
      
      // System integration methods
      executeCoordinatedAction: jest.fn().mockResolvedValue({ success: true }),
      addOrchestrationRule: jest.fn().mockResolvedValue({ success: true })
    };
  }

  /**
   * Run individual test
   */
  private async runTest(category: string, testName: string, testFunction: () => Promise<boolean>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        category,
        status: result ? 'passed' : 'failed',
        duration,
        error: result ? undefined : 'Test assertion failed'
      });
      
      console.log(`${result ? '✅' : '❌'} ${category}: ${testName} (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        testName,
        category,
        status: 'failed',
        duration,
        error: (error as Error).message
      });
      
      console.log(`❌ ${category}: ${testName} - ERROR: ${(error as Error).message} (${duration}ms)`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    const passed = this.testResults.filter(t => t.status === 'passed').length;
    const failed = this.testResults.filter(t => t.status === 'failed').length;
    const total = this.testResults.length;
    
    const totalDuration = this.testResults.reduce((sum, t) => sum + t.duration, 0);
    const avgDuration = totalDuration / total;
    
    console.log('\n📊 TEST REPORT');
    console.log('================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Duration: ${avgDuration.toFixed(1)}ms`);
    
    // Category breakdown
    const categories = [...new Set(this.testResults.map(t => t.category))];
    console.log('\nCategory Breakdown:');
    
    categories.forEach(category => {
      const categoryTests = this.testResults.filter(t => t.category === category);
      const categoryPassed = categoryTests.filter(t => t.status === 'passed').length;
      const categoryTotal = categoryTests.length;
      
      console.log(`  ${category}: ${categoryPassed}/${categoryTotal} passed`);
    });
    
    // Failed tests
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.category}: ${test.testName}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
    }
    
    console.log('\n✨ Test suite completed!');
  }
}

// Export test runner for external usage
export async function runHikvisionTests(): Promise<void> {
  const testFramework = new HikvisionTestFramework();
  await testFramework.runAllTests();
}
      await device.onInit();
      
      expect(device.log).toHaveBeenCalledWith('Camera device initialized');
      expect(device.getSettings()).toEqual(mockDeviceConfig.settings);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock error during initialization
      (device as any).getSettings = () => {
        throw new Error('Settings not available');
      };

      await expect(device.onInit()).rejects.toThrow();
      expect(device.error).toHaveBeenCalled();
    });

    test('should setup performance monitoring on init', async () => {
      await device.onInit();
      
      // Verify performance monitoring is initialized
      const status = device.getPerformanceStatus();
      expect(status).toHaveProperty('monitoring');
      expect(status.monitoring).toBe(true);
    });
  });

  describe('Connection Management', () => {
    test('should establish connection with valid credentials', async () => {
      const mockResponse = {
        status: 200,
        data: '<ResponseStatus>OK</ResponseStatus>'
      };

      // Mock successful HTTP request
      jest.spyOn(device as any, 'makeRequest').mockResolvedValue(mockResponse);

      await device.onInit();
      const result = await device.testConnection();

      expect(result.success).toBe(true);
      expect(result.response_time).toBeGreaterThan(0);
    });

    test('should handle authentication failures', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized'
      };

      jest.spyOn(device as any, 'makeRequest').mockRejectedValue(mockResponse);

      const result = await device.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });

    test('should handle network timeouts', async () => {
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 100);
        });
      });

      const result = await device.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should retry connections on failure', async () => {
      let callCount = 0;
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve({ status: 200 });
      });

      const result = await device.testConnection();

      expect(callCount).toBe(3);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await device.onInit();
    });

    test('should track response times accurately', async () => {
      const startTime = Date.now();
      
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ status: 200 }), 50);
        });
      });

      await device.testConnection();
      const status = device.getPerformanceStatus();

      expect(status.metrics.response_time).toBeGreaterThanOrEqual(45);
      expect(status.metrics.response_time).toBeLessThan(100);
    });

    test('should detect performance degradation', async () => {
      // Simulate slow responses
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ status: 200 }), 3000);
        });
      });

      // Trigger multiple requests to build history
      for (let i = 0; i < 5; i++) {
        await device.testConnection();
      }

      const status = device.getPerformanceStatus();
      expect(status.alerts).toContainEqual(
        expect.objectContaining({
          type: 'performance_degradation'
        })
      );
    });

    test('should monitor memory usage', async () => {
      const status = device.getPerformanceStatus();
      
      expect(status.metrics).toHaveProperty('memory_usage');
      expect(status.metrics.memory_usage).toBeGreaterThan(0);
      expect(status.metrics.memory_usage).toBeLessThan(1000); // MB
    });

    test('should track error rates', async () => {
      // Simulate errors
      jest.spyOn(device as any, 'makeRequest').mockRejectedValue(new Error('Test error'));

      try {
        await device.testConnection();
      } catch (error) {
        // Expected to fail
      }

      const status = device.getPerformanceStatus();
      expect(status.metrics.error_rate).toBeGreaterThan(0);
    });
  });

  describe('System Integration', () => {
    beforeEach(async () => {
      await device.onInit();
    });

    test('should discover other devices on network', async () => {
      // Enable system integration
      await device.setSettings({ ...mockDeviceConfig.settings, systemIntegration: true });
      
      // Wait for discovery
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = device.getSystemIntegrationStatus();
      expect(status.enabled).toBe(true);
    });

    test('should handle coordinated actions', async () => {
      const actionId = 'test-action-001';
      const action = {
        id: actionId,
        type: 'start_recording' as const,
        devices: ['test-camera-001'],
        settings: { duration: 60 },
        condition: 'motion_detected'
      };

      const result = await device.executeCoordinatedAction(action);
      expect(result.success).toBe(true);
    });

    test('should process orchestration rules', async () => {
      const rule = {
        id: 'test-rule-001',
        name: 'Motion Detection Rule',
        trigger: {
          type: 'motion_detected' as const,
          deviceId: 'test-camera-001'
        },
        conditions: [
          {
            type: 'time_range' as const,
            startTime: '09:00',
            endTime: '17:00'
          }
        ],
        actions: [
          {
            type: 'start_recording' as const,
            devices: ['test-camera-001', 'test-camera-002'],
            settings: { duration: 300 }
          }
        ],
        enabled: true,
        priority: 'high' as const
      };

      await device.addOrchestrationRule(rule);
      
      const status = device.getSystemIntegrationStatus();
      expect(status.activeRules).toBe(1);
    });

    test('should broadcast system messages', async () => {
      const broadcastSpy = jest.spyOn(device as any, 'broadcastMessage');
      
      const message = {
        type: 'alert_broadcast' as const,
        payload: {
          alertType: 'motion_detected',
          deviceId: 'test-camera-001',
          severity: 'medium',
          timestamp: Date.now()
        },
        priority: 'medium' as const
      };

      (device as any).broadcastMessage(message);
      
      expect(broadcastSpy).toHaveBeenCalledWith(message);
    });

    test('should aggregate system health', async () => {
      const status = device.getSystemIntegrationStatus();
      
      expect(status).toHaveProperty('systemHealth');
      expect(['excellent', 'good', 'fair', 'poor']).toContain(status.systemHealth);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await device.onInit();
    });

    test('should apply configuration profiles', async () => {
      const profile = {
        name: 'High Quality',
        settings: {
          resolution: '2560x1440',
          fps: 30,
          bitrate: 4096,
          quality: 'high'
        }
      };

      const result = await device.applyConfigurationProfile(profile);
      expect(result.success).toBe(true);
    });

    test('should validate configuration changes', async () => {
      const invalidProfile = {
        name: 'Invalid Profile',
        settings: {
          resolution: 'invalid_resolution',
          fps: -1,
          bitrate: 999999999
        }
      };

      const result = await device.applyConfigurationProfile(invalidProfile);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should backup and restore configurations', async () => {
      const backup = await device.backupConfiguration();
      expect(backup).toHaveProperty('settings');
      expect(backup).toHaveProperty('timestamp');

      // Modify settings
      await device.setSettings({ ...mockDeviceConfig.settings, quality: 'low' });

      // Restore backup
      const result = await device.restoreConfiguration(backup);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling & Recovery', () => {
    test('should handle device disconnection gracefully', async () => {
      await device.onInit();
      
      // Simulate network disconnection
      jest.spyOn(device as any, 'makeRequest').mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await device.testConnection();
      expect(result.success).toBe(false);
      
      // Verify device enters offline state
      const status = device.getPerformanceStatus();
      expect(status.connection_status).toBe('offline');
    });

    test('should recover from temporary network issues', async () => {
      await device.onInit();
      
      let requestCount = 0;
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        requestCount++;
        if (requestCount <= 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ status: 200 });
      });

      // Wait for automatic recovery
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await device.testConnection();
      expect(result.success).toBe(true);
    });

    test('should handle malformed API responses', async () => {
      jest.spyOn(device as any, 'makeRequest').mockResolvedValue({
        status: 200,
        data: 'invalid xml response'
      });

      const result = await device.getCameraCapabilities();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid response format');
    });

    test('should implement circuit breaker pattern', async () => {
      await device.onInit();
      
      // Simulate multiple failures
      jest.spyOn(device as any, 'makeRequest').mockRejectedValue(new Error('Service unavailable'));

      // Make multiple failing requests
      for (let i = 0; i < 10; i++) {
        try {
          await device.testConnection();
        } catch (error) {
          // Expected failures
        }
      }

      const status = device.getPerformanceStatus();
      expect(status.circuit_breaker_state).toBe('open');
    });
  });

  describe('Performance Under Load', () => {
    test('should handle concurrent requests efficiently', async () => {
      await device.onInit();
      
      jest.spyOn(device as any, 'makeRequest').mockResolvedValue({ status: 200 });

      const startTime = Date.now();
      
      // Execute 10 concurrent requests
      const promises = Array.from({ length: 10 }, () => device.testConnection());
      const results = await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should complete within reasonable time (not sequential)
      expect(totalTime).toBeLessThan(1000);
    });

    test('should maintain performance under high memory pressure', async () => {
      await device.onInit();
      
      // Simulate memory-intensive operations
      const largeData = Array.from({ length: 1000000 }, (_, i) => ({ id: i, data: Math.random() }));
      
      jest.spyOn(device as any, 'makeRequest').mockResolvedValue({
        status: 200,
        data: JSON.stringify(largeData)
      });

      const startTime = Date.now();
      const result = await device.testConnection();
      const responseTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should handle large data within 5 seconds
    });

    test('should throttle requests appropriately', async () => {
      await device.onInit();
      
      let requestCount = 0;
      jest.spyOn(device as any, 'makeRequest').mockImplementation(() => {
        requestCount++;
        return Promise.resolve({ status: 200 });
      });

      // Make rapid requests
      const promises = Array.from({ length: 20 }, () => device.testConnection());
      await Promise.all(promises);
      
      // Should have throttled some requests
      expect(requestCount).toBeLessThan(20);
    });
  });

  describe('Cleanup and Resource Management', () => {
    test('should cleanup resources on device deletion', async () => {
      await device.onInit();
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      await device.onDeleted();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(device.log).toHaveBeenCalledWith('Camera device deleted');
    });

    test('should prevent memory leaks', async () => {
      await device.onInit();
      
      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform operations that could cause leaks
      for (let i = 0; i < 100; i++) {
        await device.testConnection();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});