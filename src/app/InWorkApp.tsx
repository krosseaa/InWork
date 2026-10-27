import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Role = 'admin' | 'employee'
type View = 'dashboard' | 'employees' | 'attendance' | 'tasks' | 'inventory' | 'notifications' | 'profile' | 'settings'
type User = { name: string; email: string; role: Role; employeeId: string; position: string; department: string }
type Employee = { id: string; name: string; department: string; position: string; email: string; status: string; initials: string; phone?: string; salary?: string; hireDate?: string }
type Task = { id: number; title: string; assignee: string; priority: string; status: string; progress: number; due: string; description?: string; requiredPosition?: string; slots?: number; claimedBy?: string[] }
type Item = { id: number; name: string; code: string; category: string; stock: number; minimum: number; unit: string; location: string }
type AttendanceRecord = { id: number; employeeId: string; date: string; checkIn?: string; checkOut?: string; checkInPhoto?: string; checkOutPhoto?: string; status: string }

const seedEmployees: Employee[] = [
  { id: 'IW-001', name: 'Olivia Martin', department: 'Design', position: 'Product Designer', email: 'employee1@inwork.demo', status: 'Active', initials: 'OM', phone: '+1 202 555 0134', salary: '$74,000', hireDate: '12 Mar 2023' },
  { id: 'IW-002', name: 'James Wilson', department: 'Engineering', position: 'Frontend Engineer', email: 'employee2@inwork.demo', status: 'Active', initials: 'JW', phone: '+1 202 555 0168', salary: '$82,500', hireDate: '08 Aug 2022' },
  { id: 'IW-003', name: 'Sophia Lee', department: 'Marketing', position: 'Growth Manager', email: 'sophia@inwork.demo', status: 'Active', initials: 'SL', phone: '+1 202 555 0191', salary: '$88,000', hireDate: '19 Jan 2022' },
  { id: 'IW-004', name: 'Ethan Brown', department: 'Operations', position: 'Operations Lead', email: 'ethan@inwork.demo', status: 'On leave', initials: 'EB', phone: '+1 202 555 0147', salary: '$79,500', hireDate: '04 Nov 2021' },
]
const seedTasks: Task[] = [
  { id: 1, title: 'Refresh onboarding experience', assignee: 'Olivia Martin', priority: 'High', status: 'In Progress', progress: 72, due: '28 Jun', requiredPosition: 'Product Designer', slots: 1, claimedBy: ['IW-001'] },
  { id: 2, title: 'Build dashboard components', assignee: '', priority: 'Medium', status: 'Available', progress: 0, due: '30 Jun', description: 'Build accessible dashboard UI components.', requiredPosition: 'Frontend Engineer', slots: 2, claimedBy: [] },
  { id: 3, title: 'Design employee mobile flow', assignee: '', priority: 'High', status: 'Available', progress: 0, due: '02 Jul', description: 'Design and validate the employee mobile journey.', requiredPosition: 'Product Designer', slots: 1, claimedBy: [] },
]
const demoAccounts: Record<string, User> = {
  'manager@inwork.demo': { name: 'Alex Morgan', email: 'manager@inwork.demo', role: 'admin', employeeId: 'MGR-001', position: 'People Operations Director', department: 'People Operations' },
  'employee1@inwork.demo': { name: 'Olivia Martin', email: 'employee1@inwork.demo', role: 'employee', employeeId: 'IW-001', position: 'Product Designer', department: 'Design' },
  'employee2@inwork.demo': { name: 'James Wilson', email: 'employee2@inwork.demo', role: 'employee', employeeId: 'IW-002', position: 'Frontend Engineer', department: 'Engineering' },
}
const seedItems: Item[] = [
  { id: 1, name: 'MacBook Pro 14"', code: 'AST-210', category: 'Equipment', stock: 8, minimum: 3, unit: 'units', location: 'IT Store' },
  { id: 2, name: 'Ergonomic Chair', code: 'FUR-091', category: 'Furniture', stock: 12, minimum: 5, unit: 'units', location: 'Warehouse A' },
  { id: 3, name: 'Printer Paper A4', code: 'SUP-302', category: 'Supplies', stock: 4, minimum: 10, unit: 'reams', location: 'Supply Room' },
]
const performance = [
  { name: 'Mon', completed: 7, assigned: 10 },
  { name: 'Tue', completed: 10, assigned: 13 },
  { name: 'Wed', completed: 8, assigned: 11 },
  { name: 'Thu', completed: 12, assigned: 14 },
  { name: 'Fri', completed: 11, assigned: 12 },
]

const copy = {
  en: { dashboard: 'Dashboard', greeting: 'Good morning', overview: 'Here’s what’s happening across your workplace today.', demo: 'Demo workspace · Data is stored in this browser', employees: 'Employee Data', attendance: 'Attendance', tasks: 'Task Performance', inventory: 'Inventory Stock', notifications: 'Notifications', profile: 'My Profile', settings: 'Settings', logout: 'Log out' },
  id: { dashboard: 'Dasbor', greeting: 'Selamat pagi', overview: 'Berikut ringkasan aktivitas tempat kerja hari ini.', demo: 'Ruang demo · Data tersimpan di browser ini', employees: 'Data Karyawan', attendance: 'Kehadiran', tasks: 'Kinerja Tugas', inventory: 'Stok Inventaris', notifications: 'Notifikasi', profile: 'Profil Saya', settings: 'Pengaturan', logout: 'Keluar' },
}

function getStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

export function InWorkApp() {
  const [user, setUser] = useState<User | null>(() => getStored('inwork-session', null))
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [view, setView] = useState<View>('dashboard')
  const [dark, setDark] = useState(() => getStored('inwork-dark', false))
  const [lang, setLang] = useState<'en' | 'id'>(() => getStored('inwork-lang', 'en'))
  const [menu, setMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [employees, setEmployees] = useState(() => getStored('inwork-employees', seedEmployees))
  const [tasks, setTasks] = useState(() => getStored('inwork-tasks', seedTasks))
  const [items, setItems] = useState(() => getStored('inwork-items', seedItems))
  const [modal, setModal] = useState<null | 'employee' | 'task' | 'item'>(null)
  const [search, setSearch] = useState('')
  const [checkedIn, setCheckedIn] = useState(() => getStored('inwork-checked-in', false))
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getStored('inwork-attendance', []))
  const [cameraAction, setCameraAction] = useState<null | 'checkIn' | 'checkOut'>(null)
  const t = copy[lang]

  useEffect(() => { localStorage.setItem('inwork-employees', JSON.stringify(employees)) }, [employees])
  useEffect(() => { localStorage.setItem('inwork-tasks', JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem('inwork-items', JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem('inwork-dark', JSON.stringify(dark)); document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => { localStorage.setItem('inwork-lang', JSON.stringify(lang)) }, [lang])
  useEffect(() => { localStorage.setItem('inwork-attendance', JSON.stringify(attendance)) }, [attendance])

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  const login = (data: { email: string; password: string; role?: Role }) => {
    const next = demoAccounts[data.email.toLowerCase()]
    if (!next || data.password.length < 8 || !data.role || next.role !== data.role) return false
    localStorage.setItem('inwork-session', JSON.stringify(next)); setUser(next); notify('Welcome back to InWork'); return true
  }
  const logout = () => { localStorage.removeItem('inwork-session'); setUser(null); setView('dashboard') }
  const navigate = (next: View) => { setView(next); setMenu(false) }

  if (!user) return <Auth mode={authMode} setMode={setAuthMode} login={login} notify={notify} dark={dark} />

  const employeeNav = user.role === 'employee'
    ? [{ id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard }, { id: 'attendance', label: 'My Attendance', icon: CalendarDays }, { id: 'tasks', label: 'My Tasks', icon: ClipboardCheck }, { id: 'inventory', label: 'Stock Reports', icon: Package }]
    : [{ id: 'dashboard', label: t.dashboard, icon: LayoutDashboard }, { id: 'employees', label: t.employees, icon: UsersRound }, { id: 'attendance', label: t.attendance, icon: CalendarDays }, { id: 'tasks', label: t.tasks, icon: ClipboardCheck }, { id: 'inventory', label: t.inventory, icon: Package }]
  const nav = [...employeeNav, { id: 'notifications', label: t.notifications, icon: Bell }, { id: 'profile', label: t.profile, icon: UserRound }, { id: 'settings', label: t.settings, icon: Settings }] as { id: View; label: string; icon: typeof LayoutDashboard }[]

  return (
    <div className="app-shell">
      <aside className={menu ? 'sidebar open' : 'sidebar'}>
        <Brand compact />
        <button className="mobile-close" onClick={() => setMenu(false)} aria-label="Close menu"><X /></button>
        <div className="workspace-pill"><span>IW</span><div><strong>InWork Studio</strong><small>{user.role === 'admin' ? 'Administrator' : 'Employee'}</small></div></div>
        <nav>{nav.map(({ id, label, icon: Icon }) => <button className={view === id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(id)} key={id}><Icon />{label}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="user-chip"><span className="avatar">AM</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div>
          <button className="nav-item danger" onClick={logout}><LogOut />{t.logout}</button>
        </div>
      </aside>
      {menu && <button className="backdrop" onClick={() => setMenu(false)} aria-label="Close navigation" />}
      <main className="main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenu(true)}><Menu /></button>
          <div className="mobile-brand"><Brand compact /></div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</button>
            <button className="icon-button notification" onClick={() => navigate('notifications')} aria-label="Notifications"><Bell /><i /></button>
            <button className="profile-button" onClick={() => navigate('profile')}><span className="avatar">AM</span><span>{user.name}</span></button>
          </div>
        </header>
        <section className="content">
          {view === 'dashboard' && <Dashboard user={user} t={t} employees={employees} tasks={tasks} items={items} checkedIn={checkedIn} setCheckedIn={() => setCameraAction(checkedIn ? 'checkOut' : 'checkIn')} navigate={navigate} />}
          {view === 'employees' && <Employees employees={employees} search={search} setSearch={setSearch} open={() => setModal('employee')} remove={(id) => { if (confirm('Delete this employee?')) { setEmployees(employees.filter((e: Employee) => e.id !== id)); notify('Employee removed') } }} />}
          {view === 'attendance' && <Attendance user={user} checkedIn={checkedIn} attendance={attendance} action={() => setCameraAction(checkedIn ? 'checkOut' : 'checkIn')} />}
          {view === 'tasks' && <Tasks user={user} tasks={tasks} setTasks={setTasks} open={() => setModal('task')} notify={notify} />}
          {view === 'inventory' && <Inventory user={user} items={items} setItems={setItems} open={() => setModal('item')} notify={notify} />}
          {view === 'notifications' && <Notifications />}
          {view === 'profile' && <Profile user={user} notify={notify} />}
          {view === 'settings' && <SettingsPage dark={dark} setDark={setDark} lang={lang} setLang={setLang} />}
        </section>
      </main>
      {modal && <AddModal type={modal} employees={employees} close={() => setModal(null)} save={(data) => {
        if (modal === 'employee') setEmployees([...employees, data as Employee])
        if (modal === 'task') setTasks([...tasks, data as Task])
        if (modal === 'item') setItems([...items, data as Item])
        setModal(null); notify(`${modal[0].toUpperCase() + modal.slice(1)} added successfully`)
      }} />}
      {cameraAction && <CameraAttendance action={cameraAction} close={() => setCameraAction(null)} confirm={(photo) => {
        const now = new Date()
        const date = now.toISOString().slice(0, 10)
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (cameraAction === 'checkIn') {
          const record: AttendanceRecord = { id: Date.now(), employeeId: user.employeeId, date, checkIn: time, checkInPhoto: photo, status: now.getHours() >= 9 ? 'Late' : 'Present' }
          setAttendance([...attendance.filter(x => !(x.employeeId === user.employeeId && x.date === date)), record])
          setCheckedIn(true); localStorage.setItem('inwork-checked-in', 'true'); notify('Check-in recorded with photo evidence')
        } else {
          const existing = attendance.find(x => x.employeeId === user.employeeId && x.date === date)
          if (!existing) { notify('A valid check-in is required first'); return }
          setAttendance(attendance.map(x => x.id === existing.id ? { ...x, checkOut: time, checkOutPhoto: photo } : x))
          setCheckedIn(false); localStorage.setItem('inwork-checked-in', 'false'); notify('Check-out recorded with photo evidence')
        }
        setCameraAction(null)
      }} />}
      {toast && <div className="toast"><Check />{toast}</div>}
    </div>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'brand compact' : 'brand'}><span className="logo-mark"><i /><i /><i /></span><div><b>InWork</b>{!compact && <small>Manage Work. Empower People.</small>}</div></div>
}

function Auth({ mode, setMode, login, notify, dark }: { mode: 'login' | 'register' | 'forgot'; setMode: (m: 'login' | 'register' | 'forgot') => void; login: (d: { email: string; password: string; role?: Role }) => boolean; notify: (s: string) => void; dark: boolean }) {
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState<Role>('admin')
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget)
    if (mode === 'forgot') { notify('Demo reset link sent'); setMode('login'); return }
    const password = String(fd.get('password') || '')
    if (mode === 'register') {
      if (password !== fd.get('confirm')) { setError('Passwords do not match'); return }
      notify('Account created. You can now sign in.'); setMode('login'); return
    }
    if (!login({ email: String(fd.get('email')), password, role })) setError('Account, selected role, or password is incorrect. Passwords require at least 8 characters.')
  }
  return <div className={dark ? 'auth-page dark' : 'auth-page'}>
    <div className="auth-art">
      <Brand />
      <div className="art-copy"><span className="eyebrow">THE PEOPLE OPERATING SYSTEM</span><h1>Great work starts with empowered people.</h1><p>One calm, connected workspace for your people, tasks, attendance and resources.</p></div>
      <div className="floating-card"><span className="avatar mint">JW</span><div><b>James checked in</b><small>On time · 08:42 AM</small></div><span className="success-dot"><Check /></span></div>
      <p className="demo-note">Demo access: use any valid email and a 6+ character password. Emails starting with “employee” open the employee workspace.</p>
    </div>
    <div className="auth-panel"><div className="auth-mobile-brand"><Brand /></div><div className="auth-box">
      <span className="eyebrow">{mode === 'register' ? 'CREATE YOUR WORKSPACE' : mode === 'forgot' ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</span>
      <h2>{mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : 'Sign in to InWork'}</h2>
      <p>{mode === 'login' ? 'Enter your details to continue to your workspace.' : mode === 'register' ? 'You’ll join as an employee by default.' : 'We’ll send reset instructions to your email.'}</p>
      <form onSubmit={submit}>
        {mode === 'login' && <div className="role-select"><button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}><UsersRound />Login as Manager</button><button type="button" className={role === 'employee' ? 'active' : ''} onClick={() => setRole('employee')}><UserRound />Login as Employee</button></div>}
        {mode === 'register' && <Field label="Full name" name="name" placeholder="Your full name" />}
        <Field label="Email address" name="email" type="email" placeholder="you@company.com" />
        {mode !== 'forgot' && <label className="field"><span>Password</span><div className="password-field"><input name="password" type={show ? 'text' : 'password'} minLength={8} placeholder="At least 8 characters" required /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>}
        {mode === 'register' && <Field label="Confirm password" name="confirm" type="password" placeholder="Repeat your password" />}
        {error && <div className="form-error">{error}</div>}
        {mode === 'login' && <div className="form-row"><label className="check"><input type="checkbox" /> Remember me</label><button type="button" className="text-button" onClick={() => setMode('forgot')}>Forgot password?</button></div>}
        <button className="primary-button" type="submit">{mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}<ChevronRight /></button>
      </form>
      <p className="demo-accounts">Demo password: <b>inworkdemo</b><br/>Manager: manager@inwork.demo<br/>Employees: employee1@inwork.demo · employee2@inwork.demo</p>
      <p className="switch-auth">{mode === 'login' ? 'New to InWork?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create account' : 'Back to sign in'}</button></p>
    </div></div>
  </div>
}

function Field({ label, name, type = 'text', placeholder }: { label: string; name: string; type?: string; placeholder: string }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} placeholder={placeholder} required /></label>
}

function PageHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Dashboard({ user, t, employees, tasks, items, checkedIn, setCheckedIn, navigate }: any) {
  const cards = user.role === 'admin'
    ? [{ label: 'Total employees', value: employees.length, icon: UsersRound, color: 'blue', to: 'employees' }, { label: 'Present today', value: employees.length - 1, icon: ClipboardCheck, color: 'green', to: 'attendance' }, { label: 'Open tasks', value: tasks.filter((x: Task) => x.status !== 'Completed').length, icon: BriefcaseBusiness, color: 'orange', to: 'tasks' }, { label: 'Low stock items', value: items.filter((x: Item) => x.stock <= x.minimum).length, icon: Archive, color: 'purple', to: 'inventory' }]
    : [{ label: 'Attendance this month', value: '96%', icon: CalendarDays, color: 'blue' }, { label: 'Tasks completed', value: tasks.filter((x: Task) => x.status === 'Completed').length, icon: ClipboardCheck, color: 'green' }, { label: 'Tasks in progress', value: tasks.filter((x: Task) => x.status === 'In Progress').length, icon: Clock3, color: 'orange' }]
  return <>
    <PageHead eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()} title={`${t.greeting}, ${user.name.split(' ')[0]}`} description={t.overview} action={<span className="demo-badge">{t.demo}</span>} />
    <div className="stats-grid">{cards.map((card: any) => <button className="stat-card" key={card.label} onClick={() => card.to && navigate(card.to)}><span className={`stat-icon ${card.color}`}><card.icon /></span><div><small>{card.label}</small><strong>{card.value}</strong></div><ChevronRight /></button>)}</div>
    <div className="dashboard-grid">
      <article className="panel chart-panel"><div className="panel-head"><div><h2>Task performance</h2><p>Completed tasks against assigned work</p></div><span className="trend">+18.2%</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={performance}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'var(--soft)' }} /><Bar dataKey="assigned" fill="#D9DEFF" radius={[6,6,0,0]} /><Bar dataKey="completed" fill="#3038D9" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></article>
      <article className="panel attendance-card"><div className="panel-head"><div><h2>Today’s attendance</h2><p>Your workday at a glance</p></div><Clock3 /></div><div className="time-display">{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date())}<small>Local time</small></div><div className="attendance-times"><div><small>Check in</small><b>{checkedIn ? '08:42 AM' : '—'}</b></div><div><small>Check out</small><b>{checkedIn ? 'Not yet' : '—'}</b></div></div><button className={checkedIn ? 'secondary-button' : 'primary-button'} onClick={() => setCheckedIn(!checkedIn)}>{checkedIn ? 'Check out' : 'Check in now'}</button></article>
      <article className="panel recent"><div className="panel-head"><div><h2>Recent activity</h2><p>Latest updates from your team</p></div><button onClick={() => navigate('notifications')} className="text-button">View all</button></div>{['Sophia completed “Campaign brief”','James checked in for the day','Printer Paper A4 is running low'].map((x, i) => <div className="activity" key={x}><span className={`activity-icon a${i}`}><Check /></span><div><b>{x}</b><small>{i + 1} hour{i ? 's' : ''} ago</small></div></div>)}</article>
      <article className="panel tasks-preview"><div className="panel-head"><div><h2>Priority tasks</h2><p>Work that needs attention</p></div><button onClick={() => navigate('tasks')} className="text-button">View tasks</button></div>{tasks.slice(0,3).map((task: Task) => <div className="mini-task" key={task.id}><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><div><b>{task.title}</b><small>{task.assignee} · Due {task.due}</small></div><strong>{task.progress}%</strong></div>)}</article>
    </div>
  </>
}

function Employees({ employees, search, setSearch, open, remove }: any) {
  const filtered = employees.filter((e: Employee) => `${e.name} ${e.department} ${e.position}`.toLowerCase().includes(search.toLowerCase()))
  const [selected, setSelected] = useState<Employee | null>(null)
  return <><PageHead eyebrow="PEOPLE" title="Employee data" description="Manage your people, roles and employment details." action={<button className="primary-button fit" onClick={open}><Plus />Add employee</button>} /><Toolbar search={search} setSearch={setSearch} placeholder="Search employees..." /><div className="people-grid">{filtered.map((e: Employee, i: number) => <article className="person-card" key={e.id}><div className={`person-cover c${i % 4}`} /><span className="person-avatar">{e.initials}</span><span className="status-badge">{e.status}</span><h3>{e.name}</h3><p>{e.position}</p><dl><div><dt>Employee ID</dt><dd>{e.id}</dd></div><div><dt>Department</dt><dd>{e.department}</dd></div><div><dt>Email</dt><dd>{e.email}</dd></div></dl><div className="card-actions"><button className="secondary-button" onClick={() => setSelected(e)}>View profile</button><button className="icon-button danger" onClick={() => remove(e.id)}><X /></button></div></article>)}</div>{selected && <EmployeeDetail employee={selected} close={() => setSelected(null)} />}</>
}

function Toolbar({ search, setSearch, placeholder }: any) {
  return <div className="toolbar"><label className="search"><Search /><input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} /></label><button className="secondary-button">All departments</button><button className="secondary-button">Active</button></div>
}

function Attendance({ user, checkedIn, attendance, action }: any) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const record = selectedDay ? attendance.find((x: AttendanceRecord) => x.employeeId === user.employeeId && Number(x.date.slice(-2)) === selectedDay) : null
  return <><PageHead eyebrow="JUNE 2025" title={user.role === 'admin' ? 'Attendance history' : 'My attendance'} description="Review working days, time records and attendance patterns." action={<button className={checkedIn ? 'secondary-button fit' : 'primary-button fit'} onClick={action}><Clock3 />{checkedIn ? 'Check out with camera' : 'Check in with camera'}</button>} /><div className="attendance-layout"><article className="panel calendar"><div className="panel-head"><div><h2>June 2025</h2><p>Select any date to inspect its records</p></div><div className="calendar-key"><i className="present" />Present <i className="late" />Late <i className="absent" />Absent</div></div><div className="week">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x => <b key={x}>{x}</b>)}</div><div className="days">{days.map((d, i) => <button onClick={() => setSelectedDay(d)} className={i % 7 > 4 ? 'day weekend' : 'day'} key={d}><span>{d}</span></button>)}</div></article><article className="panel summary-list"><h2>Recorded summary</h2>{[['Records',attendance.length,'green'],['Complete',attendance.filter((x: AttendanceRecord) => x.checkOut).length,'blue']].map(x => <div className="summary-row" key={String(x[0])}><span className={`summary-dot ${x[2]}`} />{x[0]}<b>{x[1]}</b></div>)}</article></div>{selectedDay && <div className="modal-wrap"><div className="modal"><div className="modal-head"><div><span className="eyebrow">DAILY ATTENDANCE</span><h2>June {selectedDay}, 2025</h2></div><button className="icon-button" onClick={() => setSelectedDay(null)}><X /></button></div>{record ? <div className="detail-grid"><div><small>Status</small><b>{record.status}</b></div><div><small>Check in</small><b>{record.checkIn || '—'}</b></div><div><small>Check out</small><b>{record.checkOut || 'Incomplete'}</b></div><div><small>Photo evidence</small><b>{record.checkInPhoto ? 'Available' : 'Not available'}</b></div></div> : <div className="empty-state"><CalendarDays/><h3>No attendance record</h3><p>No record is available for this date.</p></div>}</div></div>}</>
}

function Tasks({ user, tasks, setTasks, open, notify }: any) {
  const update = (task: Task) => { const status = task.status === 'To Do' ? 'In Progress' : 'Completed'; setTasks(tasks.map((x: Task) => x.id === task.id ? { ...x, status, progress: status === 'Completed' ? 100 : 50 } : x)); notify('Task status updated') }
  const claim = (task: Task) => {
    if (task.requiredPosition !== user.position) return notify(`Only ${task.requiredPosition} employees can claim this task`)
    if (task.claimedBy?.includes(user.employeeId)) return notify('You have already claimed this task')
    if ((task.claimedBy?.length || 0) >= (task.slots || 1)) return notify('This task no longer has an available slot')
    setTasks(tasks.map((x: Task) => x.id === task.id ? { ...x, claimedBy: [...(x.claimedBy || []), user.employeeId], assignee: user.name, status: 'To Do' } : x)); notify('Task claimed successfully')
  }
  const available = tasks.filter((x: Task) => x.status === 'Available' && x.requiredPosition === user.position && !x.claimedBy?.includes(user.employeeId))
  const visible = user.role === 'employee' ? tasks.filter((x: Task) => x.claimedBy?.includes(user.employeeId)) : tasks
  return <><PageHead eyebrow="WORK MANAGEMENT" title={user.role === 'admin' ? 'Task performance' : 'My tasks'} description="Plan work, track progress and celebrate completed goals." action={user.role === 'admin' ? <button className="primary-button fit" onClick={open}><Plus />Publish task</button> : undefined} />{user.role === 'employee' && <><div className="section-title"><h2>Available tasks</h2><p>Open work matching your position: {user.position}</p></div><div className="available-grid">{available.length ? available.map((task: Task) => <article className="task-card" key={task.id}><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><h3>{task.title}</h3><p>{task.description}</p><dl className="task-facts"><div><dt>Required position</dt><dd>{task.requiredPosition}</dd></div><div><dt>Available slots</dt><dd>{(task.slots || 1) - (task.claimedBy?.length || 0)}</dd></div><div><dt>Deadline</dt><dd>{task.due}</dd></div></dl><button className="primary-button full" onClick={() => claim(task)}>Claim task</button></article>) : <div className="empty-inline">No eligible tasks are currently available.</div>}</div><div className="section-title"><h2>My claimed tasks</h2><p>Tasks currently assigned to you</p></div></>}<div className="task-board">{['To Do','In Progress','Completed'].map(status => <section className="task-column" key={status}><div className="column-title"><span>{status}</span><b>{visible.filter((x: Task) => x.status === status).length}</b></div>{visible.filter((x: Task) => x.status === status).map((task: Task) => <article className="task-card" key={task.id}><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><h3>{task.title}</h3><p>{task.description || 'Collaborate and deliver work before the deadline.'}</p><div className="progress-label"><span>Progress</span><b>{task.progress}%</b></div><div className="progress"><i style={{ width: `${task.progress}%` }} /></div><div className="task-meta"><span className="avatar small">{task.assignee ? task.assignee.split(' ').map(x => x[0]).join('') : '—'}</span><span><CalendarDays />{task.due}</span></div>{status !== 'Completed' && user.role === 'employee' && <button className="secondary-button full" onClick={() => update(task)}>Move forward</button>}</article>)}</section>)}</div></>
}

function Inventory({ user, items, setItems, open, notify }: any) {
  const [reports, setReports] = useState<any[]>(() => getStored('inwork-stock-reports', []))
  const [reporting, setReporting] = useState(false)
  const [stockSearch, setStockSearch] = useState('')
  const adjust = (item: Item, amount: number) => { if (item.stock + amount < 0) return; setItems(items.map((x: Item) => x.id === item.id ? { ...x, stock: x.stock + amount } : x)); notify('Stock updated successfully') }
  const saveReports = (next: any[]) => { setReports(next); localStorage.setItem('inwork-stock-reports', JSON.stringify(next)) }
  const visibleItems = items.filter((item: Item) => `${item.name} ${item.category} ${item.code}`.toLowerCase().includes(stockSearch.toLowerCase()))
  return <><PageHead eyebrow="ASSETS & SUPPLIES" title={user.role === 'admin' ? 'Inventory stock' : 'Stock availability'} description={user.role === 'admin' ? 'Track workplace equipment, supplies and employee reports.' : 'View current inventory availability or submit a physical stock report.'} action={<button className="primary-button fit" onClick={() => user.role === 'admin' ? open() : setReporting(true)}><Plus />{user.role === 'admin' ? 'Add item' : 'Submit stock report'}</button>} />{user.role === 'admin' && <div className="inventory-grid">{items.map((item: Item, i: number) => <article className="inventory-card" key={item.id}><div className={`item-visual v${i}`}><Package /></div><div className="item-content"><div className="item-title"><div><span>{item.category}</span><h3>{item.name}</h3></div><span className={item.stock <= item.minimum ? 'stock low' : 'stock'}>{item.stock <= item.minimum ? 'Low stock' : 'In stock'}</span></div><p>{item.code} · {item.location}</p><div className="stock-count"><strong>{item.stock}</strong><span>{item.unit} available</span></div><div className="stock-actions"><button onClick={() => adjust(item, -1)}>−</button><span>Adjust stock</span><button onClick={() => adjust(item, 1)}>+</button></div></div></article>)}</div>}{user.role === 'employee' && <section aria-labelledby="stock-availability-title"><div className="section-title stock-section-title"><div><h2 id="stock-availability-title">Stock Availability</h2><p>Read-only inventory data synchronized with the manager workspace.</p></div><label className="search stock-search"><Search /><input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Search item or category..." /></label></div><div className="inventory-grid employee-stock-grid">{visibleItems.map((item: Item, i: number) => { const status = item.stock === 0 ? 'Out of Stock' : item.stock <= item.minimum ? 'Low Stock' : 'Available'; return <article className="inventory-card employee-stock-card" key={item.id}><div className={`item-visual v${i % 3}`}><Package /></div><div className="item-content"><div className="item-title"><div><span>{item.category}</span><h3>{item.name}</h3></div><span className={`stock ${status === 'Available' ? '' : status === 'Low Stock' ? 'low' : 'out'}`}>{status}</span></div><p>{item.code} · {item.location}</p><div className="stock-count"><strong>{item.stock}</strong><span>{item.unit} available</span></div><div className="read-only-note"><Eye />Read-only stock information</div></div></article>})}</div>{visibleItems.length === 0 && <div className="empty-inline">No inventory items match your search.</div>}</section>}<div className="section-title"><h2>{user.role === 'admin' ? 'Employee stock reports' : 'My report history'}</h2><p>{reports.length} report{reports.length === 1 ? '' : 's'} submitted</p></div><div className="panel report-list">{reports.filter(r => user.role === 'admin' || r.employeeId === user.employeeId).map(r => <div className="report-row" key={r.id}><div><b>{r.itemName}</b><small>{r.employeeName} · {r.submitted}</small></div><span>System: {r.previous}</span><span>Reported: {r.quantity}</span><span className="status-badge">{r.status}</span>{user.role === 'admin' && r.status === 'Pending Review' && <div className="report-actions"><button onClick={() => { saveReports(reports.map(x => x.id === r.id ? { ...x, status: 'Approved' } : x)); notify('Report approved; official stock was not changed') }}>Approve</button><button onClick={() => saveReports(reports.map(x => x.id === r.id ? { ...x, status: 'Needs Clarification' } : x))}>Clarify</button><button onClick={() => saveReports(reports.map(x => x.id === r.id ? { ...x, status: 'Rejected' } : x))}>Reject</button></div>}</div>)}{!reports.length && <div className="empty-inline">No stock reports have been submitted.</div>}</div>{reporting && <StockReportModal items={items} close={() => setReporting(false)} save={(item: Item, quantity: number, notes: string) => { saveReports([...reports, { id: `SR-${Date.now()}`, employeeId: user.employeeId, employeeName: user.name, itemName: item.name, itemCode: item.code, previous: item.stock, quantity, notes, status: 'Pending Review', submitted: new Date().toLocaleString() }]); setReporting(false); notify('Stock report submitted for manager review') }} />}</>
}

function Notifications() {
  return <><PageHead eyebrow="INBOX" title="Notifications" description="Stay current with workplace updates and actions." /><div className="panel notification-list">{['Your task “Onboarding refresh” is due in 3 days.','Printer Paper A4 has fallen below minimum stock.','Sophia Lee completed the campaign brief.','Your attendance report for May is ready.'].map((x,i) => <div className="notice" key={x}><span className={`activity-icon a${i%3}`}><Bell /></span><div><b>{x}</b><p>{i+1} hour{i?'s':''} ago</p></div>{i < 2 && <span className="unread" />}</div>)}</div></>
}

function Profile({ user, notify }: any) {
  const [editing, setEditing] = useState(false)
  return <><PageHead eyebrow="YOUR ACCOUNT" title="Profile" description="Manage your personal and contact information." action={!editing ? <button className="primary-button fit" onClick={() => setEditing(true)}>Edit profile</button> : undefined} /><div className="profile-grid"><article className="panel profile-summary"><div className="profile-avatar">{user.name.split(' ').map((x: string) => x[0]).join('')}</div><h2>{user.name}</h2><p>{user.position}</p><span className="status-badge">Active</span></article><form className="panel profile-form" onSubmit={e => { e.preventDefault(); setEditing(false); notify('Profile saved successfully') }}><h2>Personal information</h2><div className="form-grid"><label className="field"><span>Full name</span><input name="name" defaultValue={user.name} disabled={!editing} required /></label><label className="field"><span>Email</span><input name="email" type="email" defaultValue={user.email} disabled={!editing} required /></label><label className="field"><span>Phone number</span><input name="phone" defaultValue="+1 234 567 890" disabled={!editing} /></label><label className="field"><span>Department</span><input name="department" defaultValue={user.department} disabled /></label></div>{editing && <div className="modal-actions profile-actions"><button type="button" className="secondary-button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button fit">Save changes</button></div>}</form></div></>
}

function SettingsPage({ dark, setDark, lang, setLang }: any) {
  return <><PageHead eyebrow="PREFERENCES" title="Settings" description="Personalize how InWork looks and communicates." /><div className="settings-grid"><article className="panel setting-card"><span className="setting-icon"><Sun /></span><div><h3>Appearance</h3><p>Choose the theme that feels best for you.</p></div><button className="toggle-row" onClick={() => setDark(!dark)}>{dark ? <Moon /> : <Sun />}{dark ? 'Dark' : 'Light'}<span className={dark ? 'switch on' : 'switch'}><i /></span></button></article><article className="panel setting-card"><span className="setting-icon"><BriefcaseBusiness /></span><div><h3>Language</h3><p>Change the language used across the interface.</p></div><select value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="id">Bahasa Indonesia</option></select></article><article className="panel setting-card"><span className="setting-icon"><Bell /></span><div><h3>Notifications</h3><p>Task assignments, attendance and stock alerts.</p></div><span className="switch on"><i /></span></article><article className="panel setting-card"><span className="setting-icon"><Archive /></span><div><h3>About InWork</h3><p>Manage Work. Empower People. · Version 1.0 Demo</p></div></article></div></>
}

function AddModal({ type, employees, close, save }: any) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget); const name = String(f.get('name'))
    if (type === 'employee') save({ id: String(f.get('code')), name, department: String(f.get('department')), position: String(f.get('position')), email: String(f.get('email')), status: 'Active', initials: name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() })
    if (type === 'task') save({ id: Date.now(), title: name, description: String(f.get('description')), assignee: '', priority: String(f.get('priority')), status: 'Available', progress: 0, due: String(f.get('due')), requiredPosition: String(f.get('position')), slots: Number(f.get('slots')), claimedBy: [] })
    if (type === 'item') save({ id: Date.now(), name, code: String(f.get('code')), category: String(f.get('category')), stock: Number(f.get('stock')), minimum: Number(f.get('minimum')), unit: String(f.get('unit')), location: String(f.get('location')) })
  }
  return <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><div><span className="eyebrow">NEW RECORD</span><h2>Add {type}</h2></div><button className="icon-button" onClick={close}><X /></button></div><form onSubmit={submit}><Field label={type === 'task' ? 'Task title' : type === 'item' ? 'Item name' : 'Full name'} name="name" placeholder="Enter a name" />{type === 'employee' && <><div className="form-grid"><Field label="Employee ID" name="code" placeholder="IW-005" /><Field label="Email" name="email" type="email" placeholder="name@company.com" /><Field label="Department" name="department" placeholder="Department" /><Field label="Position" name="position" placeholder="Role title" /></div></>}{type === 'task' && <><Field label="Description" name="description" placeholder="Describe the expected outcome" /><div className="form-grid"><Field label="Required position" name="position" placeholder="Product Designer" /><Field label="Available slots" name="slots" type="number" placeholder="1" /><label className="field"><span>Priority</span><select name="priority"><option>High</option><option>Medium</option><option>Low</option></select></label><Field label="Deadline" name="due" placeholder="30 Jun" /></div></>}{type === 'item' && <><div className="form-grid"><Field label="Item code" name="code" placeholder="AST-001" /><Field label="Category" name="category" placeholder="Equipment" /><Field label="Initial stock" name="stock" type="number" placeholder="10" /><Field label="Minimum stock" name="minimum" type="number" placeholder="3" /><Field label="Unit" name="unit" placeholder="units" /><Field label="Location" name="location" placeholder="Warehouse A" /></div></>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" type="submit">Save {type}</button></div></form></div></div>
}

function CameraAttendance({ action, close, confirm }: { action: 'checkIn' | 'checkOut'; close: () => void; confirm: (photo: string) => void }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState('')
  const [error, setError] = useState('')
  const videoRef = (node: HTMLVideoElement | null) => { if (node && stream) { node.srcObject = stream; node.play().catch(() => {}) } }
  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(setStream).catch(() => setError('Camera access was denied or is unavailable. Camera access requires HTTPS or localhost.'))
    return () => stream?.getTracks().forEach(track => track.stop())
  }, [])
  useEffect(() => () => stream?.getTracks().forEach(track => track.stop()), [stream])
  const capture = () => {
    const video = document.querySelector<HTMLVideoElement>('.camera-video')
    if (!video?.videoWidth) return setError('The camera is not ready yet.')
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0); setPhoto(canvas.toDataURL('image/jpeg', .72))
  }
  const exit = () => { stream?.getTracks().forEach(track => track.stop()); close() }
  return <div className="modal-wrap" role="dialog" aria-modal="true"><div className="modal camera-modal"><div className="modal-head"><div><span className="eyebrow">PHOTO EVIDENCE REQUIRED</span><h2>{action === 'checkIn' ? 'Check in' : 'Check out'} with camera</h2></div><button className="icon-button" onClick={exit}><X /></button></div><p className="camera-help">Your photo stays in this browser for this demo and is associated with your attendance record.</p>{error ? <div className="camera-error">{error}</div> : photo ? <img className="camera-preview" src={photo} alt="Captured attendance evidence" /> : <video className="camera-video" ref={videoRef} muted playsInline />}<div className="modal-actions"><button className="secondary-button" onClick={exit}>Cancel</button>{photo ? <><button className="secondary-button" onClick={() => setPhoto('')}>Retake photo</button><button className="primary-button" onClick={() => { stream?.getTracks().forEach(track => track.stop()); confirm(photo) }}>Confirm attendance</button></> : <button className="primary-button" disabled={!!error} onClick={capture}>Take photo</button>}</div></div></div>
}

function EmployeeDetail({ employee, close }: { employee: Employee; close: () => void }) {
  return <div className="modal-wrap"><div className="modal employee-detail"><div className="modal-head"><div><span className="eyebrow">EMPLOYEE PROFILE</span><h2>{employee.name}</h2></div><button className="icon-button" onClick={close}><X /></button></div><div className="employee-hero"><span className="profile-avatar">{employee.initials}</span><div><h2>{employee.name}</h2><p>{employee.position} · {employee.department}</p><span className="status-badge">{employee.status}</span></div></div><h3 className="detail-heading">Personal information</h3><div className="detail-grid"><div><small>Employee ID</small><b>{employee.id}</b></div><div><small>Email</small><b>{employee.email}</b></div><div><small>Phone</small><b>{employee.phone || 'Not provided'}</b></div><div><small>Hire date</small><b>{employee.hireDate || 'Not provided'}</b></div></div><h3 className="detail-heading">Confidential employment information</h3><div className="detail-grid"><div><small>Department</small><b>{employee.department}</b></div><div><small>Position</small><b>{employee.position}</b></div><div><small>Annual salary</small><b>{employee.salary || 'Not recorded'}</b></div><div><small>Task completion</small><b>See task monitoring</b></div></div><div className="modal-actions"><button className="primary-button" onClick={close}>Back to employees</button></div></div></div>
}

function StockReportModal({ items, close, save }: { items: Item[]; close: () => void; save: (item: Item, quantity: number, notes: string) => void }) {
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const f = new FormData(e.currentTarget); const item = items.find(x => x.id === Number(f.get('item')))!; save(item, Number(f.get('quantity')), String(f.get('notes'))) }
  return <div className="modal-wrap"><div className="modal"><div className="modal-head"><div><span className="eyebrow">PHYSICAL STOCK CHECK</span><h2>Submit stock report</h2></div><button className="icon-button" onClick={close}><X /></button></div><form onSubmit={submit}><label className="field"><span>Inventory item</span><select name="item">{items.map(x => <option value={x.id} key={x.id}>{x.name} · {x.code}</option>)}</select></label><Field label="Current physical quantity" name="quantity" type="number" placeholder="0" /><Field label="Employee notes" name="notes" placeholder="Describe what you observed" /><div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button">Submit for review</button></div></form></div></div>
}
