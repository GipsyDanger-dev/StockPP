import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader, AlertCircle, Mail } from 'lucide-react';
import AuthCanvas from '../../components/AuthCanvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, delivery_method: 'email' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.detail || 'Failed to send OTP. Please try again.');
      else { sessionStorage.setItem('resetEmail', email); sessionStorage.setItem('deliveryMethod', 'email'); navigate('/verify-code'); }
    } catch { setError('An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: S.dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
      <AuthCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', animation: 'fadeInUp 0.6s ease-out' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, letterSpacing: '-0.5px' }}>PRECISION ANALYTICS</span>
          <p style={{ font: `400 13px/20px ${S.fontD}`, color: S.mid, marginTop: 12 }}>
            Enter your corporate email to receive a verification code.
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(17,17,17,0.55)', border: `1px solid ${S.border}`, padding: '44px 36px', backdropFilter: 'blur(12px)' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ font: `400 13px/1 ${S.fontU}`, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Corporate Email</label>
              <div style={{ display: 'flex', alignItems: 'center', background: S.dark, border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Mail size={14} color={S.mid} /></div>
                <input type="email" placeholder="name@precision-analytics.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginBottom: 20 }}>
              <button type="submit" disabled={loading} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: S.orange, color: S.white, border: 'none', padding: '16px 0', cursor: loading ? 'default' : 'pointer',
                font: `500 13px/1 ${S.fontU}`, opacity: loading ? 0.6 : 1, transition: 'background .2s',
              }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = S.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = S.orange; }}>
                {loading ? <Loader size={16} className="animate-spin" /> : <><span>Send Reset Link</span><ArrowRight size={14} /></>}
              </button>
            </div>

            {/* Back to Login */}
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `400 12px/1 ${S.fontU}`, color: S.mid, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.currentTarget.style.color = S.white} onMouseLeave={(e) => e.currentTarget.style.color = S.mid}>
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
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
