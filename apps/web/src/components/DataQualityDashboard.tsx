import React, { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  IconFileText, IconCategory, IconCode, IconHash, IconChartBar,
  IconBrain, IconLink, IconSearch, IconLoader2,
  IconBulb, IconNetwork
} from '@tabler/icons-react'
import { RealDataExtractor, type RealProjectData } from '@/services/RealDataExtractor'

interface Document {
  id: string
  name: string
  content?: string
  file_type?: string
  word_count?: number
}

interface Code {
  id: string
  name: string
  description?: string
}

interface Coding {
  id: string
  document_id: string
  code_id: string
  selected_text?: string
}

interface DataQualityDashboardProps {
  documents: Document[]
  codes: Code[]
  codings: Coding[]
  language?: 'de' | 'en'
}

const KPICard: React.FC<{
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}> = ({ label, value, icon, color }) => (
  <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
)

const ChartCard: React.FC<{
  title: string
  subtitle?: string
  children: React.ReactNode
}> = ({ title, subtitle, children }) => (
  <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
    <div className="mb-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
)

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  documents,
  codes,
  codings,
  language = 'de'
}) => {
  const [realData, setRealData] = useState<RealProjectData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showInsights, setShowInsights] = useState(false)

  const isDE = language === 'de'

  const t = isDE ? {
    documents: 'Dokumente',
    totalWords: 'Gesamtwörter',
    codes: 'Codes',
    codings: 'Kodierungen',
    docTypeDistribution: 'Dokumenttypen',
    wordCountDistribution: 'Wortanzahl nach Dokument',
    first20: 'Erste 20 Dokumente',
    qualityMetrics: 'Qualitätsmetriken',
    higherBetter: 'Höher ist besser',
    overallQuality: 'Gesamtqualität',
    diversity: 'Diversität',
    coverage: 'Abdeckung',
    coherence: 'Kohärenz',
    balance: 'Balance',
    avgWordsDoc: 'Ø Wörter/Dokument',
    codingsDoc: 'Kodierungen/Dokument',
    codesDoc: 'Codes/Dokument',
    goodDiversity: 'gute',
    moderateDiversity: 'moderate',
    limitedDiversity: 'begrenzte',
    outOf10: 'von 10',
    noDocsYet: 'Noch keine Dokumente',
    analyzeData: 'Daten analysieren',
    analyzing: 'Analysiere...',
    emergentPatterns: 'Erkannte Muster',
    crossConnections: 'Kategorien-Verbindungen',
    methodology: 'Erkannte Methodik',
    researchQuestions: 'Forschungsfragen',
    shannonDiversity: 'Shannon-Diversität',
    complexity: 'Komplexität',
    categoryBalance: 'Kategorien-Balance',
    dataInsights: 'Daten-Insights',
    hideInsights: 'Insights verbergen',
    showInsights: 'Insights anzeigen',
    coOccurrences: 'Co-Occurrences',
    topCategories: 'Top-Kategorien'
  } : {
    documents: 'Documents',
    totalWords: 'Total Words',
    codes: 'Codes',
    codings: 'Codings',
    docTypeDistribution: 'Document Types',
    wordCountDistribution: 'Word Count by Document',
    first20: 'First 20 documents',
    qualityMetrics: 'Quality Metrics',
    higherBetter: 'Higher is better',
    overallQuality: 'Overall Quality',
    diversity: 'Diversity',
    coverage: 'Coverage',
    coherence: 'Coherence',
    balance: 'Balance',
    avgWordsDoc: 'Avg Words/Document',
    codingsDoc: 'Codings/Document',
    codesDoc: 'Codes/Document',
    goodDiversity: 'good',
    moderateDiversity: 'moderate',
    limitedDiversity: 'limited',
    outOf10: 'out of 10',
    noDocsYet: 'No documents yet',
    analyzeData: 'Analyze Data',
    analyzing: 'Analyzing...',
    emergentPatterns: 'Emergent Patterns',
    crossConnections: 'Cross-Category Connections',
    methodology: 'Detected Methodology',
    researchQuestions: 'Research Questions',
    shannonDiversity: 'Shannon Diversity',
    complexity: 'Complexity',
    categoryBalance: 'Category Balance',
    dataInsights: 'Data Insights',
    hideInsights: 'Hide Insights',
    showInsights: 'Show Insights',
    coOccurrences: 'Co-occurrences',
    topCategories: 'Top Categories'
  }

  // Run deep analysis
  const runAnalysis = async () => {
    if (documents.length === 0) return

    setIsAnalyzing(true)
    try {
      const projectInput = {
        documents: documents.map(d => ({
          id: d.id,
          name: d.name,
          content: d.content || '',
          wordCount: d.word_count
        })),
        categories: codes.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description
        })),
        codings: codings.map(c => ({
          id: c.id,
          documentId: c.document_id,
          categoryId: c.code_id,
          text: c.selected_text
        }))
      }

      const result = await RealDataExtractor.extract(projectInput)
      setRealData(result)
      setShowInsights(true)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calculate basic metrics
  const docsWithWordCount = documents.map(d => ({
    ...d,
    word_count: d.word_count || (d.content?.split(/\s+/).length || 0)
  }))

  const totalWords = docsWithWordCount.reduce((sum, d) => sum + (d.word_count || 0), 0)
  const avgWordsPerDoc = documents.length > 0 ? Math.round(totalWords / documents.length) : 0

  // Document type distribution
  const typeMap: { [key: string]: number } = {}
  docsWithWordCount.forEach(d => {
    const type = d.file_type || 'Text'
    typeMap[type] = (typeMap[type] || 0) + 1
  })

  const docTypeData = Object.entries(typeMap).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }))

  // Word count by document
  const wordCountData = docsWithWordCount.slice(0, 20).map((d, i) => ({
    name: `D${i + 1}`,
    words: d.word_count,
    title: d.name
  }))

  // Basic quality scores (fallback)
  const basicDiversity = useMemo(() => {
    if (documents.length === 0) return 0
    const types = new Set(documents.map(d => d.file_type || 'unknown'))
    return Math.min(types.size / 4, 1)
  }, [documents])

  const basicCoverage = useMemo(() => Math.min(codes.length / 15, 1), [codes])

  const basicCoherence = useMemo(() => {
    if (codings.length === 0) return 0
    const uniqueCodes = new Set(codings.map(c => c.code_id)).size
    return Math.min(uniqueCodes / Math.max(codings.length * 0.3, 1), 1)
  }, [codings])

  const basicBalance = useMemo(() => {
    if (codes.length === 0 || codings.length === 0) return 0
    const distribution: { [key: string]: number } = {}
    codings.forEach(c => {
      distribution[c.code_id] = (distribution[c.code_id] || 0) + 1
    })
    const values = Object.values(distribution)
    if (values.length === 0) return 0
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
    return Math.exp(-variance / Math.max(avg * avg, 1))
  }, [codes, codings])

  // Use RealDataExtractor results if available
  const diversity = realData?.projectStatistics.diversityIndex
    ? Math.min(realData.projectStatistics.diversityIndex / 2, 1)
    : basicDiversity
  const balance = realData?.projectStatistics.categoryBalance ?? basicBalance

  const qualityData = [
    { name: t.diversity, score: diversity * 100 },
    { name: t.coverage, score: basicCoverage * 100 },
    { name: t.coherence, score: basicCoherence * 100 },
    { name: t.balance, score: balance * 100 }
  ]

  const overallQuality = qualityData.reduce((sum, d) => sum + d.score, 0) / qualityData.length

  const COLORS = ['#3B82F6', '#A855F7', '#10B981', '#F97316', '#EF4444', '#F59E0B']

  // Category distribution for chart
  const categoryData = useMemo(() => {
    if (!realData?.codingIntelligence.categoryDistribution) return []
    return realData.codingIntelligence.categoryDistribution
      .slice(0, 8)
      .map(cat => ({
        name: cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name,
        count: cat.count,
        fullName: cat.name
      }))
  }, [realData])

  return (
    <div className="space-y-6">
      {/* Analysis Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <IconChartBar size={20} />
          {t.dataInsights}
        </h2>
        <div className="flex gap-2">
          {realData && (
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm"
            >
              {showInsights ? t.hideInsights : t.showInsights}
            </button>
          )}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || documents.length === 0}
            className="px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                {t.analyzing}
              </>
            ) : (
              <>
                <IconSearch size={16} />
                {t.analyzeData}
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label={t.documents}
          value={documents.length}
          icon={<IconFileText size={20} className="text-blue-400" />}
          color="bg-blue-500/20"
        />
        <KPICard
          label={t.totalWords}
          value={totalWords.toLocaleString()}
          icon={<IconHash size={20} className="text-purple-400" />}
          color="bg-purple-500/20"
        />
        <KPICard
          label={t.codes}
          value={codes.length}
          icon={<IconCategory size={20} className="text-green-400" />}
          color="bg-green-500/20"
        />
        <KPICard
          label={t.codings}
          value={codings.length}
          icon={<IconCode size={20} className="text-orange-400" />}
          color="bg-orange-500/20"
        />
      </div>

      {/* Deep Insights Panel */}
      {showInsights && realData && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Emergent Patterns */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-500/20">
            <h3 className="text-sm font-medium text-purple-300 mb-3 flex items-center gap-2">
              <IconBulb size={16} />
              {t.emergentPatterns}
            </h3>
            <ul className="space-y-2">
              {realData.codingIntelligence.emergentPatterns.map((pattern, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>

          {/* Cross-Category Connections */}
          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
            <h3 className="text-sm font-medium text-green-300 mb-3 flex items-center gap-2">
              <IconNetwork size={16} />
              {t.crossConnections}
            </h3>
            {realData.codingIntelligence.crossCategoryConnections.length > 0 ? (
              <ul className="space-y-2">
                {realData.codingIntelligence.crossCategoryConnections.slice(0, 5).map((conn, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                    <span className="text-green-400">{conn.category1}</span>
                    <IconLink size={12} className="text-slate-500" />
                    <span className="text-green-400">{conn.category2}</span>
                    <span className="text-xs text-slate-500">({conn.coOccurrences} {t.coOccurrences})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">
                {isDE ? 'Noch keine Verbindungen erkannt' : 'No connections detected yet'}
              </p>
            )}
          </div>

          {/* Statistics */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
            <h3 className="text-sm font-medium text-amber-300 mb-3 flex items-center gap-2">
              <IconBrain size={16} />
              {t.methodology}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{t.methodology}:</span>
                <span className="text-white font-medium">{realData.projectStatistics.methodologicalApproach}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.complexity}:</span>
                <span className="text-white">{realData.projectStatistics.complexityScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.shannonDiversity}:</span>
                <span className="text-white">{realData.projectStatistics.diversityIndex.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.categoryBalance}:</span>
                <span className="text-white">{(realData.projectStatistics.categoryBalance * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Research Questions */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
            <h3 className="text-sm font-medium text-cyan-300 mb-3 flex items-center gap-2">
              <IconSearch size={16} />
              {t.researchQuestions}
            </h3>
            <ul className="space-y-2">
              {realData.researchQuestions.slice(0, 3).map((q, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">F{i + 1}:</span>
                  <span className="truncate">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {docTypeData.length > 0 && (
          <ChartCard title={t.docTypeDistribution}>
            <PieChart>
              <Pie
                data={docTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {docTypeData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ChartCard>
        )}

        {/* Category Distribution (from RealDataExtractor) or Word Count */}
        {categoryData.length > 0 ? (
          <ChartCard title={t.topCategories} subtitle={isDE ? 'Nach Kodierungen' : 'By codings'}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="count" fill="#A855F7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        ) : wordCountData.length > 0 && (
          <ChartCard title={t.wordCountDistribution} subtitle={t.first20}>
            <BarChart data={wordCountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="words" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        )}
      </div>

      {/* Quality Metrics */}
      {qualityData.length > 0 && (
        <ChartCard title={t.qualityMetrics} subtitle={t.higherBetter}>
          <BarChart data={qualityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="score" fill="#10B981" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {/* Overall Quality Score */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <IconChartBar size={20} />
              {t.overallQuality}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              {documents.length > 0
                ? `${documents.length} ${t.documents.toLowerCase()} - ${
                    diversity > 0.7 ? t.goodDiversity : diversity > 0.5 ? t.moderateDiversity : t.limitedDiversity
                  } ${t.diversity.toLowerCase()}`
                : t.noDocsYet}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-green-400">
              {(overallQuality / 10).toFixed(1)}
            </div>
            <div className="text-sm text-slate-400">{t.outOf10}</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">{t.avgWordsDoc}</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{avgWordsPerDoc.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">{t.codingsDoc}</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {documents.length > 0 ? (codings.length / documents.length).toFixed(1) : '0'}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">{t.codesDoc}</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {documents.length > 0 ? (codes.length / Math.max(documents.length, 1)).toFixed(1) : '0'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DataQualityDashboard
