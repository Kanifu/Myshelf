import { useState } from 'react'
import { GENRE_OPTIONS, usePreferencesStore } from '../../store/preferencesStore'

export default function Onboarding() {
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences)
  const [preferredLanguage, setPreferredLanguage] = useState('English')
  const [preferredGenres, setPreferredGenres] = useState([])

  function toggleGenre(genre) {
    setPreferredGenres((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]
    )
  }

  function finish() {
    updatePreferences({
      preferredLanguage,
      preferredGenres,
      onboarded: true,
    })
  }

  return (
    <div className="min-h-svh bg-slate-900 text-slate-100 max-w-[480px] mx-auto flex flex-col">
      <main className="flex-1 px-5 pt-14 pb-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">MyShelf setup</p>
          <h1 className="text-3xl font-bold leading-tight">Build your shelf around your taste.</h1>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            Choose a starting language and a few genres. You can change these later in Settings.
          </p>
        </div>

        <section className="mb-7">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Preferred language</h2>
          <div className="grid grid-cols-2 gap-3">
            {['English', 'Dutch'].map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setPreferredLanguage(language)}
                className={`py-3 rounded-xl border text-sm font-semibold ${
                  preferredLanguage === language
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((genre) => {
              const selected = preferredGenres.includes(genre)
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium ${
                    selected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        </section>
      </main>

      <div className="p-5 border-t border-slate-800">
        <button
          type="button"
          onClick={finish}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl"
        >
          Start MyShelf
        </button>
        <button
          type="button"
          onClick={finish}
          className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-300"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
