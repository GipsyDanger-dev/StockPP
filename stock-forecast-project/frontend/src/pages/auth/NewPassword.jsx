import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader, AlertCircle, Lock, Check, X, Shield } from 'lucide-react';
import AuthCanvas from '../../components/AuthCanvas';
import apiClient from '../../services/apiService';

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

function PasswordCheckItem({ met, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {met ? <Check size={13} color="#22c55e" /> : <X size={13} color="#ef4444" />}
      <span style={{ font: `400 12px/1 ${S.fontU}`, color: met ? S.mid : '#ef4444' }}>{text}</span>
    </div>
  );
}

export default function NewPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const otpVerified = sessionStorage.getItem('otpVerified');
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (otpVerified === 'true' && storedEmail) { setIsVerified(true); setEmail(storedEmail); }
    setCheckingSession(false);
  }, []);

  const passwordChecks = {
    minLength: form.password.length >= 12,
    hasUppercase: /[A-Z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const strengthLabel = passedChecks <= 1 ? 'WEAK' : passedChecks <= 2 ? 'FAIR' : passedChecks <= 3 ? 'GOOD' : 'STRONG';
  const strengthColor = passedChecks <= 1 ? '#ef4444' : passedChecks <= 2 ? '#f97316' : passedChecks <= 3 ? '#eab308' : '#22c55e';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (!passwordChecks.minLength || !passwordChecks.hasUppercase || !passwordChecks.hasNumber || !passwordChecks.hasSpecial) { setError('Password does not meet all requirements.'); return; }
    setLoading(true);
    try {
      const resetToken = sessionStorage.getItem('resetToken');
      await apiClient.post('/auth/reset-password', {
        email,
        new_password: form.password,
        reset_token: resetToken,
      });
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('otpVerified');
      sessionStorage.removeItem('deliveryMethod');
      sessionStorage.removeItem('phoneNumber');
      sessionStorage.removeItem('resetToken');
      navigate('/login');
    } catch {
      setError('Failed to reset password. Please try again.');
    }
    finally { setLoading(false); }
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgba(10,10,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size={28} color={S.mid} className="animate-spin" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgba(10,10,10,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
        <AuthCanvas />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', textAlign: 'center', animation: 'fadeInUp 0.6s ease-out' }}>
          <div style={{ background: 'rgba(17,17,17,0.35)', border: `1px solid ${S.border}`, padding: '44px 36px', backdropFilter: 'blur(12px)' }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, marginBottom: 14 }}>Verification Required</h2>
            <p style={{ font: `400 13px/20px ${S.fontU}`, color: S.mid, marginBottom: 28 }}>
              You need to verify your identity before resetting your password. Please request a new reset link.
            </p>
            <Link to="/forgot-password" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, background: S.orange, color: S.white,
              textDecoration: 'none', padding: '14px 28px', font: `500 13px/1 ${S.fontU}`,
            }}>
              Request Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(10,10,10,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '80px 0' }}>
      <AuthCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, padding: '0 24px', animation: 'fadeInUp 0.6s ease-out' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ font: `500 20px/1 ${S.fontD}`, color: S.white, letterSpacing: '-0.5px' }}>PRECISION ANALYTICS</span>
          <p style={{ font: `400 13px/20px ${S.fontD}`, color: S.mid, marginTop: 12 }}>
            Establish a new, secure credential to regain access.
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

          <form onSubmit={handleSubmit}>
            {/* New Password */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="new-password" style={labelStyle}>New Password</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Lock size={14} color={S.mid} /></div>
                <input id="new-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '16px 12px', display: 'flex' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={14} color={S.mid} /> : <Eye size={14} color={S.mid} />}
                </button>
              </div>
              {/* Strength Bar */}
              {form.password && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ flex: 1, height: 3, background: passedChecks > i ? strengthColor : S.border, transition: 'background .3s' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ font: `500 9px/1 ${S.fontU}`, color: strengthColor }}>STRENGTH: {strengthLabel}</span>
                    <span style={{ font: `400 9px/1 ${S.fontU}`, color: S.dark2 }}>Min. 12 Characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="confirm-password" style={labelStyle}>Confirm New Password</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10,10,10,0.6)', border: `1px solid ${S.border}`, transition: 'border-color .2s' }} onFocus={(e) => e.currentTarget.style.borderColor = S.orange} onBlur={(e) => e.currentTarget.style.borderColor = S.border}>
                <div style={{ padding: '16px 12px' }}><Lock size={14} color={S.mid} /></div>
                <input id="confirm-password" type={showConfirm ? 'text' : 'password'} placeholder="••••••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} style={inputStyle} required />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '16px 12px', display: 'flex' }} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff size={14} color={S.mid} /> : <Eye size={14} color={S.mid} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{ padding: '16px 18px', marginBottom: 28, background: 'rgba(255,255,255,0.02)', border: `1px solid ${S.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Shield size={12} color={S.mid} />
                <span style={{ font: `500 10px/1 ${S.fontU}`, color: S.mid, textTransform: 'uppercase', letterSpacing: '.5px' }}>Enterprise Policy Requirements</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <PasswordCheckItem met={passwordChecks.minLength} text="Minimum of 12 characters in length" />
                <PasswordCheckItem met={passwordChecks.hasUppercase} text="Include at least one uppercase letter (A-Z)" />
                <PasswordCheckItem met={passwordChecks.hasNumber} text="Include at least one numerical digit (0-9)" />
                <PasswordCheckItem met={passwordChecks.hasSpecial} text="One special character (e.g., @, #, $, %)" />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: S.orange, color: S.white, border: 'none', padding: '16px 0', cursor: loading ? 'default' : 'pointer',
              font: `500 13px/1 ${S.fontU}`, opacity: loading ? 0.6 : 1, transition: 'background .2s',
            }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = S.hover; }} onMouseLeave={(e) => { e.currentTarget.style.background = S.orange; }}>
              {loading ? <Loader size={16} className="animate-spin" /> : <><span>Reset Password</span><ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        {/* Back to Login */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link to="/login" style={{ font: `400 13px/1 ${S.fontD}`, color: S.mid, textDecoration: 'none', transition: 'color .2s' }} onMouseEnter={(e) => e.currentTarget.style.color = S.white} onMouseLeave={(e) => e.currentTarget.style.color = S.mid}>
            Back to User Login
          </Link>
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
