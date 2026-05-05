import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../AuthContext';
import { getMyGroups } from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getMyGroups().then(res => setGroups(res.data)).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      <div className="page-header">
        <h1>{greeting}, {user?.username} 👋</h1>
        <p>Manage shared expenses and settle with eSewa — Nepal's #1 digital wallet</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">My Groups</div>
          <div className="stat-value green">{groups.length}</div>
          <div className="stat-sub">Active groups</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Currency</div>
          <div className="stat-value" style={{ fontSize: '20px' }}>NPR ₨</div>
          <div className="stat-sub">Nepali Rupee</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Settlement</div>
          <div className="stat-value" style={{ fontSize: '16px', color: 'var(--green)', marginTop: 4 }}>eSewa</div>
          <div className="stat-sub">UAT sandbox ready</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header"><h2>Quick Actions</h2></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate('/groups')}>👥 Create Group</button>
            <button className="btn btn-outline" onClick={() => navigate('/expenses')}>💰 Add Expense</button>
            <button className="btn btn-ghost" onClick={() => navigate('/balances')}>⚖️ Check Balances</button>
            <button className="btn btn-ghost" onClick={() => navigate('/settle')}>💚 Settle with eSewa</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>How SplitSewa Works</h2></div>
          <div className="card-body">
            {[
              { n: '1', t: 'Create a group', d: 'Add friends by their email address' },
              { n: '2', t: 'Add shared expenses', d: 'Splits equally in NPR automatically' },
              { n: '3', t: 'Check balances', d: 'Net view — who owes whom and how much' },
              { n: '4', t: 'Settle via eSewa', d: 'One-tap digital payment, no cash needed' },
            ].map((step) => (
              <div key={step.n} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{step.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Get started — create your first group</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Invite friends and start tracking shared expenses</div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/groups')}>Create Group →</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
