'use client';
import { useInterviewStore } from '@/app/store/interview-store';

export default function InterviewsPage() {
  const { saleMode, toggleSale, localScore } = useInterviewStore();
  return <div className='grid gap-4 md:grid-cols-3'><div className='card md:col-span-2'><h2 className='text-xl mb-2'>Entrevista en vivo</h2><textarea className='w-full h-48 bg-soft rounded p-2' placeholder='Respuesta actual' /></div><div className='card'><p>Score en vivo: {localScore}</p><button className='bg-accent px-3 py-2 rounded mt-3' onClick={toggleSale}>{saleMode ? 'Desactivar' : 'Activar'} modo venta</button></div></div>;
}
