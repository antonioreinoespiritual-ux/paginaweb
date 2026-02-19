'use client';
import { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { EmptyState, PageHeader } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

export default function FlowsPage() {
  const { push } = useToast();
  const qc = useQueryClient();
  const [selectedFlow, setSelectedFlow] = useState<number | ''>('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [future, setFuture] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const flows = useQuery({ queryKey: ['flows'], queryFn: () => api.get<any[]>('/api/flows') });
  const current = useQuery({ queryKey: ['flow', selectedFlow], queryFn: () => api.get<any>(`/api/flows/${selectedFlow}`), enabled: !!selectedFlow });

  useMemo(() => {
    if (current.data) {
      setNodes(current.data.nodes.map((n: any) => ({ id: n.node_key, data: { label: n.label }, position: { x: n.pos_x, y: n.pos_y } })));
      setEdges(current.data.edges.map((e: any) => ({ id: e.edge_key, source: e.source_node_key, target: e.target_node_key, label: e.condition_json?.label || '' })));
    }
  }, [current.data]);

  const save = useMutation({
    mutationFn: () => api.put(`/api/flows/${selectedFlow}`, {
      name: current.data.flow.name,
      nodes: nodes.map((n) => ({ node_key: n.id, label: n.data.label, question_text: n.data.label, pos_x: n.position.x, pos_y: n.position.y, response_type: 'texto', metadata_json: {} })),
      edges: edges.map((e) => ({ edge_key: e.id, source_node_key: e.source, target_node_key: e.target, condition_json: { label: e.label || '' } })),
    }),
    onSuccess: () => { push('Flow guardado'); qc.invalidateQueries({ queryKey: ['flows'] }); },
  });

  const create = useMutation({ mutationFn: () => api.post('/api/flows', { name: `Flow ${Date.now()}` }), onSuccess: () => qc.invalidateQueries({ queryKey: ['flows'] }) });

  const snapshot = () => { setHistory((h) => [...h, { nodes, edges }]); setFuture([]); };
  const undo = () => { const prev = history.at(-1); if (!prev) return; setFuture((f) => [{ nodes, edges }, ...f]); setNodes(prev.nodes); setEdges(prev.edges); setHistory((h) => h.slice(0, -1)); };
  const redo = () => { const next = future[0]; if (!next) return; setHistory((h) => [...h, { nodes, edges }]); setNodes(next.nodes); setEdges(next.edges); setFuture((f) => f.slice(1)); };

  const addNode = () => { snapshot(); setNodes((n) => [...n, { id: `n-${Date.now()}`, data: { label: 'Nueva pregunta' }, position: { x: 120, y: 120 } }]); };
  const removeNode = () => { if (!selectedNode) return; snapshot(); setNodes((n) => n.filter((x) => x.id !== selectedNode.id)); setEdges((e) => e.filter((x) => x.source !== selectedNode.id && x.target !== selectedNode.id)); };

  return (
    <div className='space-y-4'>
      <PageHeader title='Editor de flujo' subtitle='Guardar/cargar, propiedades, undo/redo mínimo.' action={<button className='bg-accent px-3 py-2 rounded' onClick={() => create.mutate()}>Crear flow</button>} />
      <div className='card flex gap-2 items-center'>
        <select className='bg-soft p-2 rounded' value={selectedFlow} onChange={(e) => setSelectedFlow(Number(e.target.value))}>
          <option value=''>Selecciona flow</option>
          {flows.data?.map((f) => <option key={f.id} value={f.id}>{f.name} v{f.version}</option>)}
        </select>
        <button className='bg-soft px-2 py-1 rounded' onClick={addNode}>+ Nodo</button>
        <button className='bg-soft px-2 py-1 rounded' onClick={undo}>Undo</button>
        <button className='bg-soft px-2 py-1 rounded' onClick={redo}>Redo</button>
        <button className='bg-accent px-2 py-1 rounded' onClick={() => save.mutate()} disabled={!selectedFlow}>Guardar</button>
      </div>
      {!selectedFlow && <EmptyState title='Sin flow seleccionado' description='Crea o selecciona un flow para editar.' />}
      {!!selectedFlow && <div className='grid md:grid-cols-[1fr_280px] gap-4'>
        <div className='card h-[560px]'>
          <ReactFlow nodes={nodes} edges={edges} onNodeDragStop={(_, node) => { snapshot(); setNodes((n) => n.map((x) => x.id === node.id ? node : x)); }} onNodeClick={(_, node) => setSelectedNode(node)}>
            <Background /><Controls />
          </ReactFlow>
        </div>
        <div className='card space-y-2'>
          <p className='font-medium'>Propiedades del nodo</p>
          {!selectedNode && <p className='text-sm text-gray-400'>Selecciona un nodo.</p>}
          {selectedNode && <>
            <input className='w-full bg-soft p-2 rounded' value={selectedNode.data.label} onChange={(e) => setSelectedNode({ ...selectedNode, data: { label: e.target.value } })} />
            <button className='bg-soft px-3 py-2 rounded' onClick={() => { snapshot(); setNodes((n) => n.map((x) => x.id === selectedNode.id ? selectedNode : x)); }}>Renombrar</button>
            <button className='text-red-400' onClick={removeNode}>Eliminar nodo</button>
          </>}
        </div>
      </div>}
    </div>
  );
}
