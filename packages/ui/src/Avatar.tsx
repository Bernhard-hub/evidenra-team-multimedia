import React from 'react'

export interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  isOnline?: boolean
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
  isOnline,
}) => {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`relative inline-flex ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${sizeStyles[size]} rounded-full object-cover bg-surface-800`}
        />
      ) : (
        <div
          className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center`}
        >
          <span className="font-medium text-white">{initials || '?'}</span>
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${indicatorSizes[size]} rounded-full border-2 border-surface-900 ${
            isOnline ? 'bg-green-500' : 'bg-surface-600'
          }`}
        />
      )}
    </div>
  )
}

interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  size?: AvatarProps['size']
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  size = 'md',
}) => {
  const avatars = React.Children.toArray(children)
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  const overlapStyles = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
  }

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }

  return (
    <div className="flex items-center">
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`${index > 0 ? overlapStyles[size] : ''} ring-2 ring-surface-900 rounded-full`}
        >
          {avatar}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${overlapStyles[size]} ${sizeStyles[size]} rounded-full bg-surface-700 flex items-center justify-center ring-2 ring-surface-900`}
        >
          <span className="font-medium text-surface-300">+{remainingCount}</span>
        </div>
      )}
    </div>
  )
}
