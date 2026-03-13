import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { facultyLoginSchema, getValidationError } from '@/lib/validation';
import { Eye, EyeOff } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function FacultyLogin() {
  const navigate = useNavigate();
  const { loginFaculty } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = facultyLoginSchema.safeParse({ username, password });
    const validationError = getValidationError(validation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginFaculty(username.trim(), password);

      if (result.success) {
        navigate('/faculty');
      } else {
        setError(result.error || 'Login failed');
        setIsLoading(false);
      }
    } catch {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
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
          <div>
            <Link to="/" className="text-xl font-bold">Digital Scan</Link>
            <span className="block text-xs text-blue-300 font-medium tracking-wider uppercase">BCA Department</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
            <Link to="/faculty-login" className="hover:text-gray-300 transition-colors">Login</Link>
          </nav>
        </header>

        {/* Login Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md">
            <h2 className="text-2xl font-bold text-white text-center italic mb-6">
              Faculty Login
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter username"
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Enter password"
                    maxLength={100}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/20 text-center">
              <p className="text-white/70 text-sm">
                New Faculty?{' '}
                <Link to="/faculty-register" className="text-blue-400 hover:underline">
                  Register here
                </Link>
              </p>
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
