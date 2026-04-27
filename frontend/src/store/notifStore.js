import { create } from 'zustand';
import api from '@/lib/axios';

export const useNotifStore = create((set, get) => ({
  notifikasi: [],
  unreadCount: 0,
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/notifikasi');
      const items = res.data?.data || [];
      const unread = items.filter((n) => !n.isRead).length;
      set({ notifikasi: items, unreadCount: unread, loading: false });
    } catch (_e) {
      set({ loading: false });
    }
  },

  fetchUnread: async () => {
    try {
      const res = await api.get('/notifikasi/unread-count');
      set({ unreadCount: res.data?.data?.count || 0 });
    } catch (_e) {
      /* ignore */
    }
  },

  markRead: async (id) => {
    await api.put(`/notifikasi/${id}/read`).catch(() => {});
    set((state) => ({
      notifikasi: state.notifikasi.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.put('/notifikasi/read-all').catch(() => {});
    set((state) => ({
      notifikasi: state.notifikasi.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  remove: async (id) => {
    await api.delete(`/notifikasi/${id}`).catch(() => {});
    set((state) => {
      const next = state.notifikasi.filter((n) => n.id !== id);
      const unread = next.filter((n) => !n.isRead).length;
      return { notifikasi: next, unreadCount: unread };
    });
  },

  reset: () => set({ notifikasi: [], unreadCount: 0 }),
  _get: get,
}));
