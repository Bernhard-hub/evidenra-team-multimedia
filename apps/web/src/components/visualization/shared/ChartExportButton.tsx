/**
 * Chart Export Button
 * Exports charts as PNG or SVG
 */

import { useCallback, useRef } from 'react'
import { IconDownload, IconPhoto, IconCode } from '@tabler/icons-react'

interface ChartExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement>
  filename?: string
}

export function ChartExportButton({ chartRef, filename = 'chart' }: ChartExportButtonProps) {
  const exportAsPNG = useCallback(async () => {
    if (!chartRef.current) return

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#0f172a', // surface-950
        scale: 2, // Higher resolution
      })

      const link = document.createElement('a')
      link.download = `${filename}_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      // Fallback: use browser's built-in screenshot
      alert('Export fehlgeschlagen. Bitte verwenden Sie die Screenshot-Funktion Ihres Browsers.')
    }
  }, [chartRef, filename])

  const exportAsSVG = useCallback(() => {
    if (!chartRef.current) return

    // Find SVG elements in the chart
    const svgs = chartRef.current.querySelectorAll('svg')
    if (svgs.length === 0) {
      alert('Kein SVG-Element zum Exportieren gefunden')
      return
    }

    // Clone the first SVG
    const svg = svgs[0].cloneNode(true) as SVGElement

    // Add white background
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '100%')
    rect.setAttribute('height', '100%')
    rect.setAttribute('fill', '#0f172a')
    svg.insertBefore(rect, svg.firstChild)

    // Convert to blob and download
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `${filename}_${Date.now()}.svg`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }, [chartRef, filename])

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={exportAsPNG}
        className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
        title="Als PNG exportieren"
      >
        <IconPhoto size={16} />
      </button>
      <button
        onClick={exportAsSVG}
        className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
        title="Als SVG exportieren"
      >
        <IconCode size={16} />
      </button>
    </div>
  )
}

export default ChartExportButton
