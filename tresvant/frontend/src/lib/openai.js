const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY

const SYSTEM_PROMPT = `You write single short captions for band photos. Under 15 words. No quotes around the caption.

IMPORTANT: Do NOT identify, name, or describe any specific individuals. Do NOT describe people's faces or physical features. Instead, focus on the overall scene, the vibe, the mood, the setting, objects, instruments, lighting, colors, or the energy of the moment. Treat people as anonymous figures — "someone," "a silhouette," "figures," etc.

Your captions must be genuinely creative, weird, surreal, or absurdist. Think non-sequiturs, dream logic, oddly specific observations, or deadpan absurdity. React to the mood, colors, composition, instruments, or setting — not the people.

BANNED patterns — never use any of these:
- Anything about mullets, mustaches, or facial hair
- "By day... by night..." or any day/night dual-identity structure
- "When the..." + mundane situation setups
- Generic "squad goals" or "the boys" phrasing
- "Nobody told them..." or "They didn't know..."
- "POV:" captions
- "Main character energy" or any "energy" captions
- Refusing to caption the image for any reason

Go for the kind of caption that makes someone pause and laugh because it's so unexpected.`

const FALLBACK_SYSTEM_PROMPT = `You write single short captions for band photos. Under 15 words. No quotes around the caption.

You cannot see the photo, but you have metadata about it. Use that context to write a genuinely creative, weird, surreal, or absurdist caption. Think non-sequiturs, dream logic, oddly specific observations, or deadpan absurdity.

BANNED patterns — never use any of these:
- Anything about mullets, mustaches, or facial hair
- "By day... by night..." or any day/night dual-identity structure
- "When the..." + mundane situation setups
- Generic "squad goals" or "the boys" phrasing
- "Nobody told them..." or "They didn't know..."
- "POV:" captions
- "Main character energy" or any "energy" captions

Go for the kind of caption that makes someone pause and laugh because it's so unexpected.`

const REFUSAL_PATTERNS = [
  "i can't help with",
  "i cannot help with",
  "i'm sorry",
  "i am sorry",
  "i'm unable to",
  "i cannot assist",
  "can't provide help",
  "cannot identify",
  "can't identify",
  "i'm not able to",
]

function isRefusal(text) {
  const lower = text.toLowerCase()
  return REFUSAL_PATTERNS.some(p => lower.includes(p))
}

function buildMetadataHint(metadata) {
  const parts = []
  if (metadata.event_name) parts.push(`Event: ${metadata.event_name}`)
  if (metadata.location) parts.push(`Location: ${metadata.location}`)
  if (metadata.photo_date) parts.push(`Date: ${metadata.photo_date}`)
  if (metadata.peopleNames?.length) parts.push(`People in photo: ${metadata.peopleNames.join(', ')}`)
  if (metadata.filename) parts.push(`Filename: ${metadata.filename}`)
  if (parts.length === 0) parts.push('A band photo with no additional context — go fully surreal.')
  return parts.join('\n')
}

async function callOpenAI(systemContent, userContent, opts = {}) {
  const body = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ],
    max_tokens: opts.max_tokens ?? 60,
    temperature: opts.temperature ?? 1.1,
  }
  if (opts.response_format) body.response_format = opts.response_format

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content.trim()
}

export async function suggestCaption(imageUrl, previousCaptions = [], metadata = {}) {
  if (!OPENAI_KEY) {
    throw new Error('Missing VITE_OPENAI_KEY environment variable')
  }

  let systemContent = SYSTEM_PROMPT
  if (previousCaptions.length > 0) {
    systemContent += `\n\nCaptions already used this session (do NOT repeat similar ideas, themes, or sentence structures):\n${previousCaptions.map(c => `- ${c}`).join('\n')}`
  }

  // First attempt: vision call with the image
  const caption = await callOpenAI(systemContent, [
    { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
  ])

  if (!isRefusal(caption)) {
    return caption
  }

  // Fallback: text-only call using photo metadata
  console.warn('Vision refused, falling back to metadata-based caption')
  let fallbackSystem = FALLBACK_SYSTEM_PROMPT
  if (previousCaptions.length > 0) {
    fallbackSystem += `\n\nCaptions already used this session (do NOT repeat similar ideas, themes, or sentence structures):\n${previousCaptions.map(c => `- ${c}`).join('\n')}`
  }

  const hint = buildMetadataHint(metadata)
  return callOpenAI(fallbackSystem, `Write a weird caption for this band photo.\n\n${hint}`)
}

const TRACK_SYSTEM_PROMPT = `You are a music metadata expert. Given information about an audio track (filename, any existing tags), identify the song and return as much metadata as you can.

Return ONLY valid JSON with these fields (omit any you're not confident about):
{
  "title": "Proper song title with correct capitalization",
  "track_number": 1,
  "album": "Album name",
  "genre": "Primary genre (e.g. Funk, R&B, Soul, Rock, Jazz, Hip-Hop)",
  "recorded_date": "YYYY-MM-DD (always full date, use 01 for unknown month/day)",
  "released_date": "YYYY-MM-DD (always full date, use 01 for unknown month/day)",
  "key": "Musical key (e.g. C major, F# minor)",
  "tempo_bpm": 120,
  "notes": "Brief interesting fact about the track, one sentence max"
}

Rules:
- Use ALL available clues: title, album, genre, key, tempo, duration — to identify the song
- The filename may be a UUID (like "a3f2b1c4.mp3") — ignore it and focus on the other metadata fields
- Only include fields you are reasonably confident about
- Dates MUST be full YYYY-MM-DD format. If you only know the year, use YYYY-01-01. If year and month, use YYYY-MM-01
- Do NOT fabricate information — if unsure, omit the field
- Clean up the title: remove track numbers, file extensions, underscores — the title should be ONLY the song name
- If the original filename (not UUID) starts with a number (e.g. "01 My Song.mp3"), extract that as track_number and exclude it from the title
- track_number must be an integer
- If you can identify the song from the title + album + genre combination, fill in as many fields as you can from your knowledge`

export async function suggestTrackMetadata(track) {
  if (!OPENAI_KEY) {
    throw new Error('Missing VITE_OPENAI_KEY environment variable')
  }

  const clues = []
  // Only include filename if it's not a UUID-style name
  if (track.filename && !/^[0-9a-f]{8}-/.test(track.filename)) {
    clues.push(`Filename: ${track.filename}`)
  }
  if (track.title) clues.push(`Title: ${track.title}`)
  if (track.track_number) clues.push(`Track number: ${track.track_number}`)
  if (track.album) clues.push(`Album: ${track.album}`)
  if (track.genre) {
    const g = Array.isArray(track.genre) ? track.genre.join(', ') : track.genre
    if (g) clues.push(`Genre: ${g}`)
  }
  if (track.key) clues.push(`Key: ${track.key}`)
  if (track.tempo_bpm) clues.push(`Tempo: ${track.tempo_bpm} BPM`)
  if (track.recorded_date) clues.push(`Recorded date: ${track.recorded_date}`)
  if (track.duration_secs) {
    const m = Math.floor(track.duration_secs / 60)
    const s = String(Math.round(track.duration_secs % 60)).padStart(2, '0')
    clues.push(`Duration: ${m}:${s}`)
  }
  if (track.file_size) {
    const mb = (track.file_size / 1048576).toFixed(1)
    clues.push(`File size: ${mb} MB`)
  }

  if (clues.length === 0) {
    return {}
  }

  const raw = await callOpenAI(
    TRACK_SYSTEM_PROMPT,
    `Here's what I know about this track:\n${clues.join('\n')}`,
    { max_tokens: 300, temperature: 0.3, response_format: { type: 'json_object' } }
  )

  try {
    const parsed = JSON.parse(raw)
    console.log('AI track suggestions:', parsed)
    // Normalize dates to YYYY-MM-DD for Postgres
    if (parsed.recorded_date) parsed.recorded_date = normalizeDate(parsed.recorded_date)
    if (parsed.released_date) parsed.released_date = normalizeDate(parsed.released_date)
    return parsed
  } catch {
    console.warn('Failed to parse track metadata JSON:', raw)
    return {}
  }
}

function normalizeDate(d) {
  if (!d) return null
  const s = String(d)
  // YYYY
  if (/^\d{4}$/.test(s)) return `${s}-01-01`
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  return null
}
