export type CanvasSectionKey =
  | "segments"
  | "problems"
  | "solutions"
  | "attributes"
  | "differentiation"
  | "positioning";

export interface CanvasSection {
  id: CanvasSectionKey;
  title: string;
}
