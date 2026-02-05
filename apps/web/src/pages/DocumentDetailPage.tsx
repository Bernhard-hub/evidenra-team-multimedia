import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import DocumentViewerWithParaphrases from '@/components/DocumentViewerWithParaphrases'
import CodeManager from '@/components/CodeManager'
import AICodingPanel from '@/components/AICodingPanel'
import PresenceIndicator, { ConnectionStatus } from '@/components/PresenceIndicator'
import { runAICoding, claude, type CodingMethod } from '@/lib/claude'
import { useProjectStore } from '@/stores/projectStore'
import { useParaphraseStore } from '@/stores/paraphraseStore'
import { useRealtime } from '@/hooks/useRealtime'
import { usePresence } from '@/hooks/usePresence'
import { useMethodologyContext } from '@/contexts/MethodologyContext'

// Local interface for DocumentViewer compatibility
interface ViewerCoding {
  id: string
  codeId: string
  codeName: string
  color: string
  startOffset: number
  endOffset: number
  selectedText: string
  memo?: string
}

interface ViewerCode {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string | null
}

export default function DocumentDetailPage() {
  const { projectId, documentId } = useParams()
  const {
    currentProject,
    currentDocument,
    codes,
    codings,
    isLoading,
    isLoadingCodes,
    isLoadingCodings,
    error,
    fetchProject,
    fetchDocument,
    fetchCodes,
    fetchCodings,
    createCode,
    updateCode,
    deleteCode,
    createCoding,
    deleteCoding,
    createCodingsBatch,
  } = useProjectStore()

  // Methodology context - ensures FloatingGuideButton shows on this page
  const { setProjectId: setMethodologyProjectId } = useMethodologyContext()

  // Paraphrase store
  const { fetchParaphrases, fetchCategories, paraphrases } = useParaphraseStore()

  const [showAICoding, setShowAICoding] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiProgress, setAIProgress] = useState(0)
  const [aiStatus, setAIStatus] = useState('')
  const [aiError, setAIError] = useState<string | null>(null)

  // Real-time subscriptions
  useRealtime({ projectId, documentId, enabled: true })
  const { onlineUsers, isConnected } = usePresence({ projectId, documentId, enabled: true })

  // Set project ID in methodology context to show FloatingGuideButton
  useEffect(() => {
    if (projectId) {
      setMethodologyProjectId(projectId)
    }
  }, [projectId, setMethodologyProjectId])

  // Fetch data on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchCodes(projectId)
      fetchCategories(projectId)  // Paraphrase categories
    }
    if (documentId) {
      fetchDocument(documentId)
      fetchCodings(documentId)
      fetchParaphrases(documentId)  // Paraphrases
    }
  }, [projectId, documentId, fetchProject, fetchDocument, fetchCodes, fetchCodings, fetchParaphrases, fetchCategories])

  // Convert store data to viewer format
  const viewerCodes: ViewerCode[] = codes.map((code) => ({
    id: code.id,
    name: code.name,
    description: code.description || undefined,
    color: code.color,
    parentId: code.parentId,
  }))

  const viewerCodings: ViewerCoding[] = codings.map((coding) => {
    const code = codes.find((c) => c.id === coding.codeId)
    return {
      id: coding.id,
      codeId: coding.codeId,
      codeName: code?.name || 'Unknown',
      color: code?.color || '#888888',
      startOffset: coding.startOffset,
      endOffset: coding.endOffset,
      selectedText: coding.selectedText,
      memo: coding.memo || undefined,
    }
  })

  const handleAddCoding = async (coding: Omit<ViewerCoding, 'id'>) => {
    if (!documentId) return

    await createCoding({
      documentId,
      codeId: coding.codeId,
      startOffset: coding.startOffset,
      endOffset: coding.endOffset,
      selectedText: coding.selectedText,
      memo: coding.memo,
      codingMethod: 'manual',
    })
  }

  const handleRemoveCoding = async (codingId: string) => {
    await deleteCoding(codingId)
  }

  const handleAddCode = async (code: Omit<ViewerCode, 'id'>) => {
    if (!projectId) return

    await createCode({
      projectId,
      name: code.name,
      description: code.description,
      color: code.color,
      parentId: code.parentId || undefined,
    })
  }

  const handleUpdateCode = async (id: string, updates: Partial<ViewerCode>) => {
    await updateCode(id, {
      name: updates.name,
      description: updates.description,
      color: updates.color,
      parentId: updates.parentId || undefined,
    })
  }

  const handleDeleteCode = async (id: string) => {
    await deleteCode(id)
  }

  const handleStartAICoding = async (method: string) => {
    if (!currentDocument || !projectId || !documentId) return

    setIsAIProcessing(true)
    setAIProgress(0)
    setAIStatus('Initialisiere...')
    setAIError(null)

    // Check if API key is set
    if (!claude.hasApiKey()) {
      setAIError('Kein Claude API-Schlüssel konfiguriert. Bitte fügen Sie Ihren API-Schlüssel in den Einstellungen hinzu.')
      setIsAIProcessing(false)
      return
    }

    try {
      // Convert existing codes to the format expected by the API
      const existingCodesForAPI = codes.map((code) => ({
        name: code.name,
        description: code.description || undefined,
        color: code.color,
      }))

      // Run the actual AI coding
      const result = await runAICoding(
        currentDocument.content || '',
        method as CodingMethod,
        existingCodesForAPI,
        (progress, status) => {
          setAIProgress(progress)
          setAIStatus(status)
        }
      )

      // Process the results
      const codingsToCreate: {
        documentId: string
        codeId: string
        startOffset: number
        endOffset: number
        selectedText: string
        memo?: string
        codingMethod: string
      }[] = []

      // First, create any new codes
      const codeIdMap = new Map<string, string>() // Map from code name to code ID

      // Map existing codes
      codes.forEach((code) => {
        codeIdMap.set(code.name.toLowerCase(), code.id)
      })

      // Create new codes from suggested codes
      for (const suggestedCode of result.suggestedCodes) {
        const existingId = codeIdMap.get(suggestedCode.name.toLowerCase())
        if (!existingId) {
          const newCode = await createCode({
            projectId,
            name: suggestedCode.name,
            description: suggestedCode.description,
            color: suggestedCode.color,
          })
          if (newCode) {
            codeIdMap.set(suggestedCode.name.toLowerCase(), newCode.id)
          }
        }
      }

      // Create codes from codings if they don't exist
      for (const aiCoding of result.codings) {
        let codeId = codeIdMap.get(aiCoding.codeName.toLowerCase())

        if (!codeId) {
          // Create new code
          const suggestedColor = result.suggestedCodes.find(
            (s) => s.name.toLowerCase() === aiCoding.codeName.toLowerCase()
          )?.color || '#3b82f6'

          const newCode = await createCode({
            projectId,
            name: aiCoding.codeName,
            description: aiCoding.codeDescription,
            color: suggestedColor,
          })

          if (newCode) {
            codeId = newCode.id
            codeIdMap.set(aiCoding.codeName.toLowerCase(), codeId)
          }
        }

        // Add to codings to create
        if (codeId && aiCoding.startOffset >= 0) {
          codingsToCreate.push({
            documentId,
            codeId,
            startOffset: aiCoding.startOffset,
            endOffset: aiCoding.endOffset,
            selectedText: aiCoding.selectedText,
            memo: aiCoding.reasoning,
            codingMethod: method,
          })
        }
      }

      // Create all codings in batch
      if (codingsToCreate.length > 0) {
        await createCodingsBatch(codingsToCreate)
      }

      // Refresh codings
      await fetchCodings(documentId)

      setAIProgress(100)
      setAIStatus(`Fertig! ${codingsToCreate.length} Kodierungen erstellt.`)

      // Close panel after a short delay
      setTimeout(() => {
        setShowAICoding(false)
        setIsAIProcessing(false)
      }, 1500)
    } catch (error) {
      console.error('AI Coding error:', error)
      setAIError(
        error instanceof Error
          ? error.message
          : 'Ein unbekannter Fehler ist aufgetreten.'
      )
      setIsAIProcessing(false)
    }
  }

  // Loading state
  if (isLoading || !currentDocument) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-surface-400">Dokument wird geladen...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-400 mb-4">
          <Link to="/" className="hover:text-surface-100">Dashboard</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/project/${projectId}`} className="hover:text-surface-100">
            {currentProject?.name || 'Projekt'}
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-surface-100">{currentDocument.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">{currentDocument.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-surface-400">
                {currentDocument.wordCount} Wörter · {codings.length} Kodierungen · {paraphrases.filter(p => p.documentId === documentId).length} Paraphrasen
              </p>
              <ConnectionStatus isConnected={isConnected} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Online Users */}
            {onlineUsers.length > 0 && (
              <PresenceIndicator users={onlineUsers} maxVisible={3} />
            )}
            <button className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </button>
            <button
              onClick={() => setShowAICoding(true)}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Kodieren
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Document Viewer */}
          {isLoadingCodings ? (
            <div className="bg-surface-900 rounded-xl border border-surface-800 p-8 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-surface-400">Kodierungen werden geladen...</p>
              </div>
            </div>
          ) : (
            <DocumentViewerWithParaphrases
              content={currentDocument.content || ''}
              documentId={documentId!}
              projectId={projectId!}
              codings={viewerCodings}
              codes={viewerCodes}
              onAddCoding={handleAddCoding}
              onRemoveCoding={handleRemoveCoding}
            />
          )}

          {/* Sidebar */}
          <div className="space-y-4">
            {isLoadingCodes ? (
              <div className="bg-surface-900 rounded-xl border border-surface-800 p-4 text-center">
                <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-surface-400 text-sm">Codes laden...</p>
              </div>
            ) : (
              <CodeManager
                codes={viewerCodes}
                onAddCode={handleAddCode}
                onUpdateCode={handleUpdateCode}
                onDeleteCode={handleDeleteCode}
              />
            )}

            {/* Coding Stats */}
            <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
              <h3 className="font-medium text-surface-100 mb-3">Statistik</h3>
              <div className="space-y-2">
                {viewerCodes.length === 0 ? (
                  <p className="text-sm text-surface-500">Noch keine Codes vorhanden</p>
                ) : (
                  viewerCodes.map((code) => {
                    const count = viewerCodings.filter((c) => c.codeId === code.id).length
                    const percentage = viewerCodings.length > 0 ? (count / viewerCodings.length) * 100 : 0
                    return (
                      <div key={code.id} className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: code.color }}
                        />
                        <span className="flex-1 text-sm text-surface-300 truncate">{code.name}</span>
                        <span className="text-xs text-surface-500">{count}</span>
                        <div className="w-16 h-1.5 bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percentage}%`, backgroundColor: code.color }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Coding Panel */}
        {showAICoding && (
          <AICodingPanel
            documentId={currentDocument.id}
            documentName={currentDocument.name}
            onStartCoding={handleStartAICoding}
            onClose={() => !isAIProcessing && setShowAICoding(false)}
            isProcessing={isAIProcessing}
            progress={aiProgress}
            statusMessage={aiStatus}
            error={aiError}
          />
        )}
      </div>
    </Layout>
  )
}
