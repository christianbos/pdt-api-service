import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/analyticsService'
import { validateApiKey } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const stats = await AnalyticsService.getDashboardStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}