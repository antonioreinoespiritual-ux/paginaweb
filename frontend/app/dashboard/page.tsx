'use client';
import { useQuery } from '@tanstack/react-query';
import { getJSON } from '@/app/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ['funnel'], queryFn: () => getJSON<any>('/api/analytics/funnel') });
  const chartData = [
    { name: 'Totales', value: data?.entrevistas_totales || 0 },
    { name: 'Modo venta', value: data?.activo_modo_venta || 0 },
    { name: 'Aceptó', value: data?.acepto || 0 },
  ];
  return <div className='space-y-4'><h2 className='text-2xl font-bold'>Embudo Comercial</h2><div className='card h-72'><ResponsiveContainer><BarChart data={chartData}><XAxis dataKey='name'/><YAxis/><Tooltip/><Bar dataKey='value' fill='#7c3aed' /></BarChart></ResponsiveContainer></div></div>;
}
