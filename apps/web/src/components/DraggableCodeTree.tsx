import { useState, useCallback, useRef } from 'react'
import type { Code } from '@/stores/projectStore'

interface DraggableCodeTreeProps {
  codes: Code[]
  onUpdateCode: (id: string, updates: { parentId?: string | null }) => Promise<void>
  onDeleteCode: (id: string) => Promise<void>
  onEditCode?: (code: Code) => void
  selectedCodeId?: string
  onSelectCode?: (codeId: string) => void
}

interface DragState {
  draggedId: string | null
  targetId: string | null
  dropPosition: 'before' | 'after' | 'inside' | null
}

export default function DraggableCodeTree({
  codes,
  onUpdateCode,
  onDeleteCode,
  onEditCode,
  selectedCodeId,
  onSelectCode,
}: DraggableCodeTreeProps) {
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    targetId: null,
    dropPosition: null,
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const dragCounterRef = useRef(0)

  // Build tree structure
  const rootCodes = codes.filter((c) => !c.parentId)
  const childrenMap = new Map<string, Code[]>()
  codes.forEach((code) => {
    if (code.parentId) {
      const children = childrenMap.get(code.parentId) || []
      children.push(code)
      childrenMap.set(code.parentId, children)
    }
  })

  const toggleExpand = (codeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(codeId)) {
        next.delete(codeId)
      } else {
        next.add(codeId)
      }
      return next
    })
  }

  const handleDragStart = useCallback((e: React.DragEvent, codeId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', codeId)
    setDragState({ draggedId: codeId, targetId: null, dropPosition: null })

    // Add drag image
    const elem = e.target as HTMLElement
    e.dataTransfer.setDragImage(elem, 20, 20)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({ draggedId: null, targetId: null, dropPosition: null })
    dragCounterRef.current = 0
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, codeId: string) => {
      e.preventDefault()
      e.stopPropagation()

      if (dragState.draggedId === codeId) return

      // Determine drop position based on mouse position
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height

      let dropPosition: 'before' | 'after' | 'inside'
      if (y < height * 0.25) {
        dropPosition = 'before'
      } else if (y > height * 0.75) {
        dropPosition = 'after'
      } else {
        dropPosition = 'inside'
      }

      setDragState((prev) => ({
        ...prev,
        targetId: codeId,
        dropPosition,
      }))
    },
    [dragState.draggedId]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setDragState((prev) => ({ ...prev, targetId: null, dropPosition: null }))
    }
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetCodeId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const draggedId = dragState.draggedId
      if (!draggedId || draggedId === targetCodeId) {
        handleDragEnd()
        return
      }

      const { dropPosition } = dragState

      // Prevent dropping on own children
      const isDescendant = (parentId: string, childId: string): boolean => {
        const children = childrenMap.get(parentId) || []
        for (const child of children) {
          if (child.id === childId || isDescendant(child.id, childId)) {
            return true
          }
        }
        return false
      }

      if (isDescendant(draggedId, targetCodeId)) {
        handleDragEnd()
        return
      }

      const targetCode = codes.find((c) => c.id === targetCodeId)
      if (!targetCode) {
        handleDragEnd()
        return
      }

      try {
        if (dropPosition === 'inside') {
          // Make dragged code a child of target
          await onUpdateCode(draggedId, { parentId: targetCodeId })
          // Expand target to show new child
          setExpandedIds((prev) => new Set([...prev, targetCodeId]))
        } else {
          // Place before or after target - same parent level
          await onUpdateCode(draggedId, { parentId: targetCode.parentId || null })
        }
      } catch (error) {
        console.error('Failed to update code hierarchy:', error)
      }

      handleDragEnd()
    },
    [dragState, codes, childrenMap, onUpdateCode, handleDragEnd]
  )

  const handleDropOnRoot = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()

      const draggedId = dragState.draggedId
      if (!draggedId) {
        handleDragEnd()
        return
      }

      try {
        await onUpdateCode(draggedId, { parentId: null })
      } catch (error) {
        console.error('Failed to move code to root:', error)
      }

      handleDragEnd()
    },
    [dragState.draggedId, onUpdateCode, handleDragEnd]
  )

  const renderCode = (code: Code, level: number = 0) => {
    const children = childrenMap.get(code.id) || []
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(code.id)
    const isDragging = dragState.draggedId === code.id
    const isDropTarget = dragState.targetId === code.id
    const dropPosition = dragState.dropPosition

    return (
      <div
        key={code.id}
        className={`${isDragging ? 'opacity-50' : ''}`}
      >
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, code.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, code.id)}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, code.id)}
          onClick={() => onSelectCode?.(code.id)}
          className={`
            relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing
            transition-colors group
            ${selectedCodeId === code.id ? 'bg-primary-500/10' : 'hover:bg-surface-800'}
            ${isDropTarget && dropPosition === 'inside' ? 'ring-2 ring-primary-500 bg-primary-500/5' : ''}
          `}
          style={{ paddingLeft: `${8 + level * 20}px` }}
        >
          {/* Drop indicators */}
          {isDropTarget && dropPosition === 'before' && (
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-primary-500 rounded" />
          )}
          {isDropTarget && dropPosition === 'after' && (
            <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-primary-500 rounded" />
          )}

          {/* Expand/Collapse button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(code.id)
              }}
              className="p-0.5 hover:bg-surface-700 rounded"
            >
              <svg
                className={`w-4 h-4 text-surface-500 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ) : (
            <span className="w-5" />
          )}

          {/* Color indicator */}
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: code.color }}
          />

          {/* Code name */}
          <span className="flex-1 text-sm text-surface-100 truncate">{code.name}</span>

          {/* Drag handle */}
          <svg
            className="w-4 h-4 text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEditCode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditCode(code)
                }}
                className="p-1 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-200"
                title="Bearbeiten"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Code "${code.name}" wirklich löschen?`)) {
                  onDeleteCode(code.id)
                }
              }}
              className="p-1 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"
              title="Löschen"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-surface-800">
            {children.map((child) => renderCode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Drop zone for root level */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={handleDropOnRoot}
        className={`
          rounded-lg border-2 border-dashed transition-colors p-2
          ${dragState.draggedId ? 'border-surface-600' : 'border-transparent'}
        `}
      >
        {rootCodes.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">
            Keine Codes vorhanden. Erstellen Sie einen neuen Code.
          </p>
        ) : (
          rootCodes.map((code) => renderCode(code))
        )}
      </div>

      {/* Help text */}
      {codes.length > 0 && (
        <p className="text-xs text-surface-500 px-2 mt-2">
          Tipp: Codes per Drag & Drop verschieben. Auf einen Code ziehen für Hierarchie.
        </p>
      )}
    </div>
  )
}
