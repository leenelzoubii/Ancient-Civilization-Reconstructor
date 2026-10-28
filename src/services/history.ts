/**
 * Device-local repair history.
 *
 * Attempts are stored in IndexedDB so they survive a reload without sending
 * anything to a server. Images are re-encoded as JPEG before they are saved:
 * a 1024px photo stays readable while twelve attempts fit comfortably inside
 * the normal browser quota.
 */

import type { ArtifactAnalysis } from './analysis'
import type { Prediction } from './predictService'
import type { RestoreResult } from './restoreService'

const DB_NAME = 'acr-repair-history'
const STORE = 'attempts'
// v2: an earlier diagnostic open could create an empty v1 database before the
// app's upgrade handler ran. The version bump lets the handler repair it.
const DB_VERSION = 2

/** Small enough to stay well inside the usual 50 MB IndexedDB quota. */
export const MAX_HISTORY = 12

export type HistoryEntry = {
  id: string
  createdAt: number
  mode: 'manual' | 'auto'
  originalUrl: string
  restoredUrl: string
  thumbnailUrl: string
  /** The result metadata without its Blob (Blobs are not kept in history). */
  result: RestoreResult
  prediction: Prediction | null
  analysis: ArtifactAnalysis | null
  elapsedMs: number
  /** Share of the whole photo that was sent for repair (0-1). */
  maskFraction: number
}

export type NewHistoryEntry = {
  originalUrl: string
  restoredUrl: string
  mode: 'manual' | 'auto'
  result: RestoreResult
  prediction: Prediction | null
  analysis: ArtifactAnalysis | null
  elapsedMs: number
  maskFraction: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local history.'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open history.'))
  })
  // A failed open should not poison every later attempt.
  dbPromise.catch(() => {
    dbPromise = null
  })
  return dbPromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('History request failed.'))
  })
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('History transaction failed.'))
    tx.onabort = () => reject(tx.error ?? new Error('History transaction was aborted.'))
  })
}

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* fall through to the timestamp id */
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = src
  })
}

/**
 * Re-encodes an image as JPEG at a bounded size. If anything goes wrong the
 * original data URL is returned so a history entry is never lost.
 */
async function compress(src: string, maxSide: number, quality: number): Promise<string> {
  try {
    const img = await loadImage(src)
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return src
    // JPEG has no alpha channel: paint the paper colour first so transparent
    // PNG uploads do not turn black in the thumbnail.
    ctx.fillStyle = '#f7f2e8'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return src
  }
}

async function buildEntry(input: NewHistoryEntry): Promise<HistoryEntry> {
  const [originalUrl, restoredUrl, thumbnailUrl] = await Promise.all([
    compress(input.originalUrl, 1024, 0.86),
    compress(input.restoredUrl, 1024, 0.9),
    compress(input.restoredUrl, 360, 0.72),
  ])
  return {
    id: newId(),
    createdAt: Date.now(),
    mode: input.mode,
    originalUrl,
    restoredUrl,
    thumbnailUrl,
    // Store the metadata with a null Blob: structured-cloning a Blob would
    // duplicate the full image inside IndexedDB.
    result: { ...input.result, blob: null },
    prediction: input.prediction,
    analysis: input.analysis,
    elapsedMs: input.elapsedMs,
    maskFraction: input.maskFraction,
  }
}

/** Newest first. Returns an empty list when storage is unavailable. */
export async function listHistory(): Promise<HistoryEntry[]> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const rows = await requestResult(tx.objectStore(STORE).getAll() as IDBRequest<HistoryEntry[]>)
    await transactionDone(tx)
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

/**
 * Saves a finished repair and trims the oldest entries. Returns the new list
 * so the page can update without a second IndexedDB read.
 */
export async function saveHistory(input: NewHistoryEntry): Promise<HistoryEntry[]> {
  let entry: HistoryEntry
  try {
    entry = await buildEntry(input)
  } catch {
    return []
  }
  try {
    const existing = await listHistory()
    const keep = existing.slice(0, MAX_HISTORY - 1)
    const keepIds = new Set(keep.map((row) => row.id))
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put(entry)
    for (const old of existing) {
      if (!keepIds.has(old.id)) store.delete(old.id)
    }
    await transactionDone(tx)
    return [entry, ...keep]
  } catch {
    return []
  }
}

export async function deleteHistoryEntry(id: string): Promise<boolean> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    await transactionDone(tx)
    return true
  } catch {
    return false
  }
}

export async function clearHistory(): Promise<boolean> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    await transactionDone(tx)
    return true
  } catch {
    return false
  }
}
