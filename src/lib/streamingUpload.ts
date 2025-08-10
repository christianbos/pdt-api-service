import { Readable } from 'stream'

export interface StreamingUploadResult {
  buffer: Buffer
  size: number
  cleanup: () => void
}

export class StreamingUploadService {
  private static readonly MAX_BUFFER_SIZE = 50 * 1024 * 1024 // 50MB max
  private static readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks

  /**
   * Process large files in streaming fashion to prevent memory issues
   */
  static async processFileStream(file: File): Promise<StreamingUploadResult> {
    const fileSize = file.size
    
    if (fileSize > this.MAX_BUFFER_SIZE) {
      throw new Error(`File size ${fileSize} exceeds maximum allowed size of ${this.MAX_BUFFER_SIZE}`)
    }

    // For smaller files, use direct buffer conversion
    if (fileSize <= this.CHUNK_SIZE) {
      const buffer = Buffer.from(await file.arrayBuffer())
      return {
        buffer,
        size: fileSize,
        cleanup: () => {
          // Force buffer cleanup
          if (global.gc) {
            setImmediate(() => global.gc!())
          }
        }
      }
    }

    // For larger files, process in chunks
    return this.processLargeFileInChunks(file)
  }

  private static async processLargeFileInChunks(file: File): Promise<StreamingUploadResult> {
    const chunks: Buffer[] = []
    let totalSize = 0
    
    const stream = file.stream()
    const reader = stream.getReader()
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        const chunk = Buffer.from(value)
        chunks.push(chunk)
        totalSize += chunk.length
        
        // Memory pressure check
        if (totalSize > this.MAX_BUFFER_SIZE) {
          throw new Error('File processing exceeded memory limits')
        }
      }
      
      const finalBuffer = Buffer.concat(chunks)
      
      return {
        buffer: finalBuffer,
        size: totalSize,
        cleanup: () => {
          // Clean up chunk references
          chunks.length = 0
          if (global.gc) {
            setImmediate(() => global.gc!())
          }
        }
      }
      
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Memory-safe buffer conversion with automatic cleanup
   */
  static async convertToBufferSafe(
    file: File,
    callback: (buffer: Buffer) => Promise<any>
  ): Promise<any> {
    const result = await this.processFileStream(file)
    
    try {
      return await callback(result.buffer)
    } finally {
      // Always cleanup, even if callback fails
      result.cleanup()
    }
  }

  /**
   * Monitor memory usage during upload operations
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  /**
   * Log memory stats for debugging
   */
  static logMemoryStats(operation: string): void {
    const usage = this.getMemoryUsage()
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100
    
    console.log(`[${operation}] Memory: ${usedMB}MB used / ${totalMB}MB total`)
    
    if (usedMB > 400) { // Warning at 400MB
      console.warn(`[${operation}] High memory usage detected: ${usedMB}MB`)
    }
  }

  /**
   * Force garbage collection if available
   */
  static forceGarbageCollection(): void {
    if (global.gc) {
      global.gc()
      console.log('Forced garbage collection')
    }
  }
}