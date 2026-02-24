import { CloudSidebar } from './components/CloudSidebar'

const stats = [
  ['Active Interviews', '42', '+12%'],
  ['Running Hypotheses', '18', '+3'],
  ['Win-rate Sales', '31%', '+5.4%'],
  ['Avg Validation Score', '78/100', '+2.1'],
]

const cards = [
  {
    title: 'Hypothesis Engine',
    text: 'Create falsifiable hypotheses with confidence windows, criteria and target persona.',
    cta: 'Open Hypotheses',
  },
  {
    title: 'Interview Pipeline',
    text: 'Run guided sessions, autosave answers, and capture urgency/pain signals in real time.',
    cta: 'Start Interview',
  },
  {
    title: 'Validation Flow Studio',
    text: 'Model branching validation paths and version your decision logic as nodes/edges.',
    cta: 'Edit Flows',
  },
  {
    title: 'Sales Playbooks',
    text: 'Deploy scripts, objection maps and follow-up sequences linked to each hypothesis.',
    cta: 'Launch Sales',
  },
]

export function App() {
  return (
    <div className="layout">
      <CloudSidebar />

      <main className="main">
        <header className="hero card-soft">
          <div>
            <p className="pill">CLOUD WORKSPACE</p>
            <h1>Research OS Home</h1>
            <p className="hero-text">
              Opera validación + entrevistas + ventas desde un único centro de comando, con estética cloud
              y navegación orientada a decisiones.
            </p>
            <div className="hero-actions">
              <button className="btn-primary">Go to Dashboard</button>
              <button className="btn-ghost">Create Hypothesis</button>
            </div>
          </div>
          <div className="hero-grid">
            {stats.map(([label, value, trend]) => (
              <div className="metric card-soft" key={label}>
                <p>{label}</p>
                <h3>{value}</h3>
                <small>{trend}</small>
              </div>
            ))}
          </div>
        </header>

        <section className="modules">
          {cards.map((c) => (
            <article key={c.title} className="module card-soft">
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <button className="link-btn">{c.cta} →</button>
            </article>
          ))}
        </section>

        <section className="activity card-soft">
          <h3>Recent Cloud Activity</h3>
          <ul>
            <li>Hypothesis “SMB onboarding friction” moved to running state.</li>
            <li>Template “Discovery ICP Fintech” updated with budget qualifier block.</li>
            <li>Interview #124 captured strong urgency + buying intent signals.</li>
            <li>Sales playbook “Offer B” raised close-rate from 23% to 31%.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
