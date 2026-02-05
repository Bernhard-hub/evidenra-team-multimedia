/**
 * Paraphrase Store - Manages paraphrases for qualitative content analysis
 *
 * Supports Mayring's summarizing content analysis:
 * 1. Paraphrasierung - Rewrite text segments in own words
 * 2. Generalisierung - Abstract to higher level
 * 3. Reduktion - Bundle similar paraphrases into categories
 */

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Paraphrase {
  id: string
  documentId: string
  projectId: string
  startOffset: number
  endOffset: number
  originalText: string
  paraphraseText: string
  generalization: string | null  // For Mayring step 2
  categoryId: string | null      // For Mayring step 3 (reduction)
  isAiGenerated: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ParaphraseCategory {
  id: string
  projectId: string
  name: string
  description: string | null
  color: string
  parentId: string | null
  order: number
  createdBy: string
  createdAt: string
}

export interface ParaphraseState {
  // Data
  paraphrases: Paraphrase[]
  categories: ParaphraseCategory[]

  // UI State
  isLoading: boolean
  isLoadingCategories: boolean
  paraphraseMode: boolean  // Toggle for paraphrase mode
  showParaphraseSidebar: boolean
  error: string | null

  // Actions
  fetchParaphrases: (documentId: string) => Promise<void>
  fetchCategories: (projectId: string) => Promise<void>

  createParaphrase: (data: {
    documentId: string
    projectId: string
    startOffset: number
    endOffset: number
    originalText: string
    paraphraseText: string
    generalization?: string
    isAiGenerated?: boolean
  }) => Promise<Paraphrase | null>

  updateParaphrase: (id: string, updates: {
    paraphraseText?: string
    generalization?: string
    categoryId?: string | null
  }) => Promise<void>

  deleteParaphrase: (id: string) => Promise<void>

  createCategory: (data: {
    projectId: string
    name: string
    description?: string
    color: string
    parentId?: string
  }) => Promise<ParaphraseCategory | null>

  updateCategory: (id: string, updates: {
    name?: string
    description?: string
    color?: string
    parentId?: string | null
  }) => Promise<void>

  deleteCategory: (id: string) => Promise<void>

  // Reduction helpers (Mayring step 3)
  bundleParaphrases: (paraphraseIds: string[], categoryId: string) => Promise<void>

  // UI Actions
  toggleParaphraseMode: () => void
  toggleParaphraseSidebar: () => void
  clearError: () => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const useParaphraseStore = create<ParaphraseState>()((set, get) => ({
  paraphrases: [],
  categories: [],
  isLoading: false,
  isLoadingCategories: false,
  paraphraseMode: false,
  showParaphraseSidebar: true,
  error: null,

  fetchParaphrases: async (documentId: string) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await db
        .from('paraphrases')
        .select('*')
        .eq('document_id', documentId)
        .order('start_offset', { ascending: true })

      if (error) throw error

      const paraphrases: Paraphrase[] = (data || []).map((p: any) => ({
        id: p.id,
        documentId: p.document_id,
        projectId: p.project_id,
        startOffset: p.start_offset,
        endOffset: p.end_offset,
        originalText: p.original_text,
        paraphraseText: p.paraphrase_text,
        generalization: p.generalization,
        categoryId: p.category_id,
        isAiGenerated: p.is_ai_generated || false,
        createdBy: p.created_by,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))

      set({ paraphrases, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch paraphrases:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Laden der Paraphrasen',
        isLoading: false
      })
    }
  },

  fetchCategories: async (projectId: string) => {
    set({ isLoadingCategories: true })

    try {
      const { data, error } = await db
        .from('paraphrase_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true })

      if (error) throw error

      const categories: ParaphraseCategory[] = (data || []).map((c: any) => ({
        id: c.id,
        projectId: c.project_id,
        name: c.name,
        description: c.description,
        color: c.color,
        parentId: c.parent_id,
        order: c.order || 0,
        createdBy: c.created_by,
        createdAt: c.created_at
      }))

      set({ categories, isLoadingCategories: false })
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      set({ isLoadingCategories: false })
    }
  },

  createParaphrase: async (data) => {
    set({ isLoading: true, error: null })

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { data: result, error } = await db
        .from('paraphrases')
        .insert({
          document_id: data.documentId,
          project_id: data.projectId,
          start_offset: data.startOffset,
          end_offset: data.endOffset,
          original_text: data.originalText,
          paraphrase_text: data.paraphraseText,
          generalization: data.generalization || null,
          is_ai_generated: data.isAiGenerated || false,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      const paraphrase: Paraphrase = {
        id: result.id,
        documentId: result.document_id,
        projectId: result.project_id,
        startOffset: result.start_offset,
        endOffset: result.end_offset,
        originalText: result.original_text,
        paraphraseText: result.paraphrase_text,
        generalization: result.generalization,
        categoryId: result.category_id,
        isAiGenerated: result.is_ai_generated || false,
        createdBy: result.created_by,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }

      set({
        paraphrases: [...get().paraphrases, paraphrase],
        isLoading: false
      })

      return paraphrase
    } catch (error) {
      console.error('Failed to create paraphrase:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen der Paraphrase',
        isLoading: false
      })
      return null
    }
  },

  updateParaphrase: async (id, updates) => {
    try {
      const updateData: Record<string, any> = {}
      if (updates.paraphraseText !== undefined) updateData.paraphrase_text = updates.paraphraseText
      if (updates.generalization !== undefined) updateData.generalization = updates.generalization
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId

      const { error } = await db
        .from('paraphrases')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        paraphrases: get().paraphrases.map(p =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })
    } catch (error) {
      console.error('Failed to update paraphrase:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Paraphrase'
      })
    }
  },

  deleteParaphrase: async (id) => {
    try {
      const { error } = await db
        .from('paraphrases')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        paraphrases: get().paraphrases.filter(p => p.id !== id)
      })
    } catch (error) {
      console.error('Failed to delete paraphrase:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Löschen der Paraphrase'
      })
    }
  },

  createCategory: async (data) => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const { categories } = get()
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order)) : 0

      const { data: result, error } = await db
        .from('paraphrase_categories')
        .insert({
          project_id: data.projectId,
          name: data.name,
          description: data.description || null,
          color: data.color,
          parent_id: data.parentId || null,
          order: maxOrder + 1,
          created_by: userData.user.id
        })
        .select()
        .single()

      if (error) throw error

      const category: ParaphraseCategory = {
        id: result.id,
        projectId: result.project_id,
        name: result.name,
        description: result.description,
        color: result.color,
        parentId: result.parent_id,
        order: result.order,
        createdBy: result.created_by,
        createdAt: result.created_at
      }

      set({ categories: [...get().categories, category] })

      return category
    } catch (error) {
      console.error('Failed to create category:', error)
      set({
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen der Kategorie'
      })
      return null
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const updateData: Record<string, any> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.color !== undefined) updateData.color = updates.color
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId

      const { error } = await db
        .from('paraphrase_categories')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        categories: get().categories.map(c =>
          c.id === id ? { ...c, ...updates } : c
        )
      })
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  },

  deleteCategory: async (id) => {
    try {
      // First, remove category from all paraphrases
      await db
        .from('paraphrases')
        .update({ category_id: null })
        .eq('category_id', id)

      const { error } = await db
        .from('paraphrase_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        categories: get().categories.filter(c => c.id !== id),
        paraphrases: get().paraphrases.map(p =>
          p.categoryId === id ? { ...p, categoryId: null } : p
        )
      })
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  },

  bundleParaphrases: async (paraphraseIds, categoryId) => {
    try {
      const { error } = await db
        .from('paraphrases')
        .update({ category_id: categoryId })
        .in('id', paraphraseIds)

      if (error) throw error

      set({
        paraphrases: get().paraphrases.map(p =>
          paraphraseIds.includes(p.id) ? { ...p, categoryId } : p
        )
      })
    } catch (error) {
      console.error('Failed to bundle paraphrases:', error)
    }
  },

  toggleParaphraseMode: () => {
    set({ paraphraseMode: !get().paraphraseMode })
  },

  toggleParaphraseSidebar: () => {
    set({ showParaphraseSidebar: !get().showParaphraseSidebar })
  },

  clearError: () => set({ error: null })
}))

// Selector hooks
export function useParaphrasesForDocument(documentId: string): Paraphrase[] {
  return useParaphraseStore(state =>
    state.paraphrases.filter(p => p.documentId === documentId)
  )
}

export function useParaphrasesByCategory(categoryId: string | null): Paraphrase[] {
  return useParaphraseStore(state =>
    state.paraphrases.filter(p => p.categoryId === categoryId)
  )
}

export function useUncategorizedParaphrases(): Paraphrase[] {
  return useParaphraseStore(state =>
    state.paraphrases.filter(p => !p.categoryId)
  )
}
