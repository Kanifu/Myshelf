import { create } from 'zustand'
import { db } from '../db/database'

export const useRecommendationStore = create((set, get) => ({
  recommendations: [],
  loading: false,
  error: null,

  loadRecommendations: async () => {
    try {
      const recs = await db.recommendations.orderBy('generatedAt').reverse().toArray()
      set({ recommendations: recs })
    } catch (err) {
      console.error('Failed to load recommendations', err)
    }
  },

  setRecommendations: async (recs) => {
    // Clear old ones and store new batch
    await db.recommendations.clear()
    await db.recommendations.bulkAdd(recs)
    set({ recommendations: recs })
  },

  updateFeedback: async (id, feedback) => {
    await db.recommendations.update(id, { feedback })
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, feedback } : r
      ),
    }))
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
