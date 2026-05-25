import { useMemo } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { usePreferencesStore } from '../../store/preferencesStore'

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span className="text-[10px] text-slate-500">{value}</span>
      <div className="w-full bg-slate-800 rounded-sm overflow-hidden" style={{ height: 60 }}>
        <div
          className={`w-full rounded-sm transition-all ${color}`}
          style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-slate-100' }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function StatsView() {
  const { books } = useLibraryStore()
  const readingPaceGoal = usePreferencesStore((s) => s.readingPaceGoal)

  const stats = useMemo(() => {
    const read = books.filter((b) => b.readingStatus === 'read')
    const reading = books.filter((b) => b.readingStatus === 'reading')
    const want = books.filter((b) => b.readingStatus === 'want_to_read')
    const dnf = books.filter((b) => b.readingStatus === 'dnf')

    // Average rating
    const rated = books.filter((b) => b.rating)
    const avgRating = rated.length
      ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
      : null

    // Genre breakdown
    const genreCounts = {}
    books.forEach((b) => {
      ;(b.genres || []).slice(0, 2).forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1
      })
    })
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Books read per month (last 6 months)
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      }
    })
    read.forEach((b) => {
      const finished = b.dateFinished ? new Date(b.dateFinished) : new Date(b.dateAdded)
      months.forEach((m) => {
        if (finished.getFullYear() === m.year && finished.getMonth() === m.month) {
          m.count++
        }
      })
    })

    // This month's read count
    const thisMonth = months[months.length - 1].count

    // Total pages (if available)
    const totalPages = books
      .filter((b) => b.readingStatus === 'read' && b.pageCount)
      .reduce((sum, b) => sum + (b.pageCount || 0), 0)

    return { read, reading, want, dnf, avgRating, topGenres, months, thisMonth, totalPages, rated }
  }, [books])

  if (books.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-slate-100">Stats</h1>
          <p className="text-xs text-slate-500">Your reading at a glance</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-slate-300 font-semibold">No data yet</p>
          <p className="text-slate-500 text-sm mt-1">Add books to your shelf to see stats</p>
        </div>
      </div>
    )
  }

  const maxMonthCount = Math.max(...stats.months.map((m) => m.count), 1)
  const maxGenreCount = stats.topGenres.length > 0 ? stats.topGenres[0][1] : 1

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Stats</h1>
        <p className="text-xs text-slate-500">Your reading at a glance</p>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-6">

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Books read" value={stats.read.length} color="text-emerald-400" />
          <StatCard
            label="Average rating"
            value={stats.avgRating ? `${stats.avgRating} ★` : '—'}
            sub={stats.rated.length ? `${stats.rated.length} rated` : 'no ratings yet'}
            color="text-amber-400"
          />
          <StatCard label="Currently reading" value={stats.reading.length} color="text-sky-400" />
          <StatCard
            label="Want to read"
            value={stats.want.length}
            sub={stats.dnf.length ? `${stats.dnf.length} DNF` : null}
            color="text-slate-100"
          />
        </div>

        {/* Reading pace goal */}
        {readingPaceGoal && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">This month</p>
              <p className="text-xs text-slate-400">{stats.thisMonth} / {readingPaceGoal} books</p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.thisMonth >= readingPaceGoal ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min((stats.thisMonth / readingPaceGoal) * 100, 100)}%` }}
              />
            </div>
            {stats.thisMonth >= readingPaceGoal && (
              <p className="text-xs text-emerald-400 mt-1.5">Goal reached!</p>
            )}
          </div>
        )}

        {/* Books read per month */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Books read — last 6 months</p>
          <div className="flex items-end gap-2">
            {stats.months.map((m) => (
              <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1.5">
                <Bar value={m.count} max={maxMonthCount} color="bg-amber-500" />
                <span className="text-[10px] text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top genres */}
        {stats.topGenres.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Top genres</p>
            <div className="flex flex-col gap-2.5">
              {stats.topGenres.map(([genre, count]) => (
                <div key={genre}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-300">{genre}</span>
                    <span className="text-xs text-slate-500">{count} {count === 1 ? 'book' : 'books'}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-amber-500/70"
                      style={{ width: `${(count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total pages */}
        {stats.totalPages > 0 && (
          <StatCard
            label="Total pages read"
            value={stats.totalPages.toLocaleString()}
            sub="from books with page count data"
            color="text-violet-400"
          />
        )}

        <div className="pb-4" />
      </div>
    </div>
  )
}
