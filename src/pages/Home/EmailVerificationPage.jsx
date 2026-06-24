import React, { useEffect, useState, Component } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabaseService } from '../../utils/supabaseService';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

// Security & Resilience: Mfumo madhubuti kuzuia white-screen iwapo page itaclash ghafla
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="bg-[#0d1117] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center">
            <FaExclamationCircle className="text-red-500 text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">System Error</h2>
            <p className="text-gray-400 text-sm">Failed to load the verification interface. Please try reloading or contact support.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function EmailVerificationContent() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const handleVerification = async () => {
      // Check for Supabase error parameters first
      const queryParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
      
      const errorMsg = queryParams.get('error_description') || hashParams.get('error_description');
      
      if (errorMsg) {
        setStatus('error');
        setMessage(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
        return;
      }

      // If we are in real Supabase flow, Supabase auth redirects and automatically
      // handles session creation on landing. Let's see if we have a current session user.
      const currentUser = supabaseService.getCurrentUser();
      
      if (supabaseService.isConfigured) {
        // Give a tiny moment for Supabase's SDK listener to register and set the session
        setTimeout(() => {
          const userNow = supabaseService.getCurrentUser();
          if (userNow && userNow.emailVerified) {
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now log in and explore WeFlix.');
          } else if (hashParams.get('access_token') || queryParams.get('access_token')) {
            setStatus('success');
            setMessage('Your email has been successfully verified! Welcome aboard!');
          } else {
            // Default check
            setStatus('success');
            setMessage('Your email verification check is complete. If you received no errors, you may log in.');
          }
        }, 800);
      } else {
        // In Mock Flow, we can simulate immediate success
        setTimeout(() => {
          setStatus('success');
          setMessage('Your email has been successfully verified! Welcome to WeFlix!');
        }, 1000);
      }
    };

    handleVerification();
  }, [location, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="bg-[#0d1117] p-8 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-red-500 text-4xl" />
            <h2 className="text-xl font-bold text-white">Verifying...</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <FaCheckCircle className="text-green-500 text-5xl" />
            <h2 className="text-xl font-bold text-white">Email Verified</h2>
            <p className="text-gray-400">{message}</p>
            <button 
              onClick={() => {
                navigate('/home');
                setTimeout(() => window.dispatchEvent(new Event('openAuthModal')), 100);
              }}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
            >
              Go to Log In
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <FaExclamationCircle className="text-red-500 text-5xl" />
            <h2 className="text-xl font-bold text-white">Verification Failed</h2>
            <p className="text-gray-400">{message}</p>
            <button 
              onClick={() => navigate('/home')}
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Back to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <ErrorBoundary>
      <EmailVerificationContent />
    </ErrorBoundary>
  );
}
