import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore, type Project } from '@/stores/projectStore'
import Layout from '@/components/Layout'

// Mock data for development
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Interview-Studie 2024',
    description: 'Qualitative Interviews zur Nutzererfahrung',
    organizationId: 'org-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    memberCount: 4,
    documentCount: 12,
    codeCount: 87,
  },
  {
    id: '2',
    name: 'Fokusgruppen-Analyse',
    description: 'Analyse von Fokusgruppen-Diskussionen',
    organizationId: 'org-1',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    memberCount: 3,
    documentCount: 8,
    codeCount: 54,
  },
  {
    id: '3',
    name: 'Feldnotizen Projekt',
    description: 'Ethnographische Feldforschung',
    organizationId: 'org-1',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-19T12:00:00Z',
    memberCount: 2,
    documentCount: 24,
    codeCount: 156,
  },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [projects] = useState<Project[]>(mockProjects)

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalProjects: projects.length,
    totalDocuments: projects.reduce((sum, p) => sum + p.documentCount, 0),
    totalCodes: projects.reduce((sum, p) => sum + p.codeCount, 0),
    teamMembers: 6,
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-100">
            Willkommen zurück, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </h1>
          <p className="text-surface-400 mt-1">Hier ist eine Übersicht Ihrer Projekte</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Projekte"
            value={stats.totalProjects}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Dokumente"
            value={stats.totalDocuments}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Codes"
            value={stats.totalCodes}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
          <StatCard
            label="Team"
            value={stats.teamMembers}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </div>

        {/* Projects Section */}
        <div className="bg-surface-900 rounded-xl border border-surface-800">
          {/* Header */}
          <div className="p-4 border-b border-surface-800 flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-surface-100">Projekte</h2>
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1 max-w-md relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Projekte suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <button className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Neues Projekt</span>
              </button>
            </div>
          </div>

          {/* Project List */}
          <div className="divide-y divide-surface-800">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="block p-4 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-surface-100 truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-surface-400 mt-0.5 truncate">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {project.documentCount} Dokumente
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {project.codeCount} Codes
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {project.memberCount} Mitglieder
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-surface-500">
                      Aktualisiert {formatDate(project.updatedAt)}
                    </span>
                    <svg className="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

            {filteredProjects.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-surface-400">Keine Projekte gefunden</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-surface-900 rounded-xl p-4 border border-surface-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-surface-400 text-sm">{label}</span>
        <div className="text-primary-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-surface-100">{value}</p>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 7) return `vor ${days} Tagen`

  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}
