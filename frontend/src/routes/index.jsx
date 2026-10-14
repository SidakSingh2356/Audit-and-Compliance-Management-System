import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Organizations from '../pages/Organizations';
import Users from '../pages/Users';
import Audits from '../pages/Audits';
import AuditDetail from '../pages/AuditDetail';
import ProtectedRoute from './ProtectedRoute';


function Placeholder({ title }) {
  return <h1>{title}</h1>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/users" element={<Users />} />
            <Route path="/audits" element={<Audits />} />
          </Route>
          <Route path="/audits/:id" element={<AuditDetail />} />
          <Route path="/findings" element={<Placeholder title="Findings" />} />
          <Route path="/documents" element={<Placeholder title="Documents" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
