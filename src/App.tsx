import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Eagerly load the home page for fast first paint
import Home from "./pages/Home";

// Lazy load all other pages for faster initial bundle
const FacultyLogin = lazy(() => import("./pages/FacultyLogin"));
const FacultyRegister = lazy(() => import("./pages/FacultyRegister"));
const StudentLogin = lazy(() => import("./pages/StudentLogin"));
const FacultyDashboard = lazy(() => import("./pages/faculty/FacultyDashboard"));
const AddStudent = lazy(() => import("./pages/faculty/AddStudent"));
const ViewStudents = lazy(() => import("./pages/faculty/ViewStudents"));
const StartLecture = lazy(() => import("./pages/faculty/StartLecture"));
const ViewLectures = lazy(() => import("./pages/faculty/ViewLectures"));
const ViewAttendance = lazy(() => import("./pages/faculty/ViewAttendance"));
const QRDisplay = lazy(() => import("./pages/faculty/QRDisplay"));
const LectureAttendance = lazy(() => import("./pages/faculty/LectureAttendance"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const ScanQR = lazy(() => import("./pages/student/ScanQR"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/faculty-login" element={<FacultyLogin />} />
              <Route path="/faculty-register" element={<FacultyRegister />} />
              <Route path="/student-login" element={<StudentLogin />} />

              {/* Faculty Routes */}
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/add-student" element={<AddStudent />} />
              <Route path="/faculty/students" element={<ViewStudents />} />
              <Route path="/faculty/start-lecture" element={<StartLecture />} />
              <Route path="/faculty/lectures" element={<ViewLectures />} />
              <Route path="/faculty/attendance" element={<ViewAttendance />} />
              <Route path="/faculty/qr/:lectureId" element={<QRDisplay />} />
              <Route path="/faculty/lecture-attendance/:lectureId" element={<LectureAttendance />} />

              {/* Student Routes */}
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/scan" element={<ScanQR />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
