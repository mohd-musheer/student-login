import { supabase } from '@/integrations/supabase/client';

// Types matching database schema (password removed, auth_id added)
export interface Faculty {
  id: string;
  name: string;
  username: string;
  auth_id: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  roll_no: string;
  auth_id: string | null;
  created_at: string;
}

export interface Lecture {
  id: string;
  title: string;
  faculty_id: string;
  faculty_name: string;
  start_time: string;
  end_time: string;
  room: string;
  qr_code: string;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_roll_no: string;
  lecture_id: string;
  lecture_title: string;
  lecture_date: string;
  lecture_room: string;
  punch_time: string;
  status: string;
  created_at: string;
}

// Safe logging helper — only logs in development
function logError(message: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error);
  }
}

// Faculty operations
export async function getFacultyByAuthId(authId: string): Promise<Faculty | null> {
  const { data, error } = await supabase
    .from('faculty')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  if (error) {
    logError('Error fetching faculty by auth_id:', error);
    return null;
  }
  return data as Faculty | null;
}

// Student operations
export async function getStudentByAuthId(authId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle();

  if (error) {
    logError('Error fetching student by auth_id:', error);
    return null;
  }
  return data as Student | null;
}

export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('roll_no', { ascending: true });

  if (error) {
    logError('Error fetching students:', error);
    return [];
  }
  return (data || []) as Student[];
}

export async function deleteStudent(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    logError('Error deleting student:', error);
    return false;
  }
  return true;
}

// Lecture operations
export async function getLectures(): Promise<Lecture[]> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logError('Error fetching lectures:', error);
    return [];
  }
  return (data || []) as Lecture[];
}

export async function getActiveLecture(): Promise<Lecture | null> {
  const now = new Date().toISOString();

  // Only fetch active lectures that haven't expired — no UPDATE needed
  // (expired lectures are handled server-side or by faculty)
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('is_active', true)
    .gt('end_time', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logError('Error fetching active lecture:', error);
    return null;
  }
  return data as Lecture | null;
}

export async function addLecture(
  title: string,
  facultyId: string,
  facultyName: string,
  room: string,
  durationMinutes: number
): Promise<Lecture | null> {
  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const qrCode = `DIGITALSCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase
    .from('lectures')
    .insert({
      title,
      faculty_id: facultyId,
      faculty_name: facultyName,
      room,
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      qr_code: qrCode,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    logError('Error adding lecture:', error);
    return null;
  }
  return data as Lecture | null;
}

export async function deactivateLecture(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('lectures')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    logError('Error deactivating lecture:', error);
    return false;
  }
  return true;
}

export async function getLectureById(id: string): Promise<Lecture | null> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logError('Error fetching lecture:', error);
    return null;
  }
  return data as Lecture | null;
}

export async function getLectureByQRCode(qrCode: string): Promise<Lecture | null> {
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('qr_code', qrCode)
    .maybeSingle();

  if (error) {
    logError('Error fetching lecture by QR:', error);
    return null;
  }
  return data as Lecture | null;
}

// Attendance operations
export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logError('Error fetching attendance:', error);
    return [];
  }
  return (data || []) as AttendanceRecord[];
}

export async function getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    logError('Error fetching student attendance:', error);
    return [];
  }
  return (data || []) as AttendanceRecord[];
}

export async function getLectureAttendance(lectureId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('lecture_id', lectureId)
    .order('created_at', { ascending: false });

  if (error) {
    logError('Error fetching lecture attendance:', error);
    return [];
  }
  return (data || []) as AttendanceRecord[];
}

// Real-time subscriptions
export function subscribeToStudents(callback: (students: Student[]) => void) {
  getStudents().then(callback);

  const channel = supabase
    .channel('students-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      async () => {
        const students = await getStudents();
        callback(students);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLectures(callback: (lectures: Lecture[]) => void) {
  getLectures().then(callback);

  const channel = supabase
    .channel('lectures-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lectures' },
      async () => {
        const lectures = await getLectures();
        callback(lectures);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAttendance(callback: (records: AttendanceRecord[]) => void) {
  getAttendanceRecords().then(callback);

  const channel = supabase
    .channel('attendance-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'attendance_records' },
      async () => {
        const records = await getAttendanceRecords();
        callback(records);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToActiveLecture(callback: (lecture: Lecture | null) => void) {
  getActiveLecture().then(callback);

  const channel = supabase
    .channel('active-lecture-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'lectures' },
      async () => {
        const lecture = await getActiveLecture();
        callback(lecture);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLectureAttendance(lectureId: string, callback: (records: AttendanceRecord[]) => void) {
  getLectureAttendance(lectureId).then(callback);

  const channel = supabase
    .channel(`lecture-attendance-${lectureId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_records',
        filter: `lecture_id=eq.${lectureId}`
      },
      async () => {
        const records = await getLectureAttendance(lectureId);
        callback(records);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
