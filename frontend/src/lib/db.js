// IndexedDB-backed storage for uploaded file blobs and extracted text.
// localStorage (used for the rest of the app's state) is string-only and
// capped around 5-10MB — nowhere near enough for real documents — so
// uploads live here instead, keyed by the same id used in the lightweight
// `documents` metadata list kept in the main app state.
const DB_NAME = 'burrowbrief_files'
const DB_VERSION = 1
const STORE = 'files'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(storeMode) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE, storeMode)
        const store = transaction.objectStore(STORE)
        resolve({ transaction, store })
        transaction.onerror = () => reject(transaction.error)
      }),
  )
}

// record: { id, blob, extractedText, filename, mimeType }
export async function putFileRecord(record) {
  const { store, transaction } = await tx('readwrite')
  return new Promise((resolve, reject) => {
    store.put(record)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function getFileRecord(id) {
  const { store } = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFileRecord(id) {
  const { store, transaction } = await tx('readwrite')
  return new Promise((resolve, reject) => {
    store.delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function clearAllFileRecords() {
  const { store, transaction } = await tx('readwrite')
  return new Promise((resolve, reject) => {
    store.clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function estimateStorage() {
  if (navigator.storage?.estimate) {
    try {
      return await navigator.storage.estimate() // { usage, quota }
    } catch {
      return null
    }
  }
  return null
}
