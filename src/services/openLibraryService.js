const SEARCH_URL = 'https://openlibrary.org/search.json'

function mapDocToBook(doc, seriesName, index) {
  const isbn = doc.isbn?.[0] || null
  const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null

  return {
    googleBooksId: null,
    openLibraryId: doc.key || null,
    title: doc.title || 'Unknown Title',
    authors: doc.author_name || [],
    coverUrl,
    isbn,
    genres: doc.subject?.slice(0, 4) || [],
    series: {
      name: seriesName,
      volume: index + 1,
      totalVolumes: null,
      status: 'unknown',
    },
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
    source: 'series_import',
  }
}

export async function searchOpenLibrarySeries(seriesName, authorName = '') {
  const q = [seriesName, authorName].filter(Boolean).join(' ')
  if (!q.trim()) return []

  const params = new URLSearchParams({
    q,
    limit: '20',
  })

  const res = await fetch(`${SEARCH_URL}?${params}`)
  if (!res.ok) throw new Error(`Open Library API error: ${res.status}`)

  const data = await res.json()
  return (data.docs || []).map((doc, index) => mapDocToBook(doc, seriesName, index))
}
