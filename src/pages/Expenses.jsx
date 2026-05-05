import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { addExpense, getExpenses, getMyGroups, getMembers } from '../api';

const CATEGORIES = [
  { value: 'FOOD', label: '🍛 Food', color: '#F6AD55' },
  { value: 'TRANSPORT', label: '🚌 Transport', color: '#63B3ED' },
  { value: 'HOTEL', label: '🏨 Hotel', color: '#9F7AEA' },
  { value: 'SHOPPING', label: '🛍️ Shopping', color: '#FC8181' },
  { value: 'OTHER', label: '📦 Other', color: '#A0AEC0' },
];

const getCategoryStyle = (cat) => {
  const found = CATEGORIES.find(c => c.value === cat);
  return found ? { background: found.color + '22', color: found.color, label: found.label } : { background: '#EEF2F5', color: '#5E7387', label: cat };
};

export default function Expenses() {
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [form, setForm] = useState({
    groupId: '', amount: '', description: '',
    category: 'FOOD', splitType: 'EQUAL',
  });
  const [customSplits, setCustomSplits] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [viewGroupId, setViewGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getMyGroups().then(res => {
      setGroups(res.data);
      localStorage.setItem('groups', JSON.stringify(res.data));
    }).catch(() => {});
  }, []);

  const handleGroupChange = async (groupId) => {
    setForm(f => ({ ...f, groupId }));
    setCustomSplits({});
    if (groupId) {
      try {
        const res = await getMembers(groupId);
        setGroupMembers(res.data);
        const splits = {};
        res.data.forEach(m => splits[m.userId] = '');
        setCustomSplits(splits);
      } catch { setGroupMembers([]); }
    }
  };

  const fetchExpenses = async (gid) => {
    if (!gid) return;
    setFetching(true);
    try {
      const res = await getExpenses(gid);
      setExpenses(res.data);
    } catch (err) {
      setError(err.response?.data || 'Failed to fetch expenses.');
      setExpenses([]);
    } finally {
      setFetching(false);
    }
  };

  const getCustomTotal = () => {
    return Object.values(customSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    if (form.splitType === 'CUSTOM') {
      const total = getCustomTotal();
      const amount = parseFloat(form.amount);
      if (Math.abs(total - amount) > 0.01) {
        setError(`Custom splits total (NPR ${total}) must equal expense amount (NPR ${amount})`);
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        groupId: Number(form.groupId),
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        splitType: form.splitType,
      };

      if (form.splitType === 'CUSTOM') {
        const cs = {};
        Object.entries(customSplits).forEach(([uid, amt]) => {
          if (parseFloat(amt) > 0) cs[uid] = parseFloat(amt);
        });
        payload.customSplits = cs;
      }

      await addExpense(payload);
      setSuccess(form.splitType === 'EQUAL'
        ? 'Expense added and split equally!'
        : 'Expense added with custom splits!');
      setForm(f => ({ ...f, amount: '', description: '' }));
      const newSplits = {};
      groupMembers.forEach(m => newSplits[m.userId] = '');
      setCustomSplits(newSplits);
      if (viewGroupId === form.groupId) fetchExpenses(viewGroupId);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const formatNPR = (amt) => `NPR ${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const customTotal = getCustomTotal();
  const expenseAmount = parseFloat(form.amount) || 0;
  const customRemaining = expenseAmount - customTotal;

  return (
    <Layout>
      <div className="page-header">
        <h1>Expenses</h1>
        <p>Add expenses with equal or custom splits — categorized in NPR</p>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* Add Expense Form */}
        <div className="card">
          <div className="card-header"><h2>Add Expense</h2></div>
          <div className="card-body">
            <form onSubmit={handleAdd}>
              {/* Group */}
              <div className="form-group">
                <label className="form-label">Group</label>
                <select className="form-input" value={form.groupId}
                  onChange={(e) => handleGroupChange(e.target.value)} required>
                  <option value="">Select group</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" placeholder="e.g. Hotel Pokhara"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Amount (NPR)</label>
                <input type="number" className="form-input" placeholder="0.00"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  min="1" step="0.01" required />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', border: '1.5px solid',
                        borderColor: form.category === cat.value ? cat.color : 'var(--border)',
                        background: form.category === cat.value ? cat.color + '22' : 'white',
                        color: form.category === cat.value ? cat.color : 'var(--text-muted)',
                        transition: 'all 0.15s'
                      }}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Type */}
              <div className="form-group">
                <label className="form-label">Split Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['EQUAL', 'CUSTOM'].map(type => (
                    <button key={type} type="button"
                      onClick={() => setForm({ ...form, splitType: type })}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: form.splitType === type ? 'var(--green)' : 'var(--border)',
                        background: form.splitType === type ? 'var(--green-dim)' : 'white',
                        color: form.splitType === type ? 'var(--green)' : 'var(--text-muted)',
                      }}>
                      {type === 'EQUAL' ? '⚖️ Equal' : '✏️ Custom'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Splits */}
              {form.splitType === 'CUSTOM' && groupMembers.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Custom Amounts</label>
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    {groupMembers.map(m => (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>
                          {m.username?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, flex: 1 }}>{m.username}</span>
                        <input type="number" placeholder="0.00" min="0" step="0.01"
                          value={customSplits[m.userId] || ''}
                          onChange={(e) => setCustomSplits({ ...customSplits, [m.userId]: e.target.value })}
                          style={{ width: 90, padding: '5px 8px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13, textAlign: 'right' }} />
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total assigned</span>
                      <span style={{ fontWeight: 700, color: Math.abs(customRemaining) < 0.01 ? 'var(--green)' : 'var(--red)', fontFamily: 'DM Mono, monospace' }}>
                        NPR {customTotal.toFixed(2)} / {expenseAmount.toFixed(2)}
                        {Math.abs(customRemaining) >= 0.01 && ` (${customRemaining > 0 ? '-' : '+'} NPR ${Math.abs(customRemaining).toFixed(2)})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {form.splitType === 'EQUAL' && (
                <div style={{ background: 'var(--green-dim)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--green)' }}>
                  💡 Amount split equally among all {groupMembers.length || '?'} group members
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Adding...' : '+ Add Expense'}
              </button>
            </form>
          </div>
        </div>

        {/* View Expenses */}
        <div className="card">
          <div className="card-header"><h2>Group Expenses</h2></div>
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <select className="form-input" value={viewGroupId}
                onChange={(e) => { setViewGroupId(e.target.value); fetchExpenses(e.target.value); }}>
                <option value="">Select group to view expenses</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              {fetching && <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}><div className="spinner" /></div>}
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>{viewGroupId ? 'No expenses yet' : 'Select a group'}</h3>
              <p>Only group members can view expenses</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Paid By</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const cat = getCategoryStyle(exp.category);
                    return (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 500 }}>{exp.description}</td>
                        <td>
                          <span style={{ background: cat.background, color: cat.color, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            {cat.label || exp.category}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--green)' }}>
                            {formatNPR(exp.amount)}
                          </span>
                        </td>
                        <td>{exp.paidBy}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                          {new Date(exp.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '12px 16px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {CATEGORIES.map(cat => {
                    const count = expenses.filter(e => e.category === cat.value).length;
                    if (count === 0) return null;
                    return (
                      <span key={cat.value} style={{ background: cat.color + '22', color: cat.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {cat.label} ×{count}
                      </span>
                    );
                  })}
                </div>
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700 }}>
                  Total: {formatNPR(expenses.reduce((s, e) => s + Number(e.amount), 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
