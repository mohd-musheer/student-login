import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveLecture, Student, Lecture, subscribeToActiveLecture } from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';
import { qrCodeSchema } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Camera, Loader2 } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';
import QRScanner from '@/components/QRScanner';

// Generate a simple device fingerprint based on browser properties
function getDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const parts = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'unknown',
    (nav as any).deviceMemory || 'unknown',
  ];
  let hash = 0;
  const str = parts.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'DF-' + Math.abs(hash).toString(36);
}

export default function ScanQR() {
  const { user, isStudent, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [loadingLecture, setLoadingLecture] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isStudent) {
      navigate('/student-login');
    }
  }, [isStudent, isLoading, navigate]);

  useEffect(() => {
    getActiveLecture().then((lecture) => {
      setActiveLecture(lecture);
      setLoadingLecture(false);
    });

    const unsubscribe = subscribeToActiveLecture((lecture) => {
      setActiveLecture(lecture);
      setLoadingLecture(false);
    });

    return () => { unsubscribe(); };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const student = user as unknown as Student;

  const handleScanResult = useCallback(async (scannedData: string) => {
    if (!student) return;
    
    setProcessing(true);
    setScannerOpen(false);

    try {
      const qrValidation = qrCodeSchema.safeParse(scannedData);
      if (!qrValidation.success) {
        setResult('error');
        setMessage('Invalid QR code format.');
        setProcessing(false);
        return;
      }

      const deviceFingerprint = getDeviceFingerprint();

      const response = await supabase.functions.invoke('mark-attendance', {
        body: { 
          qrCode: scannedData,
          deviceFingerprint,
        },
      });

      const responseData = response.data;
      const responseError = response.error;

      if (responseError) {
        let errorBody: any = null;
        try {
          if (responseError.context && typeof responseError.context === 'object') {
            const ctx = responseError.context as Response;
            if (ctx.json) {
              errorBody = await ctx.json();
            }
          }
        } catch {
          // ignore parse errors
        }

        if (errorBody?.error) {
          setResult('error');
          setMessage(errorBody.error);
        } else {
          setResult('error');
          setMessage('Failed to process attendance. Please try again.');
        }
      } else if (responseData?.error) {
        setResult('error');
        setMessage(responseData.error);
      } else if (responseData?.success) {
        setResult('success');
        setMessage(`Attendance marked for "${responseData.record?.lecture_title || 'lecture'}"!`);
        toast.success('Attendance marked successfully!');
      } else {
        setResult('error');
        setMessage('Unexpected response. Please try again.');
      }
    } catch {
      setResult('error');
      setMessage('Failed to process QR code. Please try again.');
    }

    setProcessing(false);
  }, [student]);

  const handleScanError = (error: string) => {
    toast.error(error);
  };

  const resetScan = () => {
    setResult(null);
    setMessage('');
  };

  if (isLoading || !isStudent || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${classroomBg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Digital Scan</Link>
          <nav className="flex items-center gap-6">
            <Link to="/student" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/student/scan" className="hover:text-gray-300 transition-colors">Scan QR</Link>
            <button onClick={handleLogout} className="hover:text-gray-300 transition-colors">Logout</button>
          </nav>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="glass-card w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Scan QR Code</h2>
            <p className="text-white/70 text-sm mb-4">
              Welcome, <span className="font-semibold">{student.name}</span> (Roll No: {student.roll_no})
            </p>

            {/* Processing state */}
            {processing && (
              <div className="mb-6">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Processing attendance...</p>
              </div>
            )}

            {/* Success result */}
            {result === 'success' && !processing && (
              <div className="mb-6">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <p className="text-green-400 font-semibold text-lg">{message}</p>
                <Button className="mt-4" variant="secondary" onClick={resetScan}>
                  Scan Another
                </Button>
              </div>
            )}

            {/* Error result */}
            {result === 'error' && !processing && (
              <div className="mb-6">
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 font-semibold">{message}</p>
                <Button className="mt-4" variant="secondary" onClick={resetScan}>
                  Try Again
                </Button>
              </div>
            )}

            {/* Scan button */}
            {!result && !processing && (
              <>
                <div className="bg-gray-800 rounded-lg aspect-square max-w-[250px] mx-auto mb-6 flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-500" />
                    <div className="absolute inset-4 border-2 border-dashed border-gray-500 rounded-lg" />
                  </div>
                </div>

                {loadingLecture ? (
                  <p className="text-white/70 mb-4">Checking for active lectures...</p>
                ) : activeLecture ? (
                  <div className="mb-4">
                    <p className="text-white/70 text-sm mb-2">Active Lecture Detected:</p>
                    <p className="text-white font-semibold text-lg">{activeLecture.title}</p>
                    <p className="text-white/60 text-sm">Room: {activeLecture.room}</p>
                    <p className="text-green-400 text-sm mt-1">✓ Ready to scan</p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-yellow-400 mb-2">No active lecture at the moment.</p>
                    <p className="text-white/50 text-sm">You can still scan when a lecture starts.</p>
                  </div>
                )}

                <Button
                  onClick={() => setScannerOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Open Camera & Scan
                </Button>

                <p className="text-white/50 text-xs mt-4">
                  📱 One device per student per lecture
                </p>
              </>
            )}
          </div>

          <div className="mt-6">
            <Button variant="secondary" onClick={() => navigate('/student')}>
              Back to Dashboard
            </Button>
          </div>
        </main>

        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan | All Rights Reserved
        </footer>
      </div>

      <QRScanner
        isActive={scannerOpen}
        onScan={handleScanResult}
        onError={handleScanError}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}
