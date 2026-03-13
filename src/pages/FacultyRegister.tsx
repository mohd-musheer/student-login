import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { facultyRegisterSchema, getValidationError } from '@/lib/validation';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function FacultyRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = facultyRegisterSchema.safeParse(formData);
    const validationError = getValidationError(validation);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('register-faculty', {
        body: {
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password,
        },
      });

      if (fnError) {
        setError('Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      toast.success('Registration successful! Please login.');
      navigate('/faculty-login');
    } catch {
      setError('Registration failed. Please try again.');
    }

    setIsLoading(false);
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

        {/* Registration Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md">
            <h2 className="text-2xl font-bold text-white text-center italic mb-6">
              New Faculty Registration
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  placeholder="Choose a username (letters, numbers, dots)"
                  maxLength={30}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Create a password (min 6 characters)"
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

              <div>
                <label className="block text-white text-sm mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Confirm your password"
                    maxLength={100}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/20 text-center">
              <p className="text-white/70 text-sm">
                Already have an account?{' '}
                <Link to="/faculty-login" className="text-blue-400 hover:underline">
                  Login here
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
