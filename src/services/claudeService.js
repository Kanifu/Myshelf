const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-20250514'

function buildPrompt(books, preferences, recommendationHistory = []) {
  const readBooks = books.filter((b) => b.readingStatus === 'read')
  const readingBooks = books.filter((b) => b.readingStatus === 'reading')
  const wantToRead = books.filter((b) => b.readingStatus === 'want_to_read')
  const dislikedBooks = books.filter((b) => b.rating && b.rating <= 2)
  const lovedBooks = books.filter((b) => b.rating && b.rating >= 4)
  const dnfBooks = books.filter((b) => b.readingStatus === 'dnf')

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
  if (lovedBooks.length) parts.push(`Loved books, strongest positive signals:\n${bookList(lovedBooks)}`)
  if (dislikedBooks.length) parts.push(`Disliked books, avoid similar patterns:\n${bookList(dislikedBooks)}`)
  if (dnfBooks.length) parts.push(`Did not finish, strong negative signals:\n${bookList(dnfBooks)}`)
  if (readBooks.length) parts.push(`Books I've read:\n${bookList(readBooks)}`)
  if (readingBooks.length) parts.push(`Currently reading:\n${bookList(readingBooks)}`)
  if (wantToRead.length) parts.push(`Want to read:\n${bookList(wantToRead)}`)

  const rejectedRecommendations = recommendationHistory.filter((rec) => rec.feedback === 'not_for_me')
  const skippedRecommendations = recommendationHistory.filter((rec) => rec.feedback === 'skipped')
  const moreLikeThisRecommendations = recommendationHistory.filter((rec) => rec.feedback === 'more_like_this')
  const recommendationList = (arr) =>
    arr
      .slice(0, 20)
      .map((rec) => `- "${rec.title}" by ${rec.author || 'Unknown'}${rec.reasoning ? ` (${rec.reasoning})` : ''}`)
      .join('\n')

  if (rejectedRecommendations.length) {
    parts.push(`Previously rejected recommendations:\n${recommendationList(rejectedRecommendations)}`)
  }
  if (skippedRecommendations.length) {
    parts.push(`Previously skipped recommendations, weaker negative signal:\n${recommendationList(skippedRecommendations)}`)
  }
  if (moreLikeThisRecommendations.length) {
    parts.push(`Asked for more like these recommendations:\n${recommendationList(moreLikeThisRecommendations)}`)
  }

  const genreStr = preferences.preferredGenres?.length
    ? `\nPreferred genres: ${preferences.preferredGenres.join(', ')}`
    : ''
  const lang = preferences.preferredLanguage || 'English'
  const langStr = `\nPreferred language: ${lang}. IMPORTANT: Write the "reasoning" field in ${lang === 'Dutch' ? 'Dutch (Nederlands)' : 'English'}.`
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

export async function identifyBookFromImage(base64Image, apiKey) {
  if (!apiKey) throw new Error('No Claude API key configured')

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
      max_tokens: 256,
      system: 'You identify books from photos. Respond only in valid JSON. No markdown.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
            },
            {
              type: 'text',
              text: 'What book is shown in this photo? Return ONLY: {"title": "...", "author": "...", "confidence": "high"|"medium"|"low"}',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Could not identify book from image')
  return JSON.parse(jsonMatch[0])
}

export async function getRecommendations(books, preferences, apiKey, recommendationHistory = []) {
  if (!apiKey) throw new Error('No Claude API key configured')
  if (books.length === 0) throw new Error('Your library is empty — add some books first')

  const prompt = buildPrompt(books, preferences, recommendationHistory)

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
      system: `You are a personal book recommendation engine. Respond only in valid JSON array. No markdown. Write all "reasoning" fields in ${preferences.preferredLanguage === 'Dutch' ? 'Dutch (Nederlands)' : 'English'}.`,
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
