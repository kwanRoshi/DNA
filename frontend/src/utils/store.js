import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const store = create(devtools((set) => ({
  token: null,
  userId: null,
  userInfo: null,
  walletAddress: null,
  healthData: null,
  analysisResult: null,
  isLoading: false,
  error: null,
  setWalletAddress: (address) => set({ walletAddress: address }),
  setHealthData: (data) => set({ healthData: data }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  login: (payload) => set({
    token: payload.token,
    userId: payload.userId,
    userInfo: payload.userInfo
  }),
  logout: () => set({
    token: null,
    userId: null,
    userInfo: null
  }),
  reset: () => set({
    token: null,
    userId: null,
    userInfo: null,
    walletAddress: null,
    healthData: null,
    analysisResult: null,
    isLoading: false,
    error: null
  })
})));

export default store;
