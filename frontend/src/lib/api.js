// Thin client for the optional backend (server/) that proxies real Claude
// API calls. Only used when settings.aiMode === 'claude' and a backendUrl
// is configured — otherwise the app never leaves the browser.

async function post(backendUrl, path, body) {
  const res = await fetch(`${backendUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Backend error (${res.status}): ${text || res.statusText}`)
  }
  return res.json()
}

export async function generateNotesAndQuizRemote(backendUrl, { text, chapterTitle, moduleName }) {
  return post(backendUrl, '/api/generate', { text, chapterTitle, moduleName })
}

export async function chatRemote(backendUrl, { message, history, moduleContext }) {
  return post(backendUrl, '/api/chat', { message, history, moduleContext })
}

export async function describeImageRemote(backendUrl, { base64, mediaType }) {
  return post(backendUrl, '/api/describe-image', { base64, mediaType })
}

export async function pingBackend(backendUrl) {
  const res = await fetch(`${backendUrl.replace(/\/$/, '')}/api/health`)
  if (!res.ok) throw new Error('Backend not reachable')
  return res.json()
}
