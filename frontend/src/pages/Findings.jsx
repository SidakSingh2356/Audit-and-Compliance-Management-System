import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const severities = ['Critical', 'High', 'Medium', 'Low'];
const statusOptions = ['Open', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'];

export default function Findings() {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const auditsResponse = await api.get('/audits');
      const audits = auditsResponse.data.data || [];

      const results = await Promise.all(
        audits.map(async (audit) => {
          try {
            const response = await api.get('/findings', {
              params: {
                auditId: audit.id,
                severity: severityFilter || undefined,
                status: statusFilter || undefined,
              },
            });
            return (response.data.data || []).map((finding) => ({
              ...finding,
              auditTitle: audit.title,
            }));
          } catch {
            // user may not have access to this audit's findings — skip silently
            return [];
          }
        })
      );

      setFindings(results.flat());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load findings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, statusFilter]);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Findings</h1>
        </div>
      </div>

      <div className="filter-bar">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          <option value="">All severities</option>
          {severities.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audit</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Due date</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Loading...</td>
              </tr>
            ) : (
              findings.map((finding) => (
                <tr key={finding.id}>
                  <td>{finding.title}</td>
                  <td>{finding.auditTitle}</td>
                  <td>{finding.severity}</td>
                  <td>{finding.status}</td>
                  <td>{finding.due_date ? new Date(finding.due_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <Link className="table-action" to={`/audits/${finding.audit_id}`}>
                      Open audit
                    </Link>
                  </td>
                </tr>
              ))
            )}
            {!loading && findings.length === 0 && (
              <tr>
                <td colSpan="6">No findings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}