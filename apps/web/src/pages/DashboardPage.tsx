import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import Layout from '@/components/Layout'
import ImportWizard, { type ImportedData } from '@/components/ImportWizard'
import TemplateSelector from '@/components/TemplateSelector'
import { type ProjectTemplate } from '@/lib/templates'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { projects, isLoading, error, fetchProjects, createProject } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const stats = {
    totalProjects: projects.length,
    totalDocuments: projects.reduce((sum, p) => sum + (p.documentsCount || 0), 0),
    totalCodes: projects.reduce((sum, p) => sum + (p.codesCount || 0), 0),
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

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

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
              <button
                onClick={() => setShowImportWizard(true)}
                className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                title="Projekt importieren"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 text-sm font-medium flex items-center gap-2"
                title="Aus Vorlage erstellen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="hidden lg:inline">Vorlage</span>
              </button>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Neues Projekt</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-400">Projekte werden geladen...</p>
            </div>
          )}

          {/* Project List */}
          {!isLoading && (
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
                          {project.documentsCount || 0} Dokumente
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {project.codesCount || 0} Codes
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {project.codingsCount || 0} Kodierungen
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

              {filteredProjects.length === 0 && !isLoading && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <p className="text-surface-400">
                    {searchQuery ? 'Keine Projekte gefunden' : 'Noch keine Projekte vorhanden'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowNewProject(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
                    >
                      Erstes Projekt erstellen
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <NewProjectModal onClose={() => setShowNewProject(false)} />
        )}

        {/* Import Wizard */}
        {showImportWizard && (
          <ImportWizard
            projectId="new"
            onImport={async (data: ImportedData) => {
              // Create a new project with imported data
              const project = await createProject({
                name: `Import ${new Date().toLocaleDateString('de-DE')}`,
                description: `Importiert aus ${data.format}`,
                organizationId: 'demo-org',
              })
              if (project) {
                // TODO: Import documents, codes, codings
                console.log('Imported data:', data)
              }
              setShowImportWizard(false)
            }}
            onClose={() => setShowImportWizard(false)}
          />
        )}

        {/* Template Selector */}
        {showTemplateSelector && (
          <TemplateSelector
            onSelect={async (template: ProjectTemplate) => {
              const project = await createProject({
                name: `${template.name} Projekt`,
                description: template.description,
                organizationId: 'demo-org',
              })
              if (project) {
                // TODO: Create codes from template
                console.log('Template selected:', template)
              }
              setShowTemplateSelector(false)
            }}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}
      </div>
    </Layout>
  )
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { createProject } = useProjectStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    const project = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      organizationId: 'demo-org', // TODO: Get from org store
    })

    if (project) {
      onClose()
    }
    setIsCreating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 rounded-2xl border border-surface-800 shadow-xl">
        <div className="p-6 border-b border-surface-800">
          <h2 className="text-xl font-semibold text-surface-100">Neues Projekt</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Projektname *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="z.B. Interview-Studie 2024"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
              placeholder="Kurze Beschreibung des Projekts..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50"
            >
              {isCreating ? 'Erstellen...' : 'Projekt erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
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
