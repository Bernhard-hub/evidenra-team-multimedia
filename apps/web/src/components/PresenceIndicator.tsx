import { useState } from 'react'
import type { PresenceUser } from '@/hooks/usePresence'

// Re-export the PresenceUser type for backward compatibility
export type { PresenceUser }

// Legacy User interface for backward compatibility
interface LegacyUser {
  id: string
  name: string
  avatarUrl?: string
  color: string
}

type User = PresenceUser | LegacyUser

function isPresenceUser(user: User): user is PresenceUser {
  return 'email' in user
}

function getUserName(user: User): string {
  if (isPresenceUser(user)) {
    return user.fullName || user.email
  }
  return user.name
}

function getInitials(name: string): string {
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

interface PresenceIndicatorProps {
  users: User[]
  maxVisible?: number
  showTooltip?: boolean
}

export default function PresenceIndicator({
  users,
  maxVisible = 4,
  showTooltip = true,
}: PresenceIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleUsers = users.slice(0, maxVisible)
  const hiddenCount = users.length - maxVisible

  if (users.length === 0) return null

  return (
    <div className="relative">
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((user, idx) => (
          <div
            key={user.id}
            className="relative group"
            style={{ zIndex: visibleUsers.length - idx }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-surface-900 flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-transform hover:scale-110 hover:z-50"
              style={{ backgroundColor: user.color }}
              title={getUserName(user)}
            >
              {!isPresenceUser(user) && user.avatarUrl ? (
                <img src={user.avatarUrl} alt={getUserName(user)} className="w-full h-full rounded-full" />
              ) : (
                getInitials(getUserName(user))
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-900 presence-online" />

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-800 rounded text-xs text-surface-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="font-medium">{getUserName(user)}</div>
                {isPresenceUser(user) && user.currentDocument && (
                  <div className="text-surface-400">Arbeitet an Dokument</div>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-800" />
              </div>
            )}
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full border-2 border-surface-900 bg-surface-700 flex items-center justify-center text-xs font-medium text-surface-300 hover:bg-surface-600 transition-colors"
          >
            +{hiddenCount}
          </button>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsExpanded(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 bg-surface-800 rounded-xl border border-surface-700 shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-surface-700">
              <h4 className="text-sm font-medium text-surface-100">
                {users.length} Nutzer online
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-surface-700/50"
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {getInitials(getUserName(user))}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-800" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-100 truncate">
                      {getUserName(user)}
                    </p>
                    {isPresenceUser(user) && user.currentDocument && (
                      <p className="text-xs text-surface-500 truncate">
                        Arbeitet an Dokument
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Cursor component for showing other users' cursors in document
export function UserCursor({ user, position }: { user: User; position: { x: number; y: number } }) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{ left: position.x, top: position.y }}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={user.color}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
      >
        <path d="M5.65376 12.4563L8.76078 20.2435C9.01431 20.8919 9.9019 20.9124 10.1846 20.2772L12.2645 15.5662C12.3477 15.3782 12.4943 15.2243 12.6781 15.1323L17.1656 12.8333C17.7658 12.5262 17.7272 11.6559 17.0997 11.4024L5.9223 6.87689C5.29485 6.62335 4.68286 7.27789 4.98437 7.88279L7.02074 11.9645C7.11303 12.1492 7.13148 12.3613 7.07235 12.5594L5.65376 12.4563Z" />
      </svg>
      <span
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {getUserName(user)}
      </span>
    </div>
  )
}

// Selection highlight for showing what other users have selected
export function UserSelection({
  user,
  rect,
}: {
  user: User
  rect: { x: number; y: number; width: number; height: number }
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: `${user.color}30`,
        borderBottom: `2px solid ${user.color}`,
      }}
    >
      <span
        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {getUserName(user)}
      </span>
    </div>
  )
}

// Connection status indicator
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-surface-600'
        }`}
      />
      <span className="text-xs text-surface-500">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  )
}

// Compact version for headers
export function PresenceAvatars({ users }: { users: User[] }) {
  if (users.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-surface-500">Online:</span>
      <div className="flex -space-x-1.5">
        {users.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white border border-surface-900"
            style={{ backgroundColor: user.color }}
            title={getUserName(user)}
          >
            {getInitials(getUserName(user))}
          </div>
        ))}
        {users.length > 3 && (
          <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-[10px] font-medium text-surface-400 border border-surface-900">
            +{users.length - 3}
          </div>
        )}
      </div>
    </div>
  )
}
