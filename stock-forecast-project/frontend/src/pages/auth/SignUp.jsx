import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Loader, AlertCircle, CheckCircle, User, Mail, Building, Lock, Shield } from 'lucide-react';
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

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [accountType, setAccountType] = useState('individual');
  const [form, setForm] = useState({ fullName: '', email: '', organization: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agreed) { setError('You must agree to the Terms of Service.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const { data, error: authError } = await signUp(form.email, form.password, {
        full_name: form.fullName,
        organization: accountType === 'enterprise' ? form.organization : '',
        account_type: accountType,
      });
      if (authError) setError('Unable to create account. Please try again.');
      else { setSuccess('Account created! Please check your email to verify.'); }
    } catch { setError('An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  const typeBtn = (type, label) => {
    const active = accountType === type;
    return (
      <button type="button" onClick={() => setAccountType(type)} style={{
        flex: 1, padding: '14px 0', background: active ? 'rgba(255,102,51,0.12)' : 'transparent',
        border: `1px solid ${active ? S.orange : S.border}`, color: active ? S.orange : S.mid,
        font: `500 12px/1 ${S.fontU}`, cursor: 'pointer', transition: 'all .2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {type === 'individual' ? <User size={14} /> : <Building size={14} />}
        {label}
      </button>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(10,10,10,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
      <AuthCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', animation: 'fadeInUp 0.6s ease-out' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, letterSpacing: '-0.5px' }}>PRECISION ANALYTICS</span>
          <p style={{ font: `400 13px/20px ${S.fontD}`, color: S.mid, marginTop: 12 }}>
            Create your account to start predicting.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(17,17,17,0.35)', border: `1px solid ${S.border}`, padding: '44px 36px', backdropFilter: 'blur(12px)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ font: `400 13px/1 ${S.fontU}`, color: '#ef4444' }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 24, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }} aria-live="polite">
              <CheckCircle size={14} color="#22c55e" />
              <span style={{ font: `400 13px/1 ${S.fontU}`, color: '#22c55e' }}>{success}</span>
              <Link to="/login" style={{ font: `500 13px/1 ${S.fontD}`, color: S.white, textDecoration: 'none', marginLeft: 'auto' }}>Log in</Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Account Type Selector */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {typeBtn('individual', 'Individual')}
                {typeBtn('enterprise', 'Enterprise')}
              </div>
            </div>

            {/* Full Name */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="signup-name" style={labelStyle}>Full Name</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><User size={14} color={S.mid} /></div>
                <input id="signup-name" type="text" placeholder="Alex Chen" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} style={inputStyle} required />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="signup-email" style={labelStyle}>{accountType === 'enterprise' ? 'Work Email' : 'Email'}</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Mail size={14} color={S.mid} /></div>
                <input id="signup-email" type="email" placeholder={accountType === 'enterprise' ? 'name@organization.com' : 'name@email.com'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} required />
              </div>
            </div>

            {/* Organization — Enterprise only */}
            {accountType === 'enterprise' && (
              <div style={{ marginBottom: 22, animation: 'fadeInUp 0.3s ease-out' }}>
                <label htmlFor="signup-org" style={labelStyle}>Organization</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                  <div style={{ padding: '16px 12px' }}><Building size={14} color={S.mid} /></div>
                  <input id="signup-org" type="text" placeholder="Enterprise Labs Inc." value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} style={inputStyle} required />
                </div>
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="signup-password" style={labelStyle}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Lock size={14} color={S.mid} /></div>
                <input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} required minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '16px 12px', display: 'flex' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={14} color={S.mid} /> : <Eye size={14} color={S.mid} />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div
              role="checkbox"
              aria-checked={agreed}
              tabIndex={0}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24, cursor: 'pointer' }}
              onClick={() => setAgreed(!agreed)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAgreed(!agreed); } }}
            >
              <div style={{ width: 16, height: 16, border: `1px solid ${S.border}`, background: agreed ? S.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, transition: 'background .2s' }}>
                {agreed && <span style={{ color: S.white, fontSize: 10, lineHeight: 1 }}>&#10003;</span>}
              </div>
              <span style={{ font: `400 12px/18px ${S.fontU}`, color: S.mid }}>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </div>

            {/* Security Notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', marginBottom: 28, background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}` }}>
              <Shield size={12} color={S.mid} style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ font: `400 11px/16px ${S.fontU}`, color: S.mid }}>
                {accountType === 'enterprise'
                  ? 'Enterprise accounts require admin approval. Activity is logged for compliance.'
                  : 'All activity is logged and monitored for compliance.'}
              </p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: S.orange, color: S.white, border: 'none', padding: '16px 0', cursor: loading ? 'default' : 'pointer',
              font: `500 13px/1 ${S.fontU}`, opacity: loading ? 0.6 : 1, transition: 'background .2s',
            }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = S.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = S.orange; }}>
              {loading ? <Loader size={16} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <span style={{ font: `400 13px/1 ${S.fontD}`, color: S.mid }}>Already have an account? </span>
          <Link to="/login" style={{ font: `500 13px/1 ${S.fontD}`, color: S.white, textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = S.orange} onMouseLeave={(e) => e.currentTarget.style.color = S.white}>Log in here</Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>Security</span>
            <span style={{ color: S.border }}>|</span>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>Compliance</span>
            <span style={{ color: S.border }}>|</span>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>System Status</span>
          </div>
          <div style={{ width: 48, height: 1, background: S.border, margin: '0 auto 12px' }} />
          <span style={{ font: `400 9px/1 ${S.fontU}`, color: S.dark2 }}>&copy; 2026 PRECISION ANALYTICS SYSTEMS. ALL RIGHTS RESERVED.</span>
        </div>
      </div>
    </div>
  );
}
