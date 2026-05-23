const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

function mapVolumeToBook(volume) {
  const info = volume.volumeInfo || {}
  const isbn = (info.industryIdentifiers || []).find(
    (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier || null

  const coverUrl =
    info.imageLinks?.thumbnail?.replace('http://', 'https://') ||
    info.imageLinks?.smallThumbnail?.replace('http://', 'https://') ||
    null

  return {
    googleBooksId: volume.id,
    title: info.title || 'Unknown Title',
    authors: info.authors || [],
    coverUrl,
    genres: info.categories || [],
    isbn,
    series: { name: null, volume: null, totalVolumes: null, status: 'unknown' },
    description: info.description || '',
    publishedDate: info.publishedDate || '',
    pageCount: info.pageCount || null,
    publisher: info.publisher || '',
  }
}

export async function searchBooks(query, apiKey = '') {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    q: query,
    maxResults: '10',
  })
  if (apiKey) params.set('key', apiKey)

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`)

  const data = await res.json()
  return (data.items || []).map(mapVolumeToBook)
}

export async function searchSeriesBooks(seriesName, authorName = '', apiKey = '') {
  const q = [seriesName, authorName].filter(Boolean).join(' ')
  if (!q.trim()) return []

  const params = new URLSearchParams({
    q,
    maxResults: '20',
  })
  if (apiKey) params.set('key', apiKey)

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`)

  const data = await res.json()
  return (data.items || [])
    .map(mapVolumeToBook)
    .map((book, index) => ({
      ...book,
      series: {
        name: seriesName,
        volume: index + 1,
        totalVolumes: data.items?.length || null,
        status: 'unknown',
      },
      source: 'series_import',
    }))
}

export async function searchBooksByTitleAndAuthor(title, author, apiKey = '') {
  const q = [
    title ? `intitle:${title}` : '',
    author ? `inauthor:${author}` : '',
  ]
    .filter(Boolean)
    .join('+')

  const params = new URLSearchParams({ q, maxResults: '3' })
  if (apiKey) params.set('key', apiKey)

  try {
    const res = await fetch(`${BASE_URL}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data.items?.length) return null
    return mapVolumeToBook(data.items[0])
  } catch {
    return null
  }
}
