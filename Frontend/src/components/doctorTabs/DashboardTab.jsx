import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    totalPrescriptions: 0,
    totalAdmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch appointments to calculate stats
      const appointmentsRes = await axiosInstance.get('/doctor/appointments');
      
      if (appointmentsRes.data.success) {
        const appointments = appointmentsRes.data.data || [];
        
        // Calculate stats
        const pending = appointments.filter(a => a.status === 'pending').length;
        const approved = appointments.filter(a => a.status === 'approved').length;
        const completed = appointments.filter(a => a.status === 'completed').length;
        
        setStats(prev => ({
          ...prev,
          totalAppointments: appointments.length,
          pendingAppointments: pending,
          approvedAppointments: approved,
          completedAppointments: completed,
        }));

        // Get recent appointments (last 5)
        const sorted = [...appointments].sort((a, b) => 
          new Date(b.appointmentDate) - new Date(a.appointmentDate)
        );
        setRecentAppointments(sorted.slice(0, 5));
      }

      // Fetch patients
      try {
        const patientsRes = await axiosInstance.get('/doctor/patients');
        if (patientsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPatients: patientsRes.data.count || 0
          }));
        }
      } catch (error) {
        // Patient fetch might fail if no patients yet - ignore
      }

      // Fetch prescriptions
      try {
        const prescriptionsRes = await axiosInstance.get('/doctor/prescriptions');
        if (prescriptionsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPrescriptions: prescriptionsRes.data.count || 0
          }));
        }
      } catch (error) {
        // Prescription fetch might fail - ignore
      }

      // Fetch admissions
      try {
        const admissionsRes = await axiosInstance.get('/doctor/admissions');
        if (admissionsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalAdmissions: admissionsRes.data.count || 0
          }));
        }
      } catch (error) {
        // Admission fetch might fail - ignore
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
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: CalendarIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Pending',
      value: stats.pendingAppointments,
      icon: ClockIcon,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
    {
      title: 'Approved',
      value: stats.approvedAppointments,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Completed',
      value: stats.completedAppointments,
      icon: CheckCircleIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: UserGroupIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Prescriptions',
      value: stats.totalPrescriptions,
      icon: DocumentTextIcon,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    },
    {
      title: 'Admissions',
      value: stats.totalAdmissions,
      icon: BuildingOfficeIcon,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
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
        <h2 className="text-xl font-semibold text-gray-800">Welcome, Doctor!</h2>
        <p className="text-sm text-gray-600 mt-1">
          Here's an overview of your practice statistics and recent activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
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

      {/* Recent Appointments */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Appointments</h3>
        {recentAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No recent appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {appointment.patient?.fullName || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}
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
    </div>
  );
};

export default DashboardTab;