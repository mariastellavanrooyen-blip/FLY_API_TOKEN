import React, { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { generateNotesFromText, generateQuizFromNotes } from '../lib/offlineAI.js'
import { generateNotesAndQuizRemote } from '../lib/api.js'
import EmptyState from './ui/EmptyState.jsx'
import { uid, formatDate } from '../lib/utils.js'

function QuizRunner({ quiz, onFinish }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function grade() {
    let correct = 0
    for (const q of quiz.questions) {
      const given = (answers[q.id] || '').trim().toLowerCase()
      if (given && given === q.answer.trim().toLowerCase()) correct++
    }
    setSubmitted(true)
    onFinish({ date: new Date().toISOString(), score: correct, total: quiz.questions.length })
  }

  return (
    <div>
      {quiz.questions.map((q, i) => {
        const isCorrect = submitted && (answers[q.id] || '').trim().toLowerCase() === q.answer.trim().toLowerCase()
        return (
          <div key={q.id} className="card" style={{ marginBottom: 10 }}>
            <div className="muted">
              Q{i + 1} · {q.type.replace('-', ' ')}
            </div>
            <p style={{ fontWeight: 600 }}>{q.prompt}</p>
            {q.type === 'mcq' && (
              <div className="pill-select">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={answers[q.id] === opt ? 'active' : ''}
                    disabled={submitted}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'true-false' && (
              <div className="pill-select">
                {['True', 'False'].map((opt) => (
                  <button key={opt} className={answers[q.id] === opt ? 'active' : ''} disabled={submitted} onClick={() => setAnswers({ ...answers, [q.id]: opt })}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {q.type === 'fill-blank' && (
              <input
                placeholder="Type the missing term…"
                value={answers[q.id] || ''}
                disabled={submitted}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              />
            )}
            {submitted && (
              <p className={isCorrect ? 'muted' : 'muted'} style={{ color: isCorrect ? '#3a5a28' : '#7a2e18', marginTop: 8 }}>
                {isCorrect ? '✅ Correct' : `❌ Answer: ${q.answer}`}
                {q.explanation && !isCorrect ? ` — “${q.explanation}”` : ''}
              </p>
            )}
          </div>
        )
      })}
      {!submitted ? (
        <button className="btn" onClick={grade}>
          Submit quiz
        </button>
      ) : (
        <p className="muted">Score recorded. Retake anytime — spaced repetition works best a few days from now.</p>
      )}
    </div>
  )
}

export default function NotesQuiz() {
  const { state, dispatch } = useStore()
  const [moduleId, setModuleId] = useState(state.modules[0]?.id || '')
  const [chapterTitle, setChapterTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openNoteId, setOpenNoteId] = useState(null)
  const [openQuizId, setOpenQuizId] = useState(null)

  const isRemote = state.settings.aiMode === 'claude' && state.settings.backendUrl

  async function handleGenerate() {
    setError('')
    if (!text.trim()) {
      setError('Paste some chapter text first.')
      return
    }
    setBusy(true)
    try {
      if (isRemote) {
        const moduleName = state.modules.find((m) => m.id === moduleId)?.name
        const res = await generateNotesAndQuizRemote(state.settings.backendUrl, {
          text,
          chapterTitle: chapterTitle || 'Untitled chapter',
          moduleName,
        })
        const notes = { id: uid(), moduleId, createdAt: new Date().toISOString(), source: 'claude', ...res.notes }
        const quiz = { id: uid(), moduleId, notesId: notes.id, chapterTitle: notes.chapterTitle, attempts: [], questions: res.quiz.questions }
        dispatch({ type: 'ADD_NOTES', payload: notes })
        dispatch({ type: 'ADD_QUIZ', payload: quiz })
        setOpenNoteId(notes.id)
      } else {
        const notes = generateNotesFromText(text, { chapterTitle: chapterTitle || 'Untitled chapter' })
        if (notes.error) {
          setError(notes.error)
          setBusy(false)
          return
        }
        const questions = generateQuizFromNotes(notes)
        const fullNotes = { ...notes, moduleId, source: 'offline' }
        const quiz = { id: uid(), moduleId, notesId: notes.id, chapterTitle: notes.chapterTitle, attempts: [], questions }
        dispatch({ type: 'ADD_NOTES', payload: fullNotes })
        dispatch({ type: 'ADD_QUIZ', payload: quiz })
        setOpenNoteId(notes.id)
      }
      setText('')
      setChapterTitle('')
    } catch (err) {
      setError(`Something went wrong generating notes: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  function moduleName(id) {
    return state.modules.find((m) => m.id === id)?.name || '—'
  }

  return (
    <div>
      <div className="card">
        <div className="section-title">
          📥 Scan a chapter <span className="badge">{isRemote ? 'Claude API' : 'Offline mode'}</span>
        </div>
        <p className="muted" style={{ marginTop: -4 }}>
          Paste the text of a chapter, article, or your own notes. {isRemote ? 'Claude will read it and produce structured notes plus a quiz.' : 'The built-in offline engine will pull out key sentences, a glossary, and generate a short quiz — no API key needed.'}
        </p>
        <div className="field-row">
          <div className="field">
            <label>Module</label>
            <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
              {state.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Chapter / topic title</label>
            <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="e.g. Chapter 5 — Client Confidentiality" />
          </div>
        </div>
        <div className="field">
          <label>Chapter text</label>
          <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste chapter text here…" />
        </div>
        {error && <p style={{ color: '#7a2e18' }}>{error}</p>}
        <button className="btn" onClick={handleGenerate} disabled={busy}>
          {busy ? 'Generating… 🐇💨' : '✨ Generate notes & quiz'}
        </button>
      </div>

      <div className="section-title" style={{ marginTop: 22 }}>
        📚 Your notes
      </div>
      {state.notes.length === 0 && (
        <div className="card">
          <EmptyState emoji="📝" title="No notes yet" subtitle="Generate your first set above." />
        </div>
      )}
      {state.notes.map((n) => {
        const quiz = state.quizzes.find((q) => q.notesId === n.id)
        const open = openNoteId === n.id
        return (
          <div className="card" key={n.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', cursor: 'pointer' }} onClick={() => setOpenNoteId(open ? null : n.id)}>
              <div>
                <h4 style={{ margin: 0 }}>{n.chapterTitle}</h4>
                <div className="muted">
                  {moduleName(n.moduleId)} · {formatDate(n.createdAt?.slice(0, 10))} · {n.wordCount ? `${n.wordCount} words scanned` : ''} · {n.source === 'claude' ? 'Claude' : 'offline engine'}
                </div>
              </div>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_NOTES', payload: { id: n.id } }) }}>
                🗑️
              </button>
            </div>
            {open && (
              <div style={{ marginTop: 14 }}>
                <strong>Key points</strong>
                <ul>
                  {n.bullets.map((b, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {b}
                    </li>
                  ))}
                </ul>
                {n.glossary?.length > 0 && (
                  <>
                    <strong>Glossary</strong>
                    <ul>
                      {n.glossary.map((g, i) => (
                        <li key={i}>
                          <strong>{g.term}:</strong> {g.definition}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {quiz && (
                  <div style={{ marginTop: 12 }}>
                    <button className="btn secondary small" onClick={() => setOpenQuizId(openQuizId === quiz.id ? null : quiz.id)}>
                      {openQuizId === quiz.id ? 'Hide quiz' : `📝 Take the ${quiz.questions.length}-question quiz`}
                    </button>
                    {quiz.attempts?.length > 0 && (
                      <span className="muted" style={{ marginLeft: 10 }}>
                        Best score: {Math.max(...quiz.attempts.map((a) => a.score))}/{quiz.questions.length}
                      </span>
                    )}
                    {openQuizId === quiz.id && (
                      <div style={{ marginTop: 12 }}>
                        <QuizRunner quiz={quiz} onFinish={(attempt) => dispatch({ type: 'RECORD_QUIZ_ATTEMPT', payload: { quizId: quiz.id, attempt } })} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
