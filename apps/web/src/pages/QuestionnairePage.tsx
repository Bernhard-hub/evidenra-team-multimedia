/**
 * Questionnaire Page
 * EVIDENRA Research - Main page wrapper for questionnaire development
 */

import { useState, useMemo } from 'react'
import Layout from '@/components/Layout'
import { QuestionnairePage as QuestionnairePageComponent } from '@/components/questionnaire'
import { useProjectStore } from '@/stores/projectStore'
import { useAuthStore } from '@/stores/authStore'
import { Scale } from '@/services/questionnaire/types'
import { QualitativeCode, QualitativeSegment } from '@/services/questionnaire/NexusItemGenerator'

export default function QuestionnairePage() {
  const { user } = useAuthStore()
  const { currentProject, codes, codings, documents } = useProjectStore()

  // Local state for scales (could be moved to a store later)
  const [scales, setScales] = useState<Scale[]>([])

  // Convert codes to QualitativeCode format
  const qualitativeCodes = useMemo<QualitativeCode[]>(() => {
    return codes.map(code => ({
      id: code.id,
      name: code.name,
      description: code.description || undefined,
      parentId: code.parent_id || undefined,
    }))
  }, [codes])

  // Convert codings to QualitativeSegment format
  const qualitativeSegments = useMemo<QualitativeSegment[]>(() => {
    return codings.map(coding => {
      const code = codes.find(c => c.id === coding.code_id)
      return {
        id: coding.id,
        text: coding.selected_text || '',
        codeId: coding.code_id,
        codeName: code?.name || 'Unknown',
        documentId: coding.document_id,
      }
    })
  }, [codings, codes])

  // Handlers
  const handleScaleCreate = (scale: Scale) => {
    setScales(prev => [...prev, scale])
  }

  const handleScaleUpdate = (updatedScale: Scale) => {
    setScales(prev => prev.map(s => s.id === updatedScale.id ? updatedScale : s))
  }

  const handleScaleDelete = (scaleId: string) => {
    setScales(prev => prev.filter(s => s.id !== scaleId))
  }

  const handleExport = (format: string, data: string) => {
    // Download the exported data
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scale-export.${format === 'csv' ? 'csv' : format === 'ddi' ? 'xml' : format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenNexus = (prompt: string) => {
    // TODO: Open Nexus chat with the given prompt
    // For now, just log it
    console.log('Open Nexus with prompt:', prompt)
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)]">
        <QuestionnairePageComponent
          codes={qualitativeCodes}
          segments={qualitativeSegments}
          scales={scales}
          onScaleCreate={handleScaleCreate}
          onScaleUpdate={handleScaleUpdate}
          onScaleDelete={handleScaleDelete}
          onExport={handleExport}
          onOpenNexus={handleOpenNexus}
          language="de"
        />
      </div>
    </Layout>
  )
}
