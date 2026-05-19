import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Eye, EyeOff, ArrowRight, Loader, AlertCircle, Lock, Check, X, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const NewPassword = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
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

    if (otpVerified === 'true' && storedEmail) {
      setIsVerified(true);
      setEmail(storedEmail);
    }
    setCheckingSession(false);
  }, []);

  const passwordChecks = {
    minLength: form.password.length >= 12,
    hasUppercase: /[A-Z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };

  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;
  const strengthPercent = (passedChecks / 4) * 100;

  const strengthLabel = passedChecks <= 1 ? 'WEAK' : passedChecks <= 2 ? 'FAIR' : passedChecks <= 3 ? 'GOOD' : 'STRONG';
  const strengthColor = passedChecks <= 1 ? 'bg-red-500' : passedChecks <= 2 ? 'bg-orange-500' : passedChecks <= 3 ? 'bg-yellow-500' : 'bg-green-500';
  const strengthTextColor = passedChecks <= 1 ? 'text-red-600' : passedChecks <= 2 ? 'text-orange-600' : passedChecks <= 3 ? 'text-yellow-600' : 'text-green-600';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasUppercase || !passwordChecks.hasNumber || !passwordChecks.hasSpecial) {
      setError('Password does not meet all requirements.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: form.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Failed to reset password. Please try again.');
      } else {
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('otpVerified');
        sessionStorage.removeItem('deliveryMethod');
        sessionStorage.removeItem('phoneNumber');
        navigate('/login');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-black" />
              <span className="text-black text-2xl font-bold">PRECISION ANALYTICS</span>
            </div>
          </div>
          <div className="w-full max-w-md">
            <div className="bg-white py-10 px-10 rounded-xl border border-[#C6C6CD] shadow-sm text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-[#191C1E] text-xl font-bold mb-2">Verification Required</h2>
              <p className="text-[#45464D] text-sm mb-6">
                You need to verify your identity before resetting your password. Please request a new reset link.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 bg-black text-white py-3 px-6 rounded font-bold text-sm hover:bg-gray-800 transition-colors"
              >
                Request Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-black" />
            <span className="text-black text-2xl font-bold">PRECISION ANALYTICS</span>
          </div>
          <h1 className="text-[#191C1E] text-2xl font-bold mb-2">Create New Password</h1>
          <p className="text-[#45464D] text-sm max-w-md mx-auto">
            Please establish a new, secure credential to regain access to the Enterprise Terminal.
          </p>
        </div>

        {/* Reset Card */}
        <div className="w-full max-w-md">
          <div className="bg-white py-10 px-10 rounded-xl border border-[#C6C6CD] shadow-sm">
            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  New Password
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#76777D] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Lock className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 py-4 text-[#45464D] hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Indicator */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className={`h-1 flex-1 rounded-full transition-colors ${passedChecks >= 1 ? strengthColor : 'bg-gray-200'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-colors ${passedChecks >= 2 ? strengthColor : 'bg-gray-200'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-colors ${passedChecks >= 3 ? strengthColor : 'bg-gray-200'}`} />
                      <div className={`h-1 flex-1 rounded-full transition-colors ${passedChecks >= 4 ? strengthColor : 'bg-gray-200'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-medium ${strengthTextColor}`}>
                        STRENGTH: {strengthLabel}
                      </span>
                      <span className="text-[#45464D] text-[10px]">
                        Min. 12 Characters
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Confirm New Password
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#76777D] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Lock className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="px-3 py-4 text-[#45464D] hover:text-black"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="flex flex-col items-start bg-[#F2F4F6] p-4 gap-3 rounded border border-[#C6C6CD]">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#45464D]" />
                  <span className="text-[#45464D] text-xs font-medium">ENTERPRISE POLICY REQUIREMENTS</span>
                </div>
                <div className="flex flex-col gap-2">
                  <PasswordCheckItem met={passwordChecks.minLength} text="Minimum of 12 characters in length" />
                  <PasswordCheckItem met={passwordChecks.hasUppercase} text="Include at least one uppercase letter (A-Z)" />
                  <PasswordCheckItem met={passwordChecks.hasNumber} text="Include at least one numerical digit (0-9)" />
                  <PasswordCheckItem met={passwordChecks.hasSpecial} text="One special character (e.g., @, #, $, %)" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded font-bold text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
                style={{ boxShadow: '0px 1px 2px #0000000D' }}
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-[#45464D] hover:text-black transition-colors"
              >
                Back to User Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <span className="text-[#45464D] text-[10px]">
            PRECISION ANALYTICS IDENTITY SERVICE • V4.2.0
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[#45464D] text-xs">Privacy Policy</span>
            <span className="text-[#45464D] text-xs">•</span>
            <span className="text-[#45464D] text-xs">Security Protocols</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordCheckItem = ({ met, text }) => (
  <div className="flex items-center gap-3">
    {met ? (
      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
    ) : (
      <X className="w-4 h-4 text-[#BA1A1A] flex-shrink-0" />
    )}
    <span className={`text-sm ${met ? 'text-[#45464D]' : 'text-[#BA1A1A]'}`}>
      {text}
    </span>
  </div>
);

export default NewPassword;
