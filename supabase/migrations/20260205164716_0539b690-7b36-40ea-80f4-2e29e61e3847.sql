-- Create faculty table
CREATE TABLE public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    roll_no TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lectures table
CREATE TABLE public.lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE NOT NULL,
    faculty_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    room TEXT NOT NULL DEFAULT 'Classroom',
    qr_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance records table
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    student_name TEXT NOT NULL,
    student_roll_no TEXT NOT NULL,
    lecture_id UUID REFERENCES public.lectures(id) ON DELETE CASCADE NOT NULL,
    lecture_title TEXT NOT NULL,
    lecture_date TEXT NOT NULL,
    lecture_room TEXT NOT NULL,
    punch_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(student_id, lecture_id)
);

-- Enable RLS on all tables
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (since this is a demo app without auth)
CREATE POLICY "Public read faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Public insert faculty" ON public.faculty FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update faculty" ON public.faculty FOR UPDATE USING (true);

CREATE POLICY "Public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Public read lectures" ON public.lectures FOR SELECT USING (true);
CREATE POLICY "Public insert lectures" ON public.lectures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update lectures" ON public.lectures FOR UPDATE USING (true);

CREATE POLICY "Public read attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Public insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.faculty;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;

-- Insert demo faculty
INSERT INTO public.faculty (name, username, password) VALUES
    ('Rajpathak', 'Rajpathak', 'Raj@123'),
    ('Ombhagvat', 'Ombhagvat', 'Om@123'),
    ('Shantikapoor', 'Shantikapoor', 'Shant@123');

-- Insert demo students
INSERT INTO public.students (name, roll_no) VALUES
    ('Ram', '01'),
    ('Priya', '02'),
    ('Rajesh', '03'),
    ('Ansh', '04'),
    ('Bhoomi', '05'),
    ('Aryan', '06'),
    ('Darshan', '07'),
    ('Radhe', '08'),
    ('Shyam', '09'),
    ('Laxman', '10');