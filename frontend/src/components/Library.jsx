import React, { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { uid, formatDate } from '../lib/utils.js'
import { extractTextFromFile, formatBytes } from '../lib/extract.js'
import { putFileRecord, getFileRecord, deleteFileRecord } from '../lib/db.js'
import { describeImageRemote } from '../lib/api.js'
import EmptyState from './ui/EmptyState.jsx'
import Modal from './ui/Modal.jsx'

const KIND_ICON = { pdf: '📕', docx: '📘', text: '📄', image: '🖼️', other: '📦' }
const STATUS_LABEL = { new: 'New', 'in-progress': 'In progress', reviewed: 'Reviewed' }
const STATUS_ORDER = ['new', 'in-progress', 'reviewed']

function statusBadgeClass(status) {
  if (status === 'reviewed') return 'badge status-done'
  if (status === 'in-progress') return 'badge priority-medium'
  return 'badge'
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export default function Library({ onSendToNotes }) {
  const { state, dispatch } = useStore()
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [filterModule, setFilterModule] = useState('all')
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewText, setPreviewText] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const fileInputRef = useRef(null)

  const isRemote = state.settings.aiMode === 'claude' && state.settings.backendUrl

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const id = uid()
      const { text, kind, ok, note } = await extractTextFromFile(file)
      await putFileRecord({ id, blob: file, extractedText: text, filename: file.name, mimeType: file.type })
      dispatch({
        type: 'ADD_DOCUMENT',
        payload: {
          id,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          moduleId: state.modules[0]?.id || '',
          uploadedAt: new Date().toISOString(),
          lastOpenedAt: null,
          status: 'new',
          kind,
          extractOk: ok,
          extractNote: note || '',
          textLength: text.length,
          linkedNotesIds: [],
        },
      })
    }
    setUploading(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  async function openPreview(doc) {
    setPreviewDoc(doc)
    setPreviewLoading(true)
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: doc.id, lastOpenedAt: new Date().toISOString() } })
    const record = await getFileRecord(doc.id)
    setPreviewText(record?.extractedText || '')
    setPreviewLoading(false)
  }

  function updatePreviewField(patch) {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: previewDoc.id, ...patch } })
    setPreviewDoc((d) => ({ ...d, ...patch }))
  }

  async function runOcr(doc) {
    if (!isRemote) return
    setOcrBusy(true)
    try {
      const record = await getFileRecord(doc.id)
      const mediaType = doc.mimeType || record?.mimeType
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
        throw new Error('Unsupported image format — try JPEG, PNG, GIF or WebP.')
      }
      const base64 = await blobToBase64(record.blob)
      const res = await describeImageRemote(state.settings.backendUrl, { base64, mediaType })
      await putFileRecord({ ...record, extractedText: res.text })
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: doc.id, extractOk: true, textLength: res.text.length, extractNote: '' } })
      setPreviewText(res.text)
    } catch (err) {
      alert(`Couldn't read this image: ${err.message}`)
    } finally {
      setOcrBusy(false)
    }
  }

  async function removeDoc(doc) {
    if (!confirm(`Delete "${doc.filename}" from your burrow? This can't be undone.`)) return
    await deleteFileRecord(doc.id)
    dispatch({ type: 'DELETE_DOCUMENT', payload: { id: doc.id } })
    if (previewDoc?.id === doc.id) setPreviewDoc(null)
  }

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name || 'General'
  }

  const docs = filterModule === 'all' ? state.documents : state.documents.filter((d) => d.moduleId === filterModule)
  const needsTextBadge = (doc) => !doc.textLength && doc.kind !== 'other'

  return (
    <div>
      <div
        className={`card upload-drop${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '2.4rem' }}>📦🐰</div>
          <h3 style={{ margin: '6px 0' }}>My Burrow</h3>
          <p className="muted" style={{ maxWidth: 480, margin: '0 auto 14px' }}>
            Drag in chapter PDFs, Word docs, plain text, or photos of your notes. Everything is stashed on this
            device — remembered across visits, ready to turn into notes and quizzes, or just to find again later.
          </p>
          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Stashing… 🐇' : '+ Upload files'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {state.documents.length > 0 && (
        <div className="card pill-select">
          <button className={filterModule === 'all' ? 'active' : ''} onClick={() => setFilterModule('all')}>
            All ({state.documents.length})
          </button>
          {state.modules.map((m) => (
            <button key={m.id} className={filterModule === m.id ? 'active' : ''} onClick={() => setFilterModule(m.id)}>
              {m.name} ({state.documents.filter((d) => d.moduleId === m.id).length})
            </button>
          ))}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="📦"
            title={state.documents.length === 0 ? 'Your burrow is empty' : 'Nothing here for this module yet'}
            subtitle="Upload a chapter PDF, DOCX, text file, or a photo of your notes to get started."
          />
        </div>
      ) : (
        <div className="grid cols-3">
          {docs.map((doc) => (
            <div className="card doc-card" key={doc.id} onClick={() => openPreview(doc)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span style={{ fontSize: '1.8rem' }}>{KIND_ICON[doc.kind] || '📦'}</span>
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDoc(doc)
                  }}
                >
                  🗑️
                </button>
              </div>
              <h4 style={{ margin: '6px 0 2px', wordBreak: 'break-word' }}>{doc.filename}</h4>
              <div className="muted">
                {moduleName(doc.moduleId)} · {formatBytes(doc.size)}
              </div>
              <div className="muted">Added {formatDate(doc.uploadedAt?.slice(0, 10))}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={statusBadgeClass(doc.status)}>{STATUS_LABEL[doc.status] || 'New'}</span>
                {doc.linkedNotesIds?.length > 0 && (
                  <span className="badge">
                    📝 {doc.linkedNotesIds.length} note set{doc.linkedNotesIds.length > 1 ? 's' : ''}
                  </span>
                )}
                {needsTextBadge(doc) && <span className="badge priority-low">No text yet</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewDoc && (
        <Modal title={`${KIND_ICON[previewDoc.kind] || '📦'} ${previewDoc.filename}`} onClose={() => setPreviewDoc(null)}>
          <div className="field-row">
            <div className="field">
              <label>Module</label>
              <select value={previewDoc.moduleId} onChange={(e) => updatePreviewField({ moduleId: e.target.value })}>
                {state.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Progress</label>
              <div className="pill-select">
                {STATUS_ORDER.map((s) => (
                  <button key={s} className={previewDoc.status === s ? 'active' : ''} onClick={() => updatePreviewField({ status: s })}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Extracted text {previewText ? `(${previewText.length.toLocaleString()} characters)` : ''}</label>
            {previewLoading ? (
              <p className="muted">Loading…</p>
            ) : previewText ? (
              <textarea rows={8} readOnly value={previewText} />
            ) : (
              <p className="muted">{previewDoc.extractNote || 'No text extracted from this file yet.'}</p>
            )}
          </div>

          {previewDoc.kind === 'image' &&
            !previewText &&
            (isRemote ? (
              <button className="btn secondary small" onClick={() => runOcr(previewDoc)} disabled={ocrBusy}>
                {ocrBusy ? 'Reading image… 🔎' : '✨ Read text with Claude'}
              </button>
            ) : (
              <p className="muted">Turn on Real AI mode in Settings to read text out of photos.</p>
            ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="btn" disabled={!previewText} onClick={() => onSendToNotes(previewDoc)}>
              📝 Generate notes &amp; quiz from this
            </button>
            {previewDoc.linkedNotesIds?.length > 0 && (
              <span className="muted" style={{ alignSelf: 'center' }}>
                Already used for {previewDoc.linkedNotesIds.length} note set{previewDoc.linkedNotesIds.length > 1 ? 's' : ''}.
              </span>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
