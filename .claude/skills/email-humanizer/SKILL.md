---
name: email-humanizer
description: Use whenever drafting, rewriting, or reviewing an email to a client — especially bulk/mail-merge sends — so it reads as written by a person, not an AI. Triggers on requests like "write an email to clients", "draft a follow-up to customers", "send this to my client list", or "make this email sound more human". Strips AI-sounding openers, transitions, buzzwords, em-dash overuse, and over-explained filler; keeps the message short, direct, and specific to the actual person and situation.
---

# Email Humanizer

Client emails written by an AI tend to give themselves away through a small,
predictable set of tells: the same handful of opening lines, the same
transition words, the same over-formal structure, and the same punctuation
habits (the em dash above all). None of these tells make the email clearer —
they just make it sound templated. This skill is a checklist and a banned-word
list to run every client email through before it goes out.

## Before drafting

1. Ask (or infer from context) three things if not already known: who the
   recipient is, what one thing they actually need from this email, and what
   tone fits this relationship (e.g. long-standing client vs. first contact).
   Write for that one person, even if the email will be mail-merged to fifty
   people — a specific, slightly imperfect email beats a polished generic one.
2. Decide the single point of the email before writing a word of it. If you
   can't state it in one sentence, the draft will ramble.

## While drafting

- Open with the actual content, not a throat-clearing lead-in. Skip
  "I hope this email finds you well" and its cousins entirely — see
  `references/banned-phrases.md` for the full list of openers/transitions/
  closers to avoid, organized by category with plain-English replacements.
- Check every sentence against `references/punctuation-and-formatting.md`
  before finalizing — the em dash is the single biggest tell, along with
  rule-of-three lists, bullet-itis in short emails, and bold-for-emphasis.
- Check the overall shape of the email against
  `references/overdescriptive-patterns.md` — these are structural/content
  habits (restating the question back, padding with backstory, hedging
  everything, stacking three CTAs) that read as AI even when individual
  sentences are fine.
- Match length to the ask. A one-line request gets a one-paragraph email, not
  three. Cut any sentence that restates something the previous sentence
  already said.

## Final pass (run this every time)

1. Read it out loud (or have it read back). If a sentence isn't something you
   would actually say to this person on a call, rewrite or cut it.
2. Search the draft for em dashes (—) and semicolons used to join two full
   sentences. Replace with a period, comma, or parenthesis, or just split the
   sentence.
3. Scan for any phrase in `references/banned-phrases.md`. Replace it with the
   suggested plain alternative or cut it outright.
4. Check the sign-off isn't a generic stack ("Please don't hesitate to reach
   out! Looking forward to hearing from you! Have a great day!"). Pick one
   closing line, not three.
5. Confirm at least one detail in the email is specific to this recipient
   (their name used naturally, a reference to their actual situation/last
   conversation, a real date/number) — generic emails are the second-biggest
   tell after the wording itself.

## Reference files

- `references/banned-phrases.md` — top ~50 AI-cliché words and phrases for
  email writing (openers, transitions, buzzwords, hedges, closers), each with
  a plain replacement.
- `references/punctuation-and-formatting.md` — punctuation and formatting
  habits that read as AI-generated (em dash, rule-of-three, bullet overuse,
  bold-for-emphasis, colon-headers, etc.) with the human-sounding fix for each.
- `references/overdescriptive-patterns.md` — structural and content patterns
  (over-explaining, hedging, padding, restating the question, generic
  compliments) that make an email feel over-produced regardless of word
  choice.
