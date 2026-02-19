'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API } from '@/app/lib/api';
import { EmptyState, PageHeader } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

export default function InterviewsPage() {
  const { push } = useToast();
  const [hypothesisId, setHypothesisId] = useState<number | ''>('');
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const [question, setQuestion] = useState('¿Cuál es tu principal dolor hoy?');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [score, setScore] = useState(0);

  const hyp = useQuery({ queryKey: ['hypotheses-for-interview'], queryFn: () => api.get<any[]>('/api/hypotheses') });
  const suggested = useQuery({ queryKey: ['suggested'], queryFn: () => api.get<any>('/api/interviews/suggested/questions') });

  const createInterview = useMutation({
    mutationFn: () => api.post<any>('/api/interviews', { hypothesis_id: Number(hypothesisId), flow_id: null }),
    onSuccess: async (i) => {
      setInterviewId(i.id);
      await api.post('/api/interviews/sessions', { interview_id: i.id, hypothesis_id: Number(hypothesisId), current_question: question });
      push('Sesión iniciada');
    },
  });

  const saveResponse = useMutation({ mutationFn: () => api.post(`/api/interviews/${interviewId}/responses`, { question_id: 'q1', question_text: question, response_type: 'texto', response_text: answer }), onSuccess: (r: any) => { setScore(r.scores.score_total_hipotesis); push('Respuesta guardada'); setAnswer(''); } });
  const saveNote = useMutation({ mutationFn: () => api.post('/api/interviews/notes', { interview_id: interviewId, note_text: note, tags: ['privada'] }), onSuccess: () => { push('Nota guardada'); setNote(''); } });

  useEffect(() => {
    if (!interviewId) return;
    const evt = new EventSource(`${API}/api/interviews/${interviewId}/live`);
    evt.onmessage = (e) => {
      try { setScore(JSON.parse(e.data).total || 0); } catch {}
    };
    return () => evt.close();
  }, [interviewId]);

  return (
    <div className='space-y-4'>
      <PageHeader title='Entrevista en vivo' subtitle='Selecciona hipótesis, inicia sesión y registra respuestas/notas con score en vivo.' />
      <div className='card grid md:grid-cols-3 gap-2'>
        <select className='bg-soft p-2 rounded' value={hypothesisId} onChange={(e) => setHypothesisId(Number(e.target.value))}>
          <option value=''>Selecciona hipótesis</option>
          {hyp.data?.map((h) => <option key={h.id} value={h.id}>{h.short_name}</option>)}
        </select>
        <button className='bg-accent px-3 py-2 rounded disabled:opacity-50' disabled={!hypothesisId} onClick={() => createInterview.mutate()}>Iniciar sesión</button>
        <div className='text-sm'>Score actual: <b>{score.toFixed(1)}</b></div>
      </div>

      {!interviewId && <EmptyState title='Sin sesión activa' description='Inicia una sesión para comenzar la entrevista guiada.' />}

      {!!interviewId && <div className='grid md:grid-cols-3 gap-4'>
        <div className='card md:col-span-2 space-y-2'>
          <input className='w-full bg-soft p-2 rounded' value={question} onChange={(e) => setQuestion(e.target.value)} />
          <textarea className='w-full h-40 bg-soft p-2 rounded' placeholder='Respuesta del participante' value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <button className='bg-accent px-3 py-2 rounded' onClick={() => saveResponse.mutate()}>Guardar respuesta</button>
          <div className='text-xs text-gray-400'>Sugeridas: {suggested.data?.items?.join(' · ')}</div>
        </div>
        <div className='card space-y-2'>
          <p className='font-medium'>Notas privadas</p>
          <textarea className='w-full h-32 bg-soft p-2 rounded' value={note} onChange={(e) => setNote(e.target.value)} />
          <button className='bg-soft px-3 py-2 rounded' onClick={() => saveNote.mutate()}>Guardar nota</button>
        </div>
      </div>}
    </div>
  );
}
