const sections = ['Home', 'Workloads', 'Hypotheses', 'Interviews', 'Flows', 'Sales', 'Settings']

export function CloudSidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-dot" />
        <div>
          <p className="brand-title">Research OS</p>
          <p className="brand-sub">Cloud Console</p>
        </div>
      </div>

      <nav className="menu">
        {sections.map((item, i) => (
          <button key={item} className={`menu-item ${i === 0 ? 'active' : ''}`}>
            <span className="menu-bullet" />
            {item}
          </button>
        ))}
      </nav>

      <div className="capacity card-soft">
        <p className="cap-title">Validation Capacity</p>
        <div className="bar">
          <span style={{ width: '72%' }} />
        </div>
        <p className="cap-value">72% used this week</p>
      </div>
    </aside>
  )
}
