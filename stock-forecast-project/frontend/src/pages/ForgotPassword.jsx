import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Loader, AlertCircle, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const ForgotPassword = () => {
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

      if (!response.ok) {
        setError(data.detail || 'Failed to send OTP. Please try again.');
      } else {
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('deliveryMethod', 'email');
        navigate('/verify-code');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-[#191C1E] text-2xl font-bold mb-2">Reset Access Key</h1>
          <p className="text-[#45464D] text-sm max-w-xs mx-auto">
            Enter your corporate email to receive a verification code.
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
              {/* Email */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Corporate Email
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Mail className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@precision-analytics.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm py-4 pr-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
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
                    Send Reset Link
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-[#45464D] hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[#76777D] text-xs">System Health</span>
            <span className="text-[#C6C6CD]">|</span>
            <span className="text-[#76777D] text-xs">Legal Portal</span>
          </div>
          <div className="w-12 h-0.5 bg-[#C6C6CD80]" />
          <span className="text-[#76777D] text-[10px]">
            © 2026 PRECISION ANALYTICS SYSTEMS. ALL RIGHTS RESERVED.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
