import { useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/stores/projectStore'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName = 'documents' | 'codes' | 'codings'

interface RealtimeConfig {
  projectId?: string
  documentId?: string
  enabled?: boolean
}

// Helper to convert snake_case to camelCase
function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object') return obj

  const result: Record<string, any> = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = toCamelCase(obj[key])
  }
  return result
}

/**
 * Hook for subscribing to real-time database changes
 * Automatically updates the store when changes occur
 */
export function useRealtime({ projectId, documentId, enabled = true }: RealtimeConfig = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const store = useProjectStore()

  const handleDocumentChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      const record = toCamelCase(payload.new || payload.old)

      switch (payload.eventType) {
        case 'INSERT':
          if (record.projectId === projectId) {
            useProjectStore.setState((state) => ({
              documents: [...state.documents, record],
            }))
          }
          break
        case 'UPDATE':
          useProjectStore.setState((state) => ({
            documents: state.documents.map((d) =>
              d.id === record.id ? { ...d, ...record } : d
            ),
            currentDocument:
              state.currentDocument?.id === record.id
                ? { ...state.currentDocument, ...record }
                : state.currentDocument,
          }))
          break
        case 'DELETE':
          useProjectStore.setState((state) => ({
            documents: state.documents.filter((d) => d.id !== payload.old?.id),
            currentDocument:
              state.currentDocument?.id === payload.old?.id
                ? null
                : state.currentDocument,
          }))
          break
      }
    },
    [projectId]
  )

  const handleCodeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      const record = toCamelCase(payload.new || payload.old)

      switch (payload.eventType) {
        case 'INSERT':
          if (record.projectId === projectId) {
            useProjectStore.setState((state) => ({
              codes: [...state.codes, record],
            }))
          }
          break
        case 'UPDATE':
          useProjectStore.setState((state) => ({
            codes: state.codes.map((c) =>
              c.id === record.id ? { ...c, ...record } : c
            ),
          }))
          break
        case 'DELETE':
          useProjectStore.setState((state) => ({
            codes: state.codes.filter((c) => c.id !== payload.old?.id),
            codings: state.codings.filter((c) => c.codeId !== payload.old?.id),
          }))
          break
      }
    },
    [projectId]
  )

  const handleCodingChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      const record = toCamelCase(payload.new || payload.old)

      switch (payload.eventType) {
        case 'INSERT':
          if (record.documentId === documentId) {
            // Add code reference
            const codes = useProjectStore.getState().codes
            record.code = codes.find((c) => c.id === record.codeId)
            useProjectStore.setState((state) => ({
              codings: [...state.codings, record],
            }))
          }
          break
        case 'UPDATE':
          useProjectStore.setState((state) => ({
            codings: state.codings.map((c) =>
              c.id === record.id ? { ...c, ...record } : c
            ),
          }))
          break
        case 'DELETE':
          useProjectStore.setState((state) => ({
            codings: state.codings.filter((c) => c.id !== payload.old?.id),
          }))
          break
      }
    },
    [documentId]
  )

  useEffect(() => {
    if (!enabled || !projectId) return

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      return
    }

    // Create a unique channel name
    const channelName = `project:${projectId}${documentId ? `:doc:${documentId}` : ''}`

    // Create channel with subscriptions
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        handleDocumentChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'codes',
          filter: `project_id=eq.${projectId}`,
        },
        handleCodeChange
      )

    // Add codings subscription if documentId is provided
    if (documentId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'codings',
          filter: `document_id=eq.${documentId}`,
        },
        handleCodingChange
      )
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error(`Realtime: Error connecting to ${channelName}`)
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [projectId, documentId, enabled, handleDocumentChange, handleCodeChange, handleCodingChange])

  return {
    isConnected: !!channelRef.current,
  }
}

export default useRealtime
