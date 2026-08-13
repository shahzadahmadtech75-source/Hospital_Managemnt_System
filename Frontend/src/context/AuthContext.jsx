import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from '../components/common/Toaster';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hms_user');
    const token = localStorage.getItem('hms_access_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('hms_user');
        localStorage.removeItem('hms_access_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        
        localStorage.setItem('hms_access_token', accessToken);
        localStorage.setItem('hms_user', JSON.stringify(user));
        setUser(user);
        
        // ✅ Success toast
        toast.success(`Welcome back, ${user.fullName || user.username}!`);
         // ✅ Role-based redirect
      let redirectPath = '/login';
      if (user.role === 'patient') redirectPath = '/patient/dashboard';
      else if (user.role === 'doctor') redirectPath = '/doctor/dashboard';
      else if (user.role === 'admin') redirectPath = '/admin/dashboard';
      else if (user.role === 'nurse') redirectPath = '/nurse/dashboard';
      
      return { success: true, redirectPath };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      
      // ✅ Error toast
      toast.error(message);
      
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const formData = new FormData();
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('username', userData.username);
      formData.append('fullName', userData.fullName);
      if (userData.profileImage) {
        formData.append('profileImage', userData.profileImage);
      }

      const response = await axiosInstance.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        const { user, token } = response.data;
        localStorage.setItem('hms_access_token', token);
        localStorage.setItem('hms_user', JSON.stringify(user));
        setUser(user);
        
        // ✅ Success toast
        toast.success('Account created successfully! Welcome to HMS.');
        
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      
      // ✅ Error toast
      toast.error(message);
      
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    // ✅ Show loading toast
    const loadingToast = toast.loading('Logging out...');
    
    try {
      await axiosInstance.post('/auth/logout');
      
      // ✅ Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success('Logged out successfully');
      
    } catch (error) {
      // ✅ Dismiss loading and show error
      toast.dismiss(loadingToast);
      toast.error('Logout failed. Please try again.');
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('hms_access_token');
      localStorage.removeItem('hms_user');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!localStorage.getItem('hms_access_token'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};