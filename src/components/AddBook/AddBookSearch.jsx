import { useState } from 'react'
import { searchBooks } from '../../services/googleBooksService'
import { useLibraryStore } from '../../store/libraryStore'
import { usePreferencesStore } from '../../store/preferencesStore'

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'read', label: 'Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'dnf', label: 'DNF' },
]

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(null)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="p-0.5"
        >
          <svg
            className={`w-8 h-8 transition-colors ${star <= (hover ?? value ?? 0) ? 'text-amber-400' : 'text-slate-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function AddBookSearch({ onDone }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('want_to_read')
  const [rating, setRating] = useState(null)
  const [saving, setSaving] = useState(false)

  const { addBook } = useLibraryStore()
  const googleBooksApiKey = usePreferencesStore((s) => s.googleBooksApiKey)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    setResults([])
    try {
      const data = await searchBooks(query, googleBooksApiKey)
      setResults(data)
      if (data.length === 0) setSearchError('No books found. Try a different search.')
    } catch (err) {
      setSearchError('Search failed. Check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd() {
    if (!selected) return
    setSaving(true)
    await addBook({
      title: selected.title,
      authors: selected.authors,
      coverUrl: selected.coverUrl,
      isbn: selected.isbn,
      genres: selected.genres,
      series: selected.series,
      googleBooksId: selected.googleBooksId,
      readingStatus: status,
      rating,
    })
    setSaving(false)
    onDone()
  }

  // Confirmation screen
  if (selected) {
    return (
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800 flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-slate-100">Add to Shelf</h1>
        </div>

        <div className="px-4 py-5 flex-1">
          {/* Book preview */}
          <div className="flex gap-4 mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
              {selected.coverUrl ? (
                <img src={selected.coverUrl} alt={selected.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-100 leading-tight">{selected.title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{selected.authors?.join(', ')}</p>
              {selected.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selected.genres.slice(0, 2).map((g) => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{g}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reading Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                    status === opt.value
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Rating {rating ? `— ${rating}/5 stars` : '— tap to rate'}
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50 text-base"
          >
            {saving ? 'Adding...' : 'Add to My Shelf'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Add a Book</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {searching ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-4">
        {searchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400">{searchError}</p>
          </div>
        )}

        {!searchError && results.length === 0 && !searching && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold">Search Google Books</p>
            <p className="text-slate-500 text-sm mt-1">Find any book by title, author, or ISBN</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500">{results.length} results</p>
            {results.map((book) => (
              <button
                key={book.googleBooksId}
                onClick={() => setSelected(book)}
                className="flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all text-left"
              >
                <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-700">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 line-clamp-2 leading-tight">{book.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{book.authors?.join(', ')}</p>
                  {book.genres?.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{book.genres[0]}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
