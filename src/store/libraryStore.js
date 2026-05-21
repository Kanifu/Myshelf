import { create } from 'zustand'
import { db } from '../db/database'

export const useLibraryStore = create((set, get) => ({
  books: [],
  loading: false,

  loadBooks: async () => {
    set({ loading: true })
    try {
      const books = await db.books.orderBy('dateAdded').reverse().toArray()
      set({ books, loading: false })
    } catch (err) {
      console.error('Failed to load books', err)
      set({ loading: false })
    }
  },

  addBook: async (bookData) => {
    const book = {
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
      dateFinished: null,
      source: 'manual',
      note: '',
      ...bookData,
    }
    await db.books.add(book)
    set((state) => ({ books: [book, ...state.books] }))
    return book
  },

  updateBook: async (id, updates) => {
    await db.books.update(id, updates)
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  },

  deleteBook: async (id) => {
    await db.books.delete(id)
    set((state) => ({ books: state.books.filter((b) => b.id !== id) }))
  },
}))
