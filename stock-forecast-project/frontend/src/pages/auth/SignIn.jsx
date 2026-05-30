import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader, AlertCircle, Lock, Mail, Shield } from 'lucide-react';
import AuthCanvas from '../../components/AuthCanvas';

const S = {
  dark: '#0a0a0a', surface: '#111', border: '#1e1e1e', mid: '#888', dark2: '#555',
  orange: '#FF6633', hover: '#E55A22', white: '#FFF',
  fontD: 'var(--font-display)', fontU: 'var(--font-ui)',
};

const inputStyle = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  font: `400 14px/1 ${S.fontU}`, color: S.white, padding: '16px 14px 16px 0',
};

const labelStyle = {
  display: 'block', font: `500 11px/16.5px ${S.fontU}`, color: S.mid,
  textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10,
};

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await signIn(form.email, form.password);
      if (authError) setError('Invalid email or password.');
      else navigate('/dashboard');
    } catch { setError('An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(10,10,10,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
      <AuthCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, letterSpacing: '-0.5px' }}>PRECISION ANALYTICS</span>
          <p style={{ font: `400 13px/20px ${S.fontD}`, color: S.mid, marginTop: 12 }}>
            Enterprise-grade predictive analytics for financial market dynamics.
          </p>
        </div>

        <div style={{ background: 'rgba(17,17,17,0.35)', border: `1px solid ${S.border}`, padding: '44px 36px', backdropFilter: 'blur(12px)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ font: `400 13px/1 ${S.fontU}`, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="signin-email" style={labelStyle}>Corporate Email</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Mail size={14} color={S.mid} /></div>
                <input id="signin-email" type="email" placeholder="name@precision-analytics.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} required />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label htmlFor="signin-password" style={{ ...labelStyle, marginBottom: 0 }}>Access Key</label>
                <Link to="/forgot-password" style={{ font: `400 11px/1 ${S.fontU}`, color: S.mid, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.currentTarget.style.color = S.orange} onMouseLeave={(e) => e.currentTarget.style.color = S.mid}>Forgot Password?</Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Lock size={14} color={S.mid} /></div>
                <input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '16px 12px', display: 'flex' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={14} color={S.mid} /> : <Eye size={14} color={S.mid} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', marginBottom: 28, background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}` }}>
              <Shield size={12} color={S.mid} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ font: `400 11px/16px ${S.fontU}`, color: S.mid }}>
                Access to this terminal is restricted to authorized personnel. All activity is logged and monitored for compliance.
              </p>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: S.orange, color: S.white, border: 'none', padding: '16px 0', cursor: loading ? 'default' : 'pointer',
              font: `500 13px/1 ${S.fontU}`, opacity: loading ? 0.6 : 1, transition: 'background .2s',
            }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = S.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = S.orange; }}>
              {loading ? <Loader size={16} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <span style={{ font: `400 13px/1 ${S.fontD}`, color: S.mid }}>Don't have an account? </span>
          <Link to="/signup" style={{ font: `500 13px/1 ${S.fontD}`, color: S.white, textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = S.orange} onMouseLeave={(e) => e.currentTarget.style.color = S.white}>Register here</Link>
        </div>

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>System Health</span>
            <span style={{ color: S.border }}>|</span>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>Legal Portal</span>
          </div>
          <div style={{ width: 48, height: 1, background: S.border, margin: '0 auto 12px' }} />
          <span style={{ font: `400 9px/1 ${S.fontU}`, color: S.dark2 }}>&copy; 2026 PRECISION ANALYTICS SYSTEMS. ALL RIGHTS RESERVED.</span>
        </div>
      </div>
    </div>
  );
}
