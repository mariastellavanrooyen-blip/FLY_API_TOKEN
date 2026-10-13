// Local, offline "smart" text processing — no network call, no API key.
// Turns pasted chapter text into bullet notes, a glossary, and a short quiz
// using keyword/frequency heuristics. Not true language understanding —
// labelled as such in the UI — but works instantly and privately.
import { uid } from './utils.js'

const STOPWORDS = new Set(
  ('the a an of to in and or for is are was were be been being this that these those ' +
    'as by with on at from into over under between within without shall must may can ' +
    'such other than which who whom whose it its their his her they them we you your ' +
    'not no if then than also may will would should could has have had do does did but ' +
    'so because while when where each any all more most some such only own same so than')
    .split(' '),
)

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.?!])\s+(?=[A-Z0-9"“])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.split(' ').length > 4)
}

function splitParagraphs(text) {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function wordFreq(sentences) {
  const freq = new Map()
  for (const s of sentences) {
    const words = s.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []
    for (const w of words) {
      if (STOPWORDS.has(w)) continue
      freq.set(w, (freq.get(w) || 0) + 1)
    }
  }
  return freq
}

const DEFINITION_PATTERNS = [
  /^(.*?)\s+(?:is|are)\s+defined\s+as\s+(.*)$/i,
  /^(.*?)\s+means\s+(.*)$/i,
  /^(.*?)\s+refers\s+to\s+(.*)$/i,
  /^(?:the\s+term\s+)?["“]?([A-Z][a-zA-Z\s-]{2,40})["”]?\s+(?:is|means)\s+(.*)$/,
]

function extractGlossary(sentences) {
  const glossary = []
  const seen = new Set()
  for (const s of sentences) {
    for (const pattern of DEFINITION_PATTERNS) {
      const m = s.match(pattern)
      if (m && m[1] && m[2]) {
        const term = m[1].trim().replace(/^(the|a|an)\s+/i, '')
        if (term.length > 60 || term.split(' ').length > 6) continue
        const key = term.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        glossary.push({ term: capitalize(term), definition: m[2].trim().replace(/\.$/, '') + '.' })
        break
      }
    }
    if (glossary.length >= 12) break
  }
  return glossary
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function scoreSentence(s, freq, index, total) {
  const words = s.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []
  let score = 0
  for (const w of words) score += freq.get(w) || 0
  score = score / Math.max(1, words.length)
  if (/\bdefined as\b|\bmeans\b|\brefers to\b/i.test(s)) score += 3
  if (/\bmust\b|\bshall\b|\brequire[sd]?\b/i.test(s)) score += 1.5
  if (index === 0) score += 1 // opening sentence of a paragraph
  if (s.length > 260) score -= 1.5 // penalize run-on sentences
  return score
}

export function generateNotesFromText(rawText, { chapterTitle = 'Untitled chapter' } = {}) {
  const cleanText = rawText.trim()
  if (cleanText.split(/\s+/).length < 30) {
    return { error: 'That looks a little short to summarize well — paste at least a few paragraphs of chapter text.' }
  }

  const paragraphs = splitParagraphs(cleanText)
  const allSentences = splitSentences(cleanText)
  const freq = wordFreq(allSentences)
  const glossary = extractGlossary(allSentences)

  const scored = []
  paragraphs.forEach((para) => {
    const sents = splitSentences(para)
    sents.forEach((s, i) => {
      scored.push({ text: s, score: scoreSentence(s, freq, i, sents.length) })
    })
  })

  const targetCount = Math.max(5, Math.min(14, Math.round(allSentences.length / 3)))
  const topSentences = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, targetCount)
  // restore original reading order
  const orderIndex = new Map(allSentences.map((s, i) => [s, i]))
  topSentences.sort((a, b) => (orderIndex.get(a.text) ?? 0) - (orderIndex.get(b.text) ?? 0))

  const keyTerms = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)

  return {
    id: uid(),
    chapterTitle,
    createdAt: new Date().toISOString(),
    wordCount: cleanText.split(/\s+/).length,
    bullets: topSentences.map((s) => s.text),
    glossary,
    keyTerms,
    sourceSentences: allSentences,
  }
}

// --- Quiz generation ---------------------------------------------------

function blankTermInSentence(sentence, term) {
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  if (!re.test(sentence)) return null
  return sentence.replace(re, '_____')
}

function pickDistractors(pool, exclude, count) {
  const filtered = pool.filter((p) => p !== exclude)
  const out = []
  while (out.length < count && filtered.length) {
    const idx = Math.floor(Math.random() * filtered.length)
    out.push(filtered.splice(idx, 1)[0])
  }
  return out
}

function negateSentence(sentence) {
  const swaps = [
    [/\bmust\b/i, 'need not'],
    [/\bshall\b/i, 'shall not'],
    [/\bis required to\b/i, 'is not required to'],
    [/\bis\b/i, 'is not'],
    [/\bare\b/i, 'are not'],
    [/\bmay\b/i, 'may never'],
    [/\balways\b/i, 'never'],
  ]
  for (const [pattern, replacement] of swaps) {
    if (pattern.test(sentence)) return sentence.replace(pattern, replacement)
  }
  return null
}

export function generateQuizFromNotes(notes, { count = 8 } = {}) {
  const questions = []
  const { glossary, sourceSentences, bullets } = notes

  // Multiple choice from glossary terms
  const defs = glossary.map((g) => g.definition)
  for (const g of glossary) {
    if (questions.length >= count) break
    const distractors = pickDistractors(defs, g.definition, 3)
    if (distractors.length < 2) continue
    const options = shuffle([g.definition, ...distractors])
    questions.push({
      id: uid(),
      type: 'mcq',
      prompt: `Which best defines "${g.term}"?`,
      options,
      answer: g.definition,
    })
  }

  // Fill in the blank using glossary terms found in bullet sentences
  for (const g of glossary) {
    if (questions.length >= count) break
    const source = bullets.find((b) => blankTermInSentence(b, g.term))
    if (!source) continue
    const blanked = blankTermInSentence(source, g.term)
    questions.push({
      id: uid(),
      type: 'fill-blank',
      prompt: blanked,
      answer: g.term,
      explanation: source,
    })
  }

  // True/False from remaining bullets
  const usedTexts = new Set(questions.map((q) => q.explanation).filter(Boolean))
  const remaining = bullets.filter((b) => !usedTexts.has(b))
  shuffle(remaining)
  for (const sentence of remaining) {
    if (questions.length >= count) break
    const makeFalse = Math.random() > 0.5
    if (makeFalse) {
      const negated = negateSentence(sentence)
      if (!negated) continue
      questions.push({
        id: uid(),
        type: 'true-false',
        prompt: negated,
        answer: 'False',
        explanation: sentence,
      })
    } else {
      questions.push({
        id: uid(),
        type: 'true-false',
        prompt: sentence,
        answer: 'True',
        explanation: sentence,
      })
    }
  }

  return shuffle(questions).slice(0, count)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// --- Offline study assistant -------------------------------------------

const ASSISTANT_RULES = [
  {
    keywords: ['irac', 'structure', 'problem question', 'answer a question'],
    reply:
      "Use IRAC: state the Issue in one sentence, the Rule that governs it, Application of the rule to the specific facts you were given, and a clear Conclusion. Examiners mark the Application step most heavily — don't just restate the rule.",
  },
  {
    keywords: ['brief a case', 'case brief', 'case note', 'reading cases'],
    reply:
      'Keep case briefs to four lines: Facts, Legal issue, Holding, and Reasoning/significance. If your brief is longer than a paragraph, you are copying rather than distilling.',
  },
  {
    keywords: ['time management', 'procrastinat', 'schedule', 'study plan'],
    reply:
      'Try one protected 90-minute deep-work block per day rather than scattered short sessions — use the Study Timer tab. Pair it with spaced review: revisit each topic on day 1, 3, 7 and 21.',
  },
  {
    keywords: ['ethic', 'conflict of interest', 'professional conduct', 'professional respons'],
    reply:
      "For Professional Ethics, learn the rationale behind each rule, not just the rule — most exam questions apply a rule to a new fact pattern, so understanding *why* the rule exists (protecting client trust, court integrity) helps you extend it correctly. Build a checklist of conflict-of-interest fact patterns as you meet them.",
  },
  {
    keywords: ['notarial', 'deed', 'notary', 'attestation', 'execution clause'],
    reply:
      'For Notarial Practice, memorise the standard anatomy of a deed (parties, recitals, operative clause, execution, attestation) and drill spotting formality defects — a missing witness or wrong capacity hidden in a long fact pattern is a classic exam trap.',
  },
  {
    keywords: ['essay', 'writing', 'thesis', 'argument'],
    reply:
      'Decide your one-sentence thesis before you start writing. Every paragraph should build toward it or knock down the strongest counter-argument — essays that address the opposing view explicitly read as far more authoritative.',
  },
  {
    keywords: ['exam', 'nervous', 'anxious', 'stressed', 'overwhelmed'],
    reply:
      "That's completely normal before law exams. Break your revision into small, specific sessions (one topic, one hour) rather than 'revise everything' — vague goals fuel anxiety. Use the habit tracker to build a visible streak; momentum reduces panic.",
  },
  {
    keywords: ['memoriz', 'remember', 'forget', 'retain'],
    reply:
      'Spaced repetition beats rereading. Generate a quiz from each chapter here and retake it a few days later — active recall under mild difficulty is what actually builds retention.',
  },
  {
    keywords: ['quiz', 'notes', 'generate', 'summar'],
    reply:
      "Head to the Notes & Quiz tab, paste in your chapter text, and I'll pull out key sentences, a glossary of defined terms, and a short practice quiz automatically.",
  },
  {
    keywords: ['goal', 'motivat'],
    reply:
      'Set one specific, dated goal per module in the Goals tab rather than a vague "study more" — e.g. "finish Chapter 4 notes by Friday". Small, checkable milestones keep motivation concrete.',
  },
]

const FALLBACK_REPLIES = [
  "I'm running in offline mode, so I work best with study-skills questions — try asking about exam technique, case briefing, time management, essay structure, or a specific module like Professional Ethics or Notarial Practice.",
  "I don't have a canned answer for that one yet. Try the Notes & Quiz tab to turn your own chapter text into a study aid, or ask me about exam technique, time management, or essay writing.",
]

export function offlineAssistantReply(message, { moduleNames = [] } = {}) {
  const lower = message.toLowerCase()
  for (const rule of ASSISTANT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.reply
  }
  for (const name of moduleNames) {
    if (name && lower.includes(name.toLowerCase())) {
      return `I don't have a specific tip pre-loaded for "${name}" beyond the general study techniques — try asking about exam technique, case briefing or essay structure, or paste chapter text into Notes & Quiz to generate module-specific material.`
    }
  }
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]
}
