import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Play, List, ClipboardList, UserCog } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function FacultyDashboard() {
  const { user, isFaculty, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isLoading && !isFaculty) {
      navigate('/faculty-login');
    }
  }, [isFaculty, isLoading, navigate]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLocation({ lat: 28.495053, lng: 77.207962 });
        }
      );
    }
  }, []);

  if (isLoading || !isFaculty) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
            {/* Department Badge */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1 bg-blue-600/80 rounded-full text-sm font-medium text-white tracking-wide">
                BCA Department — Faculty Panel
              </span>
            </div>

            {/* Location Bar */}
            <div className="location-bar mb-8">
              <h3 className="font-semibold">Faculty Location</h3>
              <p className="text-sm">
                Latitude: {location?.lat.toFixed(6) || 'Loading...'} | 
                Longitude: {location?.lng.toFixed(6) || 'Loading...'}
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="action-card">
                <UserPlus className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Add Student</h3>
                <p className="text-sm text-gray-300 mb-4">Add a new student to the system.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/faculty/add-student">Add</Link>
                </Button>
              </div>

              <div className="action-card">
                <Users className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">View Students</h3>
                <p className="text-sm text-gray-300 mb-4">View and manage student details.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/faculty/students">View</Link>
                </Button>
              </div>

              <div className="action-card">
                <Play className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Start Lecture</h3>
                <p className="text-sm text-gray-300 mb-4">Schedule a new lecture.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/faculty/start-lecture">Start</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="action-card">
                <List className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">View Lectures</h3>
                <p className="text-sm text-gray-300 mb-4">View lectures & attendance chart.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/faculty/lectures">View</Link>
                </Button>
              </div>

              <div className="action-card">
                <ClipboardList className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">View Attendance</h3>
                <p className="text-sm text-gray-300 mb-4">View student attendance records.</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/faculty/attendance">View</Link>
                </Button>
              </div>

              <div className="action-card">
                <UserCog className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Register Faculty</h3>
                <p className="text-sm text-gray-300 mb-4">Register a new faculty member.</p>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link to="/faculty-register">Register</Link>
                </Button>
              </div>
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
