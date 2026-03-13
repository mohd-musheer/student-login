import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { deleteStudent, Student, subscribeToStudents } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import classroomBg from '@/assets/classroom-bg.jpg';

export default function ViewStudents() {
  const { isFaculty, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });
    return () => { unsubscribe(); };
  }, []);

  if (!isFaculty) {
    navigate('/faculty-login');
    return null;
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      const previousStudents = students;
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Student deleted successfully!');

      const success = await deleteStudent(id);
      if (!success) {
        setStudents(previousStudents);
        toast.error('Failed to delete student');
      }
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    const { error } = await supabase
      .from('students')
      .update({ name: editName.trim() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update student');
    } else {
      toast.success('Student updated!');
      setStudents(prev => prev.map(s => s.id === id ? { ...s, name: editName.trim() } : s));
    }
    setEditingId(null);
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

        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center italic mb-8">
              Student List (Real-time)
            </h2>

            {loading ? (
              <div className="text-white text-center">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Roll No</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {editingId === student.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border rounded px-2 py-1 w-full"
                              autoFocus
                            />
                          ) : (
                            student.name
                          )}
                        </td>
                        <td className="px-4 py-3">{student.roll_no}</td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                          {editingId === student.id ? (
                            <>
                              <button onClick={() => saveEdit(student.id)} className="text-green-600 hover:text-green-800 p-1" title="Save">
                                <Check className="w-5 h-5" />
                              </button>
                              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700 p-1" title="Cancel">
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(student)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 p-1" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          No students found. Add some students first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-center space-x-4">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link to="/faculty/add-student">+ Add Student</Link>
              </Button>
              <Button variant="secondary" onClick={() => navigate('/faculty')}>
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
