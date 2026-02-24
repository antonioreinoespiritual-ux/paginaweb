'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { EmptyState, PageHeader, Skeleton, ConfirmButton, Field, Input, TextArea } from '@/app/components/ui/shared';
import { useState } from 'react';
import { useToast } from '@/app/components/ui/toast';

export default function DashboardPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const routes = useQuery({ queryKey: ['api-routes'], queryFn: () => api.get<string[]>('/api/routes') });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.get<any[]>('/projects') });

  const create = useMutation({
    mutationFn: () => api.post('/projects', { name, description }),
    onSuccess: () => {
      setName('');
      setDescription('');
      qc.invalidateQueries({ queryKey: ['projects'] });
      push('Proyecto creado');
    },
    onError: () => push('No se pudo crear proyecto', 'error'),
  });

  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/projects/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }) });

  return (
    <div className='space-y-4'>
      <PageHeader title='Dashboard operativo' subtitle='Diagnóstico + proyectos base para organizar hipótesis.' />
      <div className='grid md:grid-cols-2 gap-4'>
        <div className='card space-y-2'>
          <h3 className='font-medium'>Crear proyecto</h3>
          <Field label='Nombre'><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label='Descripción'><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <button className='bg-accent px-3 py-2 rounded disabled:opacity-50' disabled={!name.trim()} onClick={() => create.mutate()}>Guardar proyecto</button>
        </div>
        <div className='card'>
          <h3 className='font-medium mb-2'>Rutas API disponibles (Fase 0)</h3>
          {routes.isLoading && <Skeleton className='h-28' />}
          {routes.error && <p className='text-red-400 text-sm'>Error cargando rutas.</p>}
          <div className='text-xs max-h-52 overflow-auto space-y-1'>{routes.data?.map((r) => <div key={r}>{r}</div>)}</div>
        </div>
      </div>

      <div className='card'>
        <h3 className='font-medium mb-2'>Proyectos</h3>
        {projects.isLoading && <Skeleton className='h-16' />}
        {!projects.isLoading && !projects.data?.length && <EmptyState title='Sin proyectos' description='Crea tu primer proyecto para empezar a registrar hipótesis.' />}
        <ul className='space-y-2'>
          {projects.data?.map((p) => (
            <li key={p.id} className='flex justify-between bg-soft rounded p-2 text-sm'>
              <span>{p.name}</span>
              <ConfirmButton onConfirm={() => remove.mutate(p.id)}>Eliminar</ConfirmButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
