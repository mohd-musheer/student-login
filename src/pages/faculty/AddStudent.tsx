import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { addStudentSchema, getValidationError } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function AddStudent() {
  const { isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isFaculty) {
    navigate('/faculty-login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = addStudentSchema.safeParse({ name: formData.name, rollNo: formData.rollNo });
    const validationError = getValidationError(validation);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);
    toast.loading('Adding student...', { id: 'add-student' });

    try {
      const { data, error } = await supabase.functions.invoke('add-student', {
        body: { name: formData.name.trim(), rollNo: formData.rollNo.trim() },
      });

      if (error) {
        toast.error('Failed to add student. Please try again.', { id: 'add-student' });
      } else if (data?.error) {
        toast.error(data.error, { id: 'add-student' });
      } else {
        toast.success('Student added successfully!', { id: 'add-student' });
        setFormData({ name: '', rollNo: '' });
      }
    } catch {
      toast.error('Failed to add student.', { id: 'add-student' });
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
        {/* Header */}
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

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg">
            <h2 className="text-2xl font-bold text-white text-center italic mb-6">
              Add New Student
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm mb-2">Student Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter student name"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">Roll Number</label>
                <input
                  type="text"
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="input-field"
                  placeholder="Enter roll number (digits only, e.g., 01)"
                  maxLength={10}
                  required
                />
              </div>

              <p className="text-white/50 text-xs">
                Default student password will be: Student@{formData.rollNo || '{RollNo}'}
              </p>

              <Button
                type="submit"
                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Student'}
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

        {/* Footer */}
        <footer className="bg-gray-800 text-white text-center py-4">
          © 2026 Digital Scan | All Rights Reserved
        </footer>
      </div>
    </div>
  );
}
