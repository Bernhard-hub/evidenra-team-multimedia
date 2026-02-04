import { useEffect, useState, useCallback, useRef } from 'react'

interface SyncQueueItem {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'document' | 'code' | 'coding' | 'memo'
  data: any
  timestamp: number
  retries: number
}

interface OfflineState {
  isOnline: boolean
  isSyncing: boolean
  pendingChanges: number
  lastSyncAt: Date | null
}

const DB_NAME = 'evidenra-offline'
const DB_VERSION = 1
const STORES = ['documents', 'codes', 'codings', 'memos', 'syncQueue', 'metadata']

// Open or create IndexedDB
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' })
          if (storeName === 'syncQueue') {
            store.createIndex('timestamp', 'timestamp')
          }
          if (storeName !== 'metadata' && storeName !== 'syncQueue') {
            store.createIndex('projectId', 'projectId')
          }
        }
      })
    }
  })
}

// Generic IndexedDB operations
async function dbGet<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function dbGetAll<T>(storeName: string, projectId?: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)

    if (projectId && store.indexNames.contains('projectId')) {
      const index = store.index('projectId')
      const request = index.getAll(projectId)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    } else {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    }
  })
}

async function dbPut<T>(storeName: string, data: T): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(data)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function dbDelete(storeName: string, id: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function dbClear(storeName: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Sync queue management
async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
  }
  await dbPut('syncQueue', queueItem)
}

async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return dbGetAll<SyncQueueItem>('syncQueue')
}

async function removeFromSyncQueue(id: string): Promise<void> {
  await dbDelete('syncQueue', id)
}

export function useOfflineSync(projectId?: string) {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncAt: null,
  })

  const syncInProgressRef = useRef(false)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true }))
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Count pending changes
  useEffect(() => {
    const updatePendingCount = async () => {
      const queue = await getSyncQueue()
      setState(s => ({ ...s, pendingChanges: queue.length }))
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-sync when coming online
  useEffect(() => {
    if (state.isOnline && state.pendingChanges > 0) {
      syncChanges()
    }
  }, [state.isOnline])

  // Save data locally (with sync queue for later upload)
  const saveLocal = useCallback(async <T extends { id: string }>(
    entity: 'document' | 'code' | 'coding' | 'memo',
    data: T,
    operation: 'create' | 'update' | 'delete' = 'update'
  ) => {
    const storeName = entity + 's' // documents, codes, etc.

    if (operation === 'delete') {
      await dbDelete(storeName, data.id)
    } else {
      await dbPut(storeName, data)
    }

    // Add to sync queue
    await addToSyncQueue({
      type: operation,
      entity,
      data,
    })

    setState(s => ({ ...s, pendingChanges: s.pendingChanges + 1 }))
  }, [])

  // Load data from local storage
  const loadLocal = useCallback(async <T,>(
    entity: 'document' | 'code' | 'coding' | 'memo',
    id?: string
  ): Promise<T | T[] | undefined> => {
    const storeName = entity + 's'

    if (id) {
      return dbGet<T>(storeName, id)
    } else {
      return dbGetAll<T>(storeName, projectId)
    }
  }, [projectId])

  // Sync changes to server
  const syncChanges = useCallback(async () => {
    if (syncInProgressRef.current || !state.isOnline) return

    syncInProgressRef.current = true
    setState(s => ({ ...s, isSyncing: true }))

    try {
      const queue = await getSyncQueue()

      for (const item of queue) {
        try {
          // In a real implementation, this would make API calls
          // For now, we'll simulate the sync
          await new Promise(resolve => setTimeout(resolve, 100))

          // Mark as synced
          await removeFromSyncQueue(item.id)
        } catch (err) {
          // Retry logic
          if (item.retries < 3) {
            await dbPut('syncQueue', { ...item, retries: item.retries + 1 })
          } else {
            console.error('Failed to sync item after 3 retries:', item)
            await removeFromSyncQueue(item.id)
          }
        }
      }

      setState(s => ({
        ...s,
        isSyncing: false,
        pendingChanges: 0,
        lastSyncAt: new Date(),
      }))
    } catch (err) {
      console.error('Sync failed:', err)
      setState(s => ({ ...s, isSyncing: false }))
    } finally {
      syncInProgressRef.current = false
    }
  }, [state.isOnline])

  // Clear all local data
  const clearLocalData = useCallback(async () => {
    for (const store of STORES) {
      await dbClear(store)
    }
    setState(s => ({ ...s, pendingChanges: 0 }))
  }, [])

  // Cache server data locally
  const cacheData = useCallback(async <T extends { id: string }>(
    entity: 'document' | 'code' | 'coding' | 'memo',
    data: T[]
  ) => {
    const storeName = entity + 's'
    for (const item of data) {
      await dbPut(storeName, item)
    }
  }, [])

  return {
    ...state,
    saveLocal,
    loadLocal,
    syncChanges,
    clearLocalData,
    cacheData,
  }
}

// Offline indicator component
export function OfflineIndicator({ pendingChanges, isSyncing, isOnline }: OfflineState) {
  if (isOnline && pendingChanges === 0) return null

  return (
    <div className={`fixed bottom-4 left-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
      isOnline ? 'bg-surface-800' : 'bg-yellow-500/10 border border-yellow-500/20'
    }`}>
      {!isOnline ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm text-yellow-400">Offline</span>
          {pendingChanges > 0 && (
            <span className="text-xs text-yellow-400/70">
              ({pendingChanges} Änderungen warten)
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <span className="text-sm text-surface-300">Synchronisiere...</span>
        </>
      ) : pendingChanges > 0 ? (
        <>
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-surface-300">
            {pendingChanges} Änderungen werden synchronisiert
          </span>
        </>
      ) : null}
    </div>
  )
}
