const STATUS_CONFIG = {
  read: { label: 'Read', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  reading: { label: 'Reading', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  want_to_read: { label: 'Want to Read', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  dnf: { label: 'DNF', className: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
}

function StarRating({ rating }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${star <= rating ? 'text-amber-400' : 'text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function BookCard({ book, onClick, viewMode }) {
  const status = STATUS_CONFIG[book.readingStatus] || STATUS_CONFIG.want_to_read

  if (viewMode === 'list') {
    return (
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all text-left"
      >
        <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-slate-700">
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
          <p className="text-sm font-semibold text-slate-100 truncate">{book.title}</p>
          <p className="text-xs text-slate-400 truncate">{book.authors?.join(', ')}</p>
          <StarRating rating={book.rating} />
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </button>
    )
  }

  // Grid mode
  return (
    <button
      onClick={onClick}
      className="flex flex-col bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all overflow-hidden text-left"
    >
      <div className="aspect-[2/3] w-full bg-slate-700 relative">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-2">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-[10px] text-slate-500 text-center leading-tight line-clamp-3">{book.title}</span>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="p-2">
        <p className="text-xs font-semibold text-slate-100 line-clamp-2 leading-tight">{book.title}</p>
        <p className="text-[10px] text-slate-400 truncate mt-0.5">{book.authors?.join(', ')}</p>
        <StarRating rating={book.rating} />
      </div>
    </button>
  )
}
