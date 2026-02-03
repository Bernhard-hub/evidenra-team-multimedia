import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import DocumentViewer from '@/components/DocumentViewer'
import CodeManager from '@/components/CodeManager'
import AICodingPanel from '@/components/AICodingPanel'

interface Code {
  id: string
  name: string
  description?: string
  color: string
  parentId?: string | null
}

interface Coding {
  id: string
  codeId: string
  codeName: string
  color: string
  startOffset: number
  endOffset: number
  selectedText: string
  memo?: string
}

// Mock data
const mockDocument = {
  id: 'doc-1',
  name: 'Interview_001_Schmidt',
  content: `Interviewer: Können Sie mir erzählen, wie Sie die neue Software zum ersten Mal benutzt haben?

Teilnehmer: Ja, also am Anfang war ich ehrlich gesagt etwas überfordert. Die Oberfläche sah sehr komplex aus, mit vielen Buttons und Menüs. Ich wusste nicht, wo ich anfangen sollte.

Interviewer: Wie haben Sie sich dabei gefühlt?

Teilnehmer: Frustriert, würde ich sagen. Ich hatte das Gefühl, dass ich eigentlich produktiv sein sollte, aber stattdessen habe ich erstmal eine halbe Stunde damit verbracht, mich zurechtzufinden. Das war zeitlich gesehen nicht ideal.

Interviewer: Und wie hat sich das im Laufe der Zeit verändert?

Teilnehmer: Nach etwa einer Woche wurde es deutlich besser. Ich habe mir ein paar Tutorial-Videos angeschaut und dann machte vieles plötzlich Sinn. Die Logik hinter der Software ist eigentlich ganz gut durchdacht, man muss sie nur erstmal verstehen.

Interviewer: Was würden Sie anderen Nutzern empfehlen?

Teilnehmer: Definitiv die Tutorials anschauen, bevor man anfängt. Und vielleicht sollte die Software selbst einen besseren Onboarding-Prozess haben. So ein geführtes Tutorial direkt in der Anwendung wäre hilfreich gewesen.

Interviewer: Gibt es bestimmte Funktionen, die Sie besonders positiv oder negativ bewerten?

Teilnehmer: Die Suchfunktion ist fantastisch. Ich kann alles sehr schnell finden. Aber die Export-Funktion ist umständlich - man muss durch mehrere Menüs navigieren, was unnötig kompliziert ist.

Interviewer: Vielen Dank für das Gespräch.

Teilnehmer: Gerne.`,
  projectId: 'proj-1',
  wordCount: 245,
  createdAt: '2024-01-15T10:00:00Z',
}

const mockCodes: Code[] = [
  { id: 'code-1', name: 'Erste Eindrücke', color: '#f59e0b' },
  { id: 'code-2', name: 'Negative Emotion', color: '#ef4444' },
  { id: 'code-3', name: 'Positive Emotion', color: '#22c55e' },
  { id: 'code-4', name: 'Lernprozess', color: '#3b82f6' },
  { id: 'code-5', name: 'Verbesserungsvorschlag', color: '#8b5cf6' },
  { id: 'code-6', name: 'Feature-Bewertung', color: '#06b6d4' },
]

const mockCodings: Coding[] = [
  {
    id: 'coding-1',
    codeId: 'code-1',
    codeName: 'Erste Eindrücke',
    color: '#f59e0b',
    startOffset: 147,
    endOffset: 286,
    selectedText: 'Die Oberfläche sah sehr komplex aus, mit vielen Buttons und Menüs. Ich wusste nicht, wo ich anfangen sollte.',
  },
  {
    id: 'coding-2',
    codeId: 'code-2',
    codeName: 'Negative Emotion',
    color: '#ef4444',
    startOffset: 338,
    endOffset: 348,
    selectedText: 'Frustriert',
  },
]

export default function DocumentDetailPage() {
  const { projectId, documentId } = useParams()
  const [document] = useState(mockDocument)
  const [codes, setCodes] = useState<Code[]>(mockCodes)
  const [codings, setCodings] = useState<Coding[]>(mockCodings)
  const [showAICoding, setShowAICoding] = useState(false)
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [aiProgress, setAIProgress] = useState(0)

  const handleAddCoding = (coding: Omit<Coding, 'id'>) => {
    const newCoding: Coding = {
      ...coding,
      id: `coding-${Date.now()}`,
    }
    setCodings([...codings, newCoding])
  }

  const handleRemoveCoding = (codingId: string) => {
    setCodings(codings.filter((c) => c.id !== codingId))
  }

  const handleAddCode = (code: Omit<Code, 'id'>) => {
    const newCode: Code = {
      ...code,
      id: `code-${Date.now()}`,
    }
    setCodes([...codes, newCode])
  }

  const handleUpdateCode = (id: string, updates: Partial<Code>) => {
    setCodes(codes.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    // Also update any codings using this code
    setCodings(codings.map((c) => {
      if (c.codeId === id) {
        return {
          ...c,
          codeName: updates.name || c.codeName,
          color: updates.color || c.color,
        }
      }
      return c
    }))
  }

  const handleDeleteCode = (id: string) => {
    setCodes(codes.filter((c) => c.id !== id))
    setCodings(codings.filter((c) => c.codeId !== id))
  }

  const handleStartAICoding = (method: string) => {
    setIsAIProcessing(true)
    setAIProgress(0)

    // Simulate AI coding progress
    const interval = setInterval(() => {
      setAIProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsAIProcessing(false)
          setShowAICoding(false)

          // Add mock AI-generated codings
          const aiCodings: Coding[] = [
            {
              id: `ai-coding-${Date.now()}-1`,
              codeId: 'code-4',
              codeName: 'Lernprozess',
              color: '#3b82f6',
              startOffset: 587,
              endOffset: 758,
              selectedText: 'Nach etwa einer Woche wurde es deutlich besser. Ich habe mir ein paar Tutorial-Videos angeschaut und dann machte vieles plötzlich Sinn.',
            },
            {
              id: `ai-coding-${Date.now()}-2`,
              codeId: 'code-5',
              codeName: 'Verbesserungsvorschlag',
              color: '#8b5cf6',
              startOffset: 892,
              endOffset: 1059,
              selectedText: 'Und vielleicht sollte die Software selbst einen besseren Onboarding-Prozess haben. So ein geführtes Tutorial direkt in der Anwendung wäre hilfreich gewesen.',
            },
            {
              id: `ai-coding-${Date.now()}-3`,
              codeId: 'code-6',
              codeName: 'Feature-Bewertung',
              color: '#06b6d4',
              startOffset: 1155,
              endOffset: 1215,
              selectedText: 'Die Suchfunktion ist fantastisch. Ich kann alles sehr schnell finden.',
            },
          ]

          setCodings((prev) => [...prev, ...aiCodings])
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-surface-400 mb-4">
          <Link to="/" className="hover:text-surface-100">Dashboard</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to={`/project/${projectId}`} className="hover:text-surface-100">Projekt</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-surface-100">{document.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-100">{document.name}</h1>
            <p className="text-surface-400 mt-1">
              {document.wordCount} Wörter · {codings.length} Kodierungen
            </p>
          </div>
          <div className="flex items-center gap-3">
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
          <DocumentViewer
            content={document.content}
            codings={codings}
            codes={codes}
            onAddCoding={handleAddCoding}
            onRemoveCoding={handleRemoveCoding}
          />

          {/* Sidebar */}
          <div className="space-y-4">
            <CodeManager
              codes={codes}
              onAddCode={handleAddCode}
              onUpdateCode={handleUpdateCode}
              onDeleteCode={handleDeleteCode}
            />

            {/* Coding Stats */}
            <div className="bg-surface-900 rounded-xl border border-surface-800 p-4">
              <h3 className="font-medium text-surface-100 mb-3">Statistik</h3>
              <div className="space-y-2">
                {codes.map((code) => {
                  const count = codings.filter((c) => c.codeId === code.id).length
                  const percentage = codings.length > 0 ? (count / codings.length) * 100 : 0
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
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Coding Panel */}
        {showAICoding && (
          <AICodingPanel
            documentId={document.id}
            documentName={document.name}
            onStartCoding={handleStartAICoding}
            onClose={() => !isAIProcessing && setShowAICoding(false)}
            isProcessing={isAIProcessing}
            progress={aiProgress}
          />
        )}
      </div>
    </Layout>
  )
}
