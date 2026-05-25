export function getKoboSearchUrl(title, author = '') {
  return `https://www.kobo.com/nl/nl/search?query=${encodeURIComponent(`${title} ${author}`.trim())}`
}

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && quoted && next === '"') {
      value += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      values.push(value.trim())
      value = ''
    } else {
      value += char
    }
  }

  values.push(value.trim())
  return values
}

export function parseLibraryCsv(csvText, source = 'kobo_import') {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)

  if (rows.length < 2) return []

  const headers = parseCsvLine(rows[0]).map((header) => header.toLowerCase())

  return rows.slice(1).map((row) => {
    const values = parseCsvLine(row)
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']))
    const title = record.title || record.booktitle || record.name
    const author = record.author || record.authors || record.creator
    const finished = record.datefinished || record.finished || record['date finished']

    return {
      title,
      authors: author ? author.split(';').flatMap((part) => part.split(',')).map((item) => item.trim()).filter(Boolean) : [],
      isbn: record.isbn || null,
      readingStatus: finished ? 'read' : record.status || 'read',
      dateFinished: finished || null,
      source,
    }
  }).filter((book) => book.title)
}

function escapeCsv(value) {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}

export function booksToCsv(books) {
  const headers = ['Title', 'Authors', 'ISBN', 'Status', 'Rating', 'Genres', 'Series', 'Volume', 'DateAdded', 'DateFinished', 'Source', 'Note']
  const rows = books.map((book) => [
    book.title,
    book.authors?.join('; '),
    book.isbn,
    book.readingStatus,
    book.rating,
    book.genres?.join('; '),
    book.series?.name,
    book.series?.volume,
    book.dateAdded,
    book.dateFinished,
    book.source,
    book.note,
  ].map(escapeCsv).join(','))

  return [headers.join(','), ...rows].join('\n')
}
