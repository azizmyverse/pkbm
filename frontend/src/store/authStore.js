import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api, { configureApi } from '@/lib/axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      setToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken } = res.data?.data || {};
          set({ user, accessToken, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout').catch(() => {});
        } finally {
          set({ user: null, accessToken: null });
        }
      },

      refreshUser: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data?.data || get().user });
        } catch (_e) {
          /* ignore */
        }
      },

      updateProfile: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
    }),
    {
      name: 'pkbm-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    },
  ),
);

// Wire axios -> store
function unauthorizedHandler() {
  useAuthStore.setState({ user: null, accessToken: null });
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}
unauthorizedHandler.setToken = (token) => {
  useAuthStore.setState({ accessToken: token });
};

configureApi({
  getToken: () => useAuthStore.getState().accessToken,
  onUnauthorizedHandler: unauthorizedHandler,
});
