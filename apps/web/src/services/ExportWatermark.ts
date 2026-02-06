/**
 * ExportWatermark - Phase 3: Export-Wasserzeichen
 *
 * Fügt User-Informationen in exportierte Dateien ein:
 * - PDF: Unsichtbares Wasserzeichen + Metadata
 * - DOCX: Document Properties + versteckter Text
 * - Excel: Custom Properties + versteckte Zellen
 * - CSV: Kommentar-Header mit User-Info
 *
 * Ermöglicht forensische Nachverfolgung bei Datenlecks.
 */

interface WatermarkData {
  userId: string
  userEmail: string
  organizationId?: string
  organizationName?: string
  exportTimestamp: string
  documentId?: string
  projectId?: string
}

interface WatermarkOptions {
  visible?: boolean // Sichtbares Wasserzeichen (Standard: false)
  includeInFilename?: boolean // User-Hash im Dateinamen
  encryptData?: boolean // Verschlüssele Wasserzeichen-Daten
}

/**
 * Generiert Wasserzeichen-Daten für Export
 */
export function generateWatermarkData(
  userId: string,
  userEmail: string,
  options?: {
    organizationId?: string
    organizationName?: string
    documentId?: string
    projectId?: string
  }
): WatermarkData {
  return {
    userId,
    userEmail,
    organizationId: options?.organizationId,
    organizationName: options?.organizationName,
    documentId: options?.documentId,
    projectId: options?.projectId,
    exportTimestamp: new Date().toISOString(),
  }
}

/**
 * Generiert einen kurzen Hash für Dateinamen
 */
export function generateExportHash(data: WatermarkData): string {
  const input = `${data.userId}-${data.exportTimestamp}`
  // Einfacher Hash für Dateinamen (nicht kryptographisch sicher)
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8)
}

/**
 * Fügt Wasserzeichen zu CSV-Daten hinzu
 */
export function watermarkCSV(csvContent: string, data: WatermarkData): string {
  const header = [
    `# EVIDENRA Research Export`,
    `# Exported by: ${data.userEmail}`,
    `# Export ID: ${generateExportHash(data)}`,
    `# Timestamp: ${data.exportTimestamp}`,
    `# ----------------------------------------`,
    '',
  ].join('\n')

  return header + csvContent
}

/**
 * Generiert Wasserzeichen-Metadata für PDF
 */
export function getPDFWatermarkMetadata(data: WatermarkData): Record<string, string> {
  return {
    Creator: 'EVIDENRA Research',
    Producer: `EVIDENRA Export v1.0`,
    Author: data.userEmail,
    Subject: `Export ID: ${generateExportHash(data)}`,
    Keywords: `evidenra,research,${data.userId.slice(0, 8)}`,
    CreationDate: data.exportTimestamp,
    ModDate: data.exportTimestamp,
    // Verstecktes Wasserzeichen in Custom-Feld
    'X-Evidenra-Export': btoa(JSON.stringify({
      u: data.userId,
      e: data.userEmail,
      t: data.exportTimestamp,
      h: generateExportHash(data),
    })),
  }
}

/**
 * Generiert sichtbaren Wasserzeichen-Text für PDF
 */
export function getPDFVisibleWatermark(data: WatermarkData): string {
  return `EVIDENRA | ${data.userEmail} | ${new Date(data.exportTimestamp).toLocaleDateString('de-DE')}`
}

/**
 * Fügt Wasserzeichen zu Excel (XLSX) Workbook hinzu
 */
export function watermarkXLSX(
  workbook: unknown,
  data: WatermarkData,
  XLSX: typeof import('xlsx')
): void {
  // Füge Custom Properties hinzu
  if (!workbook) return

  const wb = workbook as import('xlsx').WorkBook

  // Setze Workbook-Properties
  wb.Props = {
    ...wb.Props,
    Title: 'EVIDENRA Research Export',
    Author: data.userEmail,
    Company: data.organizationName || 'EVIDENRA',
    Comments: `Export ID: ${generateExportHash(data)}`,
    CreatedDate: new Date(data.exportTimestamp),
    ModifiedDate: new Date(data.exportTimestamp),
  }

  // Füge verstecktes Worksheet mit Wasserzeichen hinzu
  const watermarkSheet = XLSX.utils.aoa_to_sheet([
    ['EVIDENRA Export Information'],
    ['Export ID', generateExportHash(data)],
    ['Exported By', data.userEmail],
    ['User ID', data.userId.slice(0, 8) + '...'],
    ['Timestamp', data.exportTimestamp],
    ['Organization', data.organizationName || 'N/A'],
    ['', ''],
    ['This sheet contains export verification data.'],
    ['Do not delete this sheet.'],
  ])

  // Verstecke das Worksheet
  XLSX.utils.book_append_sheet(wb, watermarkSheet, '_evidenra_export')

  // Markiere als sehr versteckt (xlSheetVeryHidden)
  if (wb.Workbook) {
    wb.Workbook.Sheets = wb.Workbook.Sheets || []
    const sheetIndex = wb.SheetNames.indexOf('_evidenra_export')
    if (sheetIndex >= 0) {
      wb.Workbook.Sheets[sheetIndex] = {
        ...wb.Workbook.Sheets[sheetIndex],
        Hidden: 2, // 2 = xlSheetVeryHidden
      }
    }
  }
}

/**
 * Generiert Wasserzeichen-Daten für JSON-Export
 */
export function watermarkJSON(jsonData: unknown, data: WatermarkData): object {
  return {
    _export: {
      platform: 'EVIDENRA Research',
      version: '1.0',
      exportId: generateExportHash(data),
      exportedBy: data.userEmail,
      userId: data.userId,
      timestamp: data.exportTimestamp,
      organization: data.organizationName,
    },
    data: jsonData,
  }
}

/**
 * Generiert einen Dateinamen mit Export-Hash
 */
export function generateWatermarkedFilename(
  baseName: string,
  extension: string,
  data: WatermarkData,
  includeHash = true
): string {
  const date = new Date(data.exportTimestamp)
  const dateStr = date.toISOString().split('T')[0]

  if (includeHash) {
    const hash = generateExportHash(data)
    return `${baseName}_${dateStr}_${hash}.${extension}`
  }

  return `${baseName}_${dateStr}.${extension}`
}

/**
 * Dekodiert Wasserzeichen aus PDF-Metadata
 */
export function decodeWatermarkFromPDF(
  metadata: Record<string, string>
): WatermarkData | null {
  try {
    const encoded = metadata['X-Evidenra-Export']
    if (!encoded) return null

    const decoded = JSON.parse(atob(encoded)) as {
      u: string
      e: string
      t: string
      h: string
    }

    return {
      userId: decoded.u,
      userEmail: decoded.e,
      exportTimestamp: decoded.t,
    }
  } catch {
    return null
  }
}

/**
 * Prüft ob eine Datei ein EVIDENRA-Wasserzeichen enthält
 */
export function hasEvidenraWatermark(content: string): boolean {
  return (
    content.includes('EVIDENRA Research Export') ||
    content.includes('X-Evidenra-Export') ||
    content.includes('_evidenra_export')
  )
}

export default {
  generateWatermarkData,
  generateExportHash,
  watermarkCSV,
  getPDFWatermarkMetadata,
  getPDFVisibleWatermark,
  watermarkXLSX,
  watermarkJSON,
  generateWatermarkedFilename,
  decodeWatermarkFromPDF,
  hasEvidenraWatermark,
}
