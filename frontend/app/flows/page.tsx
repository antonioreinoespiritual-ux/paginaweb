'use client';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';

const nodes = [{ id: '1', data: { label: 'Inicio' }, position: { x: 100, y: 50 } }, { id: '2', data: { label: 'Bloque problema' }, position: { x: 350, y: 150 } }];
const edges = [{ id: 'e1-2', source: '1', target: '2', label: 'si califica' }];

export default function FlowsPage() {
  return <div className='space-y-4'><h2 className='text-2xl'>Editor de flujo</h2><div className='card h-[600px]'><ReactFlow nodes={nodes} edges={edges}><Background /><Controls /></ReactFlow></div></div>;
}
