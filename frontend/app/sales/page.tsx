'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { EmptyState, PageHeader } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

export default function SalesPage() {
  const { push } = useToast();
  const qc = useQueryClient();
  const [hypothesisId, setHypothesisId] = useState<number | ''>('');

  const hypotheses = useQuery({ queryKey: ['hyp-sales-h'], queryFn: () => api.get<any[]>('/api/hypotheses') });
  const offers = useQuery({ queryKey: ['offers', hypothesisId], queryFn: () => api.get<any[]>(`/api/offers${hypothesisId ? `?hypothesis_id=${hypothesisId}` : ''}`) });
  const scripts = useQuery({ queryKey: ['scripts', hypothesisId], queryFn: () => api.get<any[]>(`/api/scripts${hypothesisId ? `?hypothesis_id=${hypothesisId}` : ''}`) });
  const objections = useQuery({ queryKey: ['objs', hypothesisId], queryFn: () => api.get<any[]>(`/api/objections${hypothesisId ? `?hypothesis_id=${hypothesisId}` : ''}`) });
  const activation = useQuery({ queryKey: ['activation', hypothesisId], queryFn: () => api.get<any>(`/api/sales/activate?hypothesis_id=${hypothesisId}`), enabled: !!hypothesisId });

  const createOffer = useMutation({ mutationFn: () => api.post('/api/offers', { hypothesis_id: Number(hypothesisId), name: `Oferta ${Date.now()}`, value_proposition: 'Ahorra tiempo', base_price: 99, price_options: [79, 99], guarantee: '7 días', cta: 'whatsapp', script_text: 'Script base', objections_expected: [], objection_responses_tree: {} }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); push('Oferta creada'); } });
  const createScript = useMutation({ mutationFn: () => api.post('/api/scripts', { hypothesis_id: Number(hypothesisId), title: `Script ${Date.now()}`, body: 'Guion de venta recomendado.', stage: 'venta' }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['scripts'] }); push('Script creado'); } });
  const createObjection = useMutation({ mutationFn: () => api.post('/api/objections', { hypothesis_id: Number(hypothesisId), text: 'Es caro' }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['objs'] }); push('Objeción agregada'); } });

  return (
    <div className='space-y-4'>
      <PageHeader title='Modo venta / Mini CRM' subtitle='Ofertas, objeciones y scripts vinculados a hipótesis.' />
      <div className='card flex gap-2'>
        <select className='bg-soft p-2 rounded' value={hypothesisId} onChange={(e) => setHypothesisId(Number(e.target.value))}>
          <option value=''>Selecciona hipótesis</option>
          {hypotheses.data?.map((h) => <option value={h.id} key={h.id}>{h.short_name}</option>)}
        </select>
        <button className='bg-soft px-3 py-2 rounded' disabled={!hypothesisId} onClick={() => createOffer.mutate()}>+ Oferta</button>
        <button className='bg-soft px-3 py-2 rounded' disabled={!hypothesisId} onClick={() => createScript.mutate()}>+ Script</button>
        <button className='bg-soft px-3 py-2 rounded' disabled={!hypothesisId} onClick={() => createObjection.mutate()}>+ Objeción</button>
      </div>
      {!hypothesisId && <EmptyState title='Selecciona hipótesis' description='Necesitas una hipótesis para activar modo venta.' />}
      {!!hypothesisId && <div className='grid md:grid-cols-3 gap-4'>
        <div className='card'><p className='font-medium mb-2'>Ofertas</p><ul className='text-sm space-y-1'>{offers.data?.map((o) => <li key={o.id}>{o.name} · ${o.base_price}</li>)}</ul></div>
        <div className='card'><p className='font-medium mb-2'>Scripts</p><ul className='text-sm space-y-1'>{scripts.data?.map((s) => <li key={s.id}>{s.title}</li>)}</ul><p className='text-xs text-gray-400 mt-2'>Preview: {activation.data?.recommended_script || 'Sin script recomendado'}</p></div>
        <div className='card'><p className='font-medium mb-2'>Objeciones</p><ul className='text-sm space-y-1'>{objections.data?.map((o) => <li key={o.id}>{o.text}</li>)}</ul><button className='bg-accent px-3 py-2 rounded mt-3'>{activation.data?.can_activate ? 'Activar modo venta' : 'Completa una oferta para activar'}</button></div>
      </div>}
    </div>
  );
}
