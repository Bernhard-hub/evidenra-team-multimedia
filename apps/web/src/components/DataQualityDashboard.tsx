import React from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  IconFileText, IconCategory, IconCode, IconHash, IconChartBar
} from '@tabler/icons-react'

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

const calculateDiversity = (docs: Document[]): number => {
  if (docs.length === 0) return 0
  const types = new Set(docs.map(d => d.file_type || 'unknown'))
  return Math.min(types.size / 4, 1)
}

const calculateCoherence = (codings: Coding[]): number => {
  if (codings.length === 0) return 0
  const uniqueCodes = new Set(codings.map(c => c.code_id)).size
  return Math.min(uniqueCodes / Math.max(codings.length * 0.3, 1), 1)
}

const calculateBalance = (codings: Coding[], codes: Code[]): number => {
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
}

export const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({
  documents,
  codes,
  codings,
  language = 'de'
}) => {
  const t = language === 'de' ? {
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
    noDocsYet: 'Noch keine Dokumente'
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
    noDocsYet: 'No documents yet'
  }

  // Calculate metrics
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

  // Quality scores
  const diversity = calculateDiversity(docsWithWordCount)
  const coverage = Math.min(codes.length / 15, 1)
  const coherence = calculateCoherence(codings)
  const balance = calculateBalance(codings, codes)

  const qualityData = [
    { name: t.diversity, score: diversity * 100 },
    { name: t.coverage, score: coverage * 100 },
    { name: t.coherence, score: coherence * 100 },
    { name: t.balance, score: balance * 100 }
  ]

  const overallQuality = qualityData.reduce((sum, d) => sum + d.score, 0) / qualityData.length

  const COLORS = ['#3B82F6', '#A855F7', '#10B981', '#F97316', '#EF4444', '#F59E0B']

  return (
    <div className="space-y-6">
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

        {wordCountData.length > 0 && (
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
