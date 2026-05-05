import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/groups', icon: '👥', label: 'Groups' },
  { path: '/expenses', icon: '💰', label: 'Expenses' },
  { path: '/balances', icon: '⚖️', label: 'Balances' },
  { path: '/settle', icon: '✅', label: 'Settle' },
];

export default function Layout({ children }) {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SplitSewa</h1>
          <p>eSewa Group Expenses</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-text">
              <strong>{user?.username}</strong>
              <span>{user?.email}</span>
            </div>
            <button className="logout-btn" onClick={logoutUser} title="Logout">
              ⏻
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
