import './globals.css';
import Link from 'next/link';
import { Providers } from './lib/query-client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body>
        <Providers>
          <div className='min-h-screen grid grid-cols-[220px_1fr]'>
            <aside className='border-r border-soft p-4 space-y-2'>
              <h1 className='font-bold text-accent'>Research OS</h1>
              <nav className='flex flex-col gap-2 text-sm'>
                <Link href='/dashboard'>Dashboard</Link>
                <Link href='/hypotheses'>Hipótesis</Link>
                <Link href='/interviews'>Entrevistas</Link>
                <Link href='/flows'>Flujos</Link>
                <Link href='/sales'>Ventas</Link>
              </nav>
            </aside>
            <main className='p-6'>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
