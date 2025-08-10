export class TimeoutService {
  private static readonly DEFAULT_TIMEOUT = 5 * 60 * 1000 // 5 minutes
  private static activeTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Execute a promise with timeout and automatic cleanup
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT,
    operationId?: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const error = new Error(`Operation timed out after ${timeoutMs}ms`)
        error.name = 'TimeoutError'
        
        // Cleanup on timeout
        if (operationId) {
          this.cleanup(operationId)
        }
        
        // Force garbage collection on timeout
        if (global.gc) {
          console.log('🕐 Timeout triggered - forcing garbage collection')
          global.gc()
        }
        
        reject(error)
      }, timeoutMs)
      
      if (operationId) {
        this.activeTimeouts.set(operationId, timeoutId)
      }
    })

    try {
      const result = await Promise.race([operation(), timeoutPromise])
      
      // Clear timeout on successful completion
      if (timeoutId) {
        clearTimeout(timeoutId)
        if (operationId) {
          this.activeTimeouts.delete(operationId)
        }
      }
      
      return result
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId)
        if (operationId) {
          this.activeTimeouts.delete(operationId)
        }
      }
      
      // Force cleanup on error
      if (operationId) {
        this.cleanup(operationId)
      }
      
      throw error
    }
  }

  /**
   * Cleanup resources for a specific operation
   */
  static cleanup(operationId: string): void {
    const timeoutId = this.activeTimeouts.get(operationId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.activeTimeouts.delete(operationId)
    }
    
    // Force garbage collection on cleanup
    if (global.gc) {
      setImmediate(() => global.gc!())
    }
  }

  /**
   * Cleanup all active timeouts (useful for shutdown)
   */
  static cleanupAll(): void {
    console.log(`🧹 Cleaning up ${this.activeTimeouts.size} active timeouts`)
    
    this.activeTimeouts.forEach((timeoutId, operationId) => {
      clearTimeout(timeoutId)
    })
    
    this.activeTimeouts.clear()
    
    if (global.gc) {
      global.gc()
    }
  }

  /**
   * Get statistics about active operations
   */
  static getStats(): {
    activeOperations: number
    operationIds: string[]
  } {
    return {
      activeOperations: this.activeTimeouts.size,
      operationIds: Array.from(this.activeTimeouts.keys())
    }
  }

  /**
   * Create a timeout wrapper for upload operations
   */
  static forUpload<T>(
    operation: () => Promise<T>,
    fileSize: number
  ): Promise<T> {
    // Dynamic timeout based on file size: 1 minute base + 1 second per MB
    const timeoutMs = Math.min(
      60000 + (fileSize / (1024 * 1024)) * 1000, // Base + 1s per MB
      300000 // Max 5 minutes
    )
    
    const operationId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    console.log(`🕐 Setting ${Math.round(timeoutMs / 1000)}s timeout for ${Math.round(fileSize / 1024 / 1024)}MB upload`)
    
    return this.withTimeout(operation, timeoutMs, operationId)
  }

  /**
   * Create a timeout wrapper for database operations
   */
  static forDatabase<T>(
    operation: () => Promise<T>,
    queryType: 'read' | 'write' | 'batch' = 'read'
  ): Promise<T> {
    const timeouts = {
      read: 30000,   // 30 seconds
      write: 60000,  // 1 minute  
      batch: 180000  // 3 minutes
    }
    
    const operationId = `db_${queryType}_${Date.now()}`
    
    return this.withTimeout(operation, timeouts[queryType], operationId)
  }
}

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  const gracefulShutdown = () => {
    console.log('🛑 Graceful shutdown initiated - cleaning up timeouts')
    TimeoutService.cleanupAll()
  }
  
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
}