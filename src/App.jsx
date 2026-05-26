import { useState, useEffect } from 'react'
import NavBar from './components/Layout/NavBar'
import LibraryView from './components/Library/LibraryView'
import AddBookSearch from './components/AddBook/AddBookSearch'
import RecommendationsView from './components/Recommendations/RecommendationsView'
import SeriesExplorer from './components/SeriesExplorer/SeriesExplorer'
import SettingsView from './components/Settings/SettingsView'
import StatsView from './components/Stats/StatsView'
import Onboarding from './components/Onboarding/Onboarding'
import { useLibraryStore } from './store/libraryStore'
import { usePreferencesStore } from './store/preferencesStore'

export default function App() {
  const [activeTab, setActiveTab] = useState('library')
  const loadBooks = useLibraryStore((s) => s.loadBooks)
  const onboarded = usePreferencesStore((s) => s.onboarded)
  const theme = usePreferencesStore((s) => s.theme)

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Apply / remove 'dark' class on <html> based on theme preference
  useEffect(() => {
    const html = document.documentElement

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = (e) => html.classList.toggle('dark', e.matches)
      apply(mq)                         // immediate
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }

    html.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (!onboarded) {
    return <Onboarding />
  }

  return (
    <div className="flex flex-col min-h-svh bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-[480px] mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'library' && <LibraryView />}
        {activeTab === 'add' && <AddBookSearch onDone={() => setActiveTab('library')} />}
        {activeTab === 'recommendations' && <RecommendationsView />}
        {activeTab === 'series' && <SeriesExplorer />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
