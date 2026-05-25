import { create } from 'zustand'
import { db } from '../db/database'

export const useRecommendationStore = create((set) => ({
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
    const batchId = crypto.randomUUID()
    const batch = recs.map((rec) => ({
      ...rec,
      batchId,
      active: true,
    }))
    const existing = await db.recommendations.toArray()
    await db.recommendations.bulkPut(existing.map((rec) => ({ ...rec, active: false })))
    await db.recommendations.bulkAdd(batch)
    const allRecs = await db.recommendations.orderBy('generatedAt').reverse().toArray()
    set({ recommendations: allRecs })
  },

  updateFeedback: async (id, feedback) => {
    const feedbackAt = feedback ? new Date().toISOString() : null
    await db.recommendations.update(id, { feedback, feedbackAt })
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, feedback, feedbackAt } : r
      ),
    }))
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
