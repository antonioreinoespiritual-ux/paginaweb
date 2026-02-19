'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { ConfirmButton, EmptyState, Field, Input, PageHeader, Skeleton, TextArea } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

const empty = { hypothesis_id: '', offer: '', objections: '{"Es caro":"Ofrece plan por etapas"}', scripts: '{"apertura":"Hola","diagnostico":"Cuéntame...","cierre":"¿Arrancamos hoy?"}', followup_sequences: '["Día 1: mensaje", "Día 3: caso"]' };

export default function SalesPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(empty);

  const hypotheses = useQuery({ queryKey: ['hyp-sales'], queryFn: () => api.get<any[]>('/hypotheses') });
  const list = useQuery({ queryKey: ['playbooks'], queryFn: () => api.get<any[]>('/sales-playbooks') });
  const detail = useQuery({ queryKey: ['playbook-detail', selectedId], queryFn: () => api.get<any>(`/sales-playbooks/${selectedId}`), enabled: !!selectedId });

  useEffect(() => {
    if (detail.data) {
      setForm({
        ...detail.data,
        hypothesis_id: detail.data.hypothesis_id,
        objections: JSON.stringify(detail.data.objections || {}, null, 2),
        scripts: JSON.stringify(detail.data.scripts || {}, null, 2),
        followup_sequences: JSON.stringify(detail.data.followup_sequences || [], null, 2),
      });
    }
  }, [detail.data]);

  const save = useMutation({
    mutationFn: () => selectedId
      ? api.put(`/sales-playbooks/${selectedId}`, { ...form, hypothesis_id: Number(form.hypothesis_id), objections: JSON.parse(form.objections || '{}'), scripts: JSON.parse(form.scripts || '{}'), followup_sequences: JSON.parse(form.followup_sequences || '[]') })
      : api.post('/sales-playbooks', { ...form, hypothesis_id: Number(form.hypothesis_id), objections: JSON.parse(form.objections || '{}'), scripts: JSON.parse(form.scripts || '{}'), followup_sequences: JSON.parse(form.followup_sequences || '[]') }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      if (r?.id) setSelectedId(r.id);
      push('Playbook guardado');
    },
    onError: () => push('Error al guardar playbook', 'error'),
  });

  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/sales-playbooks/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['playbooks'] }); setSelectedId(null); setForm(empty); } });

  return (
    <div className='grid md:grid-cols-[340px_1fr] gap-4'>
      <section className='space-y-3'>
        <PageHeader title='Ventas / Mini CRM' action={<button className='bg-accent px-3 py-2 rounded' onClick={() => { setSelectedId(null); setForm({ ...empty, hypothesis_id: hypotheses.data?.[0]?.id || '' }); }}>Nuevo</button>} />
        {list.isLoading && <Skeleton className='h-36' />}
        {!list.isLoading && !list.data?.length && <EmptyState title='Sin playbooks' description='Crea un playbook por hipótesis para activar modo venta.' />}
        <div className='card space-y-2'>
          {list.data?.map((p) => <div key={p.id} className={`p-2 rounded ${selectedId === p.id ? 'bg-soft' : 'bg-[#100a1d]'} flex justify-between`}><button className='text-left text-sm' onClick={() => setSelectedId(p.id)}>Hyp #{p.hypothesis_id}<div className='text-xs text-gray-400'>{String(p.offer).slice(0, 30)}</div></button><ConfirmButton onConfirm={() => remove.mutate(p.id)}>Eliminar</ConfirmButton></div>)}
        </div>
      </section>
      <section className='card space-y-2'>
        <h3 className='font-semibold'>Editor de playbook</h3>
        <Field label='Hipótesis'><select className='w-full bg-soft p-2 rounded' value={form.hypothesis_id} onChange={(e) => setForm({ ...form, hypothesis_id: Number(e.target.value) })}><option value=''>Selecciona</option>{hypotheses.data?.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}</select></Field>
        <Field label='Oferta'><TextArea value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} /></Field>
        <Field label='Objeciones JSON'><TextArea className='h-24' value={form.objections} onChange={(e) => setForm({ ...form, objections: e.target.value })} /></Field>
        <Field label='Guiones JSON'><TextArea className='h-24' value={form.scripts} onChange={(e) => setForm({ ...form, scripts: e.target.value })} /></Field>
        <Field label='Follow-up JSON'><TextArea className='h-24' value={form.followup_sequences} onChange={(e) => setForm({ ...form, followup_sequences: e.target.value })} /></Field>
        <div className='flex gap-2'>
          <button className='bg-accent px-3 py-2 rounded' onClick={() => save.mutate()}>Guardar</button>
          <button className='bg-soft px-3 py-2 rounded' onClick={() => navigator.clipboard.writeText(form.scripts)}>Copiar guion</button>
        </div>
        <div className='text-xs text-gray-400'>Vista previa guion: {String(form.scripts).slice(0, 120)}...</div>
      </section>
    </div>
  );
}
