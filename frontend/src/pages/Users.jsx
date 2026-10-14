import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { email: '', password: '', role: 'client', organization_id: '', full_name: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filters, setFilters] = useState({ role: '', organizationId: '' });
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const query = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [usersResponse, organizationsResponse] = await Promise.all([api.get('/users', { params: query }), api.get('/organizations')]);
      setUsers(usersResponse.data.data.users || []);
      setOrganizations(organizationsResponse.data.data.organizations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load users.');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [filters.role, filters.organizationId]);

  async function handleSubmit(event) {
    event.preventDefault(); setError('');
    try { await api.post('/users', { ...form, organization_id: Number(form.organization_id) }); setForm(emptyForm); setShowForm(false); await loadData(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create user.'); }
  }

  async function deactivate(id) {
    if (!window.confirm('Deactivate this user?')) return;
    try { await api.patch(`/users/${id}/deactivate`); await loadData(); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to deactivate user.'); }
  }

  return <section className="admin-page">
    <div className="page-heading"><div><p className="eyebrow">Administration</p><h1>Users</h1></div><button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New User'}</button></div>
    <div className="filter-bar"><select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}><option value="">All roles</option><option value="admin">Admin</option><option value="auditor">Auditor</option><option value="client">Client</option></select><select value={filters.organizationId} onChange={(event) => setFilters({ ...filters, organizationId: event.target.value })}><option value="">All organizations</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {showForm && <form className="admin-form" onSubmit={handleSubmit}><label>Full name<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label><label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="admin">Admin</option><option value="auditor">Auditor</option><option value="client">Client</option></select></label><label>Organization<select value={form.organization_id} onChange={(event) => setForm({ ...form, organization_id: event.target.value })} required><option value="">Select organization</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><button type="submit">Create user</button></form>}
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Status</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading...</td></tr> : users.map((user) => <tr key={user.id}><td>{user.full_name || user.fullName}</td><td>{user.email}</td><td>{user.role}</td><td>{organizations.find((organization) => String(organization.id) === String(user.organization_id || user.organizationId))?.name || user.organization_id || '—'}</td><td>{user.is_active ? 'Active' : 'Inactive'}</td><td>{user.is_active && <button className="table-action" onClick={() => deactivate(user.id)}>Deactivate</button>}</td></tr>)}{!loading && users.length === 0 && <tr><td colSpan="6">No users found.</td></tr>}</tbody></table></div>
  </section>;
}
