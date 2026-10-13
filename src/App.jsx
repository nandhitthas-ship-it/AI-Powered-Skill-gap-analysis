import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Award, BarChart3, BookOpenCheck,
  BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp, FileUp,
  FlaskConical, LayoutDashboard, Lightbulb, LoaderCircle, LogOut, Menu, Plus,
  Search, ShieldCheck, Sparkles, Target, UserRound, X,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { QRCodeSVG } from 'qrcode.react'

const PUBLIC_APP_URL = 'https://SkillGap.com'

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'careers', label: 'Career paths', icon: BriefcaseBusiness },
  { id: 'roadmap', label: 'Learning plan', icon: BookOpenCheck },
  { id: 'simulator', label: 'What-if lab', icon: FlaskConical },
]

async function api(path, options = {}) {
  try {
    const response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 504 || response.status === 502) {
        throw new Error('Backend server is not running on port 5000. Please start Flask.')
      }
      throw new Error(payload.error || `Request failed with status ${response.status}.`)
    }
    return payload
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend. Please ensure the Flask server is running at http://127.0.0.1:5000')
    }
    throw error
  }
}

function AuthScreen({ onAuthenticated }) {
  const [registering, setRegistering] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api(registering ? '/register' : '/login', {
        method: 'POST', body: JSON.stringify(form),
      })
      onAuthenticated(result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function useDemo() {
    setForm({ name: '', email: 'demo@skillpath.local', password: 'Demo123!' })
    setBusy(true)
    setError('')
    try {
      const result = await api('/login', {
        method: 'POST', body: JSON.stringify({ email: 'demo@skillpath.local', password: 'Demo123!' }),
      })
      onAuthenticated(result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <div className="brand brand-light"><span className="brand-mark"><Sparkles size={17} /></span> skillpath</div>
        <div className="story-copy">
          <p className="eyebrow eyebrow-light">YOUR NEXT CHAPTER, IN FOCUS</p>
          <h1>Make your next move<br />feel <em>less like a guess.</em></h1>
          <p className="story-lede">A clearer view of your strengths, the skills to build, and the career paths that fit.</p>
        </div>
        <div className="story-visual" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="visual-core"><Target size={35} strokeWidth={1.45} /></div>
          <span className="orbit-label label-one">your skills</span>
          <span className="orbit-label label-two">career fit</span>
          <span className="orbit-label label-three">next steps</span>
        </div>
        <div className="story-foot"><ShieldCheck size={15} /> Private by design. Your data stays on this device.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="brand brand-mobile"><span className="brand-mark"><Sparkles size={16} /></span> skillpath</div>
          <p className="eyebrow">LOCAL CAREER WORKSPACE</p>
          <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted">{registering ? 'Start building a path that is yours.' : 'Pick up where your next chapter begins.'}</p>
          <form className="auth-form" onSubmit={submit}>
            {registering && <label>Full name<input autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Jordan Lee" /></label>}
            <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label>Password<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 8 : undefined} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={registering ? 'At least 8 characters' : 'Your password'} /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary button-wide" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={17} /> : null}{registering ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button>
          </form>
          <div className="auth-switch">{registering ? 'Already have an account?' : 'New to Skillpath?'} <button className="text-button" onClick={() => { setRegistering(!registering); setError('') }}>{registering ? 'Sign in' : 'Create an account'}</button></div>
          <div className="demo-access"><div><span className="demo-dot" /> Demo workspace</div><button className="button button-outline button-small" onClick={useDemo} disabled={busy}>Explore demo <ArrowRight size={14} /></button></div>
          <section className="app-qr-card" aria-label="Open Skillpath on your phone">
            <a className="app-qr-code" href={PUBLIC_APP_URL} target="_blank" rel="noreferrer" aria-label="Open Skillpath">
              <QRCodeSVG value={PUBLIC_APP_URL} size={112} level="H" />
            </a>
            <div>
              <p className="eyebrow">OPEN ON YOUR PHONE</p>
              <h3>Scan to open Skillpath</h3>
              <p>Point your phone camera at this code.</p>
              <a className="app-qr-url" href={PUBLIC_APP_URL} target="_blank" rel="noreferrer">{PUBLIC_APP_URL}</a>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [catalog, setCatalog] = useState({ skills: [], career_goals: [] })
  const [dashboard, setDashboard] = useState(null)
  const [view, setView] = useState('dashboard')
  const [roadmapRole, setRoadmapRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notice, setNotice] = useState('')

  async function refreshDashboard() {
    const result = await api('/dashboard')
    setDashboard(result)
    setUser(result.student)
  }

  useEffect(() => {
    Promise.all([api('/session'), api('/catalog')]).then(async ([sessionResult, catalogResult]) => {
      setCatalog(catalogResult)
      if (sessionResult.user) {
        setUser(sessionResult.user)
        await refreshDashboard()
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  async function signOut() {
    await api('/logout', { method: 'POST' })
    setUser(null)
    setDashboard(null)
    setView('dashboard')
  }

  async function navigate(nextView) {
    setView(nextView)
    setMobileNavOpen(false)
    if (nextView === 'dashboard') await refreshDashboard()
  }

  if (loading) return <div className="page-loading"><span className="brand-mark"><Sparkles size={17} /></span><LoaderCircle className="spin" size={19} /></div>
  if (!user) return <AuthScreen onAuthenticated={(nextUser) => { setUser(nextUser); refreshDashboard().catch((error) => setNotice(error.message)) }} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span> skillpath</div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${view === id ? 'nav-link-active' : ''}`} onClick={() => navigate(id)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{view === id && <span className="nav-current" />}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={17} /><span><b>Local & private</b><small>Your profile stays on this device.</small></span></div>
          <button className="profile-mini" onClick={() => navigate('profile')}><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span className="profile-mini-copy"><b>{user.name}</b><small>{user.career_goal || 'Student profile'}</small></span><ChevronDown size={15} /></button>
        </div>
      </aside>
      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><b>{navItems.find((item) => item.id === view)?.label || (view === 'profile' ? 'Profile' : 'Workspace')}</b></div>
          <div className="topbar-actions"><span className="local-pill"><span /> LOCAL MODE</span><button className="icon-button" title="Sign out" aria-label="Sign out" onClick={signOut}><LogOut size={18} /></button></div>
        </header>
        <div className="content-area">
          {view === 'dashboard' && (dashboard ? <Dashboard data={dashboard} onNavigate={navigate} /> : <div className="page-loading"><LoaderCircle className="spin" size={24} /></div>)}
          {view === 'profile' && <ProfilePage profile={user} catalog={catalog} onSaved={async (message) => { await refreshDashboard(); setNotice(message) }} onError={(message) => setNotice(message)} />}
          {view === 'careers' && <CareersPage onRoadmap={(slug) => { setView('roadmap'); setRoadmapRole(slug) }} />}
          {view === 'roadmap' && <RoadmapPage careerOptions={dashboard?.recommendations || []} initialSlug={roadmapRole || dashboard?.focus_role?.slug} onProgress={refreshDashboard} onNotice={setNotice} />}
          {view === 'simulator' && <SimulatorPage catalog={catalog} currentSkills={user.skills} />}
        </div>
      </main>
      {notice && <div className="toast" role="status"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  )
}

function Dashboard({ data, onNavigate }) {
  const { student, recommendations, focus_role: focusRole, skill_gap: gap, skill_counts: counts, progress, profile_completion: completion } = data
  const chartData = [
    { name: 'Strong', value: counts.strong, color: '#3567df' },
    { name: 'Improving', value: counts.improving, color: '#8a76dc' },
    { name: 'To explore', value: counts.missing, color: '#e6e9f1' },
  ]
  const bars = recommendations.slice(0, 4).map((career) => ({ name: career.title.replace(' Developer', '').replace(' Analyst', ''), score: career.score }))
  return (
    <div className="page-content">
      <div className="welcome-row"><div><p className="eyebrow">YOUR CAREER WORKSPACE</p><h1>Good to see you, {(student.name || 'there').split(' ')[0]}<span className="title-period">.</span></h1><p className="muted">A practical next step is closer than it looks.</p></div><button className="button button-primary" onClick={() => onNavigate('careers')}>Explore career paths <ArrowRight size={16} /></button></div>
      <section className="focus-banner">
        <div className="focus-icon"><Target size={21} /></div>
        <div className="focus-copy"><span className="focus-label">YOUR TOP MATCH RIGHT NOW</span><h2>{focusRole.title}</h2><p>{recommendations[0]?.reasons[0] || 'Add skills and interests to see what fits your profile.'}</p></div>
        <div className="focus-score"><strong>{recommendations[0]?.score ?? 0}<small>%</small></strong><span>match score</span></div>
        <button className="icon-button focus-arrow" aria-label="View career paths" onClick={() => onNavigate('careers')}><ArrowUpRight size={20} /></button>
      </section>
      <div className="metric-grid">
        <MetricCard icon={Award} label="Skills in your profile" value={Object.keys(student.skills).length} detail={`${counts.strong} strong · ${counts.improving} in progress`} color="blue" />
        <MetricCard icon={BookOpenCheck} label="Learning progress" value={`${progress.percent}%`} detail={`${progress.completed} steps completed`} color="violet" progress={progress.percent} />
        <MetricCard icon={Target} label="Profile completeness" value={`${completion}%`} detail={completion === 100 ? 'Ready for a sharper match' : 'Add detail for a better fit'} color="green" progress={completion} />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">YOUR SKILL MIX</p><h3>Strengths at a glance</h3></div><button className="link-button" onClick={() => onNavigate('profile')}>Edit profile <ArrowRight size={14} /></button></div>
          <div className="skill-chart-wrap">
            <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius="69%" outerRadius="91%" paddingAngle={3} stroke="none">{chartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} skills`, name]} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{Object.keys(student.skills).length}</strong><span>skills</span></div></div>
            <div className="legend-list">{chartData.map((item) => <div className="legend-row" key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{item.value}</b></div>)}<div className="chart-footnote">Missing skills are based on the career library.</div></div>
          </div>
        </section>
        <section className="panel match-panel">
          <div className="panel-heading"><div><p className="eyebrow">CAREER ALIGNMENT</p><h3>Paths worth a look</h3></div><button className="icon-button subtle-icon" aria-label="View all career paths" onClick={() => onNavigate('careers')}><ArrowUpRight size={18} /></button></div>
          <div className="match-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={bars} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#edf0f5" /><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" width={112} tickLine={false} axisLine={false} tick={{ fill: '#687187', fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}% match`, 'Fit']} cursor={{ fill: '#f6f7fb' }} /><Bar dataKey="score" fill="#4b6fe0" radius={[0, 5, 5, 0]} barSize={13} /></BarChart></ResponsiveContainer></div>
          <div className="match-foot"><span><i className="legend-blue" />Estimated fit</span><span>Based on your current profile</span></div>
        </section>
      </div>
      <div className="lower-grid">
        <section className="panel gap-panel"><div className="panel-heading"><div><p className="eyebrow">TOWARD {focusRole.title.toUpperCase()}</p><h3>Your skill snapshot</h3></div><button className="link-button" onClick={() => onNavigate('careers')}>Full analysis <ArrowRight size={14} /></button></div><div className="gap-groups"><SkillGroup title="Strong" skills={gap.strong} tone="strong" /><SkillGroup title="Building" skills={gap.improving} tone="improving" /><SkillGroup title="Next to learn" skills={gap.missing.slice(0, 4)} tone="missing" /></div></section>
        <section className="panel next-panel"><p className="eyebrow">A GOOD NEXT STEP</p><div className="next-icon"><Lightbulb size={19} /></div><h3>Turn one gap into momentum.</h3><p>Start with a short project. A visible result can make a new skill easier to remember and demonstrate.</p><button className="button button-dark" onClick={() => onNavigate('roadmap')}>Open your learning plan <ArrowRight size={15} /></button></section>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, color, progress }) {
  return <section className="metric-card"><div className={`metric-icon metric-${color}`}><Icon size={18} /></div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>{progress !== undefined && <div className="metric-ring" style={{ '--progress': `${progress * 3.6}deg` }}><span>{progress}%</span></div>}</section>
}

function SkillGroup({ title, skills, tone }) {
  return <div className="skill-group"><div className="skill-group-title"><i className={`status-dot dot-${tone}`} />{title}<span>{skills.length}</span></div><div className="skill-chip-wrap">{skills.length ? skills.map((skill) => <span className={`skill-chip chip-${tone}`} key={skill}>{skill}</span>) : <span className="empty-copy">Nothing here yet</span>}</div></div>
}

function ProfilePage({ profile, catalog, onSaved, onError }) {
  const [draft, setDraft] = useState(profile)
  const [newSkill, setNewSkill] = useState('')
  const [interestInput, setInterestInput] = useState(profile.interests.join(', '))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resumeMessage, setResumeMessage] = useState('')
  useEffect(() => { setDraft(profile); setInterestInput(profile.interests.join(', ')) }, [profile])

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const interests = interestInput.split(',').map((item) => item.trim()).filter(Boolean)
      await api('/profile', { method: 'PUT', body: JSON.stringify({ ...draft, interests }) })
      await onSaved('Profile changes saved.')
    } catch (error) { onError(error.message) } finally { setSaving(false) }
  }

  async function uploadResume(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setResumeMessage('')
    try {
      const body = new FormData()
      body.append('resume', file)
      const result = await api('/resume', { method: 'POST', body })
      setDraft(result.profile)
      setResumeMessage(result.extracted_skills.length ? `Found ${result.extracted_skills.length} skills: ${result.extracted_skills.join(', ')}.` : 'No known skills found in selectable PDF text.')
      await onSaved('Resume analyzed and profile updated.')
    } catch (error) { onError(error.message) } finally { setUploading(false); event.target.value = '' }
  }

  function addSkill() {
    if (!newSkill) return
    setDraft({ ...draft, skills: { ...draft.skills, [newSkill]: 'improving' } })
    setNewSkill('')
  }

  return (
    <div className="page-content subpage">
      <PageHeading eyebrow="YOUR DETAILS, YOUR DIRECTION" title="Profile" description="Keep your starting point current. Your recommendations update from these details." />
      <div className="profile-layout">
        <form className="panel profile-form" onSubmit={saveProfile}>
          <div className="form-section-heading"><div className="section-number">01</div><div><h3>About you</h3><p>Details that give your career matches context.</p></div></div>
          <div className="form-grid"><label>Full name<input required minLength="2" maxLength="80" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Email address<input value={draft.email} disabled /><small>Email is used for sign-in and cannot be changed here.</small></label><label className="span-two">Education<input maxLength="160" placeholder="Degree, institution, or current study" value={draft.education} onChange={(event) => setDraft({ ...draft, education: event.target.value })} /></label><label>Career goal<select value={draft.career_goal} onChange={(event) => setDraft({ ...draft, career_goal: event.target.value })}><option value="">Choose a direction</option>{catalog.career_goals.map((goal) => <option key={goal}>{goal}</option>)}</select></label><label className="span-two">Interests <span className="field-hint">Separate with commas</span><input value={interestInput} onChange={(event) => setInterestInput(event.target.value)} placeholder="data, design, building products" /></label></div>
          <div className="form-section-heading skill-heading"><div className="section-number">02</div><div><h3>Your skills</h3><p>Set a starting level. Resume-extracted skills begin as improving.</p></div></div>
          <div className="add-skill-row"><select value={newSkill} onChange={(event) => setNewSkill(event.target.value)}><option value="">Add a skill</option>{catalog.skills.filter((skill) => !draft.skills[skill]).map((skill) => <option key={skill}>{skill}</option>)}</select><button type="button" className="button button-outline button-small" onClick={addSkill} disabled={!newSkill}><Plus size={15} /> Add</button></div>
          <div className="editable-skills">{Object.entries(draft.skills).map(([skill, level]) => <div className="editable-skill" key={skill}><span className="skill-name"><i className={`status-dot dot-${level}`} />{skill}</span><select aria-label={`${skill} level`} value={level} onChange={(event) => setDraft({ ...draft, skills: { ...draft.skills, [skill]: event.target.value } })}><option value="strong">Strong</option><option value="improving">Improving</option></select><button type="button" className="remove-skill" title={`Remove ${skill}`} aria-label={`Remove ${skill}`} onClick={() => { const skills = { ...draft.skills }; delete skills[skill]; setDraft({ ...draft, skills }) }}><X size={15} /></button></div>)}{!Object.keys(draft.skills).length && <p className="empty-panel-copy">Add skills manually or analyze a resume to begin.</p>}</div>
          <div className="profile-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Save profile</button></div>
        </form>
        <aside className="profile-side"><section className="panel resume-panel"><div className="resume-icon"><FileUp size={20} /></div><p className="eyebrow">PDF RESUME</p><h3>Bring your skills in.</h3><p>Extracts known skill terms from selectable PDF text. Your original file is not stored.</p><label className="button button-dark upload-button">{uploading ? <LoaderCircle className="spin" size={16} /> : <FileUp size={16} />}{uploading ? 'Analyzing…' : 'Choose a PDF'}<input type="file" accept="application/pdf,.pdf" onChange={uploadResume} disabled={uploading} /></label><small className="upload-limit">PDF only · up to 5 MB</small>{resumeMessage && <div className="resume-result"><CheckCircle2 size={15} />{resumeMessage}</div>}</section><section className="privacy-card"><ShieldCheck size={18} /><div><b>Private on this computer</b><p>Profile, resume analysis, and learning progress are saved in your local SQLite database.</p></div></section></aside>
      </div>
    </div>
  )
}

function CareersPage({ onRoadmap }) {
  const [careers, setCareers] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/careers')
      .then((result) => {
        setCareers(result.careers)
        setSelected(result.careers[0]?.slug || '')
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page-loading"><LoaderCircle className="spin" size={24} /></div>
  }

  const career = careers.find((item) => item.slug === selected)
  return (
    <div className="page-content subpage">
      <PageHeading eyebrow="MATCHES, WITH THE REASONS ATTACHED" title="Career paths" description="Compare estimated fit, see what is already working, and choose a direction to explore." />
      {error && <div className="form-error">{error}</div>}
      <div className="career-layout">
        <div className="career-list">
          {careers.map((item, index) => (
            <button key={item.slug} className={`career-option ${selected === item.slug ? 'career-option-active' : ''}`} onClick={() => setSelected(item.slug)}>
              <span className="career-rank">0{index + 1}</span>
              <span className="career-option-copy">
                <b>{item.title}</b>
                <small>{item.matched_skills.length} of {item.matched_skills.length + item.missing_skills.length} role skills in your profile</small>
              </span>
              <span className="career-option-score">{item.score}<small>%</small></span>
            </button>
          ))}
        </div>
        {career && (
          <section className="panel career-detail">
            <div className="career-detail-top">
              <div className="career-large-icon"><BriefcaseBusiness size={21} /></div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="match-tag"><Target size={13} />{career.score}% overall match</span>
                {career.tfidf_similarity !== undefined && (
                  <span className="match-tag" style={{ background: '#ede9fe', color: '#6d28d9', borderColor: '#ddd6fe' }}>
                    <Sparkles size={13} />{career.tfidf_similarity}% TF-IDF similarity
                  </span>
                )}
              </div>
            </div>
            <h2>{career.title}</h2>
            <p className="career-description">{career.description}</p>
            <div className="detail-rule" />
            <h3>Why it fits</h3>
            <ul className="reason-list">{career.reasons.map((reason) => <li key={reason}><CheckCircle2 size={16} />{reason}</li>)}</ul>
            <div className="career-skill-groups">
              <SkillGroup title="Strong" skills={career.matched_skills.filter((skill) => !career.improving_skills.includes(skill))} tone="strong" />
              <SkillGroup title="Building" skills={career.improving_skills} tone="improving" />
              <SkillGroup title="Missing" skills={career.missing_skills} tone="missing" />
            </div>
            <button className="button button-primary button-wide" onClick={() => onRoadmap(career.slug)}>View this learning plan <ArrowRight size={16} /></button>
            <p className="scoring-note"><CircleHelp size={14} />Scikit-learn TF-IDF cosine similarity & transparent rule-based algorithm: 50% role skill coverage, 30% TF-IDF vector similarity, 15% interest alignment, 5% career goal.</p>
          </section>
        )}
      </div>
    </div>
  )
}

function RoadmapPage({ careerOptions, initialSlug, onProgress, onNotice }) {
  const [slug, setSlug] = useState(initialSlug || careerOptions[0]?.slug || '')
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(false)
  const [busyItem, setBusyItem] = useState('')

  useEffect(() => {
    if (initialSlug) setSlug(initialSlug)
  }, [initialSlug])

  useEffect(() => {
    if (!slug && careerOptions.length > 0) setSlug(careerOptions[0].slug)
  }, [careerOptions, slug])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api(`/roadmap?role=${encodeURIComponent(slug)}`)
      .then(setRoadmap)
      .catch((error) => onNotice(error.message))
      .finally(() => setLoading(false))
  }, [slug])

  async function toggle(item) {
    setBusyItem(item.id)
    try {
      await api('/progress', { method: 'PATCH', body: JSON.stringify({ role_slug: slug, item_id: item.id, completed: !item.completed }) })
      const updated = await api(`/roadmap?role=${encodeURIComponent(slug)}`)
      setRoadmap(updated)
      await onProgress()
    } catch (error) { onNotice(error.message) } finally { setBusyItem('') }
  }

  const completeCount = roadmap?.items.filter((item) => item.completed).length || 0
  return (
    <div className="page-content subpage">
      <PageHeading eyebrow="SMALL STEPS, VISIBLE PROGRESS" title="Learning plan" description="A practical sequence of learning, projects, and portfolio milestones." />
      <div className="roadmap-toolbar">
        <label>Career direction
          <select value={slug} onChange={(event) => setSlug(event.target.value)}>
            {careerOptions.map((career) => <option value={career.slug} key={career.slug}>{career.title}</option>)}
          </select>
        </label>
        {roadmap && (
          <div className="roadmap-progress">
            <span>{completeCount} of {roadmap.items.length} complete</span>
            <div className="progress-track"><i style={{ width: `${(completeCount / roadmap.items.length) * 100}%` }} /></div>
          </div>
        )}
      </div>
      {loading && !roadmap ? (
        <div className="page-loading"><LoaderCircle className="spin" size={24} /></div>
      ) : roadmap ? (
        <>
          <div className="roadmap-intro">
            <span className="roadmap-intro-icon"><BookOpenCheck size={19} /></span>
            <div><p className="eyebrow">YOUR PATH</p><h2>{roadmap.role.title}</h2><p>{roadmap.role.description}</p></div>
          </div>
          <div className="roadmap-list">
            {roadmap.items.map((item, index) => (
              <article className={`roadmap-item ${item.completed ? 'roadmap-item-done' : ''}`} key={item.id}>
                <div className="roadmap-step">{item.completed ? <Check size={16} /> : `0${index + 1}`}</div>
                <div className="roadmap-item-content">
                  <div className="roadmap-item-meta"><span className="kind-label">{item.kind}</span><span className="step-label">STEP {index + 1}</span></div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <button className={`complete-button ${item.completed ? 'complete-button-done' : ''}`} onClick={() => toggle(item)} disabled={busyItem === item.id} aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.title}`} title={item.completed ? 'Mark incomplete' : 'Mark complete'}>
                  {busyItem === item.id ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
                </button>
              </article>
            ))}
          </div>
          <div className="resource-note"><Lightbulb size={17} /><p><b>Keep it practical.</b> Suggested learning resources are intentionally tool-neutral. Choose current free documentation, open course materials, and local projects that fit your pace.</p></div>
        </>
      ) : null}
    </div>
  )
}

function SimulatorPage({ catalog, currentSkills }) {
  const [skill, setSkill] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function simulate(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { setResult(await api('/simulate', { method: 'POST', body: JSON.stringify({ skill }) })) }
    catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }
  const beforeBySlug = Object.fromEntries((result?.before || []).map((item) => [item.slug, item]))
  const chartData = (result?.after || []).map((item) => ({ title: item.title, before: beforeBySlug[item.slug]?.score || 0, after: item.score, delta: item.score - (beforeBySlug[item.slug]?.score || 0) })).sort((a, b) => b.delta - a.delta || b.after - a.after)
  return <div className="page-content subpage"><PageHeading eyebrow="TEST A POSSIBLE NEXT STEP" title="What-if lab" description="Try adding one skill and see how the transparent match scores change. Nothing is saved to your profile." /><div className="simulator-layout"><section className="panel simulator-control"><span className="sim-icon"><FlaskConical size={21} /></span><p className="eyebrow">A SMALL EXPERIMENT</p><h2>What if you learned…</h2><p>Choose a skill you do not have yet. We will score it as improving and compare career matches.</p><form onSubmit={simulate}><label htmlFor="sim-skill">Skill to add</label><select id="sim-skill" required value={skill} onChange={(event) => setSkill(event.target.value)}><option value="">Choose a skill</option>{catalog.skills.filter((item) => !currentSkills[item]).map((item) => <option key={item}>{item}</option>)}</select><button className="button button-primary button-wide" disabled={!skill || busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />} Run simulation <ArrowRight size={15} /></button></form>{error && <div className="form-error">{error}</div>}<div className="simulation-disclaimer"><ShieldCheck size={15} /> This is a temporary comparison; your profile stays unchanged.</div></section>{result ? <section className="panel simulation-results"><div className="panel-heading"><div><p className="eyebrow">SIMULATED SKILL: {result.added_skill.toUpperCase()}</p><h3>Match score changes</h3></div><span className="simulated-badge">Not saved</span></div><div className="simulation-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData.slice(0, 6)} layout="vertical" margin={{ top: 4, right: 36, left: 0, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#edf0f5" /><XAxis type="number" domain={[0, 100]} hide /><YAxis dataKey="title" type="category" width={143} tickLine={false} axisLine={false} tick={{ fill: '#687187', fontSize: 11 }} /><Tooltip formatter={(value, name) => [`${value}%`, name === 'before' ? 'Current' : 'With skill']} /><Bar dataKey="before" name="Current" fill="#d9deea" radius={[0, 4, 4, 0]} barSize={9} /><Bar dataKey="after" name="With skill" fill="#5577df" radius={[0, 4, 4, 0]} barSize={9} /></BarChart></ResponsiveContainer></div><div className="delta-list">{chartData.slice(0, 4).map((item) => <div className="delta-row" key={item.title}><span>{item.title}</span><b className={item.delta > 0 ? 'delta-positive' : ''}>{item.delta > 0 ? <ArrowUpRight size={14} /> : item.delta < 0 ? <ArrowDownRight size={14} /> : null}{item.delta > 0 ? '+' : ''}{item.delta} pts</b></div>)}</div></section> : <section className="panel sim-empty"><div className="empty-rings"><Target size={26} /></div><h3>Curiosity is a good starting point.</h3><p>Choose a skill to see which career paths get a little closer.</p><div className="empty-decoration"><span /><span /><span /></div></section>}</div><div className="scoring-explainer"><div className="scoring-explainer-icon"><CircleHelp size={18} /></div><div><b>How scores are calculated</b><p>50% weighted coverage of a role's required skills (strong = 1.0, improving = 0.6), 30% Scikit-learn TF-IDF cosine similarity, 15% shared interest tags, and 5% when your stated goal matches the role. This is an explainable machine learning vector space and skill coverage model, not an unverified AI claim.</p></div></div></div>
}

function PageHeading({ eyebrow, title, description }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
}

export default App