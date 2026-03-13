import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Faculty } from '@/lib/database';
import { startLectureSchema, getValidationError } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function StartLecture() {
  const { user, isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    room: '',
    duration: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isFaculty || !user) {
    navigate('/faculty-login');
    return null;
  }

  const faculty = user as unknown as Faculty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = startLectureSchema.safeParse(formData);
    const validationError = getValidationError(validation);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    toast.loading('Starting lecture...', { id: 'start-lecture' });

    const now = new Date();
    const endTime = new Date(now.getTime() + formData.duration * 60 * 1000);
    const qrCode = `DIGITALSCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data: lecture, error } = await supabase
      .from('lectures')
      .insert({
        title: formData.title.trim(),
        faculty_id: faculty.id,
        faculty_name: faculty.name,
        room: formData.room.trim(),
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        qr_code: qrCode,
        is_active: true,
      })
      .select()
      .single();

    if (lecture) {
      toast.success('Lecture started successfully!', { id: 'start-lecture' });
      navigate(`/faculty/qr/${lecture.id}`);
    } else {
      toast.error('Failed to start lecture', { id: 'start-lecture' });
    }

    setIsSubmitting(false);
  };

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
          <Link to="/" className="text-xl font-bold">Digital Scan</Link>
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

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg">
            <h2 className="text-2xl font-bold text-white text-center italic mb-6">
              Start New Lecture
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">Lecture Title / Subject</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., DSA, Mathematics"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Lecture Room</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Room 101"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">QR Valid Duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="input-field"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Starting...' : 'Start Lecture'}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/faculty')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>

        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan | All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
