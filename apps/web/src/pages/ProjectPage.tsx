import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import IRRPanel from '@/components/IRRPanel'
import ActivityFeed from '@/components/ActivityFeed'
import ExportModal from '@/components/ExportModal'
import DocumentUpload from '@/components/DocumentUpload'
import { useProjectStore, type Document, type Code } from '@/stores/projectStore'

type TabType = 'documents' | 'codes' | 'team' | 'analysis'

export default function ProjectPage() {
  const { projectId } = useParams()
  const {
    currentProject,
    documents,
    codes,
    codings,
    isLoading,
    isLoadingDocuments,
    isLoadingCodes,
    error,
    fetchProject,
    fetchDocuments,
    fetchCodes,
    fetchCodings,
  } = useProjectStore()

  const [activeTab, setActiveTab] = useState<TabType>('documents')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showNewDocument, setShowNewDocument] = useState(false)

  // Fetch project and data on mount
  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchDocuments(projectId)
      fetchCodes(projectId)
    }
  }, [projectId, fetchProject, fetchDocuments, fetchCodes])

  // Calculate code frequencies from codings
  const codeFrequencies = codes.map((code) => ({
    ...code,
    frequency: codings.filter((c) => c.codeId === code.id).length,
  }))

  const tabs: { id: TabType; name: string; count?: number }[] = [
    { id: 'documents', name: 'Dokumente', count: documents.length },
    { id: 'codes', name: 'Codes', count: codes.length },
    { id: 'team', name: 'Team', count: 4 },
    { id: 'analysis', name: 'Analyse' },
  ]

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-400 mb-4">
          <Link to="/" className="hover:text-surface-100">Dashboard</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-surface-100">{currentProject?.name || 'Projekt'}</span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && !currentProject && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Header */}
        {currentProject && (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-surface-100">{currentProject.name}</h1>
                {currentProject.description && (
                  <p className="text-surface-400 mt-1">{currentProject.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export
                </button>
                <button className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI Kodieren
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-surface-800 mb-6">
              <nav className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-surface-400 hover:text-surface-100'
                    }`}
                  >
                    {tab.name}
                    {tab.count !== undefined && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-surface-800">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'documents' && (
              <DocumentsTab
                documents={documents}
                projectId={projectId || ''}
                isLoading={isLoadingDocuments}
                onAddDocument={() => setShowNewDocument(true)}
              />
            )}
            {activeTab === 'codes' && (
              <CodesTab codes={codeFrequencies} projectId={projectId || ''} isLoading={isLoadingCodes} />
            )}
            {activeTab === 'team' && (
              <TeamTab />
            )}
            {activeTab === 'analysis' && (
              <AnalysisTab codes={codeFrequencies} />
            )}
          </>
        )}

        {/* Export Modal */}
        {showExportModal && currentProject && (
          <ExportModal
            projectName={currentProject.name}
            documentCount={documents.length}
            codingCount={codings.length}
            onExport={(format, options) => {
              console.log('Export:', format, options)
              alert(`Export als ${format.toUpperCase()} gestartet!`)
            }}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {/* Document Upload Modal */}
        {showNewDocument && projectId && (
          <DocumentUploadWrapper
            projectId={projectId}
            onClose={() => setShowNewDocument(false)}
          />
        )}
      </div>
    </Layout>
  )
}

function DocumentUploadWrapper({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createDocument } = useProjectStore()

  const handleUpload = async (document: { name: string; content: string; type: string }) => {
    const doc = await createDocument({
      projectId,
      name: document.name,
      content: document.content,
      fileType: document.type,
    })

    if (doc) {
      onClose()
    }
  }

  return <DocumentUpload onUpload={handleUpload} onClose={onClose} />
}

function DocumentsTab({
  documents,
  projectId,
  isLoading,
  onAddDocument,
}: {
  documents: Document[]
  projectId: string
  isLoading: boolean
  onAddDocument: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onAddDocument}
          className="px-4 py-2 rounded-lg border border-dashed border-surface-700 text-surface-400 hover:border-primary-500 hover:text-primary-400 text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Dokument hinzufügen
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-surface-400">Dokumente werden geladen...</p>
        </div>
      )}

      {/* Document List */}
      {!isLoading && documents.length > 0 && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider hidden md:table-cell">Typ</th>
                <th className="px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider hidden lg:table-cell">Wörter</th>
                <th className="px-4 py-3 text-xs font-medium text-surface-500 uppercase tracking-wider">Erstellt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/project/${projectId}/document/${doc.id}`} className="flex items-center gap-3 hover:text-primary-400">
                      <DocumentIcon type={doc.fileType} />
                      <span className="text-sm text-surface-100 hover:text-primary-400">{doc.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-surface-400 capitalize">{doc.fileType}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-surface-400">{doc.wordCount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-surface-400">
                      {new Date(doc.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/project/${projectId}/document/${doc.id}`} className="p-1 rounded hover:bg-surface-700 text-surface-400 inline-block">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && documents.length === 0 && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-surface-400 mb-4">Noch keine Dokumente vorhanden</p>
          <button
            onClick={onAddDocument}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
          >
            Erstes Dokument hinzufügen
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentIcon({ type }: { type: string }) {
  // PDF files
  if (type === 'pdf') {
    return (
      <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }
  // DOCX files
  if (type === 'docx') {
    return (
      <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    )
  }
  // Audio/Media files
  if (type === 'media' || type === 'audio') {
    return (
      <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </div>
    )
  }
  // Notes
  if (type === 'note') {
    return (
      <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    )
  }
  // Default: text files
  return (
    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  )
}

function CodesTab({ codes, projectId, isLoading }: { codes: (Code & { frequency: number })[]; projectId: string; isLoading: boolean }) {
  const { createCode } = useProjectStore()
  const [showNewCode, setShowNewCode] = useState(false)
  const [newCodeName, setNewCodeName] = useState('')
  const [newCodeColor, setNewCodeColor] = useState('#3b82f6')

  const rootCodes = codes.filter((c) => !c.parentId)

  const handleCreateCode = async () => {
    if (!newCodeName.trim()) return

    await createCode({
      projectId,
      name: newCodeName.trim(),
      color: newCodeColor,
    })

    setNewCodeName('')
    setShowNewCode(false)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowNewCode(true)}
          className="px-4 py-2 rounded-lg border border-dashed border-surface-700 text-surface-400 hover:border-primary-500 hover:text-primary-400 text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neuer Code
        </button>
      </div>

      {/* New Code Input */}
      {showNewCode && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={newCodeColor}
              onChange={(e) => setNewCodeColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={newCodeName}
              onChange={(e) => setNewCodeName(e.target.value)}
              placeholder="Code-Name eingeben..."
              className="flex-1 px-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCode()
                if (e.key === 'Escape') setShowNewCode(false)
              }}
            />
            <button
              onClick={handleCreateCode}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
            >
              Erstellen
            </button>
            <button
              onClick={() => setShowNewCode(false)}
              className="px-4 py-2 rounded-lg border border-surface-700 text-surface-400 hover:bg-surface-800 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-surface-400">Codes werden geladen...</p>
        </div>
      )}

      {/* Code Tree */}
      {!isLoading && codes.length > 0 && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
          <div className="space-y-2">
            {rootCodes.map((code) => (
              <CodeItem key={code.id} code={code} codes={codes} level={0} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && codes.length === 0 && (
        <div className="bg-surface-900 rounded-xl border border-surface-800 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-surface-400">Noch keine Codes vorhanden</p>
        </div>
      )}
    </div>
  )
}

function CodeItem({ code, codes, level }: { code: Code & { frequency: number }; codes: (Code & { frequency: number })[]; level: number }) {
  const [expanded, setExpanded] = useState(true)
  const children = codes.filter((c) => c.parentId === code.id)

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-800 group"
        style={{ paddingLeft: `${8 + level * 20}px` }}
      >
        {children.length > 0 ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            <svg
              className={`w-4 h-4 text-surface-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: code.color }}
        />
        <span className="flex-1 text-sm text-surface-100">{code.name}</span>
        <span className="text-xs text-surface-500 bg-surface-800 px-1.5 py-0.5 rounded">
          {code.frequency}
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <CodeItem key={child.id} code={child} codes={codes} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function TeamTab() {
  const members = [
    { id: '1', name: 'Anna Müller', email: 'anna@example.com', role: 'admin', isOnline: true },
    { id: '2', name: 'Max Koch', email: 'max@example.com', role: 'coder', isOnline: true },
    { id: '3', name: 'Lisa Schmidt', email: 'lisa@example.com', role: 'reviewer', isOnline: false },
    { id: '4', name: 'Tom Weber', email: 'tom@example.com', role: 'viewer', isOnline: false },
  ]

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    coder: 'Kodierer',
    reviewer: 'Reviewer',
    viewer: 'Betrachter',
  }

  return (
    <div className="space-y-4">
      <button className="px-4 py-2 rounded-lg border border-dashed border-surface-700 text-surface-400 hover:border-primary-500 hover:text-primary-400 text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Mitglied einladen
      </button>

      <div className="bg-surface-900 rounded-xl border border-surface-800 divide-y divide-surface-800">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-4 p-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-400">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-900 ${
                  member.isOnline ? 'bg-green-500' : 'bg-surface-600'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-100">{member.name}</p>
              <p className="text-xs text-surface-500">{member.email}</p>
            </div>
            <span className="px-2 py-1 rounded text-xs font-medium bg-surface-800 text-surface-400">
              {roleLabels[member.role]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalysisTab({ codes }: { codes: (Code & { frequency: number })[] }) {
  const sortedCodes = [...codes].sort((a, b) => b.frequency - a.frequency).slice(0, 5)
  const maxFrequency = Math.max(...codes.map((c) => c.frequency), 1)

  const mockCoders = [
    { id: 'c1', name: 'Anna Müller', codingCount: 87 },
    { id: 'c2', name: 'Max Koch', codingCount: 64 },
    { id: 'c3', name: 'Lisa Schmidt', codingCount: 52 },
  ]

  const mockActivities = [
    { id: 'a1', userId: 'c1', userName: 'Anna Müller', userColor: '#f59e0b', action: 'coding_added' as const, target: 'Nutzererfahrung', createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 'a2', userId: 'c2', userName: 'Max Koch', userColor: '#3b82f6', action: 'code_created' as const, target: 'Frustration', createdAt: new Date(Date.now() - 900000).toISOString() },
    { id: 'a3', userId: 'c3', userName: 'Lisa Schmidt', userColor: '#22c55e', action: 'comment_added' as const, createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'a4', userId: 'c1', userName: 'Anna Müller', userColor: '#f59e0b', action: 'document_added' as const, target: 'Interview_004.txt', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'a5', userId: 'c2', userName: 'Max Koch', userColor: '#3b82f6', action: 'coding_added' as const, target: 'Lernprozess', createdAt: new Date(Date.now() - 7200000).toISOString() },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Code Frequency Chart */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h3 className="text-lg font-semibold text-surface-100 mb-4">Code-Häufigkeit</h3>
        {sortedCodes.length > 0 ? (
          <div className="space-y-3">
            {sortedCodes.map((code) => (
              <div key={code.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-300">{code.name}</span>
                  <span className="text-surface-500">{code.frequency}</span>
                </div>
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(code.frequency / maxFrequency) * 100}%`,
                      backgroundColor: code.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-surface-500 text-sm">Noch keine Kodierungen vorhanden</p>
        )}
      </div>

      {/* IRR Panel */}
      <IRRPanel
        coders={mockCoders}
        onCalculate={(metric, coderIds) => ({
          metric,
          value: 0.75,
          interpretation: 'Substantial',
        })}
      />

      {/* AI Coding Summary */}
      <div className="bg-surface-900 rounded-xl border border-surface-800 p-6">
        <h3 className="text-lg font-semibold text-surface-100 mb-4">AI-Kodierung</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-2xl font-bold text-primary-400">4</p>
            <p className="text-sm text-surface-400">Methoden</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-2xl font-bold text-green-400">87%</p>
            <p className="text-sm text-surface-400">Konsensrate</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-2xl font-bold text-blue-400">3</p>
            <p className="text-sm text-surface-400">Personas</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-800">
            <p className="text-2xl font-bold text-purple-400">0.82</p>
            <p className="text-sm text-surface-400">Fleiss' κ</p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={mockActivities} maxItems={5} />
    </div>
  )
}
