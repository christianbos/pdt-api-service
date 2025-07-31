import { NextRequest, NextResponse } from 'next/server'
import { CardService } from '@/lib/cardService'
import { ExcelImportService } from '@/lib/excelImport'
import { CreateCardSchema } from '@/lib/validations'
import { validateApiKey } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid API key required.' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = ExcelImportService.parseExcelBuffer(buffer)

    const results = {
      total: rows.length,
      success: 0,
      errors: [] as Array<{ row: number, error: string, data?: any }>
    }

    for (let i = 0; i < rows.length; i++) {
      try {
        const cardRequest = ExcelImportService.convertRowToCardRequest(rows[i])
        
        const validatedData = CreateCardSchema.parse(cardRequest)
        
        await CardService.createCard(validatedData)
        results.success++
        
      } catch (error: any) {
        results.errors.push({
          row: i + 2,
          error: error.message || 'Unknown error',
          data: rows[i]
        })
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success}/${results.total} cards imported successfully.`,
      results
    })

  } catch (error: any) {
    console.error('Error importing Excel file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const templateBuffer = ExcelImportService.generateExcelTemplate()
    
    return new NextResponse(templateBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="card_template.xlsx"'
      }
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}