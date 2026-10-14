import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { name: '', contact_info: '', industry: '' };

function formatContactInfo(contactInfo) {
  if (contactInfo === null || contactInfo === undefined) return '—';
  if (typeof contactInfo === 'string') return contactInfo;
  if (typeof contactInfo === 'object') {
    return ['email', 'phone', 'address']
      .map((key) => contactInfo[key])
      .filter(Boolean)
      .join(', ') || '—';
  }
  return '—';
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadOrganizations() {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data.data.organizations || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load organizations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrganizations(); }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await api.post('/organizations', form);
      setForm(emptyForm);
      setShowForm(false);
      await loadOrganizations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create organization.');
    }
  }

  async function deactivate(id) {
    if (!window.confirm('Deactivate this organization?')) return;
    try {
      await api.patch(`/organizations/${id}/deactivate`);
      await loadOrganizations();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to deactivate organization.');
    }
  }

  return <section className="admin-page">
    <div className="page-heading"><div><p className="eyebrow">Administration</p><h1>Organizations</h1></div><button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Organization'}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {showForm && <form className="admin-form" onSubmit={handleSubmit}>
      <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
      <label>Contact info<input value={form.contact_info} onChange={(event) => setForm({ ...form, contact_info: event.target.value })} /></label>
      <label>Industry<input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label>
      <button type="submit">Create organization</button>
    </form>}
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Industry</th><th>Contact</th><th>Status</th><th /></tr></thead><tbody>
      {loading ? <tr><td colSpan="5">Loading...</td></tr> : organizations.map((organization) => <tr key={organization.id}><td>{organization.name}</td><td>{organization.industry || '—'}</td><td>{formatContactInfo(organization.contact_info ?? organization.contactInfo)}</td><td>{organization.is_active ? 'Active' : 'Inactive'}</td><td>{organization.is_active && <button className="table-action" onClick={() => deactivate(organization.id)}>Deactivate</button>}</td></tr>)}
      {!loading && organizations.length === 0 && <tr><td colSpan="5">No organizations found.</td></tr>}
    </tbody></table></div>
  </section>;
}
