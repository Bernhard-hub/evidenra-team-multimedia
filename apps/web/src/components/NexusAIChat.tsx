import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  IconRobot,
  IconUser,
  IconCopy,
  IconCheck,
  IconX,
  IconLoader2,
  IconSend,
  IconBrain,
  IconChevronDown,
  IconTrash,
  IconSparkles,
  IconFileText,
  IconCategory,
  IconCode as IconCodeIcon,
  IconSearch,
  IconBook,
  IconArrowRight,
  // Questionnaire module icons
  IconFileSearch,
  IconBulb,
  IconListCheck,
  IconChecks,
  IconClipboardList,
  IconChartBar,
  IconNetwork,
  IconDownload,
  IconForms
} from '@tabler/icons-react'
import { AntiHallucinationService } from '@services/AntiHallucinationService'
import { useNexusWorkflowContext } from '@/contexts/MethodologyContext'
import {
  NexusQuestionnaireIntegration,
  NexusQuestionnaireContextBuilder,
  buildQuestionnaireSystemPrompt,
  NEXUS_QUESTIONNAIRE_ACTIONS,
  type NexusQuestionnaireAction,
  type NexusQuestionnaireContext,
} from '@services/questionnaire'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  prompt: string
  color: string
  category?: string
}

// Icon mapping for questionnaire actions
const QUESTIONNAIRE_ICON_MAP: Record<string, React.ReactNode> = {
  'IconSearch': <IconSearch size={16} />,
  'IconFileSearch': <IconFileSearch size={16} />,
  'IconBulb': <IconBulb size={16} />,
  'IconListCheck': <IconListCheck size={16} />,
  'IconChecks': <IconChecks size={16} />,
  'IconClipboardList': <IconClipboardList size={16} />,
  'IconChartBar': <IconChartBar size={16} />,
  'IconNetwork': <IconNetwork size={16} />,
  'IconDownload': <IconDownload size={16} />,
  'IconFileText': <IconFileText size={16} />,
}

// Color mapping for questionnaire action categories
const QUESTIONNAIRE_CATEGORY_COLORS: Record<string, string> = {
  'search': 'from-blue-500 to-cyan-500',
  'generate': 'from-purple-500 to-pink-500',
  'validate': 'from-green-500 to-emerald-500',
  'export': 'from-amber-500 to-orange-500',
}

interface ResearchContext {
  documents: Array<{ id: string; name: string; content?: string; word_count?: number }>
  codes: Array<{ id: string; name: string; description?: string }>
  codings: Array<{ id: string; code_id: string; selected_text?: string; document_id?: string }>
}

interface NexusAIChatProps {
  apiKey: string
  context: ResearchContext
  language?: 'de' | 'en'
  isOpen: boolean
  onClose: () => void
  onApplySuggestion?: (type: string, data: any) => void
}

export const NexusAIChat: React.FC<NexusAIChatProps> = ({
  apiKey,
  context,
  language = 'de',
  isOpen,
  onClose,
  onApplySuggestion
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Workflow context integration
  const { hasWorkflowContext, currentStep, buildNexusPrompt, getWorkflowContext } = useNexusWorkflowContext()

  // Questionnaire context detection
  const [questionnaireContextActive, setQuestionnaireContextActive] = useState(false)
  const [showQuestionnaireActions, setShowQuestionnaireActions] = useState(false)

  // Build questionnaire context from project data
  const questionnaireContext = useMemo<NexusQuestionnaireContext>(() => {
    return NexusQuestionnaireContextBuilder.build(
      context.codes.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
      context.codings.map(c => ({
        id: c.id,
        codeId: c.code_id,
        text: c.selected_text || '',
        codeName: context.codes.find(code => code.id === c.code_id)?.name,
      }))
    )
  }, [context.codes, context.codings])

  // Detect questionnaire context from user messages
  const detectQuestionnaireContext = useCallback((message: string) => {
    const isQuestionnaire = NexusQuestionnaireContextBuilder.shouldActivateQuestionnaireContext(message)
    if (isQuestionnaire && !questionnaireContextActive) {
      setQuestionnaireContextActive(true)
      setShowQuestionnaireActions(true)
    }
  }, [questionnaireContextActive])

  // Get contextual questionnaire quick actions
  const questionnaireQuickActions = useMemo<QuickAction[]>(() => {
    const actions = NexusQuestionnaireIntegration.getContextualActions(questionnaireContext, language)
    return actions.slice(0, 4).map(action => ({
      icon: QUESTIONNAIRE_ICON_MAP[action.icon] || <IconForms size={16} />,
      label: action.label[language],
      prompt: action.prompt[language],
      color: QUESTIONNAIRE_CATEGORY_COLORS[action.category] || 'from-purple-500 to-pink-500',
      category: action.category,
    }))
  }, [questionnaireContext, language])

  const t = language === 'de' ? {
    title: 'NEXUS AI',
    subtitle: 'Forschungsassistent',
    placeholder: 'Frag NEXUS etwas...',
    thinking: 'NEXUS denkt nach...',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    clearChat: 'Chat löschen',
    noApiKey: 'Kein API-Schlüssel konfiguriert',
    configureKey: 'Bitte konfiguriere deinen Claude API Key in den Einstellungen.',
    connectionError: 'Verbindungsfehler',
    quickActions: 'Schnellaktionen',
    summarizeDocs: 'Dokumente zusammenfassen',
    suggestCodes: 'Codes vorschlagen',
    analyzePatterns: 'Muster analysieren',
    qualityCheck: 'Qualitätsprüfung',
    // Questionnaire
    questionnaireMode: 'Fragebogen-Modus',
    questionnaireActions: 'Fragebogenentwicklung',
    welcome: `# Willkommen bei NEXUS AI

Ich bin dein **Forschungsassistent** für qualitative Analysen.

### Was ich kann:
- **Dokumente zusammenfassen** und Schlüsselthemen identifizieren
- **Codes vorschlagen** basierend auf deinen Daten
- **Muster analysieren** in deinen Kodierungen
- **Qualität prüfen** deiner Analyse
- **Fragebögen entwickeln** aus qualitativen Daten

Nutze die Schnellaktionen unten oder stelle mir eine Frage!`
  } : {
    title: 'NEXUS AI',
    subtitle: 'Research Assistant',
    placeholder: 'Ask NEXUS something...',
    thinking: 'NEXUS is thinking...',
    copy: 'Copy',
    copied: 'Copied!',
    clearChat: 'Clear chat',
    noApiKey: 'No API key configured',
    configureKey: 'Please configure your Claude API key in settings.',
    connectionError: 'Connection error',
    quickActions: 'Quick Actions',
    summarizeDocs: 'Summarize documents',
    suggestCodes: 'Suggest codes',
    analyzePatterns: 'Analyze patterns',
    qualityCheck: 'Quality check',
    // Questionnaire
    questionnaireMode: 'Questionnaire mode',
    questionnaireActions: 'Questionnaire Development',
    welcome: `# Welcome to NEXUS AI

I'm your **research assistant** for qualitative analysis.

### What I can do:
- **Summarize documents** and identify key themes
- **Suggest codes** based on your data
- **Analyze patterns** in your codings
- **Check quality** of your analysis
- **Develop questionnaires** from qualitative data

Use the quick actions below or ask me a question!`
  }

  // Workflow-aware quick action for current step
  const workflowContext = getWorkflowContext()
  const workflowQuickAction: QuickAction | null = hasWorkflowContext && currentStep ? {
    icon: <IconBook size={16} />,
    label: language === 'de' ? `Hilfe: ${currentStep.nameDE}` : `Help: ${currentStep.name}`,
    prompt: language === 'de'
      ? `Ich arbeite gerade am Schritt "${currentStep.nameDE}" (${workflowContext?.methodologyDE}). Kannst du mir dabei helfen? Was sollte ich beachten und wie gehe ich am besten vor?`
      : `I'm currently working on the step "${currentStep.name}" (${workflowContext?.methodology}). Can you help me with this? What should I consider and what's the best approach?`,
    color: 'from-indigo-500 to-purple-500'
  } : null

  // Standard qualitative analysis quick actions
  const baseQuickActions: QuickAction[] = [
    // Show workflow-specific action first if available
    ...(workflowQuickAction ? [workflowQuickAction] : []),
    {
      icon: <IconFileText size={16} />,
      label: t.summarizeDocs,
      prompt: language === 'de'
        ? 'Fasse die wichtigsten Erkenntnisse aus meinen Dokumenten zusammen. Identifiziere die Hauptthemen und gib mir einen strukturierten Überblick.'
        : 'Summarize the key findings from my documents. Identify the main themes and give me a structured overview.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <IconCategory size={16} />,
      label: t.suggestCodes,
      prompt: language === 'de'
        ? 'Analysiere meine Dokumente und schlage neue Codes vor, die ich noch nicht habe. Berücksichtige dabei mein existierendes Codesystem und finde Lücken.'
        : 'Analyze my documents and suggest new codes that I don\'t have yet. Consider my existing code system and find gaps.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <IconSearch size={16} />,
      label: t.analyzePatterns,
      prompt: language === 'de'
        ? 'Analysiere Muster in meinen Kodierungen. Welche Codes treten häufig zusammen auf? Gibt es interessante Zusammenhänge?'
        : 'Analyze patterns in my codings. Which codes often occur together? Are there interesting connections?',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <IconSparkles size={16} />,
      label: t.qualityCheck,
      prompt: language === 'de'
        ? 'Führe eine Qualitätsprüfung meiner Analyse durch. Prüfe: Sind die Codes konsistent angewendet? Gibt es unterrepräsentierte Bereiche? Was fehlt noch?'
        : 'Perform a quality check of my analysis. Check: Are codes applied consistently? Are there underrepresented areas? What\'s missing?',
      color: 'from-amber-500 to-orange-500'
    }
  ]

  // Combine quick actions: show questionnaire actions when context is active
  const quickActions: QuickAction[] = questionnaireContextActive
    ? [...questionnaireQuickActions, ...baseQuickActions.slice(0, 2)]
    : baseQuickActions

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t.welcome,
        timestamp: new Date()
      }])
    }
  }, [isOpen])

  const buildResearchContext = useCallback((): string => {
    // Use AntiHallucinationService for context
    const antiHallContext = AntiHallucinationService.generateContext(
      {
        documents: context.documents.map(d => ({
          id: d.id,
          name: d.name,
          content: d.content,
          wordCount: d.word_count
        })),
        categories: context.codes.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description
        })),
        codings: context.codings.map(c => ({
          id: c.id,
          text: c.selected_text,
          categoryId: c.code_id,
          documentId: c.document_id
        }))
      },
      {
        language,
        serviceName: 'NexusAIChat',
        showInterviewWarning: true
      }
    )

    // Add coding samples
    let codingSamples = '\n\n### Kodierungsbeispiele:\n'
    const sampleCodings = context.codings.slice(0, 10)
    sampleCodings.forEach((c, i) => {
      const code = context.codes.find(code => code.id === c.code_id)
      codingSamples += `${i + 1}. [${code?.name || 'Code'}]: "${c.selected_text?.substring(0, 100)}..."\n`
    })

    return antiHallContext + codingSamples
  }, [context, language])

  const sendMessage = async (customMessage?: string) => {
    const messageText = customMessage || input.trim()
    if (!messageText || isLoading) return

    if (!apiKey) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ **${t.noApiKey}**\n\n${t.configureKey}`,
        timestamp: new Date()
      }])
      return
    }

    // Detect questionnaire context from message
    detectQuestionnaireContext(messageText)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowQuickActions(false)
    setShowQuestionnaireActions(false)

    // Create streaming message
    const streamingMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }])

    abortControllerRef.current = new AbortController()

    try {
      const researchContext = buildResearchContext()

      // Build workflow context if available
      const workflowContextStr = hasWorkflowContext && workflowContext ? `

[AKTIVER WORKFLOW]
Methode: ${workflowContext.methodologyDE} (${workflowContext.methodology})
Aktueller Schritt: ${workflowContext.currentStepDE} (Schritt ${workflowContext.stepIndex + 1} von ${workflowContext.totalSteps})
Fortschritt: ${Math.round(workflowContext.progress)}%

Beschreibung dieses Schritts:
${workflowContext.stepDescriptionDE}

Aufgaben in diesem Schritt:
${workflowContext.tasksDE.map((t, i) => `${i + 1}. ${t}`).join('\n')}

${workflowContext.tipsDE.length > 0 ? `Tipps für diesen Schritt:\n${workflowContext.tipsDE.map(t => `• ${t}`).join('\n')}` : ''}

Der Nutzer arbeitet aktiv an diesem Workflow-Schritt. Gib kontextbezogene, praktische Hilfe die speziell für diesen Schritt relevant ist.
[/AKTIVER WORKFLOW]
` : ''

      // Build questionnaire system prompt extension if context is active
      const questionnairePromptExtension = questionnaireContextActive || NexusQuestionnaireContextBuilder.shouldActivateQuestionnaireContext(messageText)
        ? buildQuestionnaireSystemPrompt(questionnaireContext, language)
        : ''

      const systemPrompt = `Du bist NEXUS AI, ein wissenschaftlicher Forschungsassistent für qualitative Analysen${questionnaireContextActive ? ' und Fragebogenentwicklung' : ''}.

${AntiHallucinationService.generateSystemPromptAddition(language)}

${researchContext}
${workflowContextStr}
${questionnairePromptExtension}
Antworte immer:
- Basierend auf den echten Projektdaten
- In ${language === 'de' ? 'Deutsch' : 'English'}
- Strukturiert mit Markdown
- Hilfreich und wissenschaftlich fundiert
${hasWorkflowContext ? '- Beziehe dich auf den aktuellen Workflow-Schritt und gib spezifische Hilfe' : ''}
${questionnaireContextActive ? '- Bei Fragebogen-Themen: Nutze dein Wissen über Psychometrie, Skalenvalidierung und Item-Entwicklung' : ''}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          stream: true,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== 'system' && m.id !== 'welcome').slice(-10).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: messageText }
          ]
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

          for (const line of lines) {
            const data = line.replace('data: ', '').trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || ''
                if (content) {
                  fullContent += content
                  setMessages(prev => prev.map(m =>
                    m.id === streamingMessageId
                      ? { ...m, content: fullContent }
                      : m
                  ))
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Finalize message
      setMessages(prev => prev.map(m =>
        m.id === streamingMessageId
          ? { ...m, isStreaming: false }
          : m
      ))

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== streamingMessageId))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === streamingMessageId
            ? { ...m, content: `❌ **${t.connectionError}:** ${error.message}`, isStreaming: false }
            : m
        ))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const copyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t.welcome,
      timestamp: new Date()
    }])
    setShowQuickActions(true)
    setQuestionnaireContextActive(false)
    setShowQuestionnaireActions(false)
  }

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl"
      style={{
        width: '420px',
        height: '600px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
        backdropFilter: 'blur(40px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 0 60px rgba(99, 102, 241, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500"
            style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
          >
            <IconBrain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t.title}</h3>
            <p className="text-xs text-slate-400">{t.subtitle}</p>
          </div>
          {/* Workflow context indicator */}
          {hasWorkflowContext && currentStep && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
              <IconBook size={12} className="text-indigo-400" />
              <span className="text-xs text-indigo-300 max-w-[80px] truncate">
                {language === 'de' ? currentStep.nameDE : currentStep.name}
              </span>
            </div>
          )}
          {/* Questionnaire context indicator */}
          {questionnaireContextActive && (
            <button
              onClick={() => setQuestionnaireContextActive(false)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              title={language === 'de' ? 'Fragebogen-Modus deaktivieren' : 'Deactivate questionnaire mode'}
            >
              <IconForms size={12} className="text-purple-400" />
              <span className="text-xs text-purple-300">
                {language === 'de' ? 'Fragebogen' : 'Questionnaire'}
              </span>
              <IconX size={10} className="text-purple-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title={t.clearChat}
          >
            <IconTrash size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99, 102, 241, 0.3) transparent' }}
      >
        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <div className="space-y-3">
            {/* Questionnaire mode toggle if not active */}
            {!questionnaireContextActive && context.codes.length > 0 && (
              <button
                onClick={() => {
                  setQuestionnaireContextActive(true)
                  setShowQuestionnaireActions(true)
                }}
                className="w-full p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-center gap-2 hover:bg-purple-500/20 transition-colors"
              >
                <IconForms size={14} />
                <span>{language === 'de' ? 'Fragebogen-Modus aktivieren' : 'Activate questionnaire mode'}</span>
              </button>
            )}

            {/* Section header */}
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {questionnaireContextActive ? t.questionnaireActions : t.quickActions}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  className={`p-3 rounded-xl text-left text-xs text-white transition-all hover:scale-[1.02] bg-gradient-to-r ${action.color} bg-opacity-20 border border-white/10`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {action.icon}
                    <span className="font-medium">{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}
            >
              {message.role === 'user'
                ? <IconUser size={14} className="text-white" />
                : <IconRobot size={14} className="text-white" />
              }
            </div>

            {/* Content */}
            <div
              className={`max-w-[85%] rounded-xl p-3 relative group ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {message.isStreaming && (
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              )}

              <div
                className="text-sm text-slate-200 prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-purple-300">$1</code>')
                    .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-bold text-white mt-3 mb-2">$1</h3>')
                    .replace(/## (.*?)(\n|$)/g, '<h2 class="text-lg font-bold text-white mt-3 mb-2">$1</h2>')
                    .replace(/# (.*?)(\n|$)/g, '<h1 class="text-xl font-bold text-white mt-3 mb-2">$1</h1>')
                    .replace(/- (.*?)(\n|$)/g, '<li class="ml-4 text-slate-300">$1</li>')
                    .replace(/\n/g, '<br/>')
                }}
              />

              {/* Copy button */}
              <button
                onClick={() => copyMessage(message.id, message.content)}
                className="absolute top-2 right-2 p-1 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                {copiedId === message.id
                  ? <IconCheck size={12} className="text-green-400" />
                  : <IconCopy size={12} className="text-slate-400" />
                }
              </button>
            </div>
          </div>
        ))}

        {/* Loading */}
        {isLoading && !messages.find(m => m.isStreaming) && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
              <IconRobot size={14} className="text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <IconLoader2 size={14} className="animate-spin text-purple-400" />
                <span className="text-sm text-slate-400">{t.thinking}</span>
                <button
                  onClick={cancelStreaming}
                  className="ml-2 p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <IconX size={10} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={t.placeholder}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <IconSend size={18} />
          </button>
        </div>

        {/* Context info */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <IconFileText size={12} />
              {context.documents.length}
            </span>
            <span className="flex items-center gap-1">
              <IconCategory size={12} />
              {context.codes.length}
            </span>
            <span className="flex items-center gap-1">
              <IconCodeIcon size={12} />
              {context.codings.length}
            </span>
          </div>
          {/* Context indicators */}
          <div className="flex items-center gap-2">
            {/* Workflow context active indicator */}
            {hasWorkflowContext && (
              <div className="flex items-center gap-1 text-xs text-indigo-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>{language === 'de' ? 'Workflow' : 'Workflow'}</span>
              </div>
            )}
            {/* Questionnaire context active indicator */}
            {questionnaireContextActive && (
              <div className="flex items-center gap-1 text-xs text-purple-400">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>{language === 'de' ? 'Fragebogen' : 'Questionnaire'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NexusAIChat
