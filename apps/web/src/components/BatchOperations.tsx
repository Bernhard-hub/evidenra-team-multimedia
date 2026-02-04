import { useState } from 'react'

interface BatchOperationsProps<T> {
  selectedItems: T[]
  onClear: () => void
  itemName: string // e.g., "Code" or "Dokument"
  operations: BatchOperation<T>[]
}

interface BatchOperation<T> {
  id: string
  label: string
  icon: string
  variant?: 'default' | 'danger'
  action: (items: T[]) => Promise<void> | void
  confirmMessage?: string
}

export default function BatchOperations<T extends { id: string }>({
  selectedItems,
  onClear,
  itemName,
  operations,
}: BatchOperationsProps<T>) {
  const [executing, setExecuting] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<BatchOperation<T> | null>(null)

  if (selectedItems.length === 0) return null

  const handleOperation = async (op: BatchOperation<T>) => {
    if (op.confirmMessage) {
      setShowConfirm(op)
      return
    }

    await executeOperation(op)
  }

  const executeOperation = async (op: BatchOperation<T>) => {
    setExecuting(op.id)
    setShowConfirm(null)
    try {
      await op.action(selectedItems)
      onClear()
    } finally {
      setExecuting(null)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-lg px-4 py-3 flex items-center gap-4">
          {/* Selection Count */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center font-medium">
              {selectedItems.length}
            </span>
            <span className="text-surface-300 text-sm">
              {selectedItems.length === 1 ? itemName : `${itemName}s`} ausgewählt
            </span>
          </div>

          <div className="w-px h-8 bg-surface-700" />

          {/* Operations */}
          <div className="flex items-center gap-2">
            {operations.map(op => (
              <button
                key={op.id}
                onClick={() => handleOperation(op)}
                disabled={executing !== null}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                  op.variant === 'danger'
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'bg-surface-800 text-surface-200 hover:bg-surface-700'
                }`}
              >
                {executing === op.id ? (
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={op.icon} />
                  </svg>
                )}
                {op.label}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-surface-700" />

          {/* Clear Selection */}
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400"
            title="Auswahl aufheben"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowConfirm(null)} />
          <div className="relative bg-surface-900 rounded-xl border border-surface-800 p-6 max-w-md">
            <h3 className="text-lg font-medium text-surface-100 mb-2">Bestätigen</h3>
            <p className="text-surface-400 mb-6">{showConfirm.confirmMessage}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 rounded-lg border border-surface-700 text-surface-300 hover:bg-surface-800"
              >
                Abbrechen
              </button>
              <button
                onClick={() => executeOperation(showConfirm)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  showConfirm.variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {showConfirm.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Pre-built batch operations for codes
export function getCodeBatchOperations(
  onMerge: (codes: any[]) => Promise<void>,
  onDelete: (codes: any[]) => Promise<void>,
  onChangeColor: (codes: any[], color: string) => Promise<void>,
  onMove: (codes: any[], parentId: string | null) => Promise<void>
) {
  return [
    {
      id: 'merge',
      label: 'Zusammenführen',
      icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
      action: onMerge,
      confirmMessage: 'Sollen die ausgewählten Codes zusammengeführt werden? Alle Kodierungen werden dem ersten Code zugeordnet.',
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      variant: 'danger' as const,
      action: onDelete,
      confirmMessage: 'Sollen die ausgewählten Codes wirklich gelöscht werden? Alle zugehörigen Kodierungen werden ebenfalls gelöscht.',
    },
  ]
}

// Pre-built batch operations for documents
export function getDocumentBatchOperations(
  onDelete: (docs: any[]) => Promise<void>,
  onExport: (docs: any[]) => Promise<void>,
  onAutoCoding: (docs: any[]) => Promise<void>
) {
  return [
    {
      id: 'autoCoding',
      label: 'KI-Kodierung',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      action: onAutoCoding,
    },
    {
      id: 'export',
      label: 'Exportieren',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      action: onExport,
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      variant: 'danger' as const,
      action: onDelete,
      confirmMessage: 'Sollen die ausgewählten Dokumente wirklich gelöscht werden? Alle zugehörigen Kodierungen werden ebenfalls gelöscht.',
    },
  ]
}

// Pre-built batch operations for codings
export function getCodingBatchOperations(
  onDelete: (codings: any[]) => Promise<void>,
  onChangeCode: (codings: any[], newCodeId: string) => Promise<void>
) {
  return [
    {
      id: 'changeCode',
      label: 'Code ändern',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      action: (codings: any[]) => onChangeCode(codings, ''),
    },
    {
      id: 'delete',
      label: 'Löschen',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      variant: 'danger' as const,
      action: onDelete,
      confirmMessage: 'Sollen die ausgewählten Kodierungen wirklich gelöscht werden?',
    },
  ]
}
