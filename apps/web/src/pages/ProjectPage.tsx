import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import IRRPanel from '@/components/IRRPanel'
import ActivityFeed from '@/components/ActivityFeed'
import ExportModal from '@/components/ExportModal'
import DocumentUpload from '@/components/DocumentUpload'
import MediaUpload from '@/components/MediaUpload'
import SearchPanel from '@/components/SearchPanel'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import TeamManager from '@/components/TeamManager'
import MemoPanel from '@/components/MemoPanel'
import ReportGenerator from '@/components/ReportGenerator'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import PresenceIndicator, { ConnectionStatus } from '@/components/PresenceIndicator'
import NexusAIChat from '@/components/NexusAIChat'
import DataQualityDashboard from '@/components/DataQualityDashboard'
import ThesisGenerator from '@/components/ThesisGenerator'
import MethodologyGuide from '@/components/MethodologyGuide'
import ParaphraseOverview from '@/components/ParaphraseOverview'
import { useProjectStore, type Document, type Code } from '@/stores/projectStore'
import { useMemoStore } from '@/stores/memoStore'
import { useParaphraseStore } from '@/stores/paraphraseStore'
import { useRealtime } from '@/hooks/useRealtime'
import { usePresence } from '@/hooks/usePresence'
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { useMethodologyContext } from '@/contexts/MethodologyContext'

type TabType = 'documents' | 'codes' | 'memos' | 'paraphrases' | 'team' | 'analysis' | 'quality'

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
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

  // Methodology context for global workflow state
  const { setProjectId: setMethodologyProjectId, isGuideOpen, openGuide, closeGuide, minimizeGuide } = useMethodologyContext()

  const [activeTab, setActiveTab] = useState<TabType>('documents')
  const [showExportModal, setShowExportModal] = useState(false)
  const [showNewDocument, setShowNewDocument] = useState(false)
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showNexusChat, setShowNexusChat] = useState(false)
  const [showThesisGenerator, setShowThesisGenerator] = useState(false)

  // Get Claude API key from localStorage or env
  const claudeApiKey = localStorage.getItem('claude-api-key') || import.meta.env.VITE_ANTHROPIC_API_KEY || ''

  // Set project ID in methodology context when project loads
  useEffect(() => {
    if (projectId) {
      setMethodologyProjectId(projectId)
    }
    return () => {
      // Don't clear on unmount - keep context for navigation to DocumentDetailPage
    }
  }, [projectId, setMethodologyProjectId])

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    { key: 'k', ctrl: true, action: () => setShowSearch(true), description: 'Suchen', category: 'Navigation' },
    { key: 'n', ctrl: true, action: () => setShowNewDocument(true), description: 'Neues Dokument', category: 'Erstellen' },
    { key: 'e', ctrl: true, shift: true, action: () => setShowExportModal(true), description: 'Exportieren', category: 'Allgemein' },
    { key: 'r', ctrl: true, shift: true, action: () => setShowReportGenerator(true), description: 'Bericht erstellen', category: 'Allgemein' },
    { key: 'i', ctrl: true, shift: true, action: () => setShowNexusChat(prev => !prev), description: 'NEXUS AI öffnen', category: 'AI' },
    { key: 't', ctrl: true, shift: true, action: () => setShowThesisGenerator(true), description: 'Thesis Generator öffnen', category: 'AI' },
    { key: 'm', ctrl: true, shift: true, action: () => openGuide(), description: 'Methoden-Guide öffnen', category: 'Hilfe' },
    { key: '?', ctrl: true, action: () => setShowShortcutsHelp(true), description: 'Shortcuts anzeigen', category: 'Hilfe' },
    { key: '1', ctrl: true, action: () => setActiveTab('documents'), description: 'Dokumente Tab', category: 'Navigation' },
    { key: '2', ctrl: true, action: () => setActiveTab('codes'), description: 'Codes Tab', category: 'Navigation' },
    { key: '3', ctrl: true, action: () => setActiveTab('memos'), description: 'Memos Tab', category: 'Navigation' },
    { key: '4', ctrl: true, action: () => setActiveTab('paraphrases'), description: 'Paraphrasen Tab', category: 'Navigation' },
    { key: '5', ctrl: true, action: () => setActiveTab('team'), description: 'Team Tab', category: 'Navigation' },
    { key: '6', ctrl: true, action: () => setActiveTab('analysis'), description: 'Analyse Tab', category: 'Navigation' },
    { key: '7', ctrl: true, action: () => setActiveTab('quality'), description: 'Qualität Tab', category: 'Navigation' },
    { key: 'Escape', action: () => { setShowSearch(false); setShowExportModal(false); setShowNewDocument(false); setShowReportGenerator(false); setShowShortcutsHelp(false); setShowNexusChat(false); setShowThesisGenerator(false); closeGuide() }, description: 'Dialoge schließen', category: 'Navigation' },
  ], [openGuide, closeGuide])

  useKeyboardShortcuts(shortcuts)

  // Real-time subscriptions
  useRealtime({ projectId, enabled: true })
  const { onlineUsers, isConnected } = usePresence({ projectId, enabled: true })

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

  // Fetch memos
  const { memos, fetchMemos } = useMemoStore()
  useEffect(() => {
    if (projectId) {
      fetchMemos(projectId)
    }
  }, [projectId, fetchMemos])

  // Fetch paraphrase categories
  const { paraphrases, fetchCategories } = useParaphraseStore()
  useEffect(() => {
    if (projectId) {
      fetchCategories(projectId)
    }
  }, [projectId, fetchCategories])

  // Count paraphrases for this project
  const projectParaphraseCount = paraphrases.filter(p => p.projectId === projectId).length

  const tabs: { id: TabType; name: string; count?: number }[] = [
    { id: 'documents', name: 'Dokumente', count: documents.length },
    { id: 'codes', name: 'Codes', count: codes.length },
    { id: 'memos', name: 'Memos', count: memos.length },
    { id: 'paraphrases', name: 'Paraphrasen', count: projectParaphraseCount },
    { id: 'team', name: 'Team', count: 4 },
    { id: 'analysis', name: 'Analyse' },
    { id: 'quality', name: 'Qualität' },
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
                <div className="flex items-center gap-4 mt-1">
                  {currentProject.description && (
                    <p className="text-surface-400">{currentProject.description}</p>
                  )}
                  <ConnectionStatus isConnected={isConnected} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Online Users */}
                {onlineUsers.length > 0 && (
                  <PresenceIndicator users={onlineUsers} maxVisible={3} />
                )}
                <button
                  onClick={() => setShowSearch(true)}
                  className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                  title="Suchen (Ctrl+K)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden lg:inline">Suchen</span>
                  <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-surface-700 text-xs font-mono">⌘K</kbd>
                </button>
                <button
                  onClick={() => setShowReportGenerator(true)}
                  className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                  title="Bericht erstellen (Ctrl+Shift+R)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden lg:inline">Bericht</span>
                </button>
                <button
                  onClick={() => setShowThesisGenerator(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  title="Thesis Generator öffnen (Ctrl+Shift+T)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="hidden lg:inline">Thesis</span>
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                  title="Exportieren (Ctrl+Shift+E)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="hidden lg:inline">Export</span>
                </button>
                <button
                  onClick={() => setShowShortcutsHelp(true)}
                  className="p-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800"
                  title="Tastaturkürzel (Ctrl+?)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => openGuide()}
                  className="px-4 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm font-medium flex items-center gap-2"
                  title="Methoden-Guide (Ctrl+Shift+M)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className="hidden lg:inline">Guide</span>
                </button>
                <button
                  onClick={() => setShowNexusChat(true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-500/20"
                  title="NEXUS AI öffnen (Ctrl+Shift+I)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  NEXUS AI
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
                onAddMedia={() => setShowMediaUpload(true)}
              />
            )}
            {activeTab === 'codes' && (
              <CodesTab codes={codeFrequencies} projectId={projectId || ''} isLoading={isLoadingCodes} />
            )}
            {activeTab === 'memos' && projectId && (
              <MemoPanel projectId={projectId} showAllMemos />
            )}
            {activeTab === 'paraphrases' && projectId && (
              <ParaphraseOverview projectId={projectId} />
            )}
            {activeTab === 'team' && projectId && (
              <TeamManager projectId={projectId} />
            )}
            {activeTab === 'analysis' && (
              <AnalysisDashboard
                codes={codes}
                codings={codings}
                documents={documents}
              />
            )}
            {activeTab === 'quality' && (
              <DataQualityDashboard
                documents={documents.map(d => ({
                  id: d.id,
                  name: d.name,
                  content: d.content,
                  file_type: d.fileType,
                  word_count: d.wordCount
                }))}
                codes={codes.map(c => ({
                  id: c.id,
                  name: c.name,
                  description: c.description
                }))}
                codings={codings.map(c => ({
                  id: c.id,
                  document_id: c.documentId,
                  code_id: c.codeId,
                  selected_text: c.selectedText
                }))}
                language="de"
              />
            )}
          </>
        )}

        {/* Export Modal */}
        {showExportModal && currentProject && (
          <ExportModal
            projectName={currentProject.name}
            documentCount={documents.length}
            codingCount={codings.length}
            exportData={{
              project: currentProject,
              documents,
              codes,
              codings,
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

        {/* Media Upload Modal */}
        {showMediaUpload && projectId && (
          <MediaUploadWrapper
            projectId={projectId}
            onClose={() => setShowMediaUpload(false)}
          />
        )}

        {/* Search Panel */}
        {showSearch && projectId && (
          <SearchPanel
            projectId={projectId}
            documents={documents}
            codes={codes}
            codings={codings}
            onClose={() => setShowSearch(false)}
          />
        )}

        {/* Report Generator */}
        {showReportGenerator && currentProject && (
          <ReportGenerator
            projectName={currentProject.name}
            documents={documents}
            codes={codes}
            codings={codings}
            memos={memos}
            onClose={() => setShowReportGenerator(false)}
          />
        )}

        {/* Keyboard Shortcuts Help */}
        {showShortcutsHelp && (
          <KeyboardShortcutsHelp
            shortcuts={shortcuts}
            onClose={() => setShowShortcutsHelp(false)}
          />
        )}

        {/* NEXUS AI Chat */}
        <NexusAIChat
          apiKey={claudeApiKey}
          context={{
            documents: documents.map(d => ({
              id: d.id,
              name: d.name,
              content: d.content,
              word_count: d.wordCount
            })),
            codes: codes.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description
            })),
            codings: codings.map(c => ({
              id: c.id,
              code_id: c.codeId,
              document_id: c.documentId,
              selected_text: c.selectedText
            }))
          }}
          language="de"
          isOpen={showNexusChat}
          onClose={() => setShowNexusChat(false)}
        />

        {/* Thesis Generator */}
        {showThesisGenerator && (
          <ThesisGenerator
            apiKey={claudeApiKey}
            researchData={{
              documents: documents.map(d => ({
                id: d.id,
                name: d.name,
                content: d.content,
                wordCount: d.wordCount
              })),
              categories: codes.map(c => ({
                id: c.id,
                name: c.name,
                description: c.description
              })),
              codings: codings.map(c => ({
                id: c.id,
                text: c.selectedText,
                categoryId: c.codeId,
                documentId: c.documentId
              })),
              projectName: currentProject?.name
            }}
            onClose={() => setShowThesisGenerator(false)}
          />
        )}

        {/* Methodology Guide - Intelligenter Workflow-Begleiter */}
        {projectId && (
          <MethodologyGuide
            projectId={projectId}
            isOpen={isGuideOpen}
            onClose={() => closeGuide()}
            onMinimize={() => minimizeGuide()}
            language="de"
            onOpenDocuments={() => setActiveTab('documents')}
            onOpenCodes={() => setActiveTab('codes')}
            onOpenMemos={() => setActiveTab('memos')}
            onOpenAnalysis={() => setActiveTab('analysis')}
            onOpenIRR={() => setActiveTab('analysis')}
            onOpenNexus={() => setShowNexusChat(true)}
            onOpenAICoding={() => {
              if (documents.length > 0) {
                navigate(`/project/${projectId}/document/${documents[0].id}`)
              } else {
                setActiveTab('documents')
              }
            }}
            documentCount={documents.length}
            codeCount={codes.length}
            codingCount={currentProject?.codingCount || 0}
            memoCount={memos.length}
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

  const handleBatchUpload = async (documents: Array<{ name: string; content: string; type: string }>) => {
    // Upload all documents in parallel
    await Promise.all(
      documents.map(doc =>
        createDocument({
          projectId,
          name: doc.name,
          content: doc.content,
          fileType: doc.type,
        })
      )
    )
    onClose()
  }

  return <DocumentUpload onUpload={handleUpload} onBatchUpload={handleBatchUpload} onClose={onClose} />
}

function MediaUploadWrapper({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createDocument } = useProjectStore()

  const handleUpload = async (document: { name: string; content: string; type: string; duration?: number }) => {
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

  return <MediaUpload onUpload={handleUpload} onClose={onClose} />
}

function DocumentsTab({
  documents,
  projectId,
  isLoading,
  onAddDocument,
  onAddMedia,
}: {
  documents: Document[]
  projectId: string
  isLoading: boolean
  onAddDocument: () => void
  onAddMedia: () => void
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
        <button
          onClick={onAddMedia}
          className="px-4 py-2 rounded-lg border border-dashed border-surface-700 text-surface-400 hover:border-purple-500 hover:text-purple-400 text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Audio/Video transkribieren
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


