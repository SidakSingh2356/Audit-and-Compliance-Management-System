import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  ['Dashboard', '/dashboard'],
  ['Organizations', '/organizations'],
  ['Users', '/users'],
  ['Audits', '/audits'],
  ['Findings', '/findings'],
  ['Documents', '/documents'],
  ['Notifications', '/notifications'],
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/dashboard">Audit & Compliance</NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(([label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="account-area">
          <span className="role-label">{user?.role}</span>
          <button type="button" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
  );
}
