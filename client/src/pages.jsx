import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { err, BLOOD, daysLeft } from './api';
import { useAuth } from './App.jsx';

const Field = ({ label, children }) => <label className="f"><span>{label}</span>{children}</label>;
const Msg = ({ m }) => m ? <p className="msg">{m}</p> : null;
const fmt = d => d ? new Date(d).toLocaleDateString() : '—';
const useForm = init => { const [v, s] = useState(init); return [v, e => s({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }), s]; };
const BloodSelect = ({ any, ...p }) => <select {...p}>{any && <option value="">Any blood group</option>}{!any && <option value="">Select</option>}{BLOOD.map(b => <option key={b}>{b}</option>)}</select>;

export function Home() {
  const [s, setS] = useState([]);
  useEffect(() => { api.get('/requests').then(r => setS(r.data.slice(0, 3))); }, []);
  return (<>
    <section className="hero">
      <h1>Someone near you needs blood tonight.</h1>
      <p>LifeDrop lists verified donors by blood group and district, and tells matching donors the moment an urgent request goes up.</p>
      <div className="row"><Link className="btn" to="/donors">Find a donor</Link><Link className="btn ghost" to="/register">Become a donor</Link></div>
    </section>
    <h2>Open requests</h2>
    {s.length ? <div className="grid">{s.map(r => <ReqCard key={r._id} r={r} />)}</div> : <p className="muted">No open requests right now.</p>}
  </>);
}

export function Login() {
  const { login } = useAuth(); const [f, ch] = useForm({ email: '', password: '' }); const [m, setM] = useState('');
  const go = async e => { e.preventDefault(); try { login((await api.post('/auth/login', f)).data); } catch (x) { setM(err(x)); } };
  return (<form className="card narrow" onSubmit={go}><h2>Log in</h2>
    <Field label="Email"><input name="email" type="email" required value={f.email} onChange={ch} /></Field>
    <Field label="Password"><input name="password" type="password" required value={f.password} onChange={ch} /></Field>
    <Msg m={m} /><button className="btn">Log in</button></form>);
}

export function Register() {
  const { login } = useAuth(); const [f, ch] = useForm({ name: '', email: '', password: '', role: 'donor', bloodGroup: '', district: '', phone: '' }); const [m, setM] = useState('');
  const go = async e => { e.preventDefault(); try { login((await api.post('/auth/register', f)).data); } catch (x) { setM(err(x)); } };
  return (<form className="card narrow" onSubmit={go}><h2>Create your account</h2>
    <Field label="I want to"><select name="role" value={f.role} onChange={ch}><option value="donor">Donate blood</option><option value="requester">Request blood</option></select></Field>
    <Field label="Full name"><input name="name" required value={f.name} onChange={ch} /></Field>
    <Field label="Email"><input name="email" type="email" required value={f.email} onChange={ch} /></Field>
    <Field label="Password (6+ characters)"><input name="password" type="password" minLength={6} required value={f.password} onChange={ch} /></Field>
    <Field label="Phone"><input name="phone" value={f.phone} onChange={ch} /></Field>
    {f.role === 'donor' && <><Field label="Blood group"><BloodSelect name="bloodGroup" required value={f.bloodGroup} onChange={ch} /></Field>
      <Field label="District / city"><input name="district" required value={f.district} onChange={ch} /></Field></>}
    <Msg m={m} /><button className="btn">Create account</button></form>);
}

export function Donors() {
  const { user } = useAuth(); const [q, ch] = useForm({ bloodGroup: '', district: '', available: true }); const [list, setList] = useState([]); const [m, setM] = useState('');
  useEffect(() => { const t = setTimeout(() => api.get('/donors', { params: q }).then(r => setList(r.data)), 250); return () => clearTimeout(t); }, [q.bloodGroup, q.district, q.available]);
  const report = async id => { try { setM((await api.post(`/donors/${id}/report`)).data.message); } catch (x) { setM(err(x)); } };
  return (<><h2>Find donors</h2>
    <div className="filters">
      <BloodSelect any name="bloodGroup" value={q.bloodGroup} onChange={ch} />
      <input name="district" placeholder="District / city" value={q.district} onChange={ch} />
      <label className="chk"><input type="checkbox" name="available" checked={q.available} onChange={ch} /> Available now</label>
    </div><Msg m={m} />
    {list.length ? <div className="grid">{list.map(d => <div className="card donor" key={d._id}>
      <div className="bg">{d.bloodGroup}</div>
      <div><b>{d.name}</b><div className="muted">{d.district}</div><div>{d.phone || 'No phone listed'}</div>
        <small className={daysLeft(d.lastDonation) ? 'warn' : 'ok'}>{daysLeft(d.lastDonation) ? `Eligible in ${daysLeft(d.lastDonation)} days` : 'Eligible to donate'}</small>
        {user && <button className="link" onClick={() => report(d._id)}>Report profile</button>}</div></div>)}</div>
      : <p className="muted">No donors match. Try a nearby district or untick “Available now”.</p>}</>);
}

const ReqCard = ({ r, onDone }) => { const { user } = useAuth(); return (
  <div className={`card req ${r.urgency}`}><div className="bg">{r.bloodGroup}</div>
    <div><b>{r.patientName}</b> <span className="tag">{r.urgency}</span>
      <div>{r.hospital ? `${r.hospital}, ` : ''}{r.district}</div>
      <div className="muted">Needed by {fmt(r.neededBy)} • posted by {r.requester?.name}</div>
      {r.note && <div>{r.note}</div>}<div><b>Call {r.contact}</b></div>
      {onDone && user && (user.role === 'admin' || user._id === r.requester?._id || user._id === r.requester) && <button className="link" onClick={() => onDone(r._id)}>Mark fulfilled</button>}</div></div>); };

export function Requests() {
  const { user } = useAuth(); const [list, setList] = useState([]); const [q, chq] = useForm({ bloodGroup: '', district: '' });
  const [f, ch, setF] = useForm({ patientName: '', bloodGroup: '', district: '', hospital: '', contact: '', urgency: 'urgent', neededBy: '', note: '' }); const [m, setM] = useState('');
  const load = () => api.get('/requests', { params: q }).then(r => setList(r.data));
  useEffect(() => { load(); }, [q.bloodGroup, q.district]);
  const post = async e => { e.preventDefault(); try { await api.post('/requests', f); setM('Request posted. Matching donors are being emailed.'); setF({ ...f, patientName: '', note: '' }); load(); } catch (x) { setM(err(x)); } };
  const done = async id => { await api.patch(`/requests/${id}/fulfill`); load(); };
  return (<><h2>Blood requests</h2>
    <div className="filters"><BloodSelect any name="bloodGroup" value={q.bloodGroup} onChange={chq} /><input name="district" placeholder="District / city" value={q.district} onChange={chq} /></div>
    {list.length ? <div className="grid">{list.map(r => <ReqCard key={r._id} r={r} onDone={done} />)}</div> : <p className="muted">No open requests match.</p>}
    {user ? <form className="card" onSubmit={post}><h3>Post a request</h3>
      <div className="two"><Field label="Patient name"><input name="patientName" required value={f.patientName} onChange={ch} /></Field>
        <Field label="Blood group"><BloodSelect name="bloodGroup" required value={f.bloodGroup} onChange={ch} /></Field>
        <Field label="District / city"><input name="district" required value={f.district} onChange={ch} /></Field>
        <Field label="Hospital"><input name="hospital" value={f.hospital} onChange={ch} /></Field>
        <Field label="Contact number"><input name="contact" required value={f.contact} onChange={ch} /></Field>
        <Field label="Urgency"><select name="urgency" value={f.urgency} onChange={ch}><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option></select></Field>
        <Field label="Needed by"><input type="date" name="neededBy" value={f.neededBy} onChange={ch} /></Field>
        <Field label="Note"><input name="note" value={f.note} onChange={ch} /></Field></div>
      <Msg m={m} /><button className="btn">Post request</button></form>
      : <p><Link to="/login">Log in</Link> to post a request.</p>}</>);
}

export function Profile() {
  const { user, setUser } = useAuth(); const [f, ch] = useForm({ date: new Date().toISOString().slice(0, 10), place: '' }); const [m, setM] = useState('');
  const left = daysLeft(user.lastDonation);
  const add = async e => { e.preventDefault(); const r = await api.post('/auth/me/donations', f); setUser(r.data); setM('Donation logged.'); };
  const toggle = async () => setUser((await api.put('/auth/me', { ...user, available: !user.available })).data);
  return (<><h2>My donations</h2>
    <div className="card"><div className="bg">{user.bloodGroup}</div><div>
      <b>{left ? `You can donate again in ${left} days` : 'You are eligible to donate now'}</b>
      <div className="muted">Last donation: {fmt(user.lastDonation)} • 90-day gap between donations</div>
      <button className="btn sm" onClick={toggle}>{user.available ? 'Mark me unavailable' : 'Mark me available'}</button></div></div>
    <form className="card" onSubmit={add}><h3>Log a donation</h3><div className="two">
      <Field label="Date"><input type="date" name="date" max={new Date().toISOString().slice(0, 10)} value={f.date} onChange={ch} /></Field>
      <Field label="Where"><input name="place" value={f.place} onChange={ch} /></Field></div><Msg m={m} /><button className="btn">Save donation</button></form>
    <h3>History</h3>{user.donations?.length ? <table><tbody>{[...user.donations].reverse().map((d, i) => <tr key={i}><td>{fmt(d.date)}</td><td>{d.place || '—'}</td></tr>)}</tbody></table> : <p className="muted">No donations logged yet.</p>}</>);
}

export function AdminPage() {
  const [s, setS] = useState({}), [users, setUsers] = useState([]), [reqs, setReqs] = useState([]);
  const load = () => { api.get('/admin/stats').then(r => setS(r.data)); api.get('/admin/users').then(r => setUsers(r.data)); api.get('/admin/requests').then(r => setReqs(r.data)); };
  useEffect(load, []);
  const act = async (fn) => { await fn(); load(); };
  return (<><h2>Admin dashboard</h2>
    <div className="stats">{Object.entries(s).map(([k, v]) => <div key={k} className="card"><b>{v}</b><span className="muted">{k}</span></div>)}</div>
    <h3>Users</h3><div className="scroll"><table><thead><tr><th>Name</th><th>Role</th><th>Blood</th><th>District</th><th>Reports</th><th></th></tr></thead><tbody>
      {users.map(u => <tr key={u._id} className={u.reported ? 'flagged' : ''}><td>{u.name}<br /><small>{u.email}</small></td><td>{u.role}</td><td>{u.bloodGroup}</td><td>{u.district}</td><td>{u.reports}</td>
        <td>{u.role !== 'admin' && <><button className="link" onClick={() => act(() => api.patch(`/admin/users/${u._id}/flag`))}>{u.reported ? 'Restore' : 'Hide'}</button> <button className="link" onClick={() => confirm('Delete user?') && act(() => api.delete(`/admin/users/${u._id}`))}>Delete</button></>}</td></tr>)}</tbody></table></div>
    <h3>Requests</h3><div className="scroll"><table><tbody>{reqs.map(r => <tr key={r._id}><td>{r.patientName} ({r.bloodGroup})</td><td>{r.district}</td><td>{r.urgency}</td><td>{r.status}</td>
      <td><button className="link" onClick={() => act(() => api.delete(`/admin/requests/${r._id}`))}>Delete</button></td></tr>)}</tbody></table></div></>);
}
