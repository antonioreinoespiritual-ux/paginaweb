'use client';
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className='flex items-center justify-between mb-4'><div><h2 className='text-2xl font-semibold'>{title}</h2>{subtitle && <p className='text-sm text-gray-400'>{subtitle}</p>}</div>{action}</div>;
}

export function EmptyState({ title, description, cta }: { title: string; description: string; cta?: React.ReactNode }) {
  return <div className='card text-center py-8'><p className='font-medium'>{title}</p><p className='text-sm text-gray-400 mt-1'>{description}</p><div className='mt-3'>{cta}</div></div>;
}

export function Skeleton({ className = 'h-24' }: { className?: string }) { return <div className={`animate-pulse rounded bg-soft ${className}`} />; }

export function ConfirmButton({ onConfirm, children }: { onConfirm: () => void; children: React.ReactNode }) {
  return <button className='text-red-400 text-xs' onClick={() => window.confirm('¿Confirmar acción?') && onConfirm()}>{children}</button>;
}
