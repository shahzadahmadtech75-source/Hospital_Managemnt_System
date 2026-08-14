import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectRoute'
import { Toaster } from './components/common/Toaster';

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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Add Toaster here */}
        <Toaster />
        
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
          {/* Protected Routes - Patient */}
<Route element={<ProtectedRoute allowedRoles={['patient']} />}>
  <Route path="/patient/dashboard" element={<PatientDashboard />} />
</Route>

{/* Protected Routes - Doctor */}
<Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
  <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
</Route>        
<Route element={<ProtectedRoute allowedRoles={['nurse']} />}>
  <Route path="/nurse/dashboard" element={<NurseDashboard/>} />
</Route>        
<Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
  <Route path="/receptionist/dashboard" element={<ReceptionistDashboard/>} />
</Route>        
<Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
  <Route path="/accountant/dashboard" element={<AccountantDashboard/>} />
</Route>        
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin/dashboard" element={<AdminDashboard/>} />
</Route>        
          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;