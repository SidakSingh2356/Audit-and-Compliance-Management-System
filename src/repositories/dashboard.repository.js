const pool = require('../config/db');

const toNumber = (value) => Number(value || 0);

const dashboardRepository = {
  async getAdminDashboard() {
    const [countsResult, distributionResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_audits,
          COUNT(*) FILTER (WHERE status IN ('Pending', 'In Progress', 'Under Review'))::int AS active_audits,
          COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_audits,
          COUNT(*) FILTER (
            WHERE status = 'Overdue'
               OR (due_date < CURRENT_DATE AND status NOT IN ('Completed', 'Cancelled'))
          )::int AS overdue_audits,
          (SELECT COUNT(*)::int FROM organizations) AS total_organizations,
          (SELECT COUNT(*)::int FROM users) AS total_users,
          (SELECT COUNT(*)::int FROM findings WHERE status = 'Open') AS open_findings,
          (SELECT COUNT(*)::int FROM findings WHERE severity = 'Critical') AS critical_findings
        FROM audits`),
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM audits
        GROUP BY status
        ORDER BY status`),
    ]);

    const counts = countsResult.rows[0];
    return {
      auditCounts: {
        total: toNumber(counts.total_audits),
        active: toNumber(counts.active_audits),
        completed: toNumber(counts.completed_audits),
        overdue: toNumber(counts.overdue_audits),
      },
      totalOrganizations: toNumber(counts.total_organizations),
      totalUsers: toNumber(counts.total_users),
      findingCounts: {
        open: toNumber(counts.open_findings),
        critical: toNumber(counts.critical_findings),
      },
      auditStatusDistribution: distributionResult.rows.reduce((distribution, row) => {
        distribution[row.status] = toNumber(row.count);
        return distribution;
      }, {}),
    };
  },

  async getAuditorDashboard(userId) {
    const [metricsResult, dueDatesResult] = await Promise.all([
      pool.query(`
        WITH assigned_audits AS (
          SELECT DISTINCT a.id, a.due_date, a.status
          FROM audits a
          JOIN audit_assignments aa ON aa.audit_id = a.id
          WHERE aa.auditor_id = $1
        )
        SELECT
          (SELECT COUNT(*)::int FROM assigned_audits) AS assigned_audits,
          (SELECT COUNT(*)::int
           FROM document_requests dr
           JOIN assigned_audits aa ON aa.id = dr.audit_id
           WHERE dr.status IN ('Uploaded', 'Under Review')) AS pending_document_reviews,
          (SELECT COUNT(*)::int
           FROM findings f
           JOIN assigned_audits aa ON aa.id = f.audit_id
           WHERE f.status = 'Open') AS open_findings,
          (SELECT COUNT(*)::int
           FROM assigned_audits
           WHERE status = 'Overdue'
              OR (due_date < CURRENT_DATE AND status NOT IN ('Completed', 'Cancelled'))) AS overdue_audits` ,
        [userId]),
      pool.query(`
        SELECT COALESCE(json_agg(due_date ORDER BY due_date), '[]'::json) AS upcoming_due_dates
        FROM (
          SELECT DISTINCT a.id, a.due_date
          FROM audits a
          JOIN audit_assignments aa ON aa.audit_id = a.id
          WHERE aa.auditor_id = $1
            AND a.due_date >= CURRENT_DATE
          ORDER BY a.due_date
          LIMIT 10
        ) upcoming`,
        [userId]),
    ]);

    const metrics = metricsResult.rows[0];
    return {
      assignedAuditCount: toNumber(metrics.assigned_audits),
      pendingDocumentReviews: toNumber(metrics.pending_document_reviews),
      openFindings: toNumber(metrics.open_findings),
      overdueAudits: toNumber(metrics.overdue_audits),
      upcomingDueDates: dueDatesResult.rows[0].upcoming_due_dates,
    };
  },

  async getClientDashboard(organizationId) {
    const [metricsResult, deadlinesResult] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM audits
           WHERE organization_id = $1
             AND status IN ('Pending', 'In Progress', 'Under Review')) AS active_audits,
          (SELECT COUNT(*)::int
           FROM document_requests dr
           JOIN audits a ON a.id = dr.audit_id
           WHERE a.organization_id = $1 AND dr.status = 'Waiting for Upload') AS pending_document_requests,
          (SELECT COUNT(*)::int
           FROM documents d
           JOIN document_requests dr ON dr.id = d.document_request_id
           JOIN audits a ON a.id = dr.audit_id
           WHERE a.organization_id = $1) AS uploaded_documents,
          (SELECT COUNT(*)::int
           FROM findings
           WHERE audit_id IN (SELECT id FROM audits WHERE organization_id = $1)
             AND status = 'Open') AS open_findings`,
        [organizationId]),
      pool.query(`
        SELECT COALESCE(json_agg(deadline ORDER BY due_date), '[]'::json) AS upcoming_deadlines
        FROM (
          SELECT a.id, a.title, 'audit' AS type, a.due_date
          FROM audits a
          WHERE a.organization_id = $1 AND a.due_date >= CURRENT_DATE
          UNION ALL
          SELECT dr.id, dr.name, 'document_request' AS type, dr.due_date
          FROM document_requests dr
          JOIN audits a ON a.id = dr.audit_id
          WHERE a.organization_id = $1 AND dr.due_date >= CURRENT_DATE
          ORDER BY due_date
          LIMIT 10
        ) deadline`,
        [organizationId]),
    ]);

    const metrics = metricsResult.rows[0];
    return {
      activeAudits: toNumber(metrics.active_audits),
      pendingDocumentRequests: toNumber(metrics.pending_document_requests),
      uploadedDocuments: toNumber(metrics.uploaded_documents),
      openFindings: toNumber(metrics.open_findings),
      upcomingDeadlines: deadlinesResult.rows[0].upcoming_deadlines,
    };
  },
};

module.exports = dashboardRepository;