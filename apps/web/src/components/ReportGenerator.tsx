import { useState } from 'react'
import { type Code, type Coding, type Document } from '@/stores/projectStore'
import { type Memo } from '@/stores/memoStore'

interface ReportGeneratorProps {
  projectName: string
  documents: Document[]
  codes: Code[]
  codings: Coding[]
  memos?: Memo[]
  onClose: () => void
}

type ReportType = 'summary' | 'codebook' | 'frequency' | 'matrix' | 'full'
type ExportFormat = 'html' | 'markdown' | 'docx' | 'pdf'

interface ReportSection {
  id: string
  name: string
  enabled: boolean
}

export default function ReportGenerator({
  projectName,
  documents,
  codes,
  codings,
  memos = [],
  onClose,
}: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('summary')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<string | null>(null)
  const [sections, setSections] = useState<ReportSection[]>([
    { id: 'overview', name: 'Projektübersicht', enabled: true },
    { id: 'codebook', name: 'Codebuch', enabled: true },
    { id: 'frequency', name: 'Häufigkeitsanalyse', enabled: true },
    { id: 'quotations', name: 'Zitate nach Code', enabled: true },
    { id: 'memos', name: 'Memos', enabled: true },
    { id: 'matrix', name: 'Code-Dokument-Matrix', enabled: false },
  ])

  const reportTypes = [
    {
      id: 'summary' as ReportType,
      name: 'Zusammenfassung',
      description: 'Überblick über alle Codes und Häufigkeiten',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      id: 'codebook' as ReportType,
      name: 'Codebuch',
      description: 'Vollständige Code-Dokumentation mit Definitionen',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    },
    {
      id: 'frequency' as ReportType,
      name: 'Häufigkeitstabelle',
      description: 'Detaillierte Zählung aller Kodierungen',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      id: 'matrix' as ReportType,
      name: 'Code-Matrix',
      description: 'Kreuztabelle Code vs. Dokument',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    },
    {
      id: 'full' as ReportType,
      name: 'Vollständiger Bericht',
      description: 'Alle Abschnitte in einem Dokument',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
  ]

  const toggleSection = (id: string) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    )
  }

  const generateReport = async () => {
    setIsGenerating(true)

    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    const enabledSections = sections.filter(s => s.enabled).map(s => s.id)
    const report = buildReport(
      projectName,
      documents,
      codes,
      codings,
      memos,
      reportType,
      enabledSections
    )

    setGeneratedReport(report)
    setIsGenerating(false)
  }

  const downloadReport = () => {
    if (!generatedReport) return

    let content = generatedReport
    let mimeType = 'text/html'
    let extension = 'html'

    if (exportFormat === 'markdown') {
      content = htmlToMarkdown(generatedReport)
      mimeType = 'text/markdown'
      extension = 'md'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}_Bericht.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-surface-900 rounded-2xl border border-surface-800 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-100">Bericht generieren</h2>
              <p className="text-sm text-surface-400 mt-1">
                Erstellen Sie einen Analysebericht für Ihr Forschungsprojekt
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!generatedReport ? (
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-3">Berichtstyp</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        reportType === type.id
                          ? 'border-primary-500 bg-primary-500/5'
                          : 'border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          reportType === type.id ? 'bg-primary-500/10 text-primary-400' : 'bg-surface-800 text-surface-400'
                        }`}>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={type.icon} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-surface-100">{type.name}</h3>
                          <p className="text-xs text-surface-500 mt-0.5">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Selection (for full report) */}
              {reportType === 'full' && (
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-3">Abschnitte</label>
                  <div className="space-y-2">
                    {sections.map(section => (
                      <label
                        key={section.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={section.enabled}
                          onChange={() => toggleSection(section.id)}
                          className="w-4 h-4 rounded border-surface-600 bg-surface-700 text-primary-500 focus:ring-primary-500/50"
                        />
                        <span className="text-sm text-surface-200">{section.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-3">Exportformat</label>
                <div className="flex gap-3">
                  {([
                    { id: 'html', label: 'HTML', icon: 'text-orange-400' },
                    { id: 'markdown', label: 'Markdown', icon: 'text-blue-400' },
                  ] as const).map(format => (
                    <button
                      key={format.id}
                      onClick={() => setExportFormat(format.id)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        exportFormat === format.id
                          ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                          : 'border-surface-700 text-surface-400 hover:border-surface-600'
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-surface-800/50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{documents.length}</p>
                  <p className="text-xs text-surface-500">Dokumente</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{codes.length}</p>
                  <p className="text-xs text-surface-500">Codes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{codings.length}</p>
                  <p className="text-xs text-surface-500">Kodierungen</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-100">{memos.length}</p>
                  <p className="text-xs text-surface-500">Memos</p>
                </div>
              </div>
            </div>
          ) : (
            /* Report Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-surface-300">Vorschau</h3>
                <button
                  onClick={() => setGeneratedReport(null)}
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Zurück zur Konfiguration
                </button>
              </div>
              <div
                className="prose prose-invert prose-sm max-w-none bg-white text-gray-900 rounded-xl p-6 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: generatedReport }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800"
          >
            Abbrechen
          </button>
          {generatedReport ? (
            <button
              onClick={downloadReport}
              className="px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Herunterladen
            </button>
          ) : (
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Bericht erstellen
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function buildReport(
  projectName: string,
  documents: Document[],
  codes: Code[],
  codings: Coding[],
  memos: Memo[],
  type: ReportType,
  enabledSections: string[]
): string {
  const now = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Calculate statistics
  const codeFrequencies = codes.map(code => ({
    ...code,
    count: codings.filter(c => c.codeId === code.id).length,
  })).sort((a, b) => b.count - a.count)

  const rootCodes = codes.filter(c => !c.parentId)

  let html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Forschungsbericht: ${projectName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { color: #374151; margin-top: 2rem; }
    h3 { color: #4b5563; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; text-align: left; border: 1px solid #e5e7eb; }
    th { background: #f9fafb; }
    .code-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; }
    .quote { background: #f3f4f6; padding: 1rem; border-left: 3px solid #6366f1; margin: 1rem 0; font-style: italic; }
    .meta { color: #6b7280; font-size: 0.875rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0; }
    .stat-card { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .stat-value { font-size: 1.5rem; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 0.75rem; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Forschungsbericht: ${projectName}</h1>
  <p class="meta">Erstellt am ${now}</p>
`

  // Overview section
  if (type === 'summary' || type === 'full' && enabledSections.includes('overview')) {
    html += `
  <h2>Projektübersicht</h2>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${documents.length}</div>
      <div class="stat-label">Dokumente</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${codes.length}</div>
      <div class="stat-label">Codes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${codings.length}</div>
      <div class="stat-label">Kodierungen</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${memos.length}</div>
      <div class="stat-label">Memos</div>
    </div>
  </div>
`
  }

  // Codebook section
  if (type === 'codebook' || type === 'full' && enabledSections.includes('codebook')) {
    html += `
  <h2>Codebuch</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Beschreibung</th>
        <th>Häufigkeit</th>
      </tr>
    </thead>
    <tbody>
`
    for (const code of codeFrequencies) {
      const indent = code.parentId ? '&nbsp;&nbsp;&nbsp;&nbsp;' : ''
      html += `
      <tr>
        <td>${indent}<span class="code-badge" style="background-color: ${code.color}20; color: ${code.color}">${code.name}</span></td>
        <td>${code.description || '-'}</td>
        <td>${code.count}</td>
      </tr>
`
    }
    html += `
    </tbody>
  </table>
`
  }

  // Frequency section
  if (type === 'frequency' || type === 'full' && enabledSections.includes('frequency')) {
    html += `
  <h2>Häufigkeitsanalyse</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>Absolute Häufigkeit</th>
        <th>Relative Häufigkeit</th>
      </tr>
    </thead>
    <tbody>
`
    const total = codings.length || 1
    for (const code of codeFrequencies) {
      const percentage = ((code.count / total) * 100).toFixed(1)
      html += `
      <tr>
        <td><span class="code-badge" style="background-color: ${code.color}20; color: ${code.color}">${code.name}</span></td>
        <td>${code.count}</td>
        <td>${percentage}%</td>
      </tr>
`
    }
    html += `
    </tbody>
  </table>
`
  }

  // Quotations section
  if (type === 'full' && enabledSections.includes('quotations')) {
    html += `
  <h2>Zitate nach Code</h2>
`
    for (const code of codeFrequencies.filter(c => c.count > 0)) {
      const codeCodingsFiltered = codings.filter(c => c.codeId === code.id)
      html += `
  <h3><span class="code-badge" style="background-color: ${code.color}20; color: ${code.color}">${code.name}</span> (${code.count} Kodierungen)</h3>
`
      for (const coding of codeCodingsFiltered.slice(0, 5)) {
        const doc = documents.find(d => d.id === coding.documentId)
        html += `
  <div class="quote">
    "${coding.selectedText}"
    <p class="meta">— ${doc?.name || 'Unbekanntes Dokument'}</p>
  </div>
`
      }
      if (codeCodingsFiltered.length > 5) {
        html += `<p class="meta">... und ${codeCodingsFiltered.length - 5} weitere Kodierungen</p>`
      }
    }
  }

  // Matrix section
  if (type === 'matrix' || type === 'full' && enabledSections.includes('matrix')) {
    html += `
  <h2>Code-Dokument-Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Code</th>
`
    for (const doc of documents) {
      html += `        <th>${doc.name.slice(0, 10)}...</th>\n`
    }
    html += `
      </tr>
    </thead>
    <tbody>
`
    for (const code of rootCodes) {
      html += `      <tr>\n        <td>${code.name}</td>\n`
      for (const doc of documents) {
        const count = codings.filter(c => c.codeId === code.id && c.documentId === doc.id).length
        html += `        <td>${count || '-'}</td>\n`
      }
      html += `      </tr>\n`
    }
    html += `
    </tbody>
  </table>
`
  }

  // Memos section
  if (type === 'full' && enabledSections.includes('memos') && memos.length > 0) {
    html += `
  <h2>Memos</h2>
`
    for (const memo of memos) {
      html += `
  <h3>${memo.title}</h3>
  <p class="meta">Erstellt am ${new Date(memo.createdAt).toLocaleDateString('de-DE')}</p>
  <p>${memo.content}</p>
`
    }
  }

  html += `
</body>
</html>
`

  return html
}

function htmlToMarkdown(html: string): string {
  // Simple HTML to Markdown conversion
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
