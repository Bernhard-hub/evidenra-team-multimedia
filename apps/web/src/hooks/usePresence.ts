import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PresenceUser {
  id: string
  email: string
  fullName?: string
  color: string
  lastSeen: string
  currentDocument?: string
  cursor?: { x: number; y: number }
}

interface PresenceConfig {
  projectId?: string
  documentId?: string
  enabled?: boolean
}

// Generate a consistent color for a user based on their ID
function generateUserColor(userId: string): string {
  const colors = [
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#22c55e', // green
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ]
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

/**
 * Hook for managing user presence in a project or document
 * Shows who is online and where they're working
 */
export function usePresence({ projectId, documentId, enabled = true }: PresenceConfig = {}) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { user } = useAuthStore()

  const trackPresence = useCallback(async () => {
    if (!channelRef.current || !user) return

    const presenceData = {
      id: user.id,
      email: user.email || 'unknown',
      fullName: user.user_metadata?.full_name,
      color: generateUserColor(user.id),
      lastSeen: new Date().toISOString(),
      currentDocument: documentId,
    }

    await channelRef.current.track(presenceData)
  }, [user, documentId])

  const updateCursor = useCallback(async (x: number, y: number) => {
    if (!channelRef.current || !user) return

    await channelRef.current.track({
      id: user.id,
      email: user.email || 'unknown',
      fullName: user.user_metadata?.full_name,
      color: generateUserColor(user.id),
      lastSeen: new Date().toISOString(),
      currentDocument: documentId,
      cursor: { x, y },
    })
  }, [user, documentId])

  useEffect(() => {
    if (!enabled || !projectId || !user) return

    // Check if Supabase is in demo mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      // Demo mode: show mock online users
      setOnlineUsers([
        {
          id: 'demo-1',
          email: 'anna@example.com',
          fullName: 'Anna Müller',
          color: '#f59e0b',
          lastSeen: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          email: 'max@example.com',
          fullName: 'Max Koch',
          color: '#3b82f6',
          lastSeen: new Date().toISOString(),
        },
      ])
      setIsConnected(true)
      return
    }

    const channelName = `presence:${projectId}`

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[]
          if (presences.length > 0) {
            const latest = presences[presences.length - 1]
            // Don't include current user in the list
            if (latest.id !== user.id) {
              users.push({
                id: latest.id,
                email: latest.email,
                fullName: latest.fullName,
                color: latest.color,
                lastSeen: latest.lastSeen,
                currentDocument: latest.currentDocument,
                cursor: latest.cursor,
              })
            }
          }
        })

        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          // Track our presence
          await trackPresence()
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          console.error('Presence: Error connecting')
        }
      })

    channelRef.current = channel

    // Update presence periodically
    const intervalId = setInterval(trackPresence, 30000)

    return () => {
      clearInterval(intervalId)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsConnected(false)
      }
    }
  }, [projectId, user, enabled, trackPresence])

  // Re-track when document changes
  useEffect(() => {
    if (isConnected) {
      trackPresence()
    }
  }, [documentId, isConnected, trackPresence])

  return {
    onlineUsers,
    isConnected,
    updateCursor,
    userCount: onlineUsers.length + 1, // Include current user
  }
}

export default usePresence
