import { NextRequest, NextResponse } from 'next/server'

interface MemoryMetrics {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  timestamp: number
  endpoint: string
}

export class MemoryMonitor {
  private static memoryHistory: MemoryMetrics[] = []
  private static readonly MAX_HISTORY = 100
  private static readonly MEMORY_THRESHOLD_MB = 400
  private static readonly CRITICAL_THRESHOLD_MB = 480

  /**
   * Monitor memory usage for API endpoints
   */
  static monitorEndpoint(request: NextRequest): {
    startMonitoring: () => MemoryMetrics
    endMonitoring: (startMetrics: MemoryMetrics) => void
  } {
    const endpoint = this.getEndpointPath(request)

    return {
      startMonitoring: () => {
        const metrics = this.captureMemoryMetrics(endpoint)
        this.checkMemoryThresholds(metrics)
        return metrics
      },
      
      endMonitoring: (startMetrics: MemoryMetrics) => {
        const endMetrics = this.captureMemoryMetrics(endpoint)
        const memoryDiff = endMetrics.heapUsed - startMetrics.heapUsed
        
        this.logMemoryDelta(endpoint, startMetrics, endMetrics, memoryDiff)
        
        // Store for analysis
        this.addToHistory(endMetrics)
        
        // Force cleanup if memory is high
        if (endMetrics.heapUsed > this.MEMORY_THRESHOLD_MB * 1024 * 1024) {
          this.forceCleanup()
        }
      }
    }
  }

  private static captureMemoryMetrics(endpoint: string): MemoryMetrics {
    const usage = process.memoryUsage()
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
      timestamp: Date.now(),
      endpoint
    }
  }

  private static checkMemoryThresholds(metrics: MemoryMetrics): void {
    const heapUsedMB = Math.round(metrics.heapUsed / 1024 / 1024)
    
    if (heapUsedMB > this.CRITICAL_THRESHOLD_MB) {
      console.error(`🚨 CRITICAL MEMORY: ${heapUsedMB}MB at ${metrics.endpoint}`)
      this.forceCleanup()
    } else if (heapUsedMB > this.MEMORY_THRESHOLD_MB) {
      console.warn(`⚠️ HIGH MEMORY: ${heapUsedMB}MB at ${metrics.endpoint}`)
    }
  }

  private static logMemoryDelta(
    endpoint: string, 
    start: MemoryMetrics, 
    end: MemoryMetrics, 
    delta: number
  ): void {
    const startMB = Math.round(start.heapUsed / 1024 / 1024)
    const endMB = Math.round(end.heapUsed / 1024 / 1024)
    const deltaMB = Math.round(delta / 1024 / 1024)
    const duration = end.timestamp - start.timestamp
    
    if (deltaMB > 10) { // Log significant memory increases
      console.warn(`📊 Memory Delta [${endpoint}]: ${startMB}MB → ${endMB}MB (Δ${deltaMB}MB) in ${duration}ms`)
    } else if (deltaMB < -5) { // Log significant memory decreases
      console.log(`♻️ Memory Freed [${endpoint}]: ${startMB}MB → ${endMB}MB (Δ${deltaMB}MB) in ${duration}ms`)
    }
  }

  private static addToHistory(metrics: MemoryMetrics): void {
    this.memoryHistory.push(metrics)
    
    if (this.memoryHistory.length > this.MAX_HISTORY) {
      this.memoryHistory.shift()
    }
  }

  private static getEndpointPath(request: NextRequest): string {
    const url = new URL(request.url)
    return url.pathname
  }

  private static forceCleanup(): void {
    if (global.gc) {
      console.log('🧹 Forcing garbage collection due to high memory usage')
      global.gc()
    }
  }

  /**
   * Get memory statistics
   */
  static getMemoryStats(): {
    current: MemoryMetrics
    history: MemoryMetrics[]
    peakUsage: number
    averageUsage: number
  } {
    const current = this.captureMemoryMetrics('stats')
    
    const peakUsage = Math.max(...this.memoryHistory.map(m => m.heapUsed))
    const averageUsage = this.memoryHistory.length > 0 
      ? this.memoryHistory.reduce((sum, m) => sum + m.heapUsed, 0) / this.memoryHistory.length
      : current.heapUsed

    return {
      current,
      history: [...this.memoryHistory],
      peakUsage,
      averageUsage
    }
  }

  /**
   * Analyze memory trends
   */
  static analyzeMemoryTrends(): {
    isIncreasing: boolean
    leakSuspected: boolean
    topEndpoints: string[]
  } {
    if (this.memoryHistory.length < 10) {
      return {
        isIncreasing: false,
        leakSuspected: false,
        topEndpoints: []
      }
    }

    // Check if memory is consistently increasing
    const recent = this.memoryHistory.slice(-10)
    const older = this.memoryHistory.slice(-20, -10)
    
    const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length
    const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length
    
    const isIncreasing = recentAvg > olderAvg * 1.1 // 10% increase threshold
    
    // Simple leak detection: sustained high memory over time
    const highMemoryCount = recent.filter(m => m.heapUsed > this.MEMORY_THRESHOLD_MB * 1024 * 1024).length
    const leakSuspected = highMemoryCount > 7 // More than 70% of recent samples are high

    // Find endpoints with highest memory usage
    const endpointUsage = new Map<string, number>()
    this.memoryHistory.forEach(m => {
      const current = endpointUsage.get(m.endpoint) || 0
      endpointUsage.set(m.endpoint, Math.max(current, m.heapUsed))
    })
    
    const topEndpoints = Array.from(endpointUsage.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint]) => endpoint)

    return {
      isIncreasing,
      leakSuspected,
      topEndpoints
    }
  }

  /**
   * Create monitoring response wrapper
   */
  static wrapResponse(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const { startMonitoring, endMonitoring } = this.monitorEndpoint(request)
    const startMetrics = startMonitoring()

    return handler()
      .then(response => {
        endMonitoring(startMetrics)
        return response
      })
      .catch(error => {
        endMonitoring(startMetrics)
        throw error
      })
  }
}