"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

async function request(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export function DashboardClient() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["projects"], queryFn: () => request("/api/projects") });
  const form = useForm({ resolver: zodResolver(projectSchema), defaultValues: { name: "", description: "" } });

  const createProject = useMutation({
    mutationFn: (payload: any) => request("/api/projects", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => request(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader><CardTitle>Create new strategy board</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={form.handleSubmit((values) => createProject.mutate(values))}>
            <Input placeholder="Project name" {...form.register("name")} />
            <Textarea placeholder="Project description" {...form.register("description")} />
            <Button type="submit">Create Project</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((project: any) => (
          <Card key={project.id}>
            <CardHeader><CardTitle>{project.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="flex gap-2">
                <Link href={`/project/${project.id}`}><Button size="sm">Open</Button></Link>
                <Button size="sm" variant="destructive" onClick={() => deleteProject.mutate(project.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
