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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year' || 'month'
    const storeId = searchParams.get('storeId') || undefined

    // Validar período
    if (!['week', 'month', 'quarter', 'year'].includes(period)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Período inválido. Debe ser: week, month, quarter, year' 
        },
        { status: 400 }
      )
    }

    const stats = await AnalyticsService.getAdminStats({
      period,
      storeId,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('Error fetching admin analytics:', error)
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