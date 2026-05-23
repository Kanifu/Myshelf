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
      title: 'Untitled',
      authors: [],
      coverUrl: null,
      isbn: null,
      genres: [],
      tags: [],
      series: {
        name: null,
        volume: null,
        totalVolumes: null,
        status: 'unknown',
      },
      readingStatus: 'want_to_read',
      rating: null,
      dateAdded: new Date().toISOString(),
      dateFinished: null,
      source: 'manual',
      note: '',
      googleBooksId: null,
      openLibraryId: null,
      ...bookData,
    }
    await db.books.add(book)
    set((state) => ({ books: [book, ...state.books] }))
    return book
  },

  importBooks: async (booksToImport) => {
    const now = new Date().toISOString()
    const books = booksToImport.map((book) => ({
      id: book.id || crypto.randomUUID(),
      title: book.title || 'Untitled',
      authors: Array.isArray(book.authors) ? book.authors : String(book.authors || '').split(',').filter(Boolean),
      coverUrl: book.coverUrl || null,
      isbn: book.isbn || null,
      genres: Array.isArray(book.genres) ? book.genres : [],
      tags: Array.isArray(book.tags) ? book.tags : [],
      series: {
        name: book.series?.name || null,
        volume: book.series?.volume ?? null,
        totalVolumes: book.series?.totalVolumes ?? null,
        status: book.series?.status || 'unknown',
      },
      readingStatus: book.readingStatus || 'read',
      rating: book.rating ?? null,
      note: book.note || '',
      dateAdded: book.dateAdded || now,
      dateFinished: book.dateFinished || null,
      source: book.source || 'kobo_import',
      googleBooksId: book.googleBooksId || null,
      openLibraryId: book.openLibraryId || null,
    }))

    await db.books.bulkPut(books)
    const allBooks = await db.books.orderBy('dateAdded').reverse().toArray()
    set({ books: allBooks })
    return books.length
  },

  updateBook: async (id, updates) => {
    const current = get().books.find((b) => b.id === id)
    const nextUpdates = {
      ...updates,
      dateFinished:
        updates.readingStatus === 'read' && current?.readingStatus !== 'read'
          ? new Date().toISOString()
          : updates.dateFinished ?? current?.dateFinished ?? null,
    }
    await db.books.update(id, nextUpdates)
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...nextUpdates } : b)),
    }))
  },

  deleteBook: async (id) => {
    await db.books.delete(id)
    set((state) => ({ books: state.books.filter((b) => b.id !== id) }))
  },
}))
