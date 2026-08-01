import React, { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { offlineAssistantReply } from '../lib/offlineAI.js'
import { chatRemote } from '../lib/api.js'

function ModuleEditor({ module, dispatch }) {
  const [chapterDraft, setChapterDraft] = useState('')
  return (
    <div className="card">
      <div className="field">
        <label>Module name</label>
        <input value={module.name} onChange={(e) => dispatch({ type: 'UPDATE_MODULE', payload: { id: module.id, name: e.target.value } })} />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea
          rows={2}
          value={module.description}
          onChange={(e) => dispatch({ type: 'UPDATE_MODULE', payload: { id: module.id, description: e.target.value } })}
        />
      </div>
      <div className="field">
        <label>Chapters / topics</label>
        {module.chapters.length === 0 && <p className="muted">No chapters added yet.</p>}
        {module.chapters.map((c) => (
          <div key={c.id} className="list-row" style={{ padding: '6px 10px' }}>
            <span className="grow">{c.title}</span>
            <button className="icon-btn" onClick={() => dispatch({ type: 'DELETE_CHAPTER', payload: { moduleId: module.id, chapterId: c.id } })}>
              🗑️
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input
            placeholder="e.g. Chapter 3 — Conflicts of Interest"
            value={chapterDraft}
            onChange={(e) => setChapterDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chapterDraft.trim()) {
                dispatch({ type: 'ADD_CHAPTER', payload: { moduleId: module.id, title: chapterDraft.trim() } })
                setChapterDraft('')
              }
            }}
          />
          <button
            className="btn small secondary"
            onClick={() => {
              if (!chapterDraft.trim()) return
              dispatch({ type: 'ADD_CHAPTER', payload: { moduleId: module.id, title: chapterDraft.trim() } })
              setChapterDraft('')
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModulesAssistant() {
  const { state, dispatch } = useStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const logRef = useRef(null)
  const isRemote = state.settings.aiMode === 'claude' && state.settings.backendUrl

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', text, ts: Date.now() } })
    setBusy(true)
    try {
      let reply
      if (isRemote) {
        const res = await chatRemote(state.settings.backendUrl, {
          message: text,
          history: state.chatHistory.slice(-10),
          moduleContext: state.modules.map((m) => m.name).join(', '),
        })
        reply = res.reply
      } else {
        reply = offlineAssistantReply(text, { moduleNames: state.modules.map((m) => m.name) })
      }
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', text: reply, ts: Date.now() } })
    } catch (err) {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: { role: 'assistant', text: `⚠️ Couldn't reach the assistant backend (${err.message}). Falling back to offline tips: ${offlineAssistantReply(text)}`, ts: Date.now() },
      })
    } finally {
      setBusy(false)
      setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50)
    }
  }

  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="section-title">📚 Your modules</div>
        {state.modules.map((m) => (
          <ModuleEditor key={m.id} module={m} dispatch={dispatch} />
        ))}
      </div>

      <div className="card">
        <div className="section-title">
          🤖 Study Assistant <span className="badge">{isRemote ? 'Claude API' : 'Offline mode'}</span>
        </div>
        {!isRemote && (
          <p className="muted" style={{ marginTop: -6 }}>
            Running fully offline with curated study advice. Turn on real AI in Settings once you have a backend configured.
          </p>
        )}
        <div className="chat-log" ref={logRef}>
          {state.chatHistory.length === 0 && (
            <p className="muted">Ask about exam technique, essay structure, a module, or how to use this app. 🐰</p>
          )}
          {state.chatHistory.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.text}
            </div>
          ))}
          {busy && <div className="chat-bubble assistant">Thinking… 🌈</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <input
            placeholder="Ask a study question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn" onClick={send} disabled={busy}>
            Send
          </button>
        </div>
        {state.chatHistory.length > 0 && (
          <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => dispatch({ type: 'CLEAR_CHAT' })}>
            Clear chat
          </button>
        )}
      </div>
    </div>
  )
}
