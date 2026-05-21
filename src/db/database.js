import Dexie from 'dexie'

export const db = new Dexie('myshelf-db')

db.version(1).stores({
  books: 'id, title, readingStatus, dateAdded, googleBooksId',
  recommendations: 'id, generatedAt, feedback',
})
