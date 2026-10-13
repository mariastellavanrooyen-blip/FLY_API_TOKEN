import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic() // reads ANTHROPIC_API_KEY from env
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'

const NOTES_QUIZ_SCHEMA = {
  type: 'object',
  properties: {
    chapterTitle: { type: 'string' },
    bullets: {
      type: 'array',
      items: { type: 'string' },
      description: '6-12 concise bullet points covering the key concepts, rules and definitions in the text.',
    },
    glossary: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          definition: { type: 'string' },
        },
        required: ['term', 'definition'],
        additionalProperties: false,
      },
      description: 'Key defined terms found in the text, in plain language.',
    },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['mcq', 'true-false', 'fill-blank'] },
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          answer: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['type', 'prompt', 'answer'],
        additionalProperties: false,
      },
      description:
        '6-10 end-of-chapter quiz questions mixing multiple choice ("mcq", with 4 options in "options"), true/false ("true-false", answer is exactly "True" or "False"), and fill-in-the-blank ("fill-blank", prompt contains "_____" where the answer goes).',
    },
  },
  required: ['chapterTitle', 'bullets', 'glossary', 'questions'],
  additionalProperties: false,
}

export async function generateNotesAndQuiz({ text, chapterTitle, moduleName }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      'You are a meticulous legal studies tutor helping a law student turn chapter text into study material. ' +
      'Produce faithful, accurate notes and a quiz strictly grounded in the provided text — do not invent facts, ' +
      'case names, or legal rules that are not present or clearly implied in the text.',
    messages: [
      {
        role: 'user',
        content:
          `Module: ${moduleName || 'Law'}\nChapter/topic: ${chapterTitle || 'Untitled chapter'}\n\n` +
          `Read the following chapter text and produce structured study notes and a short quiz.\n\n---\n${text}\n---`,
      },
    ],
    output_config: {
      format: { type: 'json_schema', schema: NOTES_QUIZ_SCHEMA },
    },
  })

  const block = response.content.find((b) => b.type === 'text')
  if (!block) throw new Error('No structured response returned by the model')
  const parsed = JSON.parse(block.text)
  return {
    notes: {
      chapterTitle: parsed.chapterTitle || chapterTitle || 'Untitled chapter',
      bullets: parsed.bullets || [],
      glossary: parsed.glossary || [],
      wordCount: text.trim().split(/\s+/).length,
    },
    quiz: { questions: parsed.questions || [] },
  }
}

export async function describeImage({ base64, mediaType }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text:
              'If this image contains readable text (a textbook page, handwritten or typed notes, a slide, etc.), ' +
              'transcribe all of it as accurately as possible, preserving structure with plain-text formatting. ' +
              'If there is no meaningful text, briefly describe what the image shows instead. Return only the ' +
              'transcription or description — no preamble.',
          },
        ],
      },
    ],
  })

  const block = response.content.find((b) => b.type === 'text')
  return block ? block.text : ''
}

export async function chatReply({ message, history = [], moduleContext }) {
  const messages = [
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.text })),
    { role: 'user', content: message },
  ]

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system:
      'You are a warm, encouraging study assistant for a law student inside a legal-studies app called ' +
      '"Burrow & Brief". Their modules are: ' +
      `${moduleContext || 'law'}. Give concise, practical, accurate study advice — exam technique, case ` +
      'briefing, essay structure, time management, and the substance of their modules when asked. ' +
      'Keep replies to a few short paragraphs unless asked for more detail. If a legal question requires ' +
      'jurisdiction-specific accuracy you are not certain of, say so plainly rather than guessing.',
    messages,
  })

  const block = response.content.find((b) => b.type === 'text')
  return block ? block.text : "Sorry, I couldn't come up with a reply just then — try asking again."
}
