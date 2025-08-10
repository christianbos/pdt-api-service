import { NextRequest, NextResponse } from 'next/server'
import { validateAdminAccess } from '@/lib/auth'
import { MemoryMonitor } from '@/middleware/memoryMonitor'

export async function GET(request: NextRequest) {
  try {
    // Validar acceso administrativo
    if (!validateAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Admin access required' }, 
        { status: 401 }
      )
    }

    const stats = MemoryMonitor.getMemoryStats()
    const trends = MemoryMonitor.analyzeMemoryTrends()

    // Format memory values for readability
    const formatMB = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100

    const response = {
      current: {
        heapUsed: formatMB(stats.current.heapUsed),
        heapTotal: formatMB(stats.current.heapTotal),
        external: formatMB(stats.current.external),
        arrayBuffers: formatMB(stats.current.arrayBuffers),
        timestamp: new Date(stats.current.timestamp).toISOString()
      },
      statistics: {
        peakUsage: formatMB(stats.peakUsage),
        averageUsage: formatMB(stats.averageUsage),
        samplesCount: stats.history.length
      },
      trends: {
        isIncreasing: trends.isIncreasing,
        leakSuspected: trends.leakSuspected,
        topMemoryEndpoints: trends.topEndpoints
      },
      history: stats.history.slice(-20).map(h => ({
        endpoint: h.endpoint,
        heapUsed: formatMB(h.heapUsed),
        timestamp: new Date(h.timestamp).toISOString()
      })),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        uptime: Math.round(process.uptime()),
        pid: process.pid
      },
      recommendations: generateRecommendations(stats, trends)
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error getting memory stats:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve memory statistics' },
      { status: 500 }
    )
  }
}

function generateRecommendations(
  stats: ReturnType<typeof MemoryMonitor.getMemoryStats>,
  trends: ReturnType<typeof MemoryMonitor.analyzeMemoryTrends>
): string[] {
  const recommendations = []
  const currentMB = Math.round(stats.current.heapUsed / 1024 / 1024)
  
  if (currentMB > 400) {
    recommendations.push('🚨 Memory usage is critically high. Consider restarting the server.')
  } else if (currentMB > 300) {
    recommendations.push('⚠️ Memory usage is high. Monitor closely and consider optimization.')
  }
  
  if (trends.leakSuspected) {
    recommendations.push('🔍 Memory leak suspected. Check recent endpoint usage and buffer handling.')
  }
  
  if (trends.isIncreasing) {
    recommendations.push('📈 Memory usage is trending upward. Review recent deployments and traffic patterns.')
  }
  
  if (trends.topEndpoints.length > 0) {
    recommendations.push(`📊 Top memory consumers: ${trends.topEndpoints.slice(0, 3).join(', ')}`)
  }
  
  if (stats.current.arrayBuffers > 100 * 1024 * 1024) { // 100MB in array buffers
    recommendations.push('📦 High array buffer usage detected. Review file upload handling.')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ Memory usage looks healthy.')
  }
  
  return recommendations
}