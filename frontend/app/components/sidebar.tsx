'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const items = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/hypotheses', label: 'Hipótesis' },
  { href: '/interviews', label: 'Entrevistas' },
  { href: '/flows', label: 'Flujos' },
  { href: '/sales', label: 'Ventas' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className='md:hidden fixed top-3 left-3 z-50 bg-accent px-2 py-1 rounded' onClick={() => setOpen((s) => !s)}>☰</button>
      <aside className={`${open ? 'block' : 'hidden'} md:block border-r border-soft p-4 space-y-4 bg-[#0b0615] md:static fixed inset-y-0 left-0 w-56 z-40`}>
        <div>
          <h1 className='font-bold text-accent'>Research OS</h1>
          <p className='text-xs text-gray-400 mt-1'>Cloud Workspace</p>
        </div>
        <nav className='flex flex-col gap-1 text-sm'>
          {items.map((i) => {
            const active = i.href === '/' ? pathname === '/' : pathname.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} className={`px-2 py-1.5 rounded focus:outline focus:outline-2 focus:outline-accent ${active ? 'bg-soft text-white' : 'text-gray-300 hover:bg-[#160d2a]'}`}>
                {i.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  return <div className='text-xs text-gray-400 mb-3'>Inicio {parts.map((p) => ` / ${p}`).join('')}</div>;
}
