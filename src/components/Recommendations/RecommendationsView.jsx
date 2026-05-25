import { useEffect, useState, useMemo } from 'react'
import { useRecommendationStore } from '../../store/recommendationStore'
import { useLibraryStore } from '../../store/libraryStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import { getRecommendations } from '../../services/claudeService'
import { searchBooksByTitleAndAuthor } from '../../services/googleBooksService'
import RecommendationCard from './RecommendationCard'

export default function RecommendationsView() {
  const { recommendations, loading, error, loadRecommendations, setRecommendations, setLoading, setError, clearError } =
    useRecommendationStore()
  const { books } = useLibraryStore()
  const { claudeApiKey, googleBooksApiKey, preferredGenres, preferredLanguage, koboPlusSubscriber } =
    usePreferencesStore()
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  async function handleGenerate() {
    setLoading(true)
    clearError()
    try {
      const recs = await getRecommendations(
        books,
        { preferredGenres, preferredLanguage, koboPlusSubscriber },
        claudeApiKey,
        recommendations
      )

      // Fetch covers from Google Books in the background
      const recsWithCovers = await Promise.all(
        recs.map(async (rec) => {
          try {
            const bookInfo = await searchBooksByTitleAndAuthor(rec.title, rec.author, googleBooksApiKey)
            return { ...rec, coverUrl: bookInfo?.coverUrl || null }
          } catch {
            return rec
          }
        })
      )

      await setRecommendations(recsWithCovers)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Issue #22 — group past batches for history view
  const historyBatches = useMemo(() => {
    const inactive = recommendations.filter((r) => r.active === false && r.batchId)
    const byBatch = {}
    for (const rec of inactive) {
      if (!byBatch[rec.batchId]) {
        byBatch[rec.batchId] = { batchId: rec.batchId, date: rec.generatedAt, recs: [] }
      }
      byBatch[rec.batchId].recs.push(rec)
    }
    return Object.values(byBatch).sort((a, b) => b.date.localeCompare(a.date))
  }, [recommendations])

  const noApiKey = !claudeApiKey

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">For You</h1>
            <p className="text-xs text-slate-500">AI-powered recommendations</p>
          </div>
          {!noApiKey && books.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span>{recommendations.length ? 'Refresh' : 'Get Recs'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {/* No API key state */}
        {noApiKey && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold text-lg">Claude API Key Required</p>
            <p className="text-slate-500 text-sm mt-1 max-w-[260px]">
              Add your Claude API key in Settings to get personalized book recommendations.
            </p>
          </div>
        )}

        {/* Empty library */}
        {!noApiKey && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold text-lg">Add Books First</p>
            <p className="text-slate-500 text-sm mt-1">
              Add some books to your library so Claude can understand your taste.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <p className="text-rose-400 text-sm font-medium">Something went wrong</p>
            <p className="text-rose-400/70 text-xs mt-1">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-xs text-rose-400 hover:text-rose-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-16 h-24 rounded-lg bg-slate-700" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                    <div className="h-3 bg-slate-700 rounded w-full mt-3" />
                    <div className="h-3 bg-slate-700 rounded w-4/5" />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-slate-500 mt-2">
              Claude is reading your library and thinking of recommendations...
            </p>
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              {recommendations.filter((rec) => rec.active !== false).length} current recommendations · {recommendations.length} stored in history
            </p>
            {recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </div>
        )}

        {/* Issue #22 — Recommendation history batches */}
        {!loading && historyBatches.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              {showHistory ? 'Hide' : 'Show'} recommendation history ({historyBatches.length} past {historyBatches.length === 1 ? 'batch' : 'batches'})
            </button>

            {showHistory && (
              <div className="flex flex-col gap-4">
                {historyBatches.map((batch) => {
                  const actedOn = batch.recs.filter((r) => r.feedback === 'want_to_read' || r.feedback === 'already_read').length
                  const rejected = batch.recs.filter((r) => r.feedback === 'not_for_me').length
                  const moreLike = batch.recs.filter((r) => r.feedback === 'more_like_this').length
                  const date = new Date(batch.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <details key={batch.batchId} className="group bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
                        <div>
                          <p className="text-sm font-medium text-slate-300">{date}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {batch.recs.length} recs
                            {actedOn > 0 && <> · <span className="text-emerald-400">{actedOn} added</span></>}
                            {rejected > 0 && <> · <span className="text-rose-400">{rejected} rejected</span></>}
                            {moreLike > 0 && <> · <span className="text-blue-400">{moreLike} more-like-this</span></>}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-3 flex flex-col gap-2 border-t border-slate-700/40 pt-3">
                        {batch.recs.map((rec) => (
                          <div key={rec.id} className="flex items-center gap-3">
                            {rec.coverUrl ? (
                              <img src={rec.coverUrl} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-12 rounded bg-slate-700 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-300 line-clamp-1">{rec.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{rec.author}</p>
                            </div>
                            {rec.feedback && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                rec.feedback === 'want_to_read' || rec.feedback === 'already_read'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : rec.feedback === 'not_for_me'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : rec.feedback === 'more_like_this'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-slate-700 text-slate-400'
                              }`}>
                                {rec.feedback === 'want_to_read' ? 'Added' :
                                 rec.feedback === 'already_read' ? 'Read' :
                                 rec.feedback === 'not_for_me' ? 'Rejected' :
                                 rec.feedback === 'more_like_this' ? 'More like this' :
                                 rec.feedback === 'skipped' ? 'Skipped' : rec.feedback}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* No recs yet, has api key and books */}
        {!loading && !error && recommendations.length === 0 && !noApiKey && books.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-amber-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <p className="text-slate-300 font-semibold text-lg">No recommendations yet</p>
            <p className="text-slate-500 text-sm mt-1">Tap "Get Recs" to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
