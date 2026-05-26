import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const GENRE_OPTIONS = [
  'Fantasy',
  'Sci-Fi',
  'Mystery',
  'Thriller',
  'Literary Fiction',
  'Non-fiction',
  'Romance',
  'Historical Fiction',
]

export { GENRE_OPTIONS }

export const usePreferencesStore = create(
  persist(
    (set) => ({
      claudeApiKey: '',
      googleBooksApiKey: '',
      preferredGenres: [],
      preferredLanguage: 'English',
      koboPlusSubscriber: false,
      readingPaceGoal: null,
      onboarded: false,
      theme: 'dark', // 'light' | 'dark' | 'system'

      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setGoogleBooksApiKey: (key) => set({ googleBooksApiKey: key }),
      setPreferredGenres: (genres) => set({ preferredGenres: genres }),
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
      setKoboPlusSubscriber: (val) => set({ koboPlusSubscriber: val }),
      setReadingPaceGoal: (goal) => set({ readingPaceGoal: goal }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setTheme: (theme) => set({ theme }),
      updatePreferences: (updates) => set(updates),
    }),
    {
      name: 'myshelf-preferences',
    }
  )
)
