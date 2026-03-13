import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lecture, AttendanceRecord, subscribeToLectures, deactivateLecture, getAttendanceRecords } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { StopCircle, ClipboardList, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import classroomBg from '@/assets/classroom-bg.jpg';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ViewLectures() {
  const { isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLectures((data) => {
      setLectures(data);
      setLoading(false);
    });

    // Fetch all attendance records for chart
    getAttendanceRecords().then(setAllRecords);

    return () => { unsubscribe(); };
  }, []);

  if (!isFaculty) {
    navigate('/faculty-login');
    return null;
  }

  const handleEndLecture = async (id: string) => {
    if (confirm('Are you sure you want to end this lecture?')) {
      const success = await deactivateLecture(id);
      if (success) {
        toast.success('Lecture ended!');
      } else {
        toast.error('Failed to end lecture');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const formatTime = (date: string) => new Date(date).toLocaleTimeString();

  // Build chart data: attendance count per lecture
  const chartData = lectures.map((lecture, idx) => {
    const count = allRecords.filter(r => r.lecture_id === lecture.id).length;
    return {
      name: lecture.title.length > 15 ? lecture.title.slice(0, 15) + '…' : lecture.title,
      fullName: lecture.title,
      attendance: count,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    };
  }).reverse(); // oldest first for chart

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
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center italic mb-2">
              Lecture List (Real-time)
            </h2>
            <p className="text-center text-blue-300 font-medium mb-8">BCA Department — Attendance Overview</p>

            {/* Attendance Chart */}
            {!loading && lectures.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Lecture Attendance Comparison
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                    onClick={() => setShowChart(!showChart)}
                  >
                    {showChart ? 'Hide Chart' : 'Show Chart'}
                  </Button>
                </div>
                {showChart && (
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#fff" 
                          fontSize={12} 
                          angle={-35} 
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis stroke="#fff" fontSize={12} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                          formatter={(value: number) => [`${value} students`, 'Attendance']}
                        />
                        <Bar dataKey="attendance" radius={[6, 6, 0, 0]} maxBarSize={50}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-white text-center">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg overflow-hidden shadow-lg overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left">Title</th>
                      <th className="px-4 py-3 text-left">Faculty</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Room</th>
                      <th className="px-4 py-3 text-center">Attended</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lectures.map((lecture) => {
                      const isActive = lecture.is_active && new Date(lecture.end_time) > new Date();
                      const attendanceCount = allRecords.filter(r => r.lecture_id === lecture.id).length;
                      return (
                        <tr key={lecture.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{lecture.title}</td>
                          <td className="px-4 py-3">{lecture.faculty_name}</td>
                          <td className="px-4 py-3">{formatDate(lecture.start_time)}</td>
                          <td className="px-4 py-3">{formatTime(lecture.start_time)}</td>
                          <td className="px-4 py-3">{lecture.room}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold">
                              {attendanceCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isActive ? (
                              <span className="badge-present">Active</span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-400 text-white rounded text-sm">Ended</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/faculty/lecture-attendance/${lecture.id}`)}
                              >
                                <ClipboardList className="w-4 h-4 mr-1" />
                                Attendance
                              </Button>
                              {isActive && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/faculty/qr/${lecture.id}`)}
                                  >
                                    View QR
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleEndLecture(lecture.id)}
                                  >
                                    <StopCircle className="w-4 h-4 mr-1" />
                                    End
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {lectures.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No lectures found. Start a lecture first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => navigate('/faculty')}>
                Back to Dashboard
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
