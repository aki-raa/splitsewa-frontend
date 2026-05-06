import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import { settle, getMembers, getMyGroups } from '../api';

export default function Settle() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ groupId: '', toUserId: '', amount: '' });
  const [members, setMembers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prefilled, setPrefilled] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    getMyGroups().then(res => setGroups(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('settleData');
    if (saved) {
      const data = JSON.parse(saved);
      setPrefilled(data);
      setForm({
        groupId: String(data.groupId),
        toUserId: String(data.toUserId),
        amount: String(data.amount)
      });
      loadMembers(data.groupId);
      localStorage.removeItem('settleData');
    }
  }, []);

  const loadMembers = async (groupId) => {
    if (!groupId) return;
    try {
      const res = await getMembers(groupId);
      setMembers(res.data);
    } catch {
      setMembers([]);
    }
  };

  const handleGroupChange = (e) => {
    const gid = e.target.value;
    setForm({ ...form, groupId: gid, toUserId: '' });
    setResult(null);
    loadMembers(gid);
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    setShowQR(false);

    try {
      const res = await settle({
        groupId: Number(form.groupId),
        toUserId: Number(form.toUserId),
        amount: parseFloat(form.amount),
      });

      const raw = res.data;
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      setResult(data);
    } catch (err) {
      setError(err.response?.data || 'Settlement failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEsewaRedirect = () => {
    const esewaForm = document.createElement('form');
    esewaForm.method = 'POST';
    esewaForm.action = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';

    const fields = {
      amount: result.amount,
      total_amount: result.total_amount,
      transaction_uuid: result.transaction_uuid,
      product_code: result.product_code,
      signature: result.signature,
      success_url: result.success_url,
      failure_url: result.failure_url,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      esewaForm.appendChild(input);
    });

    document.body.appendChild(esewaForm);
    esewaForm.submit();
  };

  const getEsewaQRUrl = () => {
    if (!result) return '';
    return `https://rc-epay.esewa.com.np/api/epay/main/v2/form?amount=${result.amount}&total_amount=${result.total_amount}&transaction_uuid=${result.transaction_uuid}&product_code=${result.product_code}&signature=${encodeURIComponent(result.signature)}&success_url=${encodeURIComponent(result.success_url)}&failure_url=${encodeURIComponent(result.failure_url)}`;
  };

  const formatNPR = (amt) =>
    `NPR ${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const selectedMember = members.find(m => m.userId == form.toUserId);

  return (
    <Layout>
      <div className="page-header">
        <h1>Settle Payment</h1>
        <p>Mark debts as settled and pay via eSewa</p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Form */}
        <div className="card">
          <div className="card-header"><h2>Settlement Details</h2></div>
          <div className="card-body">

            {prefilled && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                ✓ Pre-filled: {prefilled.fromUsername} → {prefilled.toUsername}
              </div>
            )}

            <form onSubmit={handleSettle}>
              
              <div className="form-group">
                <label className="form-label">Group</label>
                <select className="form-input" value={form.groupId} onChange={handleGroupChange} required>
                  <option value="">Select group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pay To</label>

                {members.length > 0 ? (
                  <select
                    className="form-input"
                    value={form.toUserId}
                    onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
                    required
                  >
                    <option value="">Select member to pay</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.username} ({m.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '10px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    color: 'var(--text-muted)'
                  }}>
                    Select a group first
                  </div>
                )}

                {selectedMember && (
                  <div style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: 'var(--green-dim)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    color: 'var(--green)'
                  }}>
                    Paying to: <strong>{selectedMember.username}</strong> ({selectedMember.email})
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Amount (NPR)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Processing...' : '💚 Settle & Generate Payment'}
              </button>

            </form>
          </div>
        </div>

        {/* Result */}
        <div>
          {result ? (
            <div className="card">
              <div className="card-header">
                <h2>✅ Debt Settled</h2>
                <span className="badge badge-green">Recorded</span>
              </div>

              <div className="card-body">

                <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Amount to Pay
                  </div>
                  <div style={{
                    fontSize: 34,
                    fontWeight: 700,
                    fontFamily: 'DM Mono, monospace',
                    color: 'var(--green)'
                  }}>
                    {formatNPR(result.amount || form.amount)}
                  </div>

                  {selectedMember && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      to <strong>{selectedMember.username}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  
                  <button className="btn btn-primary btn-full" onClick={handleEsewaRedirect}>
                    Open eSewa →
                  </button>

                  <button className="btn btn-ghost btn-full" onClick={() => setShowQR(!showQR)}>
                    {showQR ? 'Hide QR' : 'Show QR'}
                  </button>

                </div>

                {showQR && (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <QRCodeSVG value={getEsewaQRUrl()} size={180} />
                  </div>
                )}

                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Transaction ID
                  </div>
                  <div style={{ fontSize: 11 }}>
                    {result.transaction_uuid}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <h3>eSewa Settlement</h3>
                <p>Fill in the details to generate payment</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}