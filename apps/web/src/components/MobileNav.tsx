import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface MobileNavProps {
  projectId?: string
}

export default function MobileNav({ projectId }: MobileNavProps) {
  const location = useLocation()

  // Main navigation items
  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    ...(projectId ? [
      {
        path: `/project/${projectId}`,
        label: 'Projekt',
        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
      },
    ] : []),
    {
      path: '/settings',
      label: 'Einstellungen',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-900 border-t border-surface-800 md:hidden safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-4 min-w-[64px] transition-colors ${
                isActive ? 'text-primary-400' : 'text-surface-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.5} d={item.icon} />
              </svg>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Mobile-optimized sidebar menu
export function MobileSidebar({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-900 border-r border-surface-800 md:hidden transform transition-transform">
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <span className="font-semibold text-surface-100">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {children}
        </div>
      </div>
    </>
  )
}

// Touch-friendly button component
export function TouchButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  fullWidth = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  fullWidth?: boolean
}) {
  const baseStyles = 'font-medium rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2'

  const variants = {
    default: 'bg-surface-800 text-surface-100 hover:bg-surface-700 active:bg-surface-600',
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 active:bg-red-500/30',
    ghost: 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

// Swipeable list item for mobile
export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
}) {
  const [startX, setStartX] = useState<number | null>(null)
  const [offsetX, setOffsetX] = useState(0)
  const threshold = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setOffsetX(Math.max(-100, Math.min(100, diff)))
  }

  const handleTouchEnd = () => {
    if (offsetX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    setOffsetX(0)
    setStartX(null)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Actions */}
      {leftAction && (
        <div className="absolute inset-y-0 left-0 w-24 bg-green-500 flex items-center justify-center text-white">
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex items-center justify-center text-white">
          {rightAction}
        </div>
      )}

      {/* Main Content */}
      <div
        className="relative bg-surface-900 transition-transform"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// Pull to refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useState<number | null>(null)[0]
  const threshold = 80

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
    setPullDistance(0)
  }

  return (
    <div className="relative">
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-surface-900/90 z-10 transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance }}
        >
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          ) : (
            <svg
              className={`w-6 h-6 text-surface-400 transition-transform ${
                pullDistance >= threshold ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      )}

      {children}
    </div>
  )
}
