import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff, ArrowRight, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await signUp(form.email, form.password, {
        full_name: form.fullName,
        organization: form.organization,
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('Account created! Please check your email to verify.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center py-4 px-12 gap-2">
        <Activity className="w-6 h-6 text-black" />
        <span className="text-black text-2xl font-bold">Precision Analytics</span>
        <span className="text-[#C6C6CD] text-xs ml-2">STOCKAI PREDICTOR</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center px-12 py-12">
        {/* Left Side - Hero */}
        <div className="flex-1 flex flex-col gap-8 mr-12">
          <div>
            <h1 className="text-5xl font-bold text-black leading-tight mb-4">
              Precision Analytics for<br />Financial Markets.
            </h1>
            <p className="text-[#45464D] text-lg max-w-lg">
              Access high-fidelity LSTM predictive modeling and real-time
              market activity monitoring designed for data-driven decision making.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-4">
            <div>
              <p className="text-[#76777D] text-xs uppercase tracking-wide">Reliability</p>
              <p className="text-black text-2xl font-bold">99.9% Uptime</p>
            </div>
            <div>
              <p className="text-[#76777D] text-xs uppercase tracking-wide">Latency</p>
              <p className="text-black text-2xl font-bold">&lt;15ms Response</p>
            </div>
          </div>

          {/* Decorative Gradient */}
          <div className="mt-8 w-full max-w-lg h-64 rounded-xl bg-gradient-to-b from-[#F7F9FB] to-transparent border border-[#C6C6CD] flex items-center justify-center">
            <Activity size={80} className="text-[#C6C6CD]" />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-[480px]">
          <div className="bg-white p-12 rounded-xl border border-[#C6C6CD] shadow-sm">
            <h2 className="text-3xl font-bold text-black mb-2">Create Account</h2>
            <p className="text-[#45464D] text-sm mb-8">
              Register your organization to start predicting.
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 mb-6 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-green-600 text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Chen"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-[#F7F9FB] text-sm py-3.5 px-4 rounded-lg border border-[#C6C6CD] outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="name@organization.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-[#F7F9FB] text-sm py-3.5 px-4 rounded-lg border border-[#C6C6CD] outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  placeholder="Enterprise Labs Inc."
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full bg-[#F7F9FB] text-sm py-3.5 px-4 rounded-lg border border-[#C6C6CD] outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-[#F7F9FB] text-sm py-3.5 px-4 pr-12 rounded-lg border border-[#C6C6CD] outline-none focus:border-indigo-500 transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#45464D] hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-[#C6C6CD]"
                />
                <span className="text-[#45464D] text-sm">
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-lg font-bold text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Register Terminal
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <span className="text-[#45464D] text-sm">Already have an account? </span>
              <Link to="/login" className="text-black text-sm font-bold hover:underline">
                Log in here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center py-8 px-12">
        <div className="flex gap-6">
          <span className="text-[#76777D] text-xs">Security</span>
          <span className="text-[#76777D] text-xs">Compliance</span>
          <span className="text-[#76777D] text-xs">System Status</span>
        </div>
        <span className="text-[#76777D] text-xs">© 2026 PRECISION ANALYTICS</span>
      </div>
    </div>
  );
};

export default SignUp;
