import { useState } from 'react'
import { usePreferencesStore, GENRE_OPTIONS } from '../../store/preferencesStore'

export default function SettingsView() {
  const prefs = usePreferencesStore()

  const [claudeApiKey, setClaudeApiKey] = useState(prefs.claudeApiKey)
  const [googleBooksApiKey, setGoogleBooksApiKey] = useState(prefs.googleBooksApiKey)
  const [preferredGenres, setPreferredGenres] = useState(prefs.preferredGenres)
  const [preferredLanguage, setPreferredLanguage] = useState(prefs.preferredLanguage)
  const [koboPlusSubscriber, setKoboPlusSubscriber] = useState(prefs.koboPlusSubscriber)
  const [saved, setSaved] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [showGoogleKey, setShowGoogleKey] = useState(false)

  function toggleGenre(genre) {
    setPreferredGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  function handleSave() {
    prefs.updatePreferences({
      claudeApiKey,
      googleBooksApiKey,
      preferredGenres,
      preferredLanguage,
      koboPlusSubscriber,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* API Keys */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">API Keys</h2>
          <div className="flex flex-col gap-3">
            {/* Claude API Key */}
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Claude API Key
                <span className="ml-2 text-[10px] font-normal text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Required for recommendations</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Get your key at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">
                  console.anthropic.com
                </a>
              </p>
              <div className="relative">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  value={claudeApiKey}
                  onChange={(e) => setClaudeApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showClaudeKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {claudeApiKey && (
                <p className="text-[10px] text-emerald-400/70 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  API key saved
                </p>
              )}
            </div>

            {/* Google Books API Key */}
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Google Books API Key
                <span className="ml-2 text-[10px] font-normal text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">Optional</span>
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Improves search results. Works without it too.
              </p>
              <div className="relative">
                <input
                  type={showGoogleKey ? 'text' : 'password'}
                  value={googleBooksApiKey}
                  onChange={(e) => setGoogleBooksApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGoogleKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showGoogleKey ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Preferred Language</h2>
          <div className="flex gap-3">
            {['English', 'Dutch'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setPreferredLanguage(lang)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                  preferredLanguage === lang
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </section>

        {/* Preferred Genres */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Preferred Genres</h2>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((genre) => {
              const selected = preferredGenres.includes(genre)
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {selected && (
                    <svg className="w-3 h-3 inline mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  )}
                  {genre}
                </button>
              )
            })}
          </div>
        </section>

        {/* Kobo Plus */}
        <section>
          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-200">Kobo Plus Subscriber</p>
              <p className="text-xs text-slate-500 mt-0.5">Prefer books available in Kobo Plus catalog</p>
            </div>
            <button
              type="button"
              onClick={() => setKoboPlusSubscriber((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                koboPlusSubscriber ? 'bg-amber-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  koboPlusSubscriber ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 font-bold rounded-xl text-base transition-all ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-900'
          }`}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Saved!
            </span>
          ) : (
            'Save Settings'
          )}
        </button>

        <p className="text-[11px] text-slate-600 text-center pb-4">
          All data is stored locally on your device. API keys are stored in browser localStorage.
        </p>
      </div>
    </div>
  )
}
