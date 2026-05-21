import { useRecommendationStore } from '../../store/recommendationStore'

const FEEDBACK_OPTIONS = [
  {
    value: 'want_to_read',
    label: 'Want to Read',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    ),
    activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    inactiveClass: 'border-slate-700 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400',
  },
  {
    value: 'not_for_me',
    label: 'Not for Me',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    activeClass: 'bg-rose-500/20 border-rose-500/50 text-rose-400',
    inactiveClass: 'border-slate-700 text-slate-400 hover:border-rose-500/30 hover:text-rose-400',
  },
  {
    value: 'skipped',
    label: 'Skip',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
      </svg>
    ),
    activeClass: 'bg-slate-600/50 border-slate-500/50 text-slate-300',
    inactiveClass: 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400',
  },
]

export default function RecommendationCard({ rec, index }) {
  const { updateFeedback } = useRecommendationStore()

  async function handleFeedback(value) {
    // Toggle off if clicking same feedback
    await updateFeedback(rec.id, rec.feedback === value ? null : value)
  }

  return (
    <div className={`bg-slate-800/60 rounded-2xl border transition-all overflow-hidden ${
      rec.feedback === 'not_for_me' || rec.feedback === 'skipped'
        ? 'border-slate-700/30 opacity-60'
        : 'border-slate-700/50'
    }`}>
      <div className="flex gap-3 p-4">
        {/* Cover / Number */}
        <div className="flex-shrink-0">
          {rec.coverUrl ? (
            <img
              src={rec.coverUrl}
              alt={rec.title}
              className="w-16 h-24 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-24 rounded-lg bg-slate-700 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl font-bold text-slate-500">{index + 1}</span>
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-100 text-sm leading-tight line-clamp-2">
                {rec.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{rec.author}</p>
              {rec.seriesName && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {rec.seriesName}{rec.seriesVolume ? ` #${rec.seriesVolume}` : ''}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 font-medium">
              {rec.genre}
            </span>
          </div>

          {/* Reasoning */}
          <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3">
            {rec.reasoning}
          </p>

          {/* Kobo link */}
          <a
            href={rec.koboSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Find on Kobo
          </a>
        </div>
      </div>

      {/* Feedback buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {FEEDBACK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFeedback(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all ${
              rec.feedback === opt.value ? opt.activeClass : opt.inactiveClass
            }`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
