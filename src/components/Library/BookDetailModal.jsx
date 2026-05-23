import { useState } from 'react'
import { useLibraryStore } from '../../store/libraryStore'
import { getKoboSearchUrl } from '../../services/koboService'

const STATUS_OPTIONS = [
  { value: 'read', label: 'Read', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { value: 'reading', label: 'Reading', className: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
  { value: 'want_to_read', label: 'Want to Read', className: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { value: 'dnf', label: 'DNF', className: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
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
          className="p-0.5 focus:outline-none"
        >
          <svg
            className={`w-7 h-7 transition-colors ${star <= (hover ?? value ?? 0) ? 'text-amber-400' : 'text-slate-600'}`}
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

export default function BookDetailModal({ book, onClose }) {
  const { updateBook, deleteBook } = useLibraryStore()
  const [status, setStatus] = useState(book.readingStatus)
  const [rating, setRating] = useState(book.rating)
  const [note, setNote] = useState(book.note || '')
  const [seriesName, setSeriesName] = useState(book.series?.name || '')
  const [seriesVolume, setSeriesVolume] = useState(book.series?.volume || '')
  const [tags, setTags] = useState(book.tags?.join(', ') || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateBook(book.id, {
      readingStatus: status,
      rating,
      note,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      series: {
        ...(book.series || {}),
        name: seriesName.trim() || null,
        volume: seriesVolume ? Number(seriesVolume) : null,
      },
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    await deleteBook(book.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ maxWidth: 480, left: '50%', transform: 'translateX(-50%)' }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full bg-slate-900 rounded-t-2xl border-t border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="px-4 pb-8">
          {/* Header */}
          <div className="flex gap-4 mb-6">
            <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-lg">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-lg font-bold text-slate-100 leading-tight">{book.title}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{book.authors?.join(', ')}</p>
              {book.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {book.genres.slice(0, 3).map((g) => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-2">
                Added {new Date(book.dateAdded).toLocaleDateString()}
              </p>
              <a
                href={getKoboSearchUrl(book.title, book.authors?.[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300"
              >
                Search on Kobo
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>

          {/* Status */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Reading Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    status === opt.value
                      ? opt.className
                      : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Rating {rating ? `(${rating}/5)` : '(not rated)'}
            </label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Series */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Series
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

          {/* Tags */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="cozy, epic, Dutch"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Your thoughts on this book..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl transition-colors disabled:opacity-50 mb-3"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 border border-slate-700 text-slate-400 rounded-xl text-sm hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-xl text-sm hover:bg-rose-500/30"
              >
                Yes, Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 text-rose-400/70 hover:text-rose-400 text-sm transition-colors"
            >
              Remove from Library
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
