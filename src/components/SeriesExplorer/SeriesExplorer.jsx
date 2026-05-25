import { useMemo } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { getKoboSearchUrl } from '../../services/koboService'

function getSeriesGroups(books) {
  const grouped = new Map()

  books.forEach((book) => {
    const name = book.series?.name?.trim()
    if (!name) return
    if (!grouped.has(name)) grouped.set(name, [])
    grouped.get(name).push(book)
  })

  return Array.from(grouped.entries())
    .map(([name, items]) => {
      const sorted = [...items].sort((a, b) => (a.series?.volume || 999) - (b.series?.volume || 999))
      const totalVolumes = Math.max(...sorted.map((book) => book.series?.totalVolumes || 0), sorted.length)
      const readCount = sorted.filter((book) => book.readingStatus === 'read').length
      const highestVolume = Math.max(...sorted.map((book) => book.series?.volume || 0))
      const nextVolume = highestVolume ? highestVolume + 1 : null
      return { name, books: sorted, totalVolumes, readCount, nextVolume }
    })
    .sort((a, b) => b.readCount - a.readCount || a.name.localeCompare(b.name))
}

export default function SeriesExplorer() {
  const books = useLibraryStore((state) => state.books)
  const series = useMemo(() => getSeriesGroups(books), [books])
  const standaloneWithSeriesHint = books.filter((book) => !book.series?.name && book.readingStatus !== 'dnf').slice(0, 4)

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Series</h1>
        <p className="text-xs text-slate-500">Track progress and jump to the next book.</p>
      </div>

      <div className="flex-1 px-4 py-4">
        {series.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 19.5A2.25 2.25 0 016.75 17.25h10.5A2.25 2.25 0 0119.5 19.5m-15 0A2.25 2.25 0 006.75 21.75h10.5A2.25 2.25 0 0019.5 19.5m-15 0v-12A2.25 2.25 0 016.75 5.25h10.5A2.25 2.25 0 0119.5 7.5v12" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold text-lg">No series yet</p>
            <p className="text-slate-500 text-sm mt-1 max-w-[280px]">
              Add series details on a book to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {series.map((item) => {
              const progress = item.totalVolumes ? Math.round((item.readCount / item.totalVolumes) * 100) : 0
              const firstAuthor = item.books[0]?.authors?.[0] || ''
              return (
                <section key={item.name} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-100 truncate">{item.name}</h2>
                      <p className="text-xs text-slate-500">
                        {item.readCount} read · {item.books.length} on shelf{item.totalVolumes ? ` · ${item.totalVolumes} known` : ''}
                      </p>
                    </div>
                    <a
                      href={getKoboSearchUrl(`${item.name} ${item.nextVolume ? `book ${item.nextVolume}` : ''}`, firstAuthor)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold"
                    >
                      Kobo
                    </a>
                  </div>

                  <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {item.books.map((book) => (
                      <div key={book.id} className="w-12 flex-shrink-0">
                        <div className={`aspect-[2/3] rounded-md overflow-hidden border ${book.readingStatus === 'read' ? 'border-emerald-500/50' : 'border-slate-700'}`}>
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                              {book.series?.volume || '?'}
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500 text-center truncate">
                          {book.series?.volume ? `#${book.series.volume}` : book.readingStatus}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {standaloneWithSeriesHint.length > 0 && (
          <section className="mt-6 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/30">
            <h2 className="text-sm font-semibold text-slate-200">Possible next cleanup</h2>
            <p className="text-xs text-slate-500 mt-1">
              These books have no series metadata yet. Add series name and volume when relevant.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {standaloneWithSeriesHint.map((book) => (
                <p key={book.id} className="text-xs text-slate-400 truncate">
                  {book.title} <span className="text-slate-600">by {book.authors?.join(', ')}</span>
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
