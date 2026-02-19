'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJSON } from '@/app/lib/api';

const schema = z.object({ short_name: z.string().min(3), type: z.string(), statement: z.string().min(10) });

type FormData = z.infer<typeof schema>;

export function HypothesisForm() {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema) });
  const mutation = useMutation({
    mutationFn: (data: FormData) => postJSON('/api/hypotheses', { ...data, independent_variable: 'n/a', primary_metric: 'score', channel: 'interview', tags: [], target_segments: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hypotheses'] }); reset(); }
  });
  return (
    <form className='card space-y-2' onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <input className='w-full bg-soft p-2 rounded' placeholder='Nombre corto' {...register('short_name')} />
      <input className='w-full bg-soft p-2 rounded' placeholder='Tipo' {...register('type')} />
      <textarea className='w-full bg-soft p-2 rounded' placeholder='Hipótesis falsable' {...register('statement')} />
      <button className='bg-accent px-3 py-2 rounded'>Guardar hipótesis</button>
    </form>
  );
}
