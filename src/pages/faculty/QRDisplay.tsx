import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getLectureById, Lecture, AttendanceRecord, subscribeToLectureAttendance } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle, Loader2 } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function QRDisplay() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [showSuccess, setShowSuccess] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lectureId) {
      getLectureById(lectureId).then((found) => {
        setLecture(found);
        setLoading(false);
      });
    }
  }, [lectureId]);

  // Countdown timer
  useEffect(() => {
    if (!lecture) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(lecture.end_time).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lecture]);

  // Real-time attendance updates - optimized subscription
  useEffect(() => {
    if (!lectureId) return;

    const unsubscribe = subscribeToLectureAttendance(lectureId, setAttendance);

    return () => {
      unsubscribe();
    };
  }, [lectureId]);

  // Hide success message after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isFaculty) {
    navigate('/faculty-login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white">Lecture not found</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // QR code contains just the qr_code string - this is what students scan
  const qrData = lecture.qr_code;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${classroomBg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Digital Scan</Link>
          <nav className="flex items-center gap-6">
            <Link to="/faculty" className="hover:text-gray-300 transition-colors">Home</Link>
            <button onClick={handleLogout} className="hover:text-gray-300 transition-colors">Logout</button>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl text-white mb-4">
            Scan this QR code to mark attendance
          </h2>

          <div className="bg-white rounded-lg p-8 shadow-2xl relative">
            {/* Success overlay */}
            {showSuccess && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center rounded-lg z-10">
                <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                <p className="text-xl font-semibold text-gray-800">
                  Lecture added and QR code
                </p>
                <p className="text-xl font-semibold text-primary">generated!</p>
              </div>
            )}

            <QRCodeSVG 
              value={qrData}
              size={300}
              level="H"
              includeMargin
            />

            <div className="text-center mt-4">
              <p className="text-lg font-semibold">{lecture.title}</p>
              <p className="text-gray-600">Room: {lecture.room}</p>
              {timeLeft > 0 ? (
                <p className="text-primary font-bold text-xl mt-2">
                  Time Left: {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="text-red-500 font-bold text-xl mt-2">
                  QR Expired
                </p>
              )}
            </div>
          </div>

          {/* Live attendance list */}
          <div className="mt-8 bg-white/90 rounded-lg p-4 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-3">
              Students Marked Present ({attendance.length}) - Live
            </h3>
            {attendance.length > 0 ? (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {attendance.map((record) => (
                  <li key={record.id} className="flex justify-between items-center border-b pb-2">
                    <span>{record.student_name} (Roll: {record.student_roll_no})</span>
                    <span className="text-sm text-gray-500">{record.punch_time}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">No students marked yet</p>
            )}
          </div>

          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => navigate('/faculty')}
            >
              Back to Dashboard
            </Button>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan | All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
