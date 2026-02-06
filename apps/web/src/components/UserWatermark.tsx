/**
 * UserWatermark - Unsichtbares Wasserzeichen mit User-ID
 *
 * Zeigt ein unsichtbares diagonales Muster mit User-Email und ID.
 * Bei Screenshots/Leaks kann die Quelle forensisch ermittelt werden.
 *
 * Opacity: 0.015 (praktisch unsichtbar, aber bei Bildanalyse erkennbar)
 */

import { useAuthStore } from '@/stores/authStore'
import { useMemo } from 'react'

export function UserWatermark() {
  const { user } = useAuthStore()

  const watermarkData = useMemo(() => {
    if (!user) return null

    const shortId = user.id?.slice(0, 8) || 'unknown'
    const email = user.email || 'unknown'
    const timestamp = new Date().toISOString().split('T')[0]

    return {
      text: `${email} | ${shortId} | ${timestamp}`,
      hash: btoa(`${user.id}-${Date.now()}`).slice(0, 12),
    }
  }, [user])

  if (!watermarkData) return null

  // Erzeuge ein Muster von Wasserzeichen über den gesamten Bildschirm
  const positions = useMemo(() => {
    const items: { top: number; left: number; rotate: number }[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        items.push({
          top: row * 180 + (col % 2) * 90,
          left: col * 300 + (row % 2) * 150,
          rotate: -35 + (row + col) % 10 - 5,
        })
      }
    }
    return items
  }, [])

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
      data-testid="user-watermark"
    >
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute whitespace-nowrap font-mono text-xs"
          style={{
            top: `${pos.top}px`,
            left: `${pos.left}px`,
            transform: `rotate(${pos.rotate}deg)`,
            color: 'rgba(0, 0, 0, 0.015)',
            fontSize: '10px',
            letterSpacing: '0.5px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {watermarkData.text}
        </span>
      ))}

      {/* Zusätzliches unsichtbares Meta-Tag für forensische Analyse */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
        data-user-hash={watermarkData.hash}
        data-watermark-version="1.0"
      />
    </div>
  )
}

export default UserWatermark
