import { Link } from 'react-router-dom';
import classroomBg from '@/assets/classroom-bg.jpg';

// Preload background image for instant display
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = classroomBg;
document.head.appendChild(preloadLink);

export default function Home() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${classroomBg})` }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Digital Scan</h1>
            <span className="text-xs text-blue-300 font-medium tracking-wider uppercase">BCA Department</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <div className="relative group">
              <button className="hover:text-gray-300 transition-colors flex items-center gap-1">
                Login <span className="text-xs">▼</span>
              </button>
              <div className="absolute right-0 top-full mt-2 bg-white rounded shadow-lg py-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link to="/faculty-login" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Faculty Login</Link>
                <Link to="/student-login" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Student Login</Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <div className="inline-block px-4 py-1 bg-blue-600/80 rounded-full text-sm font-medium mb-4 tracking-wide">
              BCA Department
            </div>
            <h2 className="text-4xl font-bold mb-4">Digital Attendance System</h2>
            <p className="text-xl mb-8 text-gray-200">Smart, Secure & QR-Based Attendance</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/faculty-login"
                className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Faculty Login
              </Link>
              <Link
                to="/faculty-register"
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                New Faculty Registration
              </Link>
              <Link
                to="/student-login"
                className="px-8 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Student Login
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan — BCA Department | All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
