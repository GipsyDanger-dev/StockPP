import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, Mail } from 'lucide-react';
import AuthCanvas from '../../components/AuthCanvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const S = {
  dark: '#0a0a0a', surface: '#111', border: '#1e1e1e', mid: '#888', dark2: '#555',
  orange: '#FF6633', hover: '#E55A22', white: '#FFF',
  fontD: 'var(--font-display)', fontU: 'var(--font-ui)',
};

export default function VerifyCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => { if (index + i < 6) newCode[index + i] = digit; });
      setCode(newCode);
      inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.detail || 'Invalid or expired code.');
      else { sessionStorage.setItem('otpVerified', 'true'); navigate('/new-password'); }
    } catch { setError('An unexpected error occurred.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!email) { setError('Email address not found. Please go back and enter your email.'); return; }
    setResending(true); setResendSuccess(false); setError('');
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, delivery_method: 'email' }),
      });
      const data = await response.json();
      if (!response.ok) setError(data.detail || 'Failed to resend code.');
      else { setResendSuccess(true); setTimeout(() => setResendSuccess(false), 3000); }
    } catch { setError('An unexpected error occurred.'); }
    finally { setResending(false); }
  };

  const maskedEmail = email ? `${email[0]}${'*'.repeat(Math.min(email.indexOf('@') - 2, 6))}${email.slice(email.indexOf('@'))}` : '';

  return (
    <div style={{ minHeight: '100vh', background: S.dark, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
      <AuthCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', animation: 'fadeInUp 0.6s ease-out' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, letterSpacing: '-0.5px' }}>PRECISION ANALYTICS</span>
          <p style={{ font: `400 11px/1 ${S.fontU}`, color: S.dark2, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 12 }}>Enterprise Terminal</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(17,17,17,0.55)', border: `1px solid ${S.border}`, padding: '44px 36px', backdropFilter: 'blur(12px)' }}>
          {/* Email Icon & Message */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Mail size={22} color={S.mid} />
            </div>
            <h2 style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, marginBottom: 10 }}>Check Your Email</h2>
            <p style={{ font: `400 13px/20px ${S.fontU}`, color: S.mid }}>
              We have sent a verification code to
              {email ? <span style={{ color: S.white, fontWeight: 500 }}> {maskedEmail}</span> : ' your email address'}.
            </p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', marginBottom: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={{ font: `400 13px/1 ${S.fontU}`, color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {/* OTP Inputs */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ font: `500 10px/1 ${S.fontU}`, color: S.mid, textTransform: 'uppercase', letterSpacing: '.5px' }}>Enter Verification Code</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, marginBottom: 28 }}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  style={{
                    width: 44, height: 50, textAlign: 'center', font: `500 18px/1 ${S.fontU}`, color: S.white,
                    background: S.dark, border: `1px solid ${S.border}`, outline: 'none', transition: 'border-color .2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = S.orange}
                  onBlur={(e) => e.currentTarget.style.borderColor = S.border}
                />
              ))}
            </div>

            <button onClick={handleVerify} disabled={loading || code.join('').length !== 6} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: S.orange, color: S.white, border: 'none', padding: '14px 48px', cursor: loading ? 'default' : 'pointer',
              font: `500 13px/1 ${S.fontU}`, opacity: (loading || code.join('').length !== 6) ? 0.5 : 1, transition: 'background .2s',
            }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = S.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = S.orange; }}>
              {loading ? <Loader size={14} className="animate-spin" /> : 'Verify Identity'}
            </button>
          </div>

          {/* Resend & Back */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ font: `400 12px/1 ${S.fontU}`, color: S.mid, marginBottom: 12 }}>Didn't receive the email?</p>
            <button onClick={handleResend} disabled={resending} style={{
              background: 'none', border: 'none', cursor: 'pointer', font: `500 11px/1 ${S.fontU}`,
              color: resending ? S.dark2 : S.white, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 24,
            }}>
              {resending ? 'Sending...' : resendSuccess ? 'Code Sent!' : 'Resend Code'}
            </button>
            <div>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `400 12px/1 ${S.fontU}`, color: S.mid, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.currentTarget.style.color = S.white} onMouseLeave={(e) => e.currentTarget.style.color = S.mid}>
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <span style={{ font: `400 9px/1 ${S.fontU}`, color: S.dark2 }}>PRECISION ANALYTICS IDENTITY SERVICE &bull; V4.2.0</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>Privacy Policy</span>
            <span style={{ color: S.border }}>&bull;</span>
            <span style={{ font: `400 10px/1 ${S.fontU}`, color: S.dark2 }}>Security Protocols</span>
          </div>
        </div>
      </div>
    </div>
  );
}
