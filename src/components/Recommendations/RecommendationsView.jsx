import { useEffect } from 'react'
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
