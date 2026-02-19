'use client';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { EmptyState, PageHeader, Skeleton, ConfirmButton } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

export default function HypothesesPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['hypotheses', q, status, type], queryFn: () => api.get<any[]>(`/api/hypotheses?q=${encodeURIComponent(q)}&status=${status}&type=${type}`) });
  const detail = useQuery({ queryKey: ['hypothesis', selected], queryFn: () => api.get<any>(`/api/hypotheses/${selected}`), enabled: !!selected });

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/hypotheses', { type: 'Problema', short_name: `Hipótesis ${Date.now()}`, statement: 'Los usuarios tienen dolor en onboarding.', independent_variable: 'onboarding', primary_metric: 'tasa', channel: 'entrevista', status: 'draft', validation_threshold: 70, min_volume: 10, tags: [], target_segments: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hypotheses'] }); push('Hipótesis creada'); },
    onError: () => push('No se pudo crear', 'error'),
  });

  const deleteMutation = useMutation({ mutationFn: (id: number) => api.delete(`/api/hypotheses/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hypotheses'] }); setSelected(null); push('Hipótesis eliminada'); } });

  const list = useMemo(() => data || [], [data]);

  return (
    <div className='grid md:grid-cols-[1fr_360px] gap-4'>
      <section>
        <PageHeader title='Hipótesis + Reglas' subtitle='Busca, filtra y abre el detalle.' action={<button className='bg-accent px-3 py-2 rounded' onClick={() => createMutation.mutate()}>Crear</button>} />
        <div className='card mb-3 grid md:grid-cols-3 gap-2'>
          <input className='bg-soft p-2 rounded' placeholder='Buscar...' value={q} onChange={(e) => setQ(e.target.value)} />
          <input className='bg-soft p-2 rounded' placeholder='Estado' value={status} onChange={(e) => setStatus(e.target.value)} />
          <input className='bg-soft p-2 rounded' placeholder='Tipo' value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        {isLoading && <Skeleton className='h-40' />}
        {error && <EmptyState title='Error al cargar' description='Intenta nuevamente.' />}
        {!isLoading && !list.length && <EmptyState title='Sin hipótesis' description='Crea tu primera hipótesis para comenzar.' cta={<button className='bg-accent px-3 py-2 rounded' onClick={() => createMutation.mutate()}>Crear hipótesis</button>} />}
        {!!list.length && <div className='card'><ul className='space-y-2'>{list.map((h) => <li key={h.id} className={`p-2 rounded flex justify-between ${selected === h.id ? 'bg-soft' : ''}`}><button onClick={() => setSelected(h.id)}>{h.short_name} · {h.type} · {h.status}</button><ConfirmButton onConfirm={() => deleteMutation.mutate(h.id)}>Eliminar</ConfirmButton></li>)}</ul></div>}
      </section>
      <aside className='card'>
        <h3 className='font-semibold mb-2'>Detalle</h3>
        {!selected && <p className='text-sm text-gray-400'>Selecciona una hipótesis para ver reglas y métricas.</p>}
        {detail.isLoading && <Skeleton className='h-24' />}
        {detail.data && <div className='text-sm space-y-2'><p><b>{detail.data.hypothesis.short_name}</b></p><p>{detail.data.hypothesis.statement}</p><p>Entrevistas: {detail.data.metrics.interviews}</p><p>Score medio: {detail.data.metrics.avg_score.toFixed(1)}</p><p>Reglas: {detail.data.rules.length}</p></div>}
      </aside>
    </div>
  );
}
