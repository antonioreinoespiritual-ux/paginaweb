'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import { ConfirmButton, EmptyState, Field, Input, PageHeader, Skeleton, TextArea } from '@/app/components/ui/shared';
import { useToast } from '@/app/components/ui/toast';

const emptyTemplate = { name: '', goal: '', target_persona: '', questions: '[{"q":"¿Qué duele?","tag":"problema"}]', scoring_rules: '{}' };
const emptySession = { hypothesis_id: '', template_id: '', date: '', interviewer: '', respondent_alias: '', notes: '', answers: '{}', score_total: 0, signals: '{}', status: 'in-progress' };

export default function InterviewsPage() {
  const qc = useQueryClient();
  const { push } = useToast();
  const [tab, setTab] = useState<'templates' | 'sessions'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState<any>(emptyTemplate);
  const [sessionForm, setSessionForm] = useState<any>(emptySession);

  const hypotheses = useQuery({ queryKey: ['hyp-int'], queryFn: () => api.get<any[]>('/hypotheses') });
  const templates = useQuery({ queryKey: ['templates-list'], queryFn: () => api.get<any[]>('/interview-templates') });
  const sessions = useQuery({ queryKey: ['sessions-list'], queryFn: () => api.get<any[]>('/interviews') });
  const templateDetail = useQuery({ queryKey: ['template-detail', selectedTemplate], queryFn: () => api.get<any>(`/interview-templates/${selectedTemplate}`), enabled: !!selectedTemplate });
  const sessionDetail = useQuery({ queryKey: ['session-detail', selectedSession], queryFn: () => api.get<any>(`/interviews/${selectedSession}`), enabled: !!selectedSession });

  useEffect(() => {
    if (templateDetail.data) {
      setTemplateForm({ ...templateDetail.data, questions: JSON.stringify(templateDetail.data.questions || [], null, 2), scoring_rules: JSON.stringify(templateDetail.data.scoring_rules || {}, null, 2) });
    }
  }, [templateDetail.data]);

  useEffect(() => {
    if (sessionDetail.data) {
      setSessionForm({ ...sessionDetail.data, hypothesis_id: sessionDetail.data.hypothesis_id, template_id: sessionDetail.data.template_id || '', answers: JSON.stringify(sessionDetail.data.answers || {}, null, 2), signals: JSON.stringify(sessionDetail.data.signals || {}, null, 2) });
    }
  }, [sessionDetail.data]);

  const saveTemplate = useMutation({
    mutationFn: () => selectedTemplate
      ? api.put(`/interview-templates/${selectedTemplate}`, { ...templateForm, questions: JSON.parse(templateForm.questions || '[]'), scoring_rules: JSON.parse(templateForm.scoring_rules || '{}') })
      : api.post('/interview-templates', { ...templateForm, questions: JSON.parse(templateForm.questions || '[]'), scoring_rules: JSON.parse(templateForm.scoring_rules || '{}') }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates-list'] }); push('Plantilla guardada'); },
    onError: () => push('Error guardando plantilla', 'error'),
  });

  const deleteTemplate = useMutation({ mutationFn: (id: number) => api.delete(`/interview-templates/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates-list'] }); setSelectedTemplate(null); setTemplateForm(emptyTemplate); } });

  const saveSession = useMutation({
    mutationFn: () => selectedSession
      ? api.put(`/interviews/${selectedSession}`, { ...sessionForm, hypothesis_id: Number(sessionForm.hypothesis_id), template_id: sessionForm.template_id ? Number(sessionForm.template_id) : null, answers: JSON.parse(sessionForm.answers || '{}'), signals: JSON.parse(sessionForm.signals || '{}') })
      : api.post('/interviews', { ...sessionForm, hypothesis_id: Number(sessionForm.hypothesis_id), template_id: sessionForm.template_id ? Number(sessionForm.template_id) : null, answers: JSON.parse(sessionForm.answers || '{}'), signals: JSON.parse(sessionForm.signals || '{}') }),
    onSuccess: (res: any) => { qc.invalidateQueries({ queryKey: ['sessions-list'] }); if (res?.id) setSelectedSession(res.id); push('Entrevista guardada'); },
    onError: () => push('Error guardando entrevista', 'error'),
  });

  useEffect(() => {
    if (!selectedSession) return;
    const t = setTimeout(() => { saveSession.mutate(); }, 5000);
    return () => clearTimeout(t);
  }, [sessionForm.notes, sessionForm.answers]);

  const deleteSession = useMutation({ mutationFn: (id: number) => api.delete(`/interviews/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions-list'] }); setSelectedSession(null); setSessionForm(emptySession); } });

  return (
    <div className='space-y-4'>
      <PageHeader title='Entrevistas' subtitle='Plantillas editables + sesiones persistidas.' action={<div className='flex gap-2'><button className={`px-3 py-2 rounded ${tab === 'templates' ? 'bg-accent' : 'bg-soft'}`} onClick={() => setTab('templates')}>Plantillas</button><button className={`px-3 py-2 rounded ${tab === 'sessions' ? 'bg-accent' : 'bg-soft'}`} onClick={() => setTab('sessions')}>Sesiones</button></div>} />

      {tab === 'templates' ? (
        <div className='grid md:grid-cols-[320px_1fr] gap-4'>
          <div className='card space-y-2'>
            <button className='bg-accent px-3 py-2 rounded' onClick={() => { setSelectedTemplate(null); setTemplateForm(emptyTemplate); }}>Nueva plantilla</button>
            {templates.isLoading && <Skeleton className='h-28' />}
            {!templates.isLoading && !templates.data?.length && <EmptyState title='Sin plantillas' description='Crea una plantilla para iniciar entrevistas.' />}
            {templates.data?.map((t) => <div key={t.id} className={`p-2 rounded ${selectedTemplate === t.id ? 'bg-soft' : 'bg-[#100a1d]'} flex justify-between`}><button onClick={() => setSelectedTemplate(t.id)} className='text-sm'>{t.name}</button><ConfirmButton onConfirm={() => deleteTemplate.mutate(t.id)}>Eliminar</ConfirmButton></div>)}
          </div>
          <div className='card space-y-2'>
            <Field label='Nombre'><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} /></Field>
            <Field label='Goal'><TextArea value={templateForm.goal} onChange={(e) => setTemplateForm({ ...templateForm, goal: e.target.value })} /></Field>
            <Field label='Target persona'><Input value={templateForm.target_persona} onChange={(e) => setTemplateForm({ ...templateForm, target_persona: e.target.value })} /></Field>
            <Field label='Questions JSON'><TextArea className='h-36' value={templateForm.questions} onChange={(e) => setTemplateForm({ ...templateForm, questions: e.target.value })} /></Field>
            <Field label='Scoring rules JSON'><TextArea value={templateForm.scoring_rules} onChange={(e) => setTemplateForm({ ...templateForm, scoring_rules: e.target.value })} /></Field>
            <button className='bg-accent px-3 py-2 rounded' onClick={() => saveTemplate.mutate()}>Guardar plantilla</button>
          </div>
        </div>
      ) : (
        <div className='grid md:grid-cols-[320px_1fr] gap-4'>
          <div className='card space-y-2'>
            <button className='bg-accent px-3 py-2 rounded' onClick={() => { setSelectedSession(null); setSessionForm({ ...emptySession, hypothesis_id: hypotheses.data?.[0]?.id || '' }); }}>Nueva sesión</button>
            {sessions.isLoading && <Skeleton className='h-28' />}
            {!sessions.isLoading && !sessions.data?.length && <EmptyState title='Sin entrevistas' description='Inicia una sesión desde una hipótesis + plantilla.' />}
            {sessions.data?.map((s) => <div key={s.id} className={`p-2 rounded ${selectedSession === s.id ? 'bg-soft' : 'bg-[#100a1d]'} flex justify-between`}><button className='text-left text-sm' onClick={() => setSelectedSession(s.id)}>{s.respondent_alias || `Sesión ${s.id}`}<div className='text-xs text-gray-400'>{s.status}</div></button><ConfirmButton onConfirm={() => deleteSession.mutate(s.id)}>Eliminar</ConfirmButton></div>)}
          </div>
          <div className='card space-y-2'>
            <Field label='Hipótesis'><select className='w-full bg-soft p-2 rounded' value={sessionForm.hypothesis_id} onChange={(e) => setSessionForm({ ...sessionForm, hypothesis_id: Number(e.target.value) })}><option value=''>Selecciona</option>{hypotheses.data?.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}</select></Field>
            <Field label='Plantilla'><select className='w-full bg-soft p-2 rounded' value={sessionForm.template_id} onChange={(e) => setSessionForm({ ...sessionForm, template_id: e.target.value })}><option value=''>Sin plantilla</option>{templates.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
            <div className='grid md:grid-cols-2 gap-2'>
              <Field label='Fecha'><Input value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} /></Field>
              <Field label='Entrevistador'><Input value={sessionForm.interviewer} onChange={(e) => setSessionForm({ ...sessionForm, interviewer: e.target.value })} /></Field>
              <Field label='Alias entrevistado'><Input value={sessionForm.respondent_alias} onChange={(e) => setSessionForm({ ...sessionForm, respondent_alias: e.target.value })} /></Field>
              <Field label='Estado'><Input value={sessionForm.status} onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })} /></Field>
            </div>
            <Field label='Answers JSON'><TextArea className='h-28' value={sessionForm.answers} onChange={(e) => setSessionForm({ ...sessionForm, answers: e.target.value })} /></Field>
            <Field label='Notes'><TextArea className='h-24' value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} /></Field>
            <Field label='Signals JSON'><TextArea value={sessionForm.signals} onChange={(e) => setSessionForm({ ...sessionForm, signals: e.target.value })} /></Field>
            <div className='flex gap-2'><button className='bg-accent px-3 py-2 rounded' onClick={() => saveSession.mutate()}>Guardar sesión</button><span className='text-xs text-gray-400 self-center'>Autosave cada 5s en notas/answers.</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
