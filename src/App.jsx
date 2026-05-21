import { useState, useEffect } from 'react'
import NavBar from './components/Layout/NavBar'
import LibraryView from './components/Library/LibraryView'
import AddBookSearch from './components/AddBook/AddBookSearch'
import RecommendationsView from './components/Recommendations/RecommendationsView'
import SettingsView from './components/Settings/SettingsView'
import { useLibraryStore } from './store/libraryStore'

export default function App() {
  const [activeTab, setActiveTab] = useState('library')
  const loadBooks = useLibraryStore((s) => s.loadBooks)

  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  return (
    <div className="flex flex-col min-h-svh bg-slate-900 text-slate-100 max-w-[480px] mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'library' && <LibraryView />}
        {activeTab === 'add' && <AddBookSearch onDone={() => setActiveTab('library')} />}
        {activeTab === 'recommendations' && <RecommendationsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
