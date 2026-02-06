import type { Project, Document, Code, Coding } from '@/stores/projectStore'
import {
  generateWatermarkData,
  watermarkCSV,
  watermarkJSON,
  watermarkXLSX,
  generateWatermarkedFilename,
  type WatermarkData,
} from '@/services/ExportWatermark'
import { getAnalytics } from '@/services/BehavioralAnalytics'

export interface ExportData {
  project: Project
  documents: Document[]
  codes: Code[]
  codings: Coding[]
}

// Wasserzeichen-Kontext für Exports
let currentWatermark: WatermarkData | null = null

/**
 * Setzt den Wasserzeichen-Kontext für Exports
 */
export function setExportWatermark(
  userId: string,
  userEmail: string,
  options?: {
    organizationId?: string
    organizationName?: string
    projectId?: string
  }
): void {
  currentWatermark = generateWatermarkData(userId, userEmail, options)
}

export interface ExportOptions {
  includeDocuments: boolean
  includeCodes: boolean
  includeCodings: boolean
  includeMemos: boolean
  includeMetadata: boolean
}

// ============================================
// CSV EXPORT
// ============================================

export function exportToCSV(data: ExportData, options: ExportOptions): string {
  const sections: string[] = []

  if (options.includeCodes) {
    sections.push(generateCodesCSV(data.codes))
  }

  if (options.includeCodings) {
    sections.push(generateCodingsCSV(data.codings, data.codes, data.documents))
  }

  if (options.includeDocuments && options.includeMetadata) {
    sections.push(generateDocumentsCSV(data.documents))
  }

  let csv = sections.join('\n\n')

  // Phase 3: Wasserzeichen hinzufügen
  if (currentWatermark) {
    csv = watermarkCSV(csv, currentWatermark)
  }

  return csv
}

function generateCodesCSV(codes: Code[]): string {
  const header = 'Code ID,Code Name,Description,Color,Parent ID,Created At'
  const rows = codes.map((code) =>
    [
      escapeCSV(code.id),
      escapeCSV(code.name),
      escapeCSV(code.description || ''),
      escapeCSV(code.color),
      escapeCSV(code.parentId || ''),
      escapeCSV(code.createdAt),
    ].join(',')
  )
  return `# CODES\n${header}\n${rows.join('\n')}`
}

function generateCodingsCSV(codings: Coding[], codes: Code[], documents: Document[]): string {
  const header = 'Coding ID,Document,Code,Selected Text,Start,End,Memo,Confidence,Method,Created At'
  const rows = codings.map((coding) => {
    const code = codes.find((c) => c.id === coding.codeId)
    const doc = documents.find((d) => d.id === coding.documentId)
    return [
      escapeCSV(coding.id),
      escapeCSV(doc?.name || ''),
      escapeCSV(code?.name || ''),
      escapeCSV(coding.selectedText),
      coding.startOffset,
      coding.endOffset,
      escapeCSV(coding.memo || ''),
      coding.confidence || '',
      escapeCSV(coding.codingMethod || 'manual'),
      escapeCSV(coding.createdAt),
    ].join(',')
  })
  return `# CODINGS\n${header}\n${rows.join('\n')}`
}

function generateDocumentsCSV(documents: Document[]): string {
  const header = 'Document ID,Name,File Type,Word Count,Created At,Updated At'
  const rows = documents.map((doc) =>
    [
      escapeCSV(doc.id),
      escapeCSV(doc.name),
      escapeCSV(doc.fileType),
      doc.wordCount,
      escapeCSV(doc.createdAt),
      escapeCSV(doc.updatedAt),
    ].join(',')
  )
  return `# DOCUMENTS\n${header}\n${rows.join('\n')}`
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// ============================================
// JSON EXPORT
// ============================================

export function exportToJSON(data: ExportData, options: ExportOptions): string {
  const exportObj: Record<string, any> = {
    project: {
      id: data.project.id,
      name: data.project.name,
      description: data.project.description,
      createdAt: data.project.createdAt,
      updatedAt: data.project.updatedAt,
    },
    exportedAt: new Date().toISOString(),
    version: '1.0',
  }

  if (options.includeCodes) {
    exportObj.codes = data.codes.map((code) => ({
      id: code.id,
      name: code.name,
      description: code.description,
      color: code.color,
      parentId: code.parentId,
      createdAt: code.createdAt,
    }))
  }

  if (options.includeCodings) {
    exportObj.codings = data.codings.map((coding) => ({
      id: coding.id,
      documentId: coding.documentId,
      codeId: coding.codeId,
      selectedText: coding.selectedText,
      startOffset: coding.startOffset,
      endOffset: coding.endOffset,
      memo: options.includeMemos ? coding.memo : undefined,
      confidence: coding.confidence,
      codingMethod: coding.codingMethod,
      createdAt: coding.createdAt,
    }))
  }

  if (options.includeDocuments) {
    exportObj.documents = data.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      fileType: doc.fileType,
      wordCount: doc.wordCount,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }))
  }

  // Phase 3: Wasserzeichen hinzufügen
  if (currentWatermark) {
    const watermarked = watermarkJSON(exportObj, currentWatermark)
    return JSON.stringify(watermarked, null, 2)
  }

  return JSON.stringify(exportObj, null, 2)
}

// ============================================
// REFI-QDA XML EXPORT (MAXQDA/Atlas.ti compatible)
// ============================================

export function exportToREFIQDA(data: ExportData, options: ExportOptions): string {
  const xml: string[] = []

  xml.push('<?xml version="1.0" encoding="UTF-8"?>')
  xml.push('<Project xmlns="urn:QDA-XML:project:1.0" name="' + escapeXML(data.project.name) + '">')
  xml.push('  <Users>')
  xml.push('    <User guid="user-1" name="Evidenra Export"/>')
  xml.push('  </Users>')

  // Code System
  if (options.includeCodes) {
    xml.push('  <CodeBook>')
    xml.push('    <Codes>')

    // Build code hierarchy
    const rootCodes = data.codes.filter((c) => !c.parentId)
    rootCodes.forEach((code) => {
      xml.push(generateCodeXML(code, data.codes, 3))
    })

    xml.push('    </Codes>')
    xml.push('  </CodeBook>')
  }

  // Sources (Documents)
  if (options.includeDocuments) {
    xml.push('  <Sources>')
    data.documents.forEach((doc) => {
      xml.push(`    <TextSource guid="${doc.id}" name="${escapeXML(doc.name)}">`)
      if (doc.content) {
        xml.push(`      <PlainTextContent>${escapeXML(doc.content)}</PlainTextContent>`)
      }
      xml.push('    </TextSource>')
    })
    xml.push('  </Sources>')
  }

  // Codings
  if (options.includeCodings) {
    xml.push('  <Coding>')
    data.codings.forEach((coding) => {
      const code = data.codes.find((c) => c.id === coding.codeId)
      xml.push(`    <CodeRef targetGUID="${coding.codeId}">`)
      xml.push(`      <SourceRef targetGUID="${coding.documentId}">`)
      xml.push(`        <PlainTextSelection start="${coding.startOffset}" end="${coding.endOffset}"/>`)
      xml.push('      </SourceRef>')
      if (options.includeMemos && coding.memo) {
        xml.push(`      <Note>${escapeXML(coding.memo)}</Note>`)
      }
      xml.push('    </CodeRef>')
    })
    xml.push('  </Coding>')
  }

  xml.push('</Project>')

  return xml.join('\n')
}

function generateCodeXML(code: Code, allCodes: Code[], indent: number): string {
  const spaces = '  '.repeat(indent)
  const children = allCodes.filter((c) => c.parentId === code.id)
  const lines: string[] = []

  lines.push(`${spaces}<Code guid="${code.id}" name="${escapeXML(code.name)}" color="${code.color}">`)

  if (code.description) {
    lines.push(`${spaces}  <Description>${escapeXML(code.description)}</Description>`)
  }

  children.forEach((child) => {
    lines.push(generateCodeXML(child, allCodes, indent + 1))
  })

  lines.push(`${spaces}</Code>`)

  return lines.join('\n')
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================
// EXCEL EXPORT (using SheetJS)
// ============================================

export async function exportToExcel(data: ExportData, options: ExportOptions): Promise<Blob> {
  // Dynamic import of xlsx library
  const XLSX = await import('xlsx')

  const workbook = XLSX.utils.book_new()

  // Project Info Sheet
  if (options.includeMetadata) {
    const projectData = [
      ['Project Name', data.project.name],
      ['Description', data.project.description || ''],
      ['Created At', data.project.createdAt],
      ['Updated At', data.project.updatedAt],
      ['Documents', data.documents.length],
      ['Codes', data.codes.length],
      ['Codings', data.codings.length],
      ['Exported At', new Date().toISOString()],
    ]
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData)
    XLSX.utils.book_append_sheet(workbook, projectSheet, 'Project Info')
  }

  // Codes Sheet
  if (options.includeCodes) {
    const codesHeader = ['ID', 'Name', 'Description', 'Color', 'Parent ID', 'Created At']
    const codesData = data.codes.map((code) => [
      code.id,
      code.name,
      code.description || '',
      code.color,
      code.parentId || '',
      code.createdAt,
    ])
    const codesSheet = XLSX.utils.aoa_to_sheet([codesHeader, ...codesData])
    XLSX.utils.book_append_sheet(workbook, codesSheet, 'Codes')
  }

  // Codings Sheet
  if (options.includeCodings) {
    const codingsHeader = [
      'ID',
      'Document',
      'Code',
      'Selected Text',
      'Start',
      'End',
      'Memo',
      'Confidence',
      'Method',
      'Created At',
    ]
    const codingsData = data.codings.map((coding) => {
      const code = data.codes.find((c) => c.id === coding.codeId)
      const doc = data.documents.find((d) => d.id === coding.documentId)
      return [
        coding.id,
        doc?.name || '',
        code?.name || '',
        coding.selectedText,
        coding.startOffset,
        coding.endOffset,
        options.includeMemos ? coding.memo || '' : '',
        coding.confidence || '',
        coding.codingMethod || 'manual',
        coding.createdAt,
      ]
    })
    const codingsSheet = XLSX.utils.aoa_to_sheet([codingsHeader, ...codingsData])
    XLSX.utils.book_append_sheet(workbook, codingsSheet, 'Codings')
  }

  // Documents Sheet
  if (options.includeDocuments) {
    const docsHeader = ['ID', 'Name', 'File Type', 'Word Count', 'Created At', 'Updated At']
    const docsData = data.documents.map((doc) => [
      doc.id,
      doc.name,
      doc.fileType,
      doc.wordCount,
      doc.createdAt,
      doc.updatedAt,
    ])
    const docsSheet = XLSX.utils.aoa_to_sheet([docsHeader, ...docsData])
    XLSX.utils.book_append_sheet(workbook, docsSheet, 'Documents')

    // Optional: Full document content in separate sheets
    if (options.includeMetadata) {
      data.documents.forEach((doc) => {
        if (doc.content) {
          const contentSheet = XLSX.utils.aoa_to_sheet([
            ['Name', doc.name],
            ['Content', doc.content],
          ])
          // Limit sheet name to 31 chars and remove invalid characters
          const sheetName = doc.name.slice(0, 28).replace(/[\\/*?[\]]/g, '_')
          XLSX.utils.book_append_sheet(workbook, contentSheet, `Doc_${sheetName}`)
        }
      })
    }
  }

  // Phase 3: Wasserzeichen hinzufügen
  if (currentWatermark) {
    watermarkXLSX(workbook, currentWatermark, XLSX)
  }

  // Generate binary
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ============================================
// DOWNLOAD HELPER
// ============================================

export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  let blob: Blob

  if (content instanceof Blob) {
    blob = content
  } else {
    blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' })
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'maxqda' | 'atlas'

export async function exportProject(
  format: ExportFormat,
  data: ExportData,
  options: ExportOptions
): Promise<void> {
  const baseName = data.project.name.replace(/[^a-zA-Z0-9]/g, '_')

  // Phase 3: Analytics-Tracking
  const analytics = getAnalytics()
  analytics.trackExport(format, data.documents.length)

  // Generiere Dateinamen (mit Wasserzeichen-Hash wenn vorhanden)
  const getFilename = (ext: string) => {
    if (currentWatermark) {
      return generateWatermarkedFilename(baseName, ext, currentWatermark, true)
    }
    const timestamp = new Date().toISOString().slice(0, 10)
    return `${baseName}_${timestamp}.${ext}`
  }

  switch (format) {
    case 'csv': {
      const csv = exportToCSV(data, options)
      downloadFile(csv, getFilename('csv'), 'text/csv')
      break
    }

    case 'json': {
      const json = exportToJSON(data, options)
      downloadFile(json, getFilename('json'), 'application/json')
      break
    }

    case 'xlsx': {
      const blob = await exportToExcel(data, options)
      downloadFile(blob, getFilename('xlsx'))
      break
    }

    case 'maxqda':
    case 'atlas': {
      // Both use REFI-QDA XML format
      const xml = exportToREFIQDA(data, options)
      const extension = format === 'maxqda' ? 'qdpx' : 'atlproj'
      downloadFile(xml, getFilename(extension), 'application/xml')
      break
    }
  }
}
