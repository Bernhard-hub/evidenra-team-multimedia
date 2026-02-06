/**
 * AKIH Export Service
 * Export AKIH scores and reports in various formats
 */

import type { AKIHScoreResult, AKIHComponent, ResearchPhase } from '@/types/akih'

interface ExportOptions {
  includeComponents?: boolean
  includePhases?: boolean
  includeSuggestions?: boolean
  includeFormula?: boolean
  projectName?: string
  authorName?: string
}

/**
 * Export AKIH result as JSON
 */
export function exportAsJSON(
  result: AKIHScoreResult,
  options: ExportOptions = {}
): string {
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      projectName: options.projectName || 'Unbenannt',
      author: options.authorName || 'Unbekannt',
      version: '1.0',
    },
    score: {
      value: result.score,
      qualityLevel: result.qualityLevel,
      calculatedAt: result.calculatedAt,
    },
    factors: {
      transparencyIndex: result.transparencyIndex,
      humanValidation: result.humanValidation,
      phaseScore: result.phaseScore,
    },
    validation: result.validationStats,
    ...(options.includeComponents !== false && {
      components: result.components.map(c => ({
        id: c.id,
        name: c.name,
        score: c.score,
        weight: c.weight,
      })),
    }),
    ...(options.includePhases !== false && {
      phases: result.phases.map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        weight: p.weight,
        aiUsage: p.aiUsage,
        humanValidation: p.humanValidation,
      })),
    }),
    ...(options.includeSuggestions !== false && {
      suggestions: result.suggestions.map(s => ({
        priority: s.priority,
        title: s.title,
        description: s.description,
        impact: s.impact,
      })),
    }),
    ...(options.includeFormula !== false && {
      formula: {
        expression: 'AKIH = Σ(wᵢ × Pᵢ) × TI × HV',
        calculation: `${result.phaseScore.toFixed(2)} × ${result.transparencyIndex.toFixed(2)} × ${result.humanValidation.toFixed(2)} = ${result.score.toFixed(2)}`,
      },
    }),
    trend: result.trend,
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export AKIH result as CSV
 */
export function exportAsCSV(result: AKIHScoreResult): string {
  const lines: string[] = []

  // Header section
  lines.push('AKIH Score Report')
  lines.push(`Generated,${new Date().toISOString()}`)
  lines.push('')

  // Main scores
  lines.push('Main Scores')
  lines.push('Metric,Value')
  lines.push(`AKIH Score,${result.score.toFixed(2)}`)
  lines.push(`Quality Level,${result.qualityLevel}`)
  lines.push(`Transparency Index,${result.transparencyIndex.toFixed(3)}`)
  lines.push(`Human Validation,${result.humanValidation.toFixed(3)}`)
  lines.push(`Phase Score,${result.phaseScore.toFixed(2)}`)
  lines.push('')

  // Validation stats
  lines.push('Validation Statistics')
  lines.push('Status,Count')
  lines.push(`Total,${result.validationStats.total}`)
  lines.push(`Accepted,${result.validationStats.accepted}`)
  lines.push(`Modified,${result.validationStats.modified}`)
  lines.push(`Rejected,${result.validationStats.rejected}`)
  lines.push(`Pending,${result.validationStats.pending}`)
  lines.push(`Validation Rate,${(result.validationStats.validationRate * 100).toFixed(1)}%`)
  lines.push('')

  // Components
  lines.push('Components')
  lines.push('Component,Score,Weight')
  result.components.forEach(c => {
    lines.push(`${c.name},${c.score.toFixed(1)},${(c.weight * 100).toFixed(0)}%`)
  })
  lines.push('')

  // Phases
  lines.push('Research Phases')
  lines.push('Phase,Score,Weight,AI Usage,Human Validation')
  result.phases.forEach(p => {
    lines.push(`${p.name},${p.score.toFixed(1)},${(p.weight * 100).toFixed(0)}%,${p.aiUsage}%,${p.humanValidation}%`)
  })

  return lines.join('\n')
}

/**
 * Generate HTML report for AKIH score
 */
export function generateHTMLReport(
  result: AKIHScoreResult,
  options: ExportOptions = {}
): string {
  const qualityColors = {
    excellent: '#22c55e',
    good: '#3b82f6',
    acceptable: '#f59e0b',
    critical: '#ef4444',
  }

  const qualityLabels = {
    excellent: 'Exzellent',
    good: 'Gut',
    acceptable: 'Akzeptabel',
    critical: 'Kritisch',
  }

  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AKIH Score Report${options.projectName ? ` - ${options.projectName}` : ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { font-size: 2rem; color: #f8fafc; margin-bottom: 0.5rem; }
    .header .subtitle { color: #64748b; font-size: 0.875rem; }

    .score-card {
      background: #1e293b;
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .score-value {
      font-size: 4rem;
      font-weight: bold;
      color: ${qualityColors[result.qualityLevel]};
    }
    .score-label {
      font-size: 1.25rem;
      color: ${qualityColors[result.qualityLevel]};
      margin-top: 0.5rem;
    }

    .factors-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .factor-card {
      background: #1e293b;
      border-radius: 0.75rem;
      padding: 1rem;
      text-align: center;
    }
    .factor-value { font-size: 1.5rem; font-weight: bold; color: #f8fafc; }
    .factor-label { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

    .section {
      background: #1e293b;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .section h2 {
      font-size: 1rem;
      color: #94a3b8;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .component-bar {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .component-name { width: 140px; font-size: 0.875rem; color: #cbd5e1; }
    .component-track {
      flex: 1;
      height: 8px;
      background: #334155;
      border-radius: 4px;
      overflow: hidden;
      margin: 0 1rem;
    }
    .component-fill { height: 100%; border-radius: 4px; }
    .component-value { width: 50px; text-align: right; font-size: 0.875rem; font-weight: 500; }

    .formula {
      background: #0f172a;
      border-radius: 0.5rem;
      padding: 1rem;
      font-family: monospace;
      color: #94a3b8;
      text-align: center;
    }
    .formula .expression { font-size: 0.875rem; margin-bottom: 0.5rem; }
    .formula .calculation { font-size: 1rem; color: #3b82f6; }

    .validation-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      text-align: center;
    }
    .validation-item .value { font-size: 1.5rem; font-weight: bold; }
    .validation-item .label { font-size: 0.75rem; color: #64748b; }
    .validation-item.accepted .value { color: #22c55e; }
    .validation-item.modified .value { color: #f59e0b; }
    .validation-item.rejected .value { color: #ef4444; }
    .validation-item.pending .value { color: #64748b; }

    .footer {
      text-align: center;
      color: #475569;
      font-size: 0.75rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }

    @media print {
      body { background: white; color: #1e293b; }
      .score-card, .factor-card, .section { background: #f8fafc; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AKIH Score Report</h1>
      <p class="subtitle">
        ${options.projectName || 'Qualitative Analyse'}
        | ${new Date(result.calculatedAt).toLocaleDateString('de-DE')}
      </p>
    </div>

    <div class="score-card">
      <div class="score-value">${result.score.toFixed(0)}</div>
      <div class="score-label">${qualityLabels[result.qualityLevel]}</div>
    </div>

    <div class="factors-grid">
      <div class="factor-card">
        <div class="factor-value">${result.phaseScore.toFixed(1)}</div>
        <div class="factor-label">Phasen-Score</div>
      </div>
      <div class="factor-card">
        <div class="factor-value">${result.transparencyIndex.toFixed(2)}</div>
        <div class="factor-label">Transparenz (TI)</div>
      </div>
      <div class="factor-card">
        <div class="factor-value">${result.humanValidation.toFixed(2)}</div>
        <div class="factor-label">Validierung (HV)</div>
      </div>
    </div>

    <div class="section">
      <h2>Validierungsstatistik</h2>
      <div class="validation-grid">
        <div class="validation-item accepted">
          <div class="value">${result.validationStats.accepted}</div>
          <div class="label">Akzeptiert</div>
        </div>
        <div class="validation-item modified">
          <div class="value">${result.validationStats.modified}</div>
          <div class="label">Korrigiert</div>
        </div>
        <div class="validation-item rejected">
          <div class="value">${result.validationStats.rejected}</div>
          <div class="label">Abgelehnt</div>
        </div>
        <div class="validation-item pending">
          <div class="value">${result.validationStats.pending}</div>
          <div class="label">Offen</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Komponenten</h2>
      ${result.components.map(c => `
        <div class="component-bar">
          <span class="component-name">${c.name}</span>
          <div class="component-track">
            <div class="component-fill" style="width: ${c.score}%; background: ${c.color};"></div>
          </div>
          <span class="component-value" style="color: ${c.color};">${c.score.toFixed(0)}%</span>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h2>Formel</h2>
      <div class="formula">
        <div class="expression">AKIH-Score = Σ(wᵢ × Pᵢ) × TI × HV</div>
        <div class="calculation">
          ${result.phaseScore.toFixed(1)} × ${result.transparencyIndex.toFixed(2)} × ${result.humanValidation.toFixed(2)} = ${result.score.toFixed(1)}
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Generiert mit EVIDENRA Team | ${new Date().toLocaleString('de-DE')}</p>
      <p>AKIH: AI-Kodierung Human-Integration Score</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export AKIH result with download
 */
export function downloadAKIHReport(
  result: AKIHScoreResult,
  format: 'json' | 'csv' | 'html',
  options: ExportOptions = {}
) {
  const timestamp = new Date().toISOString().split('T')[0]
  const projectSlug = options.projectName?.toLowerCase().replace(/\s+/g, '-') || 'akih'

  switch (format) {
    case 'json':
      downloadFile(
        exportAsJSON(result, options),
        `${projectSlug}-akih-report-${timestamp}.json`,
        'application/json'
      )
      break

    case 'csv':
      downloadFile(
        exportAsCSV(result),
        `${projectSlug}-akih-report-${timestamp}.csv`,
        'text/csv'
      )
      break

    case 'html':
      downloadFile(
        generateHTMLReport(result, options),
        `${projectSlug}-akih-report-${timestamp}.html`,
        'text/html'
      )
      break
  }
}
