import * as XLSX from 'xlsx'
import { CreateCardRequest } from '@/types/card'

interface ExcelCardRow {
  name: string
  set: string
  number: string
  year: string
  rarity: string
  finalGrade: number
  certificationNumber: number
  version: number
  has3DScan: boolean
  tcg?: string
  gradeText?: string
  notes?: string
  gradeDate?: string
  // Surface
  surfaceFinalScore: number
  surfaceBent: number
  surfaceBentWeight?: number
  surfaceFrontColor: number
  surfaceFrontScratches: number
  surfaceFrontColorWeight: number
  surfaceFrontScratchesWeight: number
  surfaceFrontTotalWeight: number
  surfaceBackColor: number
  surfaceBackScratches: number
  surfaceBackColorWeight: number
  surfaceBackScratchesWeight: number
  surfaceBackTotalWeight: number
  // Edges
  edgesFinalScore: number
  edgesFrontWeight: number
  edgesBackWeight: number
  edgesFrontLeft: number
  edgesFrontTop: number
  edgesFrontRight: number
  edgesFrontBottom: number
  edgesBackLeft: number
  edgesBackTop: number
  edgesBackRight: number
  edgesBackBottom: number
  // Corners
  cornersFinalScore: number
  cornersFrontWeight: number
  cornersBackWeight: number
  cornersFrontTopLeft: number
  cornersFrontTopRight: number
  cornersFrontBottomLeft: number
  cornersFrontBottomRight: number
  cornersBackTopLeft: number
  cornersBackTopRight: number
  cornersBackBottomLeft: number
  cornersBackBottomRight: number
  // Centering
  centeringFrontScore: number
  centeringBackScore: number
  centeringFinalScore: number
  centeringFrontLeft: number
  centeringFrontTop: number
  centeringFrontRight: number
  centeringFrontBottom: number
  centeringBackLeft: number
  centeringBackTop: number
  centeringBackRight: number
  centeringBackBottom: number
}

export class ExcelImportService {
  static parseExcelBuffer(buffer: Buffer): ExcelCardRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const data = XLSX.utils.sheet_to_json<ExcelCardRow>(worksheet, {
      raw: true, // Use raw values for numbers and booleans
    })

    return data
  }

  static convertRowToCardRequest(row: ExcelCardRow): CreateCardRequest {
    return {
      name: row.name,
      set: row.set,
      number: row.number,
      year: row.year,
      rarity: row.rarity,
      finalGrade: row.finalGrade,
      certificationNumber: row.certificationNumber,
      version: row.version,
      has3DScan: row.has3DScan,
      tcg: row.tcg,
      gradeText: row.gradeText,
      notes: row.notes,
      gradeDate: row.gradeDate,
      surface: {
        finalScore: row.surfaceFinalScore,
        bent: row.surfaceBent,
        bentWeight: row.surfaceBentWeight || null,
        front: {
          color: row.surfaceFrontColor,
          scratches: row.surfaceFrontScratches,
          colorWeight: row.surfaceFrontColorWeight,
          scratchesWeight: row.surfaceFrontScratchesWeight,
          totalWeight: row.surfaceFrontTotalWeight,
        },
        back: {
          color: row.surfaceBackColor,
          scratches: row.surfaceBackScratches,
          colorWeight: row.surfaceBackColorWeight,
          scratchesWeight: row.surfaceBackScratchesWeight,
          totalWeight: row.surfaceBackTotalWeight,
        },
      },
      edges: {
        finalScore: row.edgesFinalScore,
        frontWeight: row.edgesFrontWeight,
        backWeight: row.edgesBackWeight,
        front: {
          left: row.edgesFrontLeft,
          top: row.edgesFrontTop,
          right: row.edgesFrontRight,
          bottom: row.edgesFrontBottom,
        },
        back: {
          left: row.edgesBackLeft,
          top: row.edgesBackTop,
          right: row.edgesBackRight,
          bottom: row.edgesBackBottom,
        },
      },
      corners: {
        finalScore: row.cornersFinalScore,
        frontWeight: row.cornersFrontWeight,
        backWeight: row.cornersBackWeight,
        front: {
          topLeft: row.cornersFrontTopLeft,
          topRight: row.cornersFrontTopRight,
          bottomLeft: row.cornersFrontBottomLeft,
          bottomRight: row.cornersFrontBottomRight,
        },
        back: {
          topLeft: row.cornersBackTopLeft,
          topRight: row.cornersBackTopRight,
          bottomLeft: row.cornersBackBottomLeft,
          bottomRight: row.cornersBackBottomRight,
        },
      },
      centering: {
        frontScore: row.centeringFrontScore,
        backScore: row.centeringBackScore,
        finalScore: row.centeringFinalScore,
        front: {
          left: row.centeringFrontLeft,
          top: row.centeringFrontTop,
          right: row.centeringFrontRight,
          bottom: row.centeringFrontBottom,
        },
        back: {
          left: row.centeringBackLeft,
          top: row.centeringBackTop,
          right: row.centeringBackRight,
          bottom: row.centeringBackBottom,
        },
      },
    }
  }

  static generateExcelTemplate(): Buffer {
    const headers = [
      'name', 'set', 'number', 'year', 'rarity', 'finalGrade', 'certificationNumber', 'version', 'has3DScan',
      'surfaceFinalScore', 'surfaceBent', 'surfaceBentWeight',
      'surfaceFrontColor', 'surfaceFrontScratches', 'surfaceFrontColorWeight', 'surfaceFrontScratchesWeight', 'surfaceFrontTotalWeight',
      'surfaceBackColor', 'surfaceBackScratches', 'surfaceBackColorWeight', 'surfaceBackScratchesWeight', 'surfaceBackTotalWeight',
      'edgesFinalScore', 'edgesFrontWeight', 'edgesBackWeight',
      'edgesFrontLeft', 'edgesFrontTop', 'edgesFrontRight', 'edgesFrontBottom',
      'edgesBackLeft', 'edgesBackTop', 'edgesBackRight', 'edgesBackBottom',
      'cornersFinalScore', 'cornersFrontWeight', 'cornersBackWeight',
      'cornersFrontTopLeft', 'cornersFrontTopRight', 'cornersFrontBottomLeft', 'cornersFrontBottomRight',
      'cornersBackTopLeft', 'cornersBackTopRight', 'cornersBackBottomLeft', 'cornersBackBottomRight',
      'centeringFrontScore', 'centeringBackScore', 'centeringFinalScore',
      'centeringFrontLeft', 'centeringFrontTop', 'centeringFrontRight', 'centeringFrontBottom',
      'centeringBackLeft', 'centeringBackTop', 'centeringBackRight', 'centeringBackBottom'
    ]

    const exampleRow = [
      'Regigigas Vstar', 'CROWN ZENITH', '#114', '2023', 'ULTRA RARE', 10, 10, 1, false,
      9.5, 10, null,
      9.5, 9.5, 0.3, 0.7, 0.45,
      9.5, 9.5, 0.3, 0.7, 0.45,
      10, 0.6, 0.4,
      10, 10, 10, 10,
      10, 10, 10, 10,
      10, 0.6, 0.4,
      10, 10, 10, 10,
      10, 10, 10, 10,
      9.5, 9.5, 9.5,
      9.5, 9.5, 9.5, 9.5,
      9.5, 9.5, 9.5, 9.5
    ]

    const worksheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cards')

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }
}