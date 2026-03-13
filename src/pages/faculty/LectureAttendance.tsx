import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceRecord, Lecture, getLectureById, subscribeToLectureAttendance } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, CheckCircle } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function LectureAttendance() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lectureId) return;

    getLectureById(lectureId).then(setLecture);

    const unsubscribe = subscribeToLectureAttendance(lectureId, (data) => {
      setRecords(data);
      setLoading(false);
    });

    return () => { unsubscribe(); };
  }, [lectureId]);

  if (!isFaculty) {
    navigate('/faculty-login');
    return null;
  }

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
        <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <Link to="/" className="text-xl font-bold">Digital Scan</Link>
            <span className="block text-xs text-blue-300 font-medium tracking-wider uppercase">BCA Department</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/faculty" className="hover:text-gray-300 transition-colors">Home</Link>
            <div className="relative group">
              <button className="hover:text-gray-300 transition-colors">Student ▼</button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded shadow-lg py-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link to="/faculty/add-student" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Add Student</Link>
                <Link to="/faculty/students" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">View Students</Link>
              </div>
            </div>
            <div className="relative group">
              <button className="hover:text-gray-300 transition-colors">Lecture ▼</button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded shadow-lg py-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link to="/faculty/start-lecture" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Start Lecture</Link>
                <Link to="/faculty/lectures" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">View Lectures</Link>
              </div>
            </div>
            <button onClick={handleLogout} className="hover:text-gray-300 transition-colors">Logout</button>
          </nav>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {/* Lecture Info Card */}
            {lecture && (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6 border border-white/20">
                <div className="text-center mb-2">
                  <span className="inline-block px-3 py-0.5 bg-blue-600/80 rounded-full text-xs font-medium text-white tracking-wide">
                    BCA Department
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white text-center italic mb-4">
                  {lecture.title} — Attendance
                </h2>
                <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
                  <span>Faculty: <strong className="text-white">{lecture.faculty_name}</strong></span>
                  <span>Room: <strong className="text-white">{lecture.room}</strong></span>
                  <span>Date: <strong className="text-white">{new Date(lecture.start_time).toLocaleDateString()}</strong></span>
                  <span>Time: <strong className="text-white">{new Date(lecture.start_time).toLocaleTimeString()}</strong></span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="bg-green-600/80 backdrop-blur-sm text-white rounded-lg px-6 py-4 flex items-center gap-3">
                <Users className="w-6 h-6" />
                <div>
                  <div className="text-2xl font-bold">{records.length}</div>
                  <div className="text-sm opacity-80">Students Present</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-white text-center">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Roll No</th>
                      <th className="px-4 py-3 text-left">Student Name</th>
                      <th className="px-4 py-3 text-left">Punch Time</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{record.student_roll_no}</td>
                        <td className="px-4 py-3">{record.student_name}</td>
                        <td className="px-4 py-3 text-gray-600">{record.punch_time}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Present
                          </span>
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No students have marked attendance for this lecture yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-center">
              <Button
                variant="secondary"
                onClick={() => navigate('/faculty/lectures')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Lectures
              </Button>
            </div>
          </div>
        </main>

        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan — BCA Department | All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
