// Simplified Digital Attendance System - Faculty & Student only
// This file is kept for type compatibility but auth is now handled by Supabase Auth

export type UserRole = 'faculty' | 'student';

export interface Faculty {
  id: string;
  name: string;
  username: string;
  role: 'faculty';
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  role: 'student';
}

export interface Lecture {
  id: string;
  title: string;
  facultyId: string;
  facultyName: string;
  startTime: Date;
  endTime: Date;
  room: string;
  qrCode: string;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  lectureId: string;
  lectureTitle: string;
  lectureDate: string;
  lectureRoom: string;
  punchTime: string;
  status: 'present' | 'absent';
}

// Authentication is now handled by Supabase Auth.
// These functions are no longer used.
export const demoFaculty: Faculty[] = [];
export const demoStudents: Student[] = [];
