import './globals.css';
import { Providers } from './lib/query-client';
import { Breadcrumb, Sidebar } from './components/sidebar';
import { ToastProvider } from './components/ui/toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='es'>
      <body>
        <Providers>
          <ToastProvider>
            <div className='min-h-screen grid md:grid-cols-[220px_1fr]'>
              <Sidebar />
              <main className='p-6 mt-8 md:mt-0'>
                <Breadcrumb />
                {children}
              </main>
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
