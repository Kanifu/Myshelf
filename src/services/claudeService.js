const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

function buildPrompt(books, preferences) {
  const readBooks = books.filter((b) => b.readingStatus === 'read')
  const readingBooks = books.filter((b) => b.readingStatus === 'reading')
  const wantToRead = books.filter((b) => b.readingStatus === 'want_to_read')

  const bookList = (arr) =>
    arr
      .map((b) => {
        const rating = b.rating ? ` (rated ${b.rating}/5)` : ''
        const authors = b.authors?.join(', ') || 'Unknown'
        const genres = b.genres?.length ? ` [${b.genres.join(', ')}]` : ''
        return `- "${b.title}" by ${authors}${genres}${rating}`
      })
      .join('\n')

  const parts = []
  if (readBooks.length) parts.push(`Books I've read:\n${bookList(readBooks)}`)
  if (readingBooks.length) parts.push(`Currently reading:\n${bookList(readingBooks)}`)
  if (wantToRead.length) parts.push(`Want to read:\n${bookList(wantToRead)}`)

  const genreStr = preferences.preferredGenres?.length
    ? `\nPreferred genres: ${preferences.preferredGenres.join(', ')}`
    : ''
  const langStr = `\nPreferred language: ${preferences.preferredLanguage || 'English'}`
  const koboStr = preferences.koboPlusSubscriber
    ? '\nI am a Kobo Plus subscriber — prefer books available on Kobo Plus.'
    : ''

  return `Here is my book library:

${parts.join('\n\n')}
${genreStr}${langStr}${koboStr}

Based on my reading history and preferences, recommend exactly 7 books I haven't read yet. For each book provide a Kobo search URL in the format https://www.kobo.com/nl/nl/search?query=TITLE+AUTHOR (URL-encoded).

Respond ONLY with a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "series_name": null,
    "series_volume": null,
    "genre": "Genre",
    "reasoning": "Why I'd enjoy this book based on my library",
    "kobo_search_url": "https://www.kobo.com/nl/nl/search?query=..."
  }
]`
}

export async function getRecommendations(books, preferences, apiKey) {
  if (!apiKey) throw new Error('No Claude API key configured')
  if (books.length === 0) throw new Error('Your library is empty — add some books first')

  const prompt = buildPrompt(books, preferences)

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: 'You are a personal book recommendation engine. Respond only in valid JSON array. No markdown.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Invalid response from Claude — no JSON array found')

  const parsed = JSON.parse(jsonMatch[0])
  if (!Array.isArray(parsed)) throw new Error('Claude did not return a JSON array')

  return parsed.map((item) => ({
    id: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    title: item.title || '',
    author: item.author || '',
    seriesName: item.series_name || null,
    seriesVolume: item.series_volume || null,
    genre: item.genre || '',
    reasoning: item.reasoning || '',
    koboSearchUrl: item.kobo_search_url || `https://www.kobo.com/nl/nl/search?query=${encodeURIComponent(item.title)}`,
    coverUrl: null,
    feedback: null,
  }))
}
