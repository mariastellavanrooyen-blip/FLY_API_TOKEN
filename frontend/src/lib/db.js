// IndexedDB-backed storage for recipe photos. localStorage (used for the
// rest of the app's state) is string-only and capped around 5-10MB, so
// images live here instead, keyed by the recipe's id.
const DB_NAME = 'wifesbrain_files'
const DB_VERSION = 1
const STORE = 'images'

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

export async function putImage(id, blob) {
  const { store, transaction } = await tx('readwrite')
  return new Promise((resolve, reject) => {
    store.put({ id, blob })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function getImage(id) {
  const { store } = await tx('readonly')
  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(req.result?.blob || null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteImage(id) {
  const { store, transaction } = await tx('readwrite')
  return new Promise((resolve, reject) => {
    store.delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function clearAllImages() {
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

// Downscale + compress an uploaded photo before it ever hits storage, so a
// dozen phone-camera recipe photos don't blow through the device quota.
export function compressImage(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('compress failed'))), 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}
