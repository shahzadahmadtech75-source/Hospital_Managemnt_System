import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      try {
        const appointmentsRes = await axiosInstance.get('/receptionist/appointments', {
          params: { limit: 100 }
        });
        if (appointmentsRes.data.success) {
          const appointments = appointmentsRes.data.data || [];
          
          // Calculate stats
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayApps = appointments.filter(a => {
            const appDate = new Date(a.appointmentDate);
            appDate.setHours(0, 0, 0, 0);
            return appDate.getTime() === today.getTime();
          });
          
          const pending = appointments.filter(a => a.status === 'pending').length;
          const approved = appointments.filter(a => a.status === 'approved').length;
          const completed = appointments.filter(a => a.status === 'completed').length;
          const cancelled = appointments.filter(a => a.status === 'cancelled').length;
          
          setStats(prev => ({
            ...prev,
            totalAppointments: appointments.length,
            todayAppointments: todayApps.length,
            pendingAppointments: pending,
            approvedAppointments: approved,
            completedAppointments: completed,
            cancelledAppointments: cancelled,
          }));
          
          setTodayAppointments(todayApps.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      }

      // Fetch patients
      try {
        const patientsRes = await axiosInstance.get('/receptionist/patients/search', {
          params: { query: '' }
        });
        if (patientsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPatients: patientsRes.data.count || 0
          }));
          setRecentPatients(patientsRes.data.data?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: UserGroupIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: CalendarIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: ClockIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingAppointments,
      icon: ClockIcon,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
    {
      title: 'Approved',
      value: stats.approvedAppointments,
      icon: CheckCircleIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Completed',
      value: stats.completedAppointments,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Welcome, Receptionist!</h2>
        <p className="text-sm text-gray-600 mt-1">
          Here's an overview of today's activities and statistics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white border ${stat.color} rounded-lg p-4 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Appointments */}
      <div className="mb-8">
        <h3 className="text-md font-semibold text-gray-800 mb-4">Today's Appointments</h3>
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.patient?.fullName || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Dr. {appointment.doctor?.fullName || 'Unknown'} • {formatTime(appointment.appointmentTime)}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(appointment.status)}`}>
                  {appointment.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Patients */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Patients</h3>
        {recentPatients.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No recent patients</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <div
                key={patient._id || patient.userId}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {patient.fullName || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.phone || 'No phone'} • {patient.email || 'No email'}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  patient.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                }`}>
                  {patient.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;