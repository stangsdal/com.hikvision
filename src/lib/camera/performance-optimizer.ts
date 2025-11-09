/**
 * Performance Optimization Module for Hikvision Camera Integration
 *
 * This module provides comprehensive performance optimization capabilities including:
 * - Memory management and garbage collection
 * - Connection pooling and resource reuse
 * - Real-time resource monitoring and alerting
 * - Image and stream caching with automatic cleanup
 * - Performance metrics tracking and reporting
 *
 * @fileoverview Core performance optimization system for camera operations
 * @version 1.0.0
 * @author Your Name <your.email@example.com>
 * @since 1.0.0
 */

import {
    CacheEntry,
    ConnectionPool,
    MemoryManager,
    PooledConnection,
    ResourceMonitor
} from '../shared/camera-types';

/**
 * Performance Optimizer Class
 *
 * Provides comprehensive performance optimization for Hikvision camera operations including
 * memory management, connection pooling, caching, and real-time resource monitoring.
 *
 * @class PerformanceOptimizer
 * @example
 * ```typescript
 * const optimizer = new PerformanceOptimizer();
 * await optimizer.initialize();
 *
 * // Cache camera image
 * await optimizer.cacheImage('camera1_main', imageBuffer);
 *
 * // Get cached image
 * const cachedImage = optimizer.getCachedImage('camera1_main');
 * ```
 */
export class PerformanceOptimizer {
  /** Memory management configuration and state */
  private memoryManager: MemoryManager;

  /** Connection pool for HTTP requests optimization */
  private connectionPool: ConnectionPool;

  /** Resource monitoring configuration and metrics */
  private resourceMonitor: ResourceMonitor;

  /** Cache for camera images with automatic expiration */
  private imageCache: Map<string, CacheEntry<Buffer>> = new Map();

  /** Cache for streaming URLs and configurations */
  private streamCache: Map<string, CacheEntry<string>> = new Map();

  /** Interval for performance monitoring checks */
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  /** Interval for automatic optimization routines */
  private optimizationInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the Performance Optimizer with default configurations
   *
   * Sets up memory management limits, connection pooling parameters,
   * and resource monitoring thresholds optimized for Hikvision cameras.
   */
  constructor() {
    this.memoryManager = {
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      currentUsage: 0,
      cacheSize: 0,
      bufferSize: 0,
      gcInterval: 300000, // 5 minutes
      lastGC: Date.now(),
      highWaterMark: 80 * 1024 * 1024, // 80MB
      lowWaterMark: 50 * 1024 * 1024,  // 50MB
      autoCleanup: true
    };

    this.connectionPool = {
      maxConnections: 10,
      activeConnections: 0,
      connectionTimeout: 30000,
      keepAliveTimeout: 60000,
      retryAttempts: 3,
      retryDelay: 1000,
      connections: new Map(),
      lastCleanup: Date.now()
    };

    this.resourceMonitor = {
      enabled: true,
      checkInterval: 10000, // 10 seconds
      thresholds: {
        memory: 85, // 85% of max
        cpu: 80,    // 80% CPU usage
        disk: 90,   // 90% disk usage
        network: 75 // 75% network capacity
      },
      actions: {
        cleanup: true,
        throttle: true,
        alert: true
      },
      history: []
    };
  }

  /**
   * Initialize performance optimizer
   */
  async initialize(): Promise<void> {
    this.startResourceMonitoring();
    this.startOptimizationTasks();
    await this.updateMemoryStats();
  }

  /**
   * Add item to cache with automatic cleanup
   */
  addToCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number = 300000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      size: this.estimateDataSize(data)
    };

    cache.set(key, entry);
    this.memoryManager.cacheSize += entry.size;

    // Trigger cleanup if cache is getting large
    if (this.memoryManager.cacheSize > this.memoryManager.highWaterMark * 0.5) {
      this.cleanupExpiredCache();
    }
  }

  /**
   * Get item from cache
   */
  getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if ((now - entry.timestamp) > entry.ttl) {
      cache.delete(key);
      this.memoryManager.cacheSize -= entry.size;
      return null;
    }

    entry.hits++;
    return entry.data;
  }

  /**
   * Cache image data
   */
  cacheImage(url: string, imageData: Buffer, ttl?: number): void {
    this.addToCache(this.imageCache, url, imageData, ttl);
  }

  /**
   * Get cached image
   */
  getCachedImage(url: string): Buffer | null {
    return this.getFromCache(this.imageCache, url);
  }

  /**
   * Cache stream data
   */
  cacheStream(url: string, streamData: string, ttl?: number): void {
    this.addToCache(this.streamCache, url, streamData, ttl);
  }

  /**
   * Get cached stream data
   */
  getCachedStream(url: string): string | null {
    return this.getFromCache(this.streamCache, url);
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedSize = 0;

    // Clean image cache
    for (const [key, entry] of this.imageCache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        cleanedSize += entry.size;
        this.imageCache.delete(key);
      }
    }

    // Clean stream cache
    for (const [key, entry] of this.streamCache.entries()) {
      if ((now - entry.timestamp) > entry.ttl) {
        cleanedSize += entry.size;
        this.streamCache.delete(key);
      }
    }

    this.memoryManager.cacheSize -= cleanedSize;
    console.log(`Cleaned up ${cleanedSize} bytes from cache`);
  }

  /**
   * Get connection from pool or create new one
   */
  getConnection(url: string): PooledConnection | null {
    const existing = this.connectionPool.connections.get(url);

    if (existing && existing.isActive) {
      existing.lastUsed = Date.now();
      return existing;
    }

    if (this.connectionPool.activeConnections >= this.connectionPool.maxConnections) {
      return null; // Pool exhausted
    }

    const connection: PooledConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      url,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true,
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0
    };

    this.connectionPool.connections.set(url, connection);
    this.connectionPool.activeConnections++;

    return connection;
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(url: string, responseTime: number, isError: boolean = false): void {
    const connection = this.connectionPool.connections.get(url);
    if (!connection) {
      return;
    }

    connection.lastUsed = Date.now();
    connection.requestCount++;

    if (isError) {
      connection.errorCount++;
    }

    // Update average response time
    const totalTime = connection.avgResponseTime * (connection.requestCount - 1) + responseTime;
    connection.avgResponseTime = totalTime / connection.requestCount;
  }

  /**
   * Cleanup expired connections
   */
  cleanupConnectionPool(): void {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [url, connection] of this.connectionPool.connections.entries()) {
        const timeSinceLastUse = now - connection.lastUsed;
        const shouldCleanup = timeSinceLastUse > this.connectionPool.keepAliveTimeout ||
                             connection.errorCount > 5;

        if (shouldCleanup) {
          this.connectionPool.connections.delete(url);
          this.connectionPool.activeConnections--;
          cleanedCount++;
        }
      }

      this.connectionPool.lastCleanup = now;

      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} connections from pool`);
      }
    } catch (error) {
      console.error('Error cleaning up connection pool:', error);
    }
  }

  /**
   * Update memory statistics
   */
  async updateMemoryStats(): Promise<void> {
    try {
      // Calculate current memory usage
      let totalCacheSize = 0;

      // Image cache size
      for (const entry of this.imageCache.values()) {
        totalCacheSize += entry.size;
      }

      // Stream cache size
      for (const entry of this.streamCache.values()) {
        totalCacheSize += entry.size;
      }

      this.memoryManager.cacheSize = totalCacheSize;
      this.memoryManager.currentUsage = totalCacheSize; // Simplified for now

      // Trigger cleanup if needed
      if (this.memoryManager.currentUsage > this.memoryManager.highWaterMark) {
        this.aggressiveCleanup();
      }

    } catch (error) {
      console.error('Error updating memory stats:', error);
    }
  }

  /**
   * Start resource monitoring
   */
  private startResourceMonitoring(): void {
    if (!this.resourceMonitor.enabled) {
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.checkResourceThresholds();
      this.updateResourceMetrics();
    }, this.resourceMonitor.checkInterval);
  }

  /**
   * Start optimization tasks
   */
  private startOptimizationTasks(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    this.optimizationInterval = setInterval(() => {
      this.performOptimizationTasks().catch(console.error);
    }, 60000); // Every minute
  }

  /**
   * Perform periodic optimization tasks
   */
  private async performOptimizationTasks(): Promise<void> {
    try {
      console.log('Running optimization tasks');

      // Update memory stats
      await this.updateMemoryStats();

      // Cleanup expired cache entries
      this.cleanupExpiredCache();

      // Cleanup connection pool
      this.cleanupConnectionPool();

      // Check resource thresholds
      this.checkResourceThresholds();

      // Update resource metrics
      this.updateResourceMetrics();

    } catch (error) {
      console.error('Error during optimization tasks:', error);
    }
  }

  /**
   * Update resource metrics
   */
  private updateResourceMetrics(): void {
    const now = Date.now();

    const metrics = {
      timestamp: now,
      memory: (this.memoryManager.currentUsage / this.memoryManager.maxMemoryUsage) * 100,
      cpu: 0, // Would be calculated from system info
      connections: this.connectionPool.activeConnections
    };

    this.resourceMonitor.history.push(metrics);

    // Keep only recent history (last hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    this.resourceMonitor.history = this.resourceMonitor.history.filter(
      entry => entry.timestamp > oneHourAgo
    );
  }

  /**
   * Check resource thresholds and take action
   */
  private checkResourceThresholds(): void {
    const memoryUsagePercent = (this.memoryManager.currentUsage / this.memoryManager.maxMemoryUsage) * 100;

    if (memoryUsagePercent > this.resourceMonitor.thresholds.memory) {
      if (this.resourceMonitor.actions.cleanup) {
        console.log(`Memory usage high (${memoryUsagePercent.toFixed(1)}%), triggering cleanup`);
        this.aggressiveCleanup();
      }
    }

    // Check connection pool
    const connectionUsagePercent = (this.connectionPool.activeConnections / this.connectionPool.maxConnections) * 100;
    if (connectionUsagePercent > 80) {
      console.log(`Connection pool usage high (${connectionUsagePercent.toFixed(1)}%)`);
      this.cleanupConnectionPool();
    }
  }

  /**
   * Perform aggressive cleanup to free memory
   */
  private aggressiveCleanup(): void {
    console.log('Performing aggressive cleanup');

    // Clear all caches
    const imageCacheSize = this.imageCache.size;
    const streamCacheSize = this.streamCache.size;

    this.imageCache.clear();
    this.streamCache.clear();

    // Reset connection pool
    this.resetConnectionPool();

    // Update memory stats
    this.memoryManager.cacheSize = 0;
    this.memoryManager.currentUsage = 0;
    this.memoryManager.lastGC = Date.now();

    console.log(`Aggressive cleanup completed: cleared ${imageCacheSize} image cache entries, ${streamCacheSize} stream cache entries`);
  }

  /**
   * Reset connection pool
   */
  private resetConnectionPool(): void {
    this.connectionPool.connections.clear();
    this.connectionPool.activeConnections = 0;
    this.connectionPool.lastCleanup = Date.now();
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(data: unknown): number {
    try {
      if (Buffer.isBuffer(data)) {
        return data.length;
      }
      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      }
      if (typeof data === 'object') {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      }
      return 64; // Default estimate
    } catch (error) {
      console.error('Error estimating data size:', error);
      return 64;
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus(): {
    memoryManager: MemoryManager;
    connectionPool: { size: number; activeConnections: number; lastCleanup: number };
    resourceMonitor: ResourceMonitor;
    cacheStats: { imageCache: number; streamCache: number };
  } {
    return {
      memoryManager: { ...this.memoryManager },
      connectionPool: {
        size: this.connectionPool.connections.size,
        activeConnections: this.connectionPool.activeConnections,
        lastCleanup: this.connectionPool.lastCleanup
      },
      resourceMonitor: {
        ...this.resourceMonitor,
        history: [...this.resourceMonitor.history]
      },
      cacheStats: {
        imageCache: this.imageCache.size,
        streamCache: this.streamCache.size
      }
    };
  }

  /**
   * Configure optimization settings
   */
  configure(config: {
    memoryManager?: Partial<MemoryManager>;
    connectionPool?: Partial<ConnectionPool>;
    resourceMonitor?: Partial<ResourceMonitor>;
  }): void {
    if (config.memoryManager) {
      this.memoryManager = { ...this.memoryManager, ...config.memoryManager };
    }

    if (config.connectionPool) {
      this.connectionPool = { ...this.connectionPool, ...config.connectionPool };
    }

    if (config.resourceMonitor) {
      this.resourceMonitor = { ...this.resourceMonitor, ...config.resourceMonitor };

      // Restart monitoring if interval changed
      if (config.resourceMonitor.checkInterval) {
        this.startResourceMonitoring();
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    this.imageCache.clear();
    this.streamCache.clear();
    this.connectionPool.connections.clear();
    this.resourceMonitor.history = [];
  }
}