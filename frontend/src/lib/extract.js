// Client-side text extraction so uploaded documents can feed the Notes &
// Quiz generator and the assistant. PDF and DOCX parsers are dynamically
// imported so they don't bloat the initial bundle for people who never
// upload a file.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

const MAX_PDF_PAGES = 300

export function detectKind(file) {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  )
    return 'docx'
  if (file.type === 'text/plain' || name.endsWith('.txt') || name.endsWith('.md')) return 'text'
  if (file.type.startsWith('image/')) return 'image'
  return 'other'
}

export async function extractTextFromFile(file) {
  const kind = detectKind(file)
  try {
    if (kind === 'text') return { text: (await file.text()).trim(), kind, ok: true }
    if (kind === 'pdf') return { text: await extractPdf(file), kind, ok: true }
    if (kind === 'docx') return { text: await extractDocx(file), kind, ok: true }
    if (kind === 'image') return { text: '', kind, ok: true, note: 'Images need Real AI mode to read text — see My Burrow.' }
    return { text: '', kind, ok: true, note: 'This file type can be stored but not auto-read for notes.' }
  } catch (err) {
    return { text: '', kind, ok: false, note: `Could not read this file: ${err.message}` }
  }
}

async function extractPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES)
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n\n'
  }
  return text.trim()
}

async function extractDocx(file) {
  const mod = await import('mammoth/mammoth.browser.js')
  const mammoth = mod.default || mod
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
