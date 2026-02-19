import { z } from "zod";

const sanitizeText = (value: string) => value.trim().replace(/<[^>]*>/g, "");

export const projectSchema = z.object({
  name: z.string().min(2).max(120).transform(sanitizeText),
  description: z.string().min(2).max(500).transform(sanitizeText)
});

export const segmentSchema = z.object({
  title: z.string().min(2).max(120).transform(sanitizeText),
  description: z.string().min(2).max(400).transform(sanitizeText),
  projectId: z.string().cuid()
});

export const problemSchema = z.object({
  description: z.string().min(2).max(400).transform(sanitizeText),
  severity: z.number().int().min(1).max(5),
  projectId: z.string().cuid()
});

export const solutionSchema = z.object({
  description: z.string().min(2).max(400).transform(sanitizeText),
  impact: z.number().int().min(1).max(5),
  projectId: z.string().cuid()
});

export const kpiSchema = z.object({
  name: z.string().min(2).max(120).transform(sanitizeText),
  metricType: z.string().min(2).max(40).transform(sanitizeText),
  value: z.number().min(0),
  target: z.number().min(0),
  projectId: z.string().cuid()
});

export const milestoneSchema = z.object({
  title: z.string().min(2).max(120).transform(sanitizeText),
  dueDate: z.string().datetime(),
  status: z.enum(["planned", "in-progress", "completed"]),
  projectId: z.string().cuid()
});

export const canvasSchema = z.object({
  attributes: z.array(z.object({ id: z.string().optional(), title: z.string(), description: z.string() })),
  differentiators: z.array(z.object({ id: z.string().optional(), title: z.string(), description: z.string() })),
  positionings: z.array(z.object({ id: z.string().optional(), statement: z.string() })),
  userStories: z.array(z.object({ id: z.string().optional(), role: z.string(), feature: z.string(), benefit: z.string() }))
});
