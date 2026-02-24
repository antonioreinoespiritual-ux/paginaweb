'use client';

import Link from 'next/link';

const kpis = [
  { label: 'Uptime API', value: '99.98%', trend: '+0.4%' },
  { label: 'Entrevistas activas', value: '24', trend: '+8 hoy' },
  { label: 'Hipótesis en ejecución', value: '12', trend: '+2 esta semana' },
  { label: 'Playbooks listos', value: '9', trend: '3 con alta conversión' },
];

const modules = [
  { title: 'Hipótesis', desc: 'Define hipótesis falsables con criterios, señales y umbrales claros.', href: '/hypotheses' },
  { title: 'Entrevistas', desc: 'Ejecuta sesiones guiadas, guarda notas y respuestas con persistencia real.', href: '/interviews' },
  { title: 'Flujos', desc: 'Diseña y versiona recorridos de validación y ramificaciones por contexto.', href: '/flows' },
  { title: 'Ventas', desc: 'Conecta objeciones, guiones y ofertas en modo mini-CRM por hipótesis.', href: '/sales' },
];

const activity = [
  'Nueva hipótesis “Onboarding B2B” vinculada a flujo v4.',
  'Plantilla “Discovery ICP Tech” actualizada con nuevas preguntas de urgencia.',
  'Playbook de venta para “Segmento SaaS SMB” con cierre consultivo.',
  'Sesión de entrevista completada con score total 78/100.',
];

export default function HomePage() {
  return (
    <div className='space-y-6'>
      <section className='cloud-hero rounded-2xl border border-soft p-6 md:p-8'>
        <div className='max-w-3xl space-y-3'>
          <p className='text-xs uppercase tracking-[0.2em] text-violet-300'>Research OS Cloud</p>
          <h1 className='text-3xl md:text-4xl font-bold leading-tight'>Centro operativo para validar hipótesis y cerrar ventas desde entrevistas.</h1>
          <p className='text-gray-300'>Un workspace estilo cloud: rápido, modular y accionable. Diseñado para que cada insight termine en una decisión de producto o comercial.</p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Link href='/dashboard' className='bg-accent hover:opacity-90 px-4 py-2 rounded-lg text-sm font-medium'>Abrir Dashboard</Link>
            <Link href='/hypotheses' className='bg-soft hover:bg-[#3b255f] px-4 py-2 rounded-lg text-sm font-medium'>Crear Hipótesis</Link>
          </div>
        </div>
      </section>

      <section className='grid gap-3 md:grid-cols-4'>
        {kpis.map((k) => (
          <div key={k.label} className='card cloud-tile'>
            <p className='text-xs text-gray-400'>{k.label}</p>
            <p className='text-2xl font-semibold mt-1'>{k.value}</p>
            <p className='text-xs text-violet-300 mt-2'>{k.trend}</p>
          </div>
        ))}
      </section>

      <section className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
        <div className='card'>
          <h2 className='text-lg font-semibold mb-3'>Módulos principales</h2>
          <div className='grid sm:grid-cols-2 gap-3'>
            {modules.map((m) => (
              <Link key={m.title} href={m.href} className='rounded-xl border border-soft p-4 bg-[#110a20] hover:border-violet-500 transition'>
                <p className='font-medium'>{m.title}</p>
                <p className='text-sm text-gray-400 mt-1'>{m.desc}</p>
                <p className='text-xs text-violet-300 mt-3'>Ir al módulo →</p>
              </Link>
            ))}
          </div>
        </div>

        <div className='card'>
          <h2 className='text-lg font-semibold mb-3'>Actividad reciente</h2>
          <ul className='space-y-3'>
            {activity.map((a) => (
              <li key={a} className='text-sm text-gray-300 border-l-2 border-violet-500 pl-3'>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
