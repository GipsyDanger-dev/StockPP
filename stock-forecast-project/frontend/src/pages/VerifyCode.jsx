import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Loader, Mail, MessageCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const VerifyCode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get stored data from sessionStorage
    const storedEmail = sessionStorage.getItem('resetEmail');
    const storedMethod = sessionStorage.getItem('deliveryMethod');
    const storedPhone = sessionStorage.getItem('phoneNumber');

    if (storedEmail) setEmail(storedEmail);
    if (storedMethod) setDeliveryMethod(storedMethod);
    if (storedPhone) setPhoneNumber(storedPhone);
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) newCode[index + i] = digit;
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Invalid or expired code.');
      } else {
        // Store verified status for the new password page
        sessionStorage.setItem('otpVerified', 'true');
        navigate('/new-password');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please go back and enter your email.');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setError('');

    try {
      const payload = {
        email,
        delivery_method: deliveryMethod,
      };

      if (deliveryMethod === 'whatsapp' && phoneNumber) {
        payload.phone_number = phoneNumber;
      }

      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Failed to resend code.');
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setResending(false);
    }
  };

  // Mask email for display
  const maskedEmail = email ? `${email[0]}${'*'.repeat(Math.min(email.indexOf('@') - 2, 6))}${email.slice(email.indexOf('@'))}` : '';
  // Mask phone for display
  const maskedPhone = phoneNumber ? `${phoneNumber.slice(0, 4)}****${phoneNumber.slice(-3)}` : '';

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
          <span className="text-[#505F76] text-xs">ENTERPRISE TERMINAL</span>
        </div>

        {/* Verify Card */}
        <div className="w-full max-w-md">
          <div className="bg-white py-11 px-10 rounded-xl border border-[#C6C6CD] shadow-sm">
            {/* Delivery Icon & Message */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#F7F9FB] rounded-full flex items-center justify-center mx-auto mb-4">
                {deliveryMethod === 'whatsapp' ? (
                  <MessageCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <Mail className="w-8 h-8 text-[#45464D]" />
                )}
              </div>
              <h2 className="text-black text-2xl font-bold mb-2">Check Your {deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'Email'}</h2>
              <p className="text-[#45464D] text-sm">
                We have sent a verification code to
                {deliveryMethod === 'whatsapp' && phoneNumber ? (
                  <span className="font-medium text-black"> {maskedPhone}</span>
                ) : email ? (
                  <span className="font-medium text-black"> {maskedEmail}</span>
                ) : (
                  ' your account'
                )}.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            {/* Verification Code Input */}
            <div className="text-center mb-8">
              <span className="text-[#45464D] text-xs uppercase tracking-wide">ENTER VERIFICATION CODE</span>

              <div className="flex items-center justify-center gap-2 mt-4 mb-6">
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
                    className="w-12 h-12 text-center text-lg font-bold bg-[#F7F9FB] rounded border border-[#C6C6CD] outline-none focus:border-indigo-500 transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || code.join('').length !== 6}
                className="flex items-center justify-center gap-2 bg-black text-white py-3 px-16 rounded font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 mx-auto"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify Identity'
                )}
              </button>
            </div>

            {/* Resend & Back Links */}
            <div className="text-center space-y-3">
              <p className="text-[#45464D] text-sm">
                Didn't receive the {deliveryMethod === 'whatsapp' ? 'message' : 'email'}?
              </p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-black text-xs font-bold hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : resendSuccess ? 'Code Sent!' : 'RESEND CODE'}
              </button>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[#45464D] text-xs hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-col items-center gap-2">
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
    </div>
  );
};

export default VerifyCode;
