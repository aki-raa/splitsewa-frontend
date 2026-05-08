import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.phone && !/^9[678]\d{8}$/.test(form.phone)) {
      setError('Enter a valid Nepali phone number (e.g. 9841234567)');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>SplitSewa</h1>
          <p>Split expenses, settle with eSewa</p>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-sub">Join SplitSewa today</p>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-input" placeholder="Your name"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">eSewa Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: 'var(--text-muted)', fontWeight: 600
              }}>🇳🇵 +977</span>
              <input type="tel" className="form-input" placeholder="9841234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{ paddingLeft: 80 }}
                maxLength={10}
                required />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Your eSewa registered number — used for settlements
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}