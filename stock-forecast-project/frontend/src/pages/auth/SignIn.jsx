import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, Eye, EyeOff, ArrowRight, Loader, AlertCircle, Lock, Mail, Shield } from 'lucide-react';

const SignIn = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await signIn(form.email, form.password);

      if (authError) {
        setError(authError.message);
      } else {
        navigate('/');
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
          <h1 className="text-[#191C1E] text-2xl font-bold mb-2">StockAI Predictor</h1>
          <p className="text-[#45464D] text-sm max-w-xs mx-auto">
            Enterprise-grade predictive analytics for financial market dynamics.
          </p>
        </div>

        {/* Login Card */}
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
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex-1 bg-transparent text-sm py-4 pr-4 outline-none text-gray-500 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#45464D] text-xs uppercase tracking-wide">
                    Access Key
                  </label>
                  <Link to="/forgot-password" className="text-[#505F76] text-xs hover:text-indigo-600 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="flex items-center bg-[#F7F9FB] rounded border border-[#C6C6CD] focus-within:border-indigo-500 transition-colors">
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
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-3 bg-[#F2F4F6] rounded border border-[#C6C6CD4D]">
                <Shield className="w-3 h-3 text-[#45464D] mt-0.5 flex-shrink-0" />
                <p className="text-[#45464D] text-[11px] leading-relaxed">
                  Access to this terminal is restricted to authorized personnel. All activity is logged and monitored for compliance.
                </p>
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
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <span className="text-[#45464D] text-sm">Don't have an account? </span>
            <Link to="/signup" className="text-black text-sm font-bold hover:underline">
              Register here
            </Link>
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

export default SignIn;
