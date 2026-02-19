'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { ConfirmButton, EmptyState, Field, Input, PageHeader, Skeleton, TextArea } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

const empty = { hypothesis_id: '', name: '', description: '', nodes: '[{"id":"n1","label":"Inicio"}]', edges: '[]' };

export default function FlowsPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState<any>(empty);

  const hypotheses = useQuery({ queryKey: ['hyp-flow'], queryFn: () => api.get<any[]>('/hypotheses') });
  const list = useQuery({ queryKey: ['flows', q], queryFn: () => api.get<any[]>('/flows', { q }) });
  const detail = useQuery({ queryKey: ['flow-detail', selectedId], queryFn: () => api.get<any>(`/flows/${selectedId}`), enabled: !!selectedId });

  useEffect(() => {
    if (detail.data) {
      setForm({
        ...detail.data,
        hypothesis_id: detail.data.hypothesis_id || '',
        nodes: JSON.stringify(detail.data.nodes || [], null, 2),
        edges: JSON.stringify(detail.data.edges || [], null, 2),
      });
    }
  }, [detail.data]);

  const create = useMutation({ mutationFn: () => api.post('/flows', { ...form, hypothesis_id: form.hypothesis_id ? Number(form.hypothesis_id) : null, nodes: JSON.parse(form.nodes || '[]'), edges: JSON.parse(form.edges || '[]') }), onSuccess: (r: any) => { qc.invalidateQueries({ queryKey: ['flows'] }); setSelectedId(r.id); push('Flujo creado'); } });
  const update = useMutation({ mutationFn: () => api.put(`/flows/${selectedId}`, { ...form, hypothesis_id: form.hypothesis_id ? Number(form.hypothesis_id) : null, nodes: JSON.parse(form.nodes || '[]'), edges: JSON.parse(form.edges || '[]') }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['flows'] }); push('Flujo guardado'); } });
  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/flows/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['flows'] }); setSelectedId(null); setForm(empty); push('Flujo eliminado'); } });

  return (
    <div className='grid md:grid-cols-[340px_1fr] gap-4'>
      <section className='space-y-3'>
        <PageHeader title='Flujos de validación' action={<button className='bg-accent px-3 py-2 rounded' onClick={() => { setSelectedId(null); setForm(empty); }}>Nuevo</button>} />
        <div className='card'><Input placeholder='Buscar flow' value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {list.isLoading && <Skeleton className='h-44' />}
        {!list.isLoading && !list.data?.length && <EmptyState title='No hay flows' description='Crea el primer flujo y vincúlalo a una hipótesis.' />}
        <div className='card space-y-2'>
          {list.data?.map((f) => (
            <div key={f.id} className={`p-2 rounded ${selectedId === f.id ? 'bg-soft' : 'bg-[#100a1d]'} flex justify-between`}>
              <button className='text-left text-sm' onClick={() => setSelectedId(f.id)}>{f.name}<div className='text-xs text-gray-400'>v{f.version}</div></button>
              <ConfirmButton onConfirm={() => remove.mutate(f.id)}>Eliminar</ConfirmButton>
            </div>
          ))}
        </div>
      </section>
      <section className='card space-y-2'>
        <h3 className='font-semibold'>Editor</h3>
        {detail.isLoading && selectedId && <Skeleton className='h-28' />}
        <Field label='Hipótesis'><select className='w-full bg-soft p-2 rounded' value={form.hypothesis_id} onChange={(e) => setForm({ ...form, hypothesis_id: e.target.value })}><option value=''>Sin asociar</option>{hypotheses.data?.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}</select></Field>
        <Field label='Nombre'><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label='Descripción'><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label='Nodes JSON'><TextArea className='h-32' value={form.nodes} onChange={(e) => setForm({ ...form, nodes: e.target.value })} /></Field>
        <Field label='Edges JSON'><TextArea className='h-32' value={form.edges} onChange={(e) => setForm({ ...form, edges: e.target.value })} /></Field>
        {!selectedId ? <button className='bg-accent px-3 py-2 rounded' onClick={() => create.mutate()}>Guardar nuevo</button> : <button className='bg-accent px-3 py-2 rounded' onClick={() => update.mutate()}>Guardar cambios</button>}
      </section>
    </div>
  );
}
