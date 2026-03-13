import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getStudentAttendance, Student, AttendanceRecord, subscribeToLectures, subscribeToAttendance } from '@/lib/database';
import { QrCode, ClipboardList } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function StudentDashboard() {
  const { user, isStudent, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [totalLectures, setTotalLectures] = useState(0);

  useEffect(() => {
    if (!isLoading && !isStudent) {
      navigate('/student-login');
    }
  }, [isStudent, isLoading, navigate]);

  useEffect(() => {
    if (user && isStudent) {
      const student = user as unknown as Student;
      
      // subscribeToLectures already fetches initial data
      const unsubLectures = subscribeToLectures((lectures) => {
        setTotalLectures(lectures.length);
      });

      // Fetch student-specific attendance initially, then listen for changes
      getStudentAttendance(student.id).then(setAttendance);
      
      const unsubAttendance = subscribeToAttendance(() => {
        getStudentAttendance(student.id).then(setAttendance);
      });

      return () => {
        unsubLectures();
        unsubAttendance();
      };
    }
  }, [user, isStudent]);

  if (isLoading || !isStudent || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const student = user as unknown as Student;
  const attendancePercent = totalLectures > 0 
    ? Math.round((attendance.length / totalLectures) * 100) 
    : 100;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <Link to="/student" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/student/scan" className="hover:text-gray-300 transition-colors">Scan QR</Link>
            <button onClick={handleLogout} className="hover:text-gray-300 transition-colors">Logout</button>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome */}
            <div className="glass-card mb-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome, {student.name}!
              </h2>
              <p className="text-white/70">Roll Number: {student.roll_no}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="action-card">
                <h3 className="font-semibold text-lg">Total Lectures</h3>
                <p className="text-3xl font-bold text-blue-400">{totalLectures}</p>
              </div>
              <div className="action-card">
                <h3 className="font-semibold text-lg">Attended</h3>
                <p className="text-3xl font-bold text-green-400">{attendance.length}</p>
              </div>
              <div className="action-card">
                <h3 className="font-semibold text-lg">Attendance %</h3>
                <p className={`text-3xl font-bold ${attendancePercent >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                  {attendancePercent}%
                </p>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="action-card">
                <QrCode className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Scan QR Code</h3>
                <p className="text-sm text-gray-300 mb-4">Scan to mark your attendance.</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/student/scan">Scan</Link>
                </Button>
              </div>

              <div className="action-card">
                <ClipboardList className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">My Attendance</h3>
                <p className="text-sm text-gray-300 mb-4">View your attendance history.</p>
                <div className="text-sm text-white/70">
                  {attendance.length} of {totalLectures} lectures attended
                </div>
              </div>
            </div>

            {/* Attendance Warning */}
            {attendancePercent < 75 && (
              <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
                <p className="text-red-200 font-semibold">
                  ⚠️ Warning: Your attendance is below 75%. Please attend more lectures.
                </p>
              </div>
            )}
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
