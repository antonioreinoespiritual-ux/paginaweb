"use client";

import { create } from "zustand";
import { CanvasSection } from "@/types";

const defaultSections: CanvasSection[] = [
  { id: "segments", title: "Segments" },
  { id: "problems", title: "Problems" },
  { id: "solutions", title: "Solutions" },
  { id: "attributes", title: "Attributes" },
  { id: "differentiation", title: "Differentiation" },
  { id: "positioning", title: "Positioning" }
];

interface CanvasState {
  sections: CanvasSection[];
  setSections: (sections: CanvasSection[]) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  sections: defaultSections,
  setSections: (sections) => set({ sections })
}));
