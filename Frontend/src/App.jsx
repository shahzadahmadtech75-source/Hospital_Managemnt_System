import React from 'react';
import { BrowserRouter,Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectRoute'
import { Toaster } from './components/common/Toaster';
import ScrollToTop from './components/common/ScrollToTop';
import { SocketProvider } from './context/SocketContext';
import { useEffect } from 'react';
import {useNavigate } from 'react-router-dom';
import { eventBus } from './utils/eventBus';
import { toast } from './components/common/Toaster';

// Public Pages
import LandingPage from './pages/public/LandingPage'
import AboutPage from './pages/public/AboutPage'
import DepartmentsPage from './pages/public/DepartmetsPage'
import DoctorsPage from './pages/public/DoctorsPage'
import ContactPage from './pages/public/ContactPage';


// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage'
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Placeholder for protected routes
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import AccountantDashboard from './pages/accountant/AccountantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
// Create a wrapper component to use useNavigate inside App
const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Listen for new message events from SocketContext
    const unsubscribe = eventBus.on('newMessage', (data) => {
      console.log('📨 App received new message event:', data);

      // Get current user from localStorage to determine dashboard path
      const storedUser = localStorage.getItem('hms_user');
      let dashboardPath = '/dashboard';

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const role = user.role;

          switch (role) {
            case 'admin':
              dashboardPath = '/admin/dashboard';
              break;
            case 'doctor':
              dashboardPath = '/doctor/dashboard';
              break;
            case 'patient':
              dashboardPath = '/patient/dashboard';
              break;
            case 'nurse':
              dashboardPath = '/nurse/dashboard';
              break;
            case 'receptionist':
              dashboardPath = '/receptionist/dashboard';
              break;
            case 'accountant':
              dashboardPath = '/accountant/dashboard';
              break;
            default:
              dashboardPath = '/dashboard';
          }
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      }

      // ✅ Show toast notification
      toast.success(
        <div>
          <p className="font-medium">New message from {data.senderName}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {data.content}
          </p>
        </div>,
        {
          duration: 4000,
          onClick: () => {
            // ✅ Navigate to the correct dashboard + messages tab
            navigate(`${dashboardPath}?tab=messages`);
          },
        }
      );
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/departments" element={<DepartmentsPage />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['nurse']} />}>
        <Route path="/nurse/dashboard" element={<NurseDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
        <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
        <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster />
          <ScrollToTop />
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
