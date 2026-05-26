import { useState, useRef, useEffect } from 'react'
import { searchBooks, searchSeriesBooks } from '../../services/googleBooksService'
import { searchOpenLibrarySeries } from '../../services/openLibraryService'
import { identifyBookFromImage } from '../../services/claudeService'
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
  const [mode, setMode] = useState('manual')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [seriesSearch, setSeriesSearch] = useState('')
  const [seriesAuthor, setSeriesAuthor] = useState('')
  const [seriesResults, setSeriesResults] = useState([])
  const [selectedSeriesIds, setSelectedSeriesIds] = useState([])
  const [status, setStatus] = useState('want_to_read')
  const [rating, setRating] = useState(null)
  const [seriesName, setSeriesName] = useState('')
  const [seriesVolume, setSeriesVolume] = useState('')
  const [saving, setSaving] = useState(false)
  const [listening, setListening] = useState(false)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraScanning, setCameraScanning] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const { addBook, importBooks } = useLibraryStore()
  const googleBooksApiKey = usePreferencesStore((s) => s.googleBooksApiKey)
  const claudeApiKey = usePreferencesStore((s) => s.claudeApiKey)

  // Stop camera stream when leaving photo mode
  useEffect(() => {
    if (mode !== 'photo' && !cameraActive) return
    return () => stopCamera()
  }, [mode])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
      setSearchError(null)
    } catch {
      setSearchError('Camera access denied. Allow camera permission and try again.')
    }
  }

  async function captureAndIdentify() {
    if (!videoRef.current || !claudeApiKey) {
      if (!claudeApiKey) setSearchError('Claude API key required for photo recognition. Add it in Settings.')
      return
    }
    setCameraScanning(true)
    setSearchError(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

      const result = await identifyBookFromImage(base64, claudeApiKey)
      stopCamera()

      if (!result.title) throw new Error('Could not identify a book in this photo')

      // Search Google Books for the identified book
      const query = `${result.title} ${result.author || ''}`.trim()
      const books = await searchBooks(query, googleBooksApiKey)
      if (books.length > 0) {
        setSelected(books[0])
        setSearchError(null)
      } else {
        // Fall back to manual entry with identified title/author
        setSelected({
          googleBooksId: `photo-${Date.now()}`,
          title: result.title,
          authors: result.author ? [result.author] : [],
          coverUrl: null,
          isbn: null,
          genres: [],
          series: { name: null, volume: null, totalVolumes: null, status: 'unknown' },
          source: 'photo',
        })
      }
    } catch (err) {
      setSearchError(err.message || 'Could not identify book. Try a clearer photo or search manually.')
    } finally {
      setCameraScanning(false)
    }
  }

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
    } catch {
      setSearchError('Search failed. Check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  async function handleSeriesSearch(e) {
    e.preventDefault()
    if (!seriesSearch.trim()) return
    setSearching(true)
    setSearchError(null)
    setSeriesResults([])
    try {
      let data = await searchSeriesBooks(seriesSearch, seriesAuthor, googleBooksApiKey)
      if (data.length === 0) {
        data = await searchOpenLibrarySeries(seriesSearch, seriesAuthor)
      }
      setSeriesResults(data)
      setSelectedSeriesIds(data.map((book) => book.googleBooksId || book.openLibraryId))
      if (data.length === 0) setSearchError('No series books found. Try the series name with the author.')
    } catch {
      try {
        const data = await searchOpenLibrarySeries(seriesSearch, seriesAuthor)
        setSeriesResults(data)
        setSelectedSeriesIds(data.map((book) => book.googleBooksId || book.openLibraryId))
        if (data.length === 0) setSearchError('No series books found. Try the series name with the author.')
      } catch {
        setSearchError('Series search failed. Check your connection and try again.')
      }
    } finally {
      setSearching(false)
    }
  }

  async function handleSeriesImport() {
    const booksToImport = seriesResults
      .filter((book) => selectedSeriesIds.includes(book.googleBooksId || book.openLibraryId))
      .map((book, index) => ({
        ...book,
        readingStatus: status,
        rating: null,
        dateFinished: status === 'read' ? new Date().toISOString() : null,
        source: 'series_import',
        series: {
          ...(book.series || {}),
          name: seriesSearch.trim(),
          volume: book.series?.volume || index + 1,
          totalVolumes: selectedSeriesIds.length,
          status: 'unknown',
        },
      }))

    if (!booksToImport.length) return
    setSaving(true)
    await importBooks(booksToImport)
    setSaving(false)
    onDone()
  }

  function startManualAdd() {
    const [titlePart, authorPart] = query.split(/\s+by\s+/i)
    setSelected({
      googleBooksId: `manual-${Date.now()}`,
      title: titlePart?.trim() || query.trim() || 'Untitled',
      authors: authorPart ? [authorPart.trim()] : [],
      coverUrl: null,
      isbn: null,
      genres: [],
      series: { name: null, volume: null, totalVolumes: null, status: 'unknown' },
      source: 'manual',
    })
    setSearchError(null)
  }

  function handleVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSearchError('Voice input is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'nl-NL'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onerror = () => {
      setListening(false)
      setSearchError('Voice input failed. Try typing the title or author.')
    }
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) {
        setQuery(transcript)
        setSearchError(null)
      }
    }
    recognition.start()
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
      series: {
        ...(selected.series || {}),
        name: seriesName.trim() || selected.series?.name || null,
        volume: seriesVolume ? Number(seriesVolume) : selected.series?.volume || null,
      },
      googleBooksId: selected.googleBooksId,
      readingStatus: status,
      rating,
      dateFinished: status === 'read' ? new Date().toISOString() : null,
      source: selected.source || 'manual',
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

          {/* Series */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Series details
            </label>
            <div className="grid grid-cols-[1fr_76px] gap-2">
              <input
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="Series name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <input
                value={seriesVolume}
                onChange={(e) => setSeriesVolume(e.target.value)}
                inputMode="numeric"
                placeholder="#"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
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
        {mode !== 'series' ? (
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
            type="button"
            onClick={handleVoiceSearch}
            className={`px-3 py-2.5 border rounded-xl text-sm transition-colors flex-shrink-0 ${
              listening
                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                : 'border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
            aria-label="Search by voice"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-12 1.5a6 6 0 006 6m0 0v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V5.25a3 3 0 10-6 0v7.5a3 3 0 003 3z" />
            </svg>
          </button>
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
        ) : (
          <form onSubmit={handleSeriesSearch} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={seriesSearch}
                onChange={(e) => setSeriesSearch(e.target.value)}
                placeholder="Series name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <input
                type="text"
                value={seriesAuthor}
                onChange={(e) => setSeriesAuthor(e.target.value)}
                placeholder="Author"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !seriesSearch.trim()}
              className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {searching ? 'Searching...' : 'Find Series'}
            </button>
          </form>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-4">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            ['manual', 'Manual', 'Google Books'],
            ['voice', 'Voice', listening ? 'Listening...' : 'Tap mic'],
            ['series', 'Series', 'Bulk import'],
            ['photo', 'Photo', 'Scan cover'],
          ].map(([id, label, helper]) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                if (id === 'voice') {
                  setMode('manual')
                  handleVoiceSearch()
                  return
                }
                if (id === 'photo') {
                  setMode('photo')
                  setSearchError(null)
                  setResults([])
                  return
                }
                setMode(id)
                setSearchError(null)
              }}
              className={`rounded-xl border p-3 text-left ${
                mode === id || (id === 'voice' && listening)
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-slate-700/60 bg-slate-800/40'
              }`}
            >
              <p className="text-xs font-semibold text-slate-200">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{helper}</p>
            </button>
          ))}
        </div>

        {mode === 'photo' && (
          <div className="flex flex-col items-center gap-4 py-4">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex flex-col items-center gap-3 w-full py-10 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-500/50 transition-colors"
              >
                <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <div className="text-center">
                  <p className="text-slate-300 font-semibold">Open Camera</p>
                  <p className="text-xs text-slate-500 mt-0.5">Point at a book cover to identify it</p>
                </div>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-800 aspect-[3/4]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {cameraScanning && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-300">Identifying book...</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={captureAndIdentify}
                    disabled={cameraScanning}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold disabled:opacity-50"
                  >
                    Identify Book
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'series' && seriesResults.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">{seriesResults.length} possible series books</p>
              <button
                type="button"
                onClick={handleSeriesImport}
                disabled={saving || selectedSeriesIds.length === 0}
                className="px-3 py-2 bg-amber-500 text-slate-900 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Import {selectedSeriesIds.length}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium ${
                    status === opt.value
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {seriesResults.map((book) => {
              const bookId = book.googleBooksId || book.openLibraryId
              const checked = selectedSeriesIds.includes(bookId)
              return (
                <button
                  key={bookId}
                  type="button"
                  onClick={() =>
                    setSelectedSeriesIds((ids) =>
                      checked ? ids.filter((id) => id !== bookId) : [...ids, bookId]
                    )
                  }
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left ${
                    checked ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-800/60 border-slate-700/50'
                  }`}
                >
                  <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-slate-700">
                    {book.coverUrl && <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 line-clamp-2">{book.title}</p>
                    <p className="text-xs text-slate-400 truncate">{book.authors?.join(', ')}</p>
                  </div>
                  <span className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-600'}`}>
                    {checked && (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {mode === 'series' && searchError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400">{searchError}</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px]">
              Try a shorter series name, the author only, or add the books one by one from Manual search.
            </p>
          </div>
        )}

        {searchError && mode !== 'series' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400">{searchError}</p>
            <button
              type="button"
              onClick={startManualAdd}
              className="mt-4 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm font-semibold hover:border-amber-500/40"
            >
              Add manually instead
            </button>
          </div>
        )}

        {!searchError && results.length === 0 && !searching && mode === 'manual' && (
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

        {results.length > 0 && mode === 'manual' && (
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
