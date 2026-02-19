'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { ConfirmButton, EmptyState, Field, Input, PageHeader, Skeleton, TextArea } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

const emptyForm = {
  project_id: 0,
  title: '',
  pain: '',
  persona: '',
  context: '',
  falsifiable_statement: '',
  success_criteria: '{"metric":"","threshold":"","window":""}',
  traffic_source: 'organico',
  status: 'draft',
  notes: '',
  validation_flow_id: '',
  interview_template_id: '',
  sales_playbook_id: '',
};

export default function HypothesesPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.get<any[]>('/projects') });
  const flows = useQuery({ queryKey: ['flows'], queryFn: () => api.get<any[]>('/flows') });
  const templates = useQuery({ queryKey: ['templates'], queryFn: () => api.get<any[]>('/interview-templates') });
  const playbooks = useQuery({ queryKey: ['playbooks'], queryFn: () => api.get<any[]>('/sales-playbooks') });

  const list = useQuery({ queryKey: ['hypotheses', q, status], queryFn: () => api.get<any[]>('/hypotheses', { q, status }) });
  const detail = useQuery({ queryKey: ['hypothesis-detail', selectedId], queryFn: () => api.get<any>(`/hypotheses/${selectedId}`), enabled: !!selectedId });

  useEffect(() => {
    if (detail.data) {
      setForm({
        ...detail.data,
        success_criteria: JSON.stringify(detail.data.success_criteria || {}, null, 2),
        validation_flow_id: detail.data.validation_flow_id || '',
        interview_template_id: detail.data.interview_template_id || '',
        sales_playbook_id: detail.data.sales_playbook_id || '',
      });
    }
  }, [detail.data]);

  const create = useMutation({
    mutationFn: () => api.post('/hypotheses', {
      ...form,
      project_id: Number(form.project_id),
      success_criteria: JSON.parse(form.success_criteria || '{}'),
      validation_flow_id: form.validation_flow_id ? Number(form.validation_flow_id) : null,
      interview_template_id: form.interview_template_id ? Number(form.interview_template_id) : null,
      sales_playbook_id: form.sales_playbook_id ? Number(form.sales_playbook_id) : null,
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['hypotheses'] });
      setSelectedId(res.id);
      push('Hipótesis creada');
    },
    onError: () => push('Error al crear hipótesis', 'error'),
  });

  const update = useMutation({
    mutationFn: () => api.put(`/hypotheses/${selectedId}`, {
      ...form,
      project_id: Number(form.project_id),
      success_criteria: JSON.parse(form.success_criteria || '{}'),
      validation_flow_id: form.validation_flow_id ? Number(form.validation_flow_id) : null,
      interview_template_id: form.interview_template_id ? Number(form.interview_template_id) : null,
      sales_playbook_id: form.sales_playbook_id ? Number(form.sales_playbook_id) : null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hypotheses'] });
      qc.invalidateQueries({ queryKey: ['hypothesis-detail', selectedId] });
      push('Hipótesis guardada');
    },
    onError: () => push('Error al guardar', 'error'),
  });

  const remove = useMutation({ mutationFn: (id: number) => api.delete(`/hypotheses/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['hypotheses'] }); setSelectedId(null); setForm(emptyForm); push('Hipótesis eliminada'); } });

  const canSave = form.project_id && form.title && form.pain && form.persona && form.falsifiable_statement;

  return (
    <div className='grid md:grid-cols-[360px_1fr] gap-4'>
      <section className='space-y-3'>
        <PageHeader title='Hipótesis' subtitle='Lista + búsqueda + filtros.' action={<button className='bg-accent px-3 py-2 rounded' onClick={() => { setSelectedId(null); setForm({ ...emptyForm, project_id: projects.data?.[0]?.id || 0 }); }}>Nuevo</button>} />
        <div className='card space-y-2'>
          <Input placeholder='Buscar' value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder='Estado (draft/running/...)' value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        {list.isLoading && <Skeleton className='h-48' />}
        {!list.isLoading && !list.data?.length && <EmptyState title='No hay hipótesis' description='Crea tu primera hipótesis rica con criterios de éxito.' />}
        <div className='card space-y-2 max-h-[540px] overflow-auto'>
          {list.data?.map((h) => (
            <div key={h.id} className={`p-2 rounded ${selectedId === h.id ? 'bg-soft' : 'bg-[#100a1d]'} flex justify-between items-start`}>
              <button onClick={() => setSelectedId(h.id)} className='text-left text-sm'>
                <div className='font-medium'>{h.title}</div><div className='text-xs text-gray-400'>{h.persona} · {h.status}</div>
              </button>
              <ConfirmButton onConfirm={() => remove.mutate(h.id)}>Eliminar</ConfirmButton>
            </div>
          ))}
        </div>
      </section>

      <section className='card space-y-2'>
        <h3 className='font-semibold'>Detalle / Edición</h3>
        {detail.isLoading && selectedId && <Skeleton className='h-40' />}
        {!selectedId && <p className='text-sm text-gray-400'>Pulsa “Nuevo” o selecciona una hipótesis existente.</p>}
        <div className='grid md:grid-cols-2 gap-2'>
          <Field label='Proyecto'><select className='w-full bg-soft p-2 rounded' value={form.project_id} onChange={(e) => setForm({ ...form, project_id: Number(e.target.value) })}><option value=''>Selecciona</option>{projects.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label='Título'><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label='Persona'><Input value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })} /></Field>
          <Field label='Fuente de tráfico'><Input value={form.traffic_source} onChange={(e) => setForm({ ...form, traffic_source: e.target.value })} /></Field>
          <Field label='Estado'><Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></Field>
          <Field label='Flow validación'><select className='w-full bg-soft p-2 rounded' value={form.validation_flow_id} onChange={(e) => setForm({ ...form, validation_flow_id: e.target.value })}><option value=''>Sin vincular</option>{flows.data?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
          <Field label='Plantilla entrevista'><select className='w-full bg-soft p-2 rounded' value={form.interview_template_id} onChange={(e) => setForm({ ...form, interview_template_id: e.target.value })}><option value=''>Sin vincular</option>{templates.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label='Playbook ventas'><select className='w-full bg-soft p-2 rounded' value={form.sales_playbook_id} onChange={(e) => setForm({ ...form, sales_playbook_id: e.target.value })}><option value=''>Sin vincular</option>{playbooks.data?.map((p) => <option key={p.id} value={p.id}>{p.hypothesis_id} / {p.offer?.slice(0, 20)}</option>)}</select></Field>
        </div>
        <Field label='Dolor'><TextArea value={form.pain} onChange={(e) => setForm({ ...form, pain: e.target.value })} /></Field>
        <Field label='Contexto'><TextArea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></Field>
        <Field label='Hipótesis falsable'><TextArea value={form.falsifiable_statement} onChange={(e) => setForm({ ...form, falsifiable_statement: e.target.value })} /></Field>
        <Field label='Success criteria JSON'><TextArea className='h-24' value={form.success_criteria} onChange={(e) => setForm({ ...form, success_criteria: e.target.value })} /></Field>
        <Field label='Notes (markdown)'><TextArea className='h-24' value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        <div className='flex gap-2'>
          {!selectedId ? <button className='bg-accent px-3 py-2 rounded disabled:opacity-50' disabled={!canSave} onClick={() => create.mutate()}>Guardar nueva</button> : <button className='bg-accent px-3 py-2 rounded disabled:opacity-50' disabled={!canSave} onClick={() => update.mutate()}>Guardar cambios</button>}
        </div>
      </section>
    </div>
  );
}
