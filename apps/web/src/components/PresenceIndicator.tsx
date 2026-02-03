import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  avatarUrl?: string
  color: string
}

interface PresenceIndicatorProps {
  users: User[]
  maxVisible?: number
}

export default function PresenceIndicator({ users, maxVisible = 4 }: PresenceIndicatorProps) {
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
            className="relative"
            style={{ zIndex: visibleUsers.length - idx }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-surface-900 flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full" />
              ) : (
                user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-900 presence-online" />
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
          <div className="absolute top-full right-0 mt-2 w-64 bg-surface-800 rounded-xl border border-surface-700 shadow-xl z-50 p-2">
            <p className="px-3 py-2 text-xs font-medium text-surface-400 uppercase">
              {users.length} Nutzer online
            </p>
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-700"
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-800" />
                  </div>
                  <span className="text-sm text-surface-200">{user.name}</span>
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
        {user.name}
      </span>
    </div>
  )
}

// Selection highlight for showing what other users have selected
export function UserSelection({
  user,
  text,
  rect,
}: {
  user: User
  text: string
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
        {user.name}
      </span>
    </div>
  )
}
