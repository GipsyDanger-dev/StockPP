import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff, ArrowRight, Loader, AlertCircle, CheckCircle, User, Mail, Building, Lock } from 'lucide-react';

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
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-black" />
            <span className="text-black text-2xl font-bold">PRECISION ANALYTICS</span>
          </div>
          <h1 className="text-[#191C1E] text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-[#45464D] text-sm max-w-xs mx-auto">
            Register your organization to start predicting.
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="w-full max-w-md">
          <div className="bg-white py-10 px-10 rounded-xl border border-[#C6C6CD] shadow-sm">
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
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <User className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Alex Chen"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 pr-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Work Email
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Mail className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 pr-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Organization
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Building className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enterprise Labs Inc."
                    value={form.organization}
                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 pr-4 outline-none text-gray-500 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[#45464D] text-xs uppercase tracking-wide mb-2">
                  Password
                </label>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
                  <div className="px-3 py-4">
                    <Lock className="w-4 h-4 text-[#45464D]" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3 py-4 text-[#45464D] hover:text-black"
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
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded font-bold text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
                style={{ boxShadow: '0px 1px 2px #0000000D' }}
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
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-[#45464D] text-sm">Already have an account? </span>
            <Link to="/login" className="text-black text-sm font-bold hover:underline">
              Log in here
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <span className="text-[#76777D] text-xs">Security</span>
            <span className="text-[#C6C6CD]">|</span>
            <span className="text-[#76777D] text-xs">Compliance</span>
            <span className="text-[#C6C6CD]">|</span>
            <span className="text-[#76777D] text-xs">System Status</span>
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

export default SignUp;
