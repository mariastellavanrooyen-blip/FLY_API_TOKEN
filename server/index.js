import express from 'express'
import cors from 'cors'
import { generateNotesAndQuiz, chatReply, describeImage } from './lib/anthropic.js'

const app = express()
const PORT = process.env.PORT || 8080
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || '*'
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

app.use(cors({ origin: ALLOWED_ORIGIN }))
// Higher limit than the other routes to accommodate base64-encoded photos of notes/pages.
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: process.env.ANTHROPIC_MODEL || 'claude-opus-5' })
})

app.post('/api/generate', async (req, res) => {
  const { text, chapterTitle, moduleName } = req.body || {}
  if (!text || typeof text !== 'string' || text.trim().split(/\s+/).length < 20) {
    return res.status(400).json({ error: 'Provide at least a few sentences of chapter text.' })
  }
  try {
    const result = await generateNotesAndQuiz({ text, chapterTitle, moduleName })
    res.json(result)
  } catch (err) {
    console.error('generate error:', err)
    res.status(502).json({ error: 'The AI model could not generate notes right now. Please try again.' })
  }
})

app.post('/api/chat', async (req, res) => {
  const { message, history, moduleContext } = req.body || {}
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' })
  }
  try {
    const reply = await chatReply({ message, history, moduleContext })
    res.json({ reply })
  } catch (err) {
    console.error('chat error:', err)
    res.status(502).json({ error: 'The assistant is unavailable right now. Please try again.' })
  }
})

app.post('/api/describe-image', async (req, res) => {
  const { base64, mediaType } = req.body || {}
  if (!base64 || typeof base64 !== 'string') {
    return res.status(400).json({ error: 'An image (base64) is required.' })
  }
  if (!ALLOWED_IMAGE_TYPES.has(mediaType)) {
    return res.status(400).json({ error: 'mediaType must be image/jpeg, image/png, image/gif or image/webp.' })
  }
  try {
    const text = await describeImage({ base64, mediaType })
    res.json({ text })
  } catch (err) {
    console.error('describe-image error:', err)
    res.status(502).json({ error: 'Could not read this image right now. Please try again.' })
  }
})

app.listen(PORT, () => {
  console.log(`Burrow & Brief backend listening on port ${PORT}`)
})
