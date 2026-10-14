import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Card({ label, value }) {
  return (
    <div className="admin-form" style={{ textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{label}</p>
      <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{value}</p>
    </div>
  );
}

function AdminDashboard({ data }) {
  return (
    <>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <Card label="Total Audits" value={data.auditCounts.total} />
        <Card label="Active Audits" value={data.auditCounts.active} />
        <Card label="Completed Audits" value={data.auditCounts.completed} />
        <Card label="Overdue Audits" value={data.auditCounts.overdue} />
        <Card label="Organizations" value={data.totalOrganizations} />
        <Card label="Users" value={data.totalUsers} />
        <Card label="Open Findings" value={data.findingCounts.open} />
        <Card label="Critical Findings" value={data.findingCounts.critical} />
      </div>

      <div className="admin-form" style={{ marginTop: '1.5rem' }}>
        <h2>Audit status distribution</h2>
        <ul className="assigned-list">
          {Object.entries(data.auditStatusDistribution).map(([status, count]) => (
            <li key={status}>
              <span>{status}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function AuditorDashboard({ data }) {
  return (
    <>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <Card label="Assigned Audits" value={data.assignedAuditCount} />
        <Card label="Pending Reviews" value={data.pendingDocumentReviews} />
        <Card label="Open Findings" value={data.openFindings} />
        <Card label="Overdue Audits" value={data.overdueAudits} />
      </div>

      <div className="admin-form" style={{ marginTop: '1.5rem' }}>
        <h2>Upcoming due dates</h2>
        {data.upcomingDueDates.length === 0 ? (
          <p>Nothing due soon.</p>
        ) : (
          <ul className="assigned-list">
            {data.upcomingDueDates.map((date, index) => (
              <li key={index}>{new Date(date).toLocaleDateString()}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ClientDashboard({ data }) {
  return (
    <>
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <Card label="Active Audits" value={data.activeAudits} />
        <Card label="Pending Requests" value={data.pendingDocumentRequests} />
        <Card label="Uploaded Documents" value={data.uploadedDocuments} />
        <Card label="Open Findings" value={data.openFindings} />
      </div>

      <div className="admin-form" style={{ marginTop: '1.5rem' }}>
        <h2>Upcoming deadlines</h2>
        {data.upcomingDeadlines.length === 0 ? (
          <p>Nothing due soon.</p>
        ) : (
          <ul className="assigned-list">
            {data.upcomingDeadlines.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <span>
                  {item.title} <em>({item.type})</em>
                </span>
                <strong>{new Date(item.due_date).toLocaleDateString()}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get(`/dashboard/${user.role}`);
        setData(response.data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.role]);

  if (loading) {
    return (
      <section className="admin-page">
        <p>Loading...</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="admin-page">
        <p className="form-error" role="alert">
          {error || 'No dashboard data available.'}
        </p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
      </div>

      {user.role === 'admin' && <AdminDashboard data={data} />}
      {user.role === 'auditor' && <AuditorDashboard data={data} />}
      {user.role === 'client' && <ClientDashboard data={data} />}
    </section>
  );
}