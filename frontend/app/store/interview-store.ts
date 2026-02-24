import { create } from 'zustand';

type LiveState = {
  interviewId?: number;
  saleMode: boolean;
  localScore: number;
  setScore: (value: number) => void;
  toggleSale: () => void;
};

export const useInterviewStore = create<LiveState>((set) => ({
  saleMode: false,
  localScore: 0,
  setScore: (value) => set({ localScore: value }),
  toggleSale: () => set((s) => ({ saleMode: !s.saleMode })),
}));
