'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { EmptyState, PageHeader, Skeleton } from '@/app/components/ui/shared';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['funnel'], queryFn: () => api.get<any>('/api/analytics/funnel') });

  if (isLoading) return <Skeleton className='h-72' />;
  if (!data?.entrevistas_totales) {
    return <EmptyState title='Embudo Comercial vacío' description='Aquí verás cómo avanzan entrevistas y conversiones. Para empezar crea una hipótesis y registra una entrevista.' cta={<Link className='bg-accent px-3 py-2 rounded inline-block' href='/hypotheses'>Crear hipótesis</Link>} />;
  }

  const chartData = [
    { name: 'Entrevistas', value: data.entrevistas_totales },
    { name: 'Modo venta', value: data.activo_modo_venta },
    { name: 'Aceptó', value: data.acepto },
  ];

  return (
    <div className='space-y-4'>
      <PageHeader title='Embudo Comercial' subtitle={data.explicacion} />
      <div className='grid md:grid-cols-3 gap-3'>
        <div className='card'>Totales<br /><b>{data.entrevistas_totales}</b></div>
        <div className='card'>Tasa activación<br /><b>{(data.tasa_activacion_venta * 100).toFixed(1)}%</b></div>
        <div className='card'>Tasa cierre<br /><b>{(data.tasa_cierre * 100).toFixed(1)}%</b></div>
      </div>
      <div className='card h-72'>
        <ResponsiveContainer>
          <BarChart data={chartData}><XAxis dataKey='name' /><YAxis /><Tooltip /><Bar dataKey='value' fill='#7c3aed' /></BarChart>
        </ResponsiveContainer>
      </div>
      <p className='text-xs text-gray-400'>Últimos 7 días: (pendiente en Fase 2 con series temporales).</p>
    </div>
  );
}
