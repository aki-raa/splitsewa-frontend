import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getBalances, getMyGroups } from '../api';

export default function Balances() {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getMyGroups().then(res => setGroups(res.data)).catch(() => {});
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setLoaded(false);
    try {
      const res = await getBalances(groupId);
      setBalances(res.data);
      setLoaded(true);
    } catch (err) {
      setError(err.response?.data || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = (b) => {
    localStorage.setItem('settleData', JSON.stringify({
      groupId, toUserId: b.toUserId, toUsername: b.toUsername,
      fromUsername: b.fromUsername, amount: b.amount,
    }));
    navigate('/settle');
  };

  const formatNPR = (amt) => `NPR ${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const selectedGroup = groups.find(g => g.id == groupId);

  return (
    <Layout>
      <div className="page-header">
        <h1>Balances</h1>
        <p>See who owes whom — net balances across all expenses</p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <form onSubmit={handleFetch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Select Group</label>
              <select className="form-input" value={groupId}
                onChange={(e) => { setGroupId(e.target.value); setLoaded(false); setBalances([]); }} required>
                <option value="">Choose a group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Calculating...' : 'Check Balances'}
            </button>
          </form>
        </div>
      </div>

      {loaded && (
        <div className="card">
          <div className="card-header">
            <h2>Net Balances — {selectedGroup?.name}</h2>
            <span className={`badge ${balances.length === 0 ? 'badge-green' : 'badge-red'}`}>
              {balances.length === 0 ? 'All settled' : `${balances.length} outstanding`}
            </span>
          </div>
          {balances.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>All settled up!</h3>
              <p>No outstanding balances in this group</p>
            </div>
          ) : (
            <div className="card-body">
              {balances.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #EEF2F5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 14, background: 'var(--red)', flexShrink: 0 }}>
                      {b.fromUsername?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14 }}>
                        <strong>{b.fromUsername}</strong>
                        <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>owes</span>
                        <strong>{b.toUsername}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Unsettled balance</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 16, color: 'var(--red)' }}>
                      {formatNPR(b.amount)}
                    </span>
                    <button className="btn btn-sm btn-primary" onClick={() => handleSettle(b)}>Settle →</button>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: '16px 0 0', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total outstanding</span>
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 20, color: 'var(--red)' }}>
                  {formatNPR(balances.reduce((sum, b) => sum + Number(b.amount), 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {!loaded && !loading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">⚖️</div>
            <h3>Select a group to check balances</h3>
            <p>Shows net amounts after all expenses are accounted for</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
