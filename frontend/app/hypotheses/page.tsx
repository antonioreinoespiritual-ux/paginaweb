'use client';
import { useQuery } from '@tanstack/react-query';
import { getJSON } from '@/app/lib/api';
import { HypothesisForm } from '@/app/components/hypothesis-form';

export default function HypothesesPage() {
  const { data } = useQuery({ queryKey: ['hypotheses'], queryFn: () => getJSON<any[]>('/api/hypotheses') });
  return <div className='space-y-4'><h2 className='text-2xl'>Hipótesis + Reglas</h2><HypothesisForm /><div className='card'><ul>{data?.map((h) => <li key={h.id}>{h.short_name} · {h.type}</li>)}</ul></div></div>;
}
