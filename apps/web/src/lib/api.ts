/**
 * EVIDENRA API Service
 * Handles all database operations with Supabase
 */

import { supabase } from './supabase'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']
type Project = Tables['projects']['Row']
type Document = Tables['documents']['Row']
type Code = Tables['codes']['Row']
type Coding = Tables['codings']['Row']
type Organization = Tables['organizations']['Row']
type OrganizationMember = Tables['organization_members']['Row']
type Profile = Tables['profiles']['Row']

// Check if we're in demo mode
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

// ============================================
// DEMO DATA
// ============================================

const demoProjects: (Project & { documents_count: number; codes_count: number; codings_count: number })[] = [
  {
    id: 'demo-project-1',
    organization_id: 'demo-org',
    name: 'Nutzerforschung App Redesign',
    description: 'Qualitative Analyse der Nutzerinterviews zum App Redesign',
    created_by: 'demo-user',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z',
    documents_count: 8,
    codes_count: 24,
    codings_count: 156,
  },
  {
    id: 'demo-project-2',
    organization_id: 'demo-org',
    name: 'Marktanalyse Q1 2024',
    description: 'Fokusgruppen und Experteninterviews zur Marktpositionierung',
    created_by: 'demo-user',
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-10T11:00:00Z',
    documents_count: 5,
    codes_count: 18,
    codings_count: 89,
  },
]

const demoDocuments: Document[] = [
  {
    id: 'demo-doc-1',
    project_id: 'demo-project-1',
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
    file_path: null,
    file_type: 'transcript',
    word_count: 245,
    created_by: 'demo-user',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: 'demo-doc-2',
    project_id: 'demo-project-1',
    name: 'Interview_002_Mueller',
    content: `Interviewer: Wie würden Sie Ihre allgemeine Erfahrung mit der Software beschreiben?

Teilnehmer: Insgesamt positiv. Die Software hat mir viel Zeit gespart, besonders bei der Datenanalyse.

Interviewer: Was hat Ihnen besonders gut gefallen?

Teilnehmer: Die Visualisierungen sind wirklich beeindruckend. Man kann komplexe Daten sehr einfach darstellen.`,
    file_path: null,
    file_type: 'transcript',
    word_count: 52,
    created_by: 'demo-user',
    created_at: '2024-01-16T14:00:00Z',
    updated_at: '2024-01-16T14:00:00Z',
  },
]

const demoCodes: Code[] = [
  { id: 'demo-code-1', project_id: 'demo-project-1', parent_id: null, name: 'Erste Eindrücke', description: 'Erste Reaktionen und Eindrücke', color: '#f59e0b', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
  { id: 'demo-code-2', project_id: 'demo-project-1', parent_id: null, name: 'Negative Emotion', description: 'Negative emotionale Reaktionen', color: '#ef4444', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
  { id: 'demo-code-3', project_id: 'demo-project-1', parent_id: null, name: 'Positive Emotion', description: 'Positive emotionale Reaktionen', color: '#22c55e', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
  { id: 'demo-code-4', project_id: 'demo-project-1', parent_id: null, name: 'Lernprozess', description: 'Lernerfahrungen und Fortschritte', color: '#3b82f6', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
  { id: 'demo-code-5', project_id: 'demo-project-1', parent_id: null, name: 'Verbesserungsvorschlag', description: 'Vorschläge zur Verbesserung', color: '#8b5cf6', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
  { id: 'demo-code-6', project_id: 'demo-project-1', parent_id: null, name: 'Feature-Bewertung', description: 'Bewertung einzelner Features', color: '#06b6d4', created_by: 'demo-user', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-15T11:00:00Z' },
]

const demoCodings: Coding[] = [
  { id: 'demo-coding-1', document_id: 'demo-doc-1', code_id: 'demo-code-1', start_offset: 147, end_offset: 286, selected_text: 'Die Oberfläche sah sehr komplex aus, mit vielen Buttons und Menüs. Ich wusste nicht, wo ich anfangen sollte.', memo: null, confidence: null, coding_method: 'manual', coded_by: 'demo-user', created_at: '2024-01-15T12:00:00Z', updated_at: '2024-01-15T12:00:00Z' },
  { id: 'demo-coding-2', document_id: 'demo-doc-1', code_id: 'demo-code-2', start_offset: 338, end_offset: 348, selected_text: 'Frustriert', memo: null, confidence: null, coding_method: 'manual', coded_by: 'demo-user', created_at: '2024-01-15T12:05:00Z', updated_at: '2024-01-15T12:05:00Z' },
]

// ============================================
// ORGANIZATIONS API
// ============================================

export const organizationsApi = {
  async getMyOrganizations() {
    if (isDemoMode) {
      return {
        data: [{
          id: 'demo-org',
          name: 'Demo Organisation',
          slug: 'demo',
          logo_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }],
        error: null,
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        organization:organizations(*)
      `)
      .eq('user_id', user.id)

    if (error) return { data: null, error }

    const organizations = data?.map((m: any) => m.organization).filter(Boolean) || []
    return { data: organizations, error: null }
  },

  async create(name: string, slug: string) {
    if (isDemoMode) {
      return {
        data: {
          id: `org-${Date.now()}`,
          name,
          slug,
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name, slug })
      .select()
      .single()

    if (orgError) return { data: null, error: orgError }

    // Add creator as owner
    await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
      })

    return { data: org, error: null }
  },
}

// ============================================
// PROJECTS API
// ============================================

export const projectsApi = {
  async getAll(organizationId?: string) {
    if (isDemoMode) {
      const projects = organizationId
        ? demoProjects.filter(p => p.organization_id === organizationId)
        : demoProjects
      return { data: projects, error: null }
    }

    let query = supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query
    return { data, error }
  },

  async getById(id: string) {
    if (isDemoMode) {
      const project = demoProjects.find(p => p.id === id)
      return { data: project || null, error: project ? null : new Error('Project not found') }
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  async create(data: { name: string; description?: string; organizationId: string }) {
    if (isDemoMode) {
      const newProject = {
        id: `project-${Date.now()}`,
        organization_id: data.organizationId,
        name: data.name,
        description: data.description || null,
        created_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        documents_count: 0,
        codes_count: 0,
        codings_count: 0,
      }
      demoProjects.push(newProject)
      return { data: newProject, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        organization_id: data.organizationId,
        name: data.name,
        description: data.description,
        created_by: user.id,
      })
      .select()
      .single()

    return { data: project, error }
  },

  async update(id: string, updates: { name?: string; description?: string }) {
    if (isDemoMode) {
      const idx = demoProjects.findIndex(p => p.id === id)
      if (idx !== -1) {
        demoProjects[idx] = { ...demoProjects[idx], ...updates, updated_at: new Date().toISOString() }
        return { data: demoProjects[idx], error: null }
      }
      return { data: null, error: new Error('Project not found') }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async delete(id: string) {
    if (isDemoMode) {
      const idx = demoProjects.findIndex(p => p.id === id)
      if (idx !== -1) {
        demoProjects.splice(idx, 1)
        return { error: null }
      }
      return { error: new Error('Project not found') }
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    return { error }
  },

  async getStats(projectId: string) {
    if (isDemoMode) {
      const project = demoProjects.find(p => p.id === projectId)
      return {
        data: {
          document_count: project?.documents_count || 0,
          code_count: project?.codes_count || 0,
          coding_count: project?.codings_count || 0,
          member_count: 3,
          word_count: 1250,
        },
        error: null,
      }
    }

    const { data, error } = await supabase
      .rpc('get_project_stats', { p_project_id: projectId })

    return { data: data?.[0], error }
  },
}

// ============================================
// DOCUMENTS API
// ============================================

export const documentsApi = {
  async getByProject(projectId: string) {
    if (isDemoMode) {
      const docs = demoDocuments.filter(d => d.project_id === projectId)
      return { data: docs, error: null }
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    return { data, error }
  },

  async getById(id: string) {
    if (isDemoMode) {
      const doc = demoDocuments.find(d => d.id === id)
      return { data: doc || null, error: doc ? null : new Error('Document not found') }
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    return { data, error }
  },

  async create(data: { projectId: string; name: string; content: string; fileType?: string }) {
    if (isDemoMode) {
      const newDoc: Document = {
        id: `doc-${Date.now()}`,
        project_id: data.projectId,
        name: data.name,
        content: data.content,
        file_path: null,
        file_type: data.fileType || 'text',
        word_count: data.content.split(/\s+/).length,
        created_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      demoDocuments.push(newDoc)
      return { data: newDoc, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data: doc, error } = await supabase
      .from('documents')
      .insert({
        project_id: data.projectId,
        name: data.name,
        content: data.content,
        file_type: data.fileType || 'text',
        created_by: user.id,
      })
      .select()
      .single()

    return { data: doc, error }
  },

  async update(id: string, updates: { name?: string; content?: string }) {
    if (isDemoMode) {
      const idx = demoDocuments.findIndex(d => d.id === id)
      if (idx !== -1) {
        demoDocuments[idx] = {
          ...demoDocuments[idx],
          ...updates,
          word_count: updates.content ? updates.content.split(/\s+/).length : demoDocuments[idx].word_count,
          updated_at: new Date().toISOString(),
        }
        return { data: demoDocuments[idx], error: null }
      }
      return { data: null, error: new Error('Document not found') }
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async delete(id: string) {
    if (isDemoMode) {
      const idx = demoDocuments.findIndex(d => d.id === id)
      if (idx !== -1) {
        demoDocuments.splice(idx, 1)
        return { error: null }
      }
      return { error: new Error('Document not found') }
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    return { error }
  },
}

// ============================================
// CODES API
// ============================================

export const codesApi = {
  async getByProject(projectId: string) {
    if (isDemoMode) {
      const codes = demoCodes.filter(c => c.project_id === projectId)
      return { data: codes, error: null }
    }

    const { data, error } = await supabase
      .from('codes')
      .select('*')
      .eq('project_id', projectId)
      .order('name')

    return { data, error }
  },

  async create(data: { projectId: string; name: string; description?: string; color: string; parentId?: string }) {
    if (isDemoMode) {
      const newCode: Code = {
        id: `code-${Date.now()}`,
        project_id: data.projectId,
        parent_id: data.parentId || null,
        name: data.name,
        description: data.description || null,
        color: data.color,
        created_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      demoCodes.push(newCode)
      return { data: newCode, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data: code, error } = await supabase
      .from('codes')
      .insert({
        project_id: data.projectId,
        parent_id: data.parentId,
        name: data.name,
        description: data.description,
        color: data.color,
        created_by: user.id,
      })
      .select()
      .single()

    return { data: code, error }
  },

  async update(id: string, updates: { name?: string; description?: string; color?: string; parentId?: string }) {
    if (isDemoMode) {
      const idx = demoCodes.findIndex(c => c.id === id)
      if (idx !== -1) {
        demoCodes[idx] = {
          ...demoCodes[idx],
          ...updates,
          parent_id: updates.parentId !== undefined ? updates.parentId || null : demoCodes[idx].parent_id,
          updated_at: new Date().toISOString(),
        }
        return { data: demoCodes[idx], error: null }
      }
      return { data: null, error: new Error('Code not found') }
    }

    const { data, error } = await supabase
      .from('codes')
      .update({
        name: updates.name,
        description: updates.description,
        color: updates.color,
        parent_id: updates.parentId,
      })
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async delete(id: string) {
    if (isDemoMode) {
      const idx = demoCodes.findIndex(c => c.id === id)
      if (idx !== -1) {
        demoCodes.splice(idx, 1)
        return { error: null }
      }
      return { error: new Error('Code not found') }
    }

    const { error } = await supabase
      .from('codes')
      .delete()
      .eq('id', id)

    return { error }
  },
}

// ============================================
// CODINGS API
// ============================================

export const codingsApi = {
  async getByDocument(documentId: string) {
    if (isDemoMode) {
      const codings = demoCodings.filter(c => c.document_id === documentId)
      // Include code information
      const codingsWithCodes = codings.map(coding => {
        const code = demoCodes.find(c => c.id === coding.code_id)
        return {
          ...coding,
          code: code || null,
        }
      })
      return { data: codingsWithCodes, error: null }
    }

    const { data, error } = await supabase
      .from('codings')
      .select(`
        *,
        code:codes(*)
      `)
      .eq('document_id', documentId)
      .order('start_offset')

    return { data, error }
  },

  async create(data: {
    documentId: string
    codeId: string
    startOffset: number
    endOffset: number
    selectedText: string
    memo?: string
    confidence?: number
    codingMethod?: string
  }) {
    if (isDemoMode) {
      const newCoding: Coding = {
        id: `coding-${Date.now()}`,
        document_id: data.documentId,
        code_id: data.codeId,
        start_offset: data.startOffset,
        end_offset: data.endOffset,
        selected_text: data.selectedText,
        memo: data.memo || null,
        confidence: data.confidence || null,
        coding_method: data.codingMethod || 'manual',
        coded_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      demoCodings.push(newCoding)
      return { data: newCoding, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data: coding, error } = await supabase
      .from('codings')
      .insert({
        document_id: data.documentId,
        code_id: data.codeId,
        start_offset: data.startOffset,
        end_offset: data.endOffset,
        selected_text: data.selectedText,
        memo: data.memo,
        confidence: data.confidence,
        coding_method: data.codingMethod || 'manual',
        coded_by: user.id,
      })
      .select()
      .single()

    return { data: coding, error }
  },

  async update(id: string, updates: { memo?: string; confidence?: number }) {
    if (isDemoMode) {
      const idx = demoCodings.findIndex(c => c.id === id)
      if (idx !== -1) {
        demoCodings[idx] = {
          ...demoCodings[idx],
          ...updates,
          updated_at: new Date().toISOString(),
        }
        return { data: demoCodings[idx], error: null }
      }
      return { data: null, error: new Error('Coding not found') }
    }

    const { data, error } = await supabase
      .from('codings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  },

  async delete(id: string) {
    if (isDemoMode) {
      const idx = demoCodings.findIndex(c => c.id === id)
      if (idx !== -1) {
        demoCodings.splice(idx, 1)
        return { error: null }
      }
      return { error: new Error('Coding not found') }
    }

    const { error } = await supabase
      .from('codings')
      .delete()
      .eq('id', id)

    return { error }
  },

  async createBatch(codings: {
    documentId: string
    codeId: string
    startOffset: number
    endOffset: number
    selectedText: string
    memo?: string
    confidence?: number
    codingMethod?: string
  }[]) {
    if (isDemoMode) {
      const newCodings = codings.map((data, idx) => ({
        id: `coding-${Date.now()}-${idx}`,
        document_id: data.documentId,
        code_id: data.codeId,
        start_offset: data.startOffset,
        end_offset: data.endOffset,
        selected_text: data.selectedText,
        memo: data.memo || null,
        confidence: data.confidence || null,
        coding_method: data.codingMethod || 'manual',
        coded_by: 'demo-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      demoCodings.push(...newCodings)
      return { data: newCodings, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('codings')
      .insert(codings.map(c => ({
        document_id: c.documentId,
        code_id: c.codeId,
        start_offset: c.startOffset,
        end_offset: c.endOffset,
        selected_text: c.selectedText,
        memo: c.memo,
        confidence: c.confidence,
        coding_method: c.codingMethod || 'manual',
        coded_by: user.id,
      })))
      .select()

    return { data, error }
  },
}

// ============================================
// PROFILES API
// ============================================

export const profilesApi = {
  async getCurrent() {
    if (isDemoMode) {
      return {
        data: {
          id: 'demo-user',
          email: 'demo@evidenra.com',
          full_name: 'Demo User',
          avatar_url: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { data, error }
  },

  async update(updates: { fullName?: string; avatarUrl?: string }) {
    if (isDemoMode) {
      return { data: { id: 'demo-user', ...updates }, error: null }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: updates.fullName,
        avatar_url: updates.avatarUrl,
      })
      .eq('id', user.id)
      .select()
      .single()

    return { data, error }
  },
}
