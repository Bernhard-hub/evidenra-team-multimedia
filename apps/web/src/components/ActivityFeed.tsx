import { useState } from 'react'

interface Activity {
  id: string
  userId: string
  userName: string
  userColor: string
  action: 'coding_added' | 'coding_removed' | 'code_created' | 'document_added' | 'comment_added' | 'member_joined'
  target?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
}

const actionIcons: Record<Activity['action'], { icon: React.ReactNode; color: string }> = {
  coding_added: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: 'text-green-400 bg-green-400/10',
  },
  coding_removed: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    color: 'text-red-400 bg-red-400/10',
  },
  code_created: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    color: 'text-primary-400 bg-primary-400/10',
  },
  document_added: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-400 bg-blue-400/10',
  },
  comment_added: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'text-purple-400 bg-purple-400/10',
  },
  member_joined: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    color: 'text-cyan-400 bg-cyan-400/10',
  },
}

const actionLabels: Record<Activity['action'], (target?: string) => string> = {
  coding_added: (target) => `hat "${target}" kodiert`,
  coding_removed: (target) => `hat Kodierung entfernt`,
  code_created: (target) => `hat Code "${target}" erstellt`,
  document_added: (target) => `hat "${target}" hinzugefügt`,
  comment_added: (target) => `hat kommentiert`,
  member_joined: () => `ist dem Projekt beigetreten`,
}

export default function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleActivities = isExpanded ? activities : activities.slice(0, maxItems)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Gerade eben'
    if (minutes < 60) return `vor ${minutes}m`
    if (hours < 24) return `vor ${hours}h`
    if (days === 1) return 'Gestern'
    if (days < 7) return `vor ${days}d`
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="bg-surface-900 rounded-xl border border-surface-800">
      <div className="p-4 border-b border-surface-800 flex items-center justify-between">
        <h3 className="font-medium text-surface-100">Aktivitäten</h3>
        <span className="text-xs text-surface-500">{activities.length} Einträge</span>
      </div>

      <div className="divide-y divide-surface-800">
        {visibleActivities.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Noch keine Aktivitäten</p>
          </div>
        ) : (
          visibleActivities.map((activity) => {
            const { icon, color } = actionIcons[activity.action]
            return (
              <div key={activity.id} className="p-3 hover:bg-surface-800/50 transition-colors">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200">
                      <span className="font-medium" style={{ color: activity.userColor }}>
                        {activity.userName}
                      </span>{' '}
                      {actionLabels[activity.action](activity.target)}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {activities.length > maxItems && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 text-sm text-primary-400 hover:bg-surface-800 transition-colors border-t border-surface-800"
        >
          {isExpanded ? 'Weniger anzeigen' : `${activities.length - maxItems} weitere anzeigen`}
        </button>
      )}
    </div>
  )
}
