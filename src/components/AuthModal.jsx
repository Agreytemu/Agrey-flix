import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaGoogle, FaEnvelope, FaLock, FaUser, FaSpinner, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { BiMoviePlay } from 'react-icons/bi';
import { supabaseService } from '../utils/supabaseService';
import { validatePassword, getPasswordStrength, checkRateLimit, logSecurityEvent } from '../utils/security';

const getErrorMessage = (err, isLogin = true) => {
  if (!err) {
    return isLogin 
      ? 'An error occurred while logging in. Please try again.'
      : 'An error occurred while signing up. Please try again.';
  }

  // Log to console so that developer can inspect the raw error object
  console.error('[AgreyFlix Auth Error Detail]:', err);

  let msg = '';
  if (typeof err === 'string') {
    msg = err;
  } else if (err instanceof Error) {
    msg = err.message;
  } else if (typeof err === 'object') {
    msg = err.message || err.error_description || err.error || '';
    if (!msg) {
      try {
        const serialized = JSON.stringify(err);
        if (serialized && serialized !== '{}') {
          msg = serialized;
        } else {
          msg = err.toString();
        }
      } catch (e) {
        msg = '';
      }
    }
  }

  // If msg is empty or generic, use a user-friendly default based on the action
  if (!msg || msg === '{}' || msg === '[object Object]') {
    return isLogin
      ? 'A network or system error occurred while logging in. Please verify that your email and password are correct.'
      : 'A network or system error occurred while signing up. Make sure the email is not already in use and the password is at least 6 characters long.';
  }

  const lowerMsg = msg.toLowerCase();

  // English clean error map
  if (lowerMsg.includes('invalid-email') || lowerMsg.includes('email format is invalid') || lowerMsg.includes('invalid_email')) {
    return "The email address is invalid. Please enter a valid email address (e.g. name@gmail.com).";
  }
  if (lowerMsg.includes('user-not-found') || lowerMsg.includes('invalid login credentials') || lowerMsg.includes('invalid_credentials')) {
    return "Incorrect email or password. Please verify your credentials and try again.";
  }
  if (lowerMsg.includes('email-already-in-use') || lowerMsg.includes('user already exists') || lowerMsg.includes('email_exists')) {
    return "This email address is already registered on AgreyFlix! Please go to the 'Log In' tab to access your account.";
  }
  if (lowerMsg.includes('weak-password') || lowerMsg.includes('password should be') || lowerMsg.includes('weak_password') || lowerMsg.includes('at least 6 characters')) {
    return "The password must be at least six (6) characters long.";
  }
  if (lowerMsg.includes('network') || lowerMsg.includes('failed to fetch')) {
    return "A network connection error occurred. Please check your internet connection and try again.";
  }

  return msg;
};

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [pendingGoogleCred, setPendingGoogleCred] = useState(null);

  const [verificationSent, setVerificationSent] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Cloudflare Turnstile
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch (_) {}
      }
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: '0x4AAAAAADXIPkP3kbxBSU8N',
        theme: 'dark',
      });
    };

    // If Turnstile already loaded before this modal opened, render immediately
    if (window._turnstileReady || window.turnstile) {
      setTimeout(renderWidget, 100); // small delay for modal DOM to mount
    } else {
      // Wait for the onload event fired from index.html
      window.addEventListener('turnstile-ready', renderWidget, { once: true });
    }

    return () => {
      window.removeEventListener('turnstile-ready', renderWidget);
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch (_) {}
        turnstileWidgetId.current = null;
      }
    };
  }, [isOpen]);


  // Clear errors when switching tabs
  const handleSwitchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setShowReset(false);
    setResetSent(false);
    setPendingGoogleCred(null);
    setVerificationSent(false);
    setShowResend(false);
    setResendSuccess(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      await supabaseService.sendPasswordResetEmail(resetEmail.trim());
      setResetSent(true);
    } catch (err) {
      setError(getErrorMessage(err, true));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await supabaseService.resendVerificationEmail(email);
      setResendSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, true));
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResend(false);
    setResendSuccess(false);

    const rateLimitAction = isLogin ? 'login_attempt' : 'signup_attempt';
    if (!checkRateLimit(rateLimitAction, 5, 60000)) {
      setError('Too many attempts. Please wait 1 minute before trying again.');
      logSecurityEvent('ALERT', `Rate limit triggered for action: ${rateLimitAction} on email: ${email}`);
      setLoading(false);
      return;
    }

    if (!isLogin) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        setError(passwordCheck.message);
        setLoading(false);
        return;
      }

      // Check if email already exists
      try {
        const emailExists = await supabaseService.checkEmailExists(email);
        if (emailExists) {
          setError('This email address is already registered on AgreyFlix. Please go to the "Log In" tab to access your account.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking email existence:', err);
      }
    }

    try {
      if (isLogin) {
        // Sign in with email/password
        const result = await supabaseService.signIn(email, password);

        if (supabaseService.isConfigured && !result.emailVerified) {
          setError('Your email is not verified yet. Please check your verification email to verify your account, or click below to request another one.');
          setShowResend(true);
          await supabaseService.signOut();
          setLoading(false);
          return; // Stop early
        }
        logSecurityEvent('SUCCESS', `User login success: ${email}`);
      } else {
        // Register new user
        const result = await supabaseService.signUp(email, password, name);

        logSecurityEvent('SUCCESS', `User signup success: ${email}`);
        if (result.sessionRequired) {
          setVerificationSent(true);
          setLoading(false);
          return; // Stop early so we show the success screen
        }
      }
      onClose();
    } catch (err) {
      logSecurityEvent('FAILURE', `Auth error on ${email}: ${err?.message || err}`);
      setError(getErrorMessage(err, isLogin));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('Sorry, we encouraging you to use your email to signup or sign in');
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-[400px] bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                      <BiMoviePlay className="text-red-500 text-xl" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight">
                      Agrey<span className="text-red-500">Flix</span>
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab(true)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab(false)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                      !isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Info Note / Error */}
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-2 mb-6 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <FaExclamationCircle className="text-red-400 text-base shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm font-medium leading-snug">{error}</p>
                      </div>
                      {showResend && (
                        <div className="mt-2 pl-6">
                          {resendSuccess ? (
                            <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                              <FaCheckCircle size={12} /> Verification email sent!
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={resendLoading}
                              onClick={handleResendVerification}
                              className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer transition-colors flex items-center gap-1.5"
                            >
                              {resendLoading && <FaSpinner className="animate-spin" size={10} />}
                              Resend Verification Email
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.p
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-gray-400 text-sm mb-6 text-center"
                    >
                      {isLogin
                        ? 'Welcome back! Sign in to access your Watchlist.'
                        : 'Create an account to save movies and sync progress.'}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Form OR Forgot Password */}
                {showReset ? (
                  <form className="space-y-4" onSubmit={handleForgotPassword}>
                    {resetSent ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-3 py-4 text-center"
                      >
                        <FaCheckCircle className="text-green-400 text-4xl" />
                        <p className="text-green-300 font-semibold text-sm">Reset email sent!</p>
                        <p className="text-gray-500 text-xs">Check your inbox for a password reset link.</p>
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setResetSent(false); setError(''); }}
                          className="mt-2 text-sm text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors"
                        >
                          ← Back to Log In
                        </button>
                      </motion.div>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <FaEnvelope className="text-gray-500 text-sm" />
                          </div>
                          <input
                            type="email"
                            required
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Your email address"
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all active:scale-[0.98]"
                        >
                          {loading && <FaSpinner className="animate-spin" />}
                          Send Reset Link
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowReset(false); setError(''); }}
                          className="w-full text-sm text-gray-500 hover:text-gray-300 font-semibold transition-colors py-1"
                        >
                          ← Back to Log In
                        </button>
                      </>
                    )}
                  </form>
                ) : verificationSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-4 text-center"
                  >
                    <FaCheckCircle className="text-green-400 text-4xl" />
                    <h2 className="text-white font-bold text-lg mt-2">Verify your email</h2>
                    <p className="text-gray-400 text-sm">
                      We've sent a verification link to <strong className="text-white">{email}</strong>. 
                      Please check your inbox and click the link to activate your account.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab(true)}
                      className="mt-4 w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                    >
                      Return to Log In
                    </button>
                  </motion.div>
                ) : (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="relative"
                    >
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <FaUser className="text-gray-500 text-sm" />
                      </div>
                      <input
                        type="text"
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                      />
                    </motion.div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-500 text-sm" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-500 text-sm" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-all font-medium text-sm"
                    />
                  </div>

                  {!isLogin && password && (() => {
                    const str = getPasswordStrength(password);
                    return (
                      <div className="mt-2 text-left bg-black/30 border border-white/5 p-3 rounded-xl">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] uppercase font-black tracking-wider text-gray-500">Strength:</span>
                          <span className={`text-[10px] font-black uppercase ${
                            str.score >= 3 ? 'text-emerald-400' : str.score === 2 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {str.label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 0 ? str.color : 'bg-transparent'}`} />
                          <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 1 ? str.color : 'bg-white/5'}`} />
                          <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 2 ? str.color : 'bg-white/5'}`} />
                          <div className={`h-full flex-1 transition-all duration-300 ${str.score >= 3 ? str.color : 'bg-white/5'}`} />
                        </div>
                        <ul className="mt-2 space-y-0.5 text-[9px] text-gray-400 font-medium">
                          <li className={password.length >= 8 ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                            <span>{password.length >= 8 ? '●' : '○'}</span> At least 8-20 characters
                          </li>
                          <li className={/[A-Z]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                            <span>{/[A-Z]/.test(password) ? '●' : '○'}</span> At least one uppercase letter
                          </li>
                          <li className={/[a-z]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                            <span>{/[a-z]/.test(password) ? '●' : '○'}</span> At least one lowercase letter
                          </li>
                          <li className={/\d/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                            <span>{/\d/.test(password) ? '●' : '○'}</span> At least one number
                          </li>
                          <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400 flex items-center gap-1' : 'text-gray-500 flex items-center gap-1'}>
                            <span>{/[^A-Za-z0-9]/.test(password) ? '●' : '○'}</span> At least one special character
                          </li>
                        </ul>
                      </div>
                    );
                  })()}

                  {isLogin && (
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }}
                        className="text-xs text-gray-500 hover:text-red-400 font-semibold underline underline-offset-2 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <div ref={turnstileRef} className="flex justify-center" />

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 mt-2 flex justify-center items-center gap-2 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-[0.98] ${
                      pendingGoogleCred
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                        : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                    }`}
                  >
                    {loading && <FaSpinner className="animate-spin" />}
                    {pendingGoogleCred
                      ? <><FaGoogle /> Sign In & Link Google</>
                      : (isLogin ? 'Continue' : 'Create Account')
                    }
                  </button>
                </form>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 uppercase font-semibold">Or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <FaGoogle className="text-red-500" />
                  Continue with Google
                </button>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
