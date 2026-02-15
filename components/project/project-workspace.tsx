"use client";

import { ReactNode, useMemo } from "react";
import dynamic from "next/dynamic";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { useCanvasStore } from "@/store/canvas-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { kpiSchema, milestoneSchema } from "@/lib/validators";

type ProjectDetail = any;
const KpiChart = dynamic(() => import("./kpi-chart"), { ssr: false });

async function request(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function SortableCard({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const { sections, setSections } = useCanvasStore();
  const queryClient = useQueryClient();

  const { data } = useQuery<ProjectDetail>({ queryKey: ["project", projectId], queryFn: () => request(`/api/projects/${projectId}`) });

  const addKpi = useMutation({
    mutationFn: (payload: any) => request("/api/kpis", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });

  const addMilestone = useMutation({
    mutationFn: (payload: any) => request("/api/milestones", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    setSections(arrayMove(sections, oldIndex, newIndex));
  };

  const kpiForm = useForm({ resolver: zodResolver(kpiSchema.omit({ projectId: true })), defaultValues: { name: "", metricType: "percentage", value: 0, target: 0 } });
  const milestoneForm = useForm({ resolver: zodResolver(milestoneSchema.omit({ projectId: true })), defaultValues: { title: "", dueDate: new Date().toISOString(), status: "planned" as const } });

  const chartData = useMemo(() => data?.kpis?.map((k: any) => ({ name: k.name, value: k.value, target: k.target })) ?? [], [data?.kpis]);

  if (!data) return <div className="p-8">Loading workspace...</div>;

  const sectionMap: Record<string, ReactNode> = {
    segments: data.segments.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.title}: {x.description}</p>),
    problems: data.problems.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.description} (Severity {x.severity})</p>),
    solutions: data.solutions.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.description} (Impact {x.impact})</p>),
    attributes: data.attributes.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.title}: {x.description}</p>),
    differentiation: data.differentiators.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.title}: {x.description}</p>),
    positioning: data.positionings.map((x: any) => <p key={x.id} className="rounded bg-muted p-2 text-sm">{x.statement}</p>)
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex justify-end">
        <a className="inline-flex" href={`/api/projects/${projectId}/export`}><Button><Save className="mr-2 h-4 w-4" />Export JSON</Button></a>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map((section) => (
              <SortableCard key={section.id} id={section.id} title={section.title}>
                <div className="space-y-2">{sectionMap[section.id]}</div>
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>KPI Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-2" onSubmit={kpiForm.handleSubmit((values) => addKpi.mutate({ ...values, projectId }))}>
              <Input placeholder="KPI name" {...kpiForm.register("name")} />
              <Input placeholder="Metric Type" {...kpiForm.register("metricType")} />
              <Input type="number" step="0.1" placeholder="Value" {...kpiForm.register("value", { valueAsNumber: true })} />
              <Input type="number" step="0.1" placeholder="Target" {...kpiForm.register("target", { valueAsNumber: true })} />
              <Button type="submit">Add KPI</Button>
            </form>
            <KpiChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Roadmap Milestones</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-2" onSubmit={milestoneForm.handleSubmit((values) => addMilestone.mutate({ ...values, projectId }))}>
              <Input placeholder="Milestone title" {...milestoneForm.register("title")} />
              <Input type="datetime-local" {...milestoneForm.register("dueDate", { setValueAs: (v) => new Date(v).toISOString() })} />
              <Input placeholder="planned | in-progress | completed" {...milestoneForm.register("status")} />
              <Button type="submit">Add Milestone</Button>
            </form>
            <div className="space-y-2">
              {data.milestones.map((m: any) => (
                <div key={m.id} className="rounded-lg border p-2 text-sm">{m.title} - {new Date(m.dueDate).toLocaleDateString()} - {m.status}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>User Stories</CardTitle></CardHeader>
        <CardContent>
          {data.userStories.map((story: any) => (
            <p key={story.id} className="rounded bg-muted p-2 text-sm">As a {story.role}, I want {story.feature}, so that I can {story.benefit}.</p>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
