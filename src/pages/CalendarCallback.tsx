import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calendarService } from '@/services/calendarService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const CalendarCallback = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          const errorDescription = urlParams.get('error_description');
          throw new Error(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setMessage('Exchanging authorization code for access token...');
        
        await calendarService.handleOAuthCallback(code, state || undefined);
        
        if (calendarService.isAuthenticated()) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting to calendar...');
          
          sessionStorage.removeItem('oauth_start_time');
          
          setTimeout(() => {
            navigate('/calendar', { replace: true });
          }, 2000);
        } else {
          throw new Error('Authentication verification failed - token invalid or expired');
        }
        
      } catch (err) {
        console.error('OAuth callback error:', err);
        
        setStatus('error');
        setMessage(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        sessionStorage.removeItem('oauth_start_time');
        
        setTimeout(() => {
          navigate('/calendar', { replace: true });
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border shadow-sm p-8">
          <div className="text-center">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h1 className="text-xl font-semibold mb-2">Processing Authentication</h1>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-green-700 mb-2">Authentication Successful!</h1>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-semibold text-red-700 mb-2">Authentication Failed</h1>
                <p className="text-muted-foreground">{message}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarCallback; 