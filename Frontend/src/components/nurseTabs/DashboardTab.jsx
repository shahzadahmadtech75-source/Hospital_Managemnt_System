import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  HomeIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalAdmissions: 0,
    activeAdmissions: 0,
    totalReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAdmissions, setRecentAdmissions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch patients
      try {
        const patientsRes = await axiosInstance.get('/nurse/patients');
        if (patientsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPatients: patientsRes.data.count || 0
          }));
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }

      // Fetch beds
      try {
        const bedsRes = await axiosInstance.get('/nurse/beds');
        if (bedsRes.data.success) {
          const beds = bedsRes.data.data || [];
          const available = beds.filter(b => b.status === 'available').length;
          const occupied = beds.filter(b => b.status === 'occupied').length;
          setStats(prev => ({
            ...prev,
            totalBeds: beds.length,
            availableBeds: available,
            occupiedBeds: occupied,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch beds:', error);
      }

      // Fetch admissions
      try {
        const admissionsRes = await axiosInstance.get('/nurse/admissions');
        if (admissionsRes.data.success) {
          const admissions = admissionsRes.data.data || [];
          const active = admissions.filter(a => a.status === 'admitted').length;
          setStats(prev => ({
            ...prev,
            totalAdmissions: admissions.length,
            activeAdmissions: active,
          }));
          // Get recent admissions (last 5)
          const sorted = [...admissions].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentAdmissions(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch admissions:', error);
      }

      // Fetch reports
      try {
        const reportsRes = await axiosInstance.get('/nurse/reports');
        if (reportsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalReports: reportsRes.data.count || 0
          }));
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
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
      admitted: 'bg-blue-100 text-blue-800 border-blue-200',
      discharged: 'bg-green-100 text-green-800 border-green-200',
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
      title: 'Total Beds',
      value: stats.totalBeds,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Available Beds',
      value: stats.availableBeds,
      icon: HomeIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Occupied Beds',
      value: stats.occupiedBeds,
      icon: BuildingOfficeIcon,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      title: 'Total Admissions',
      value: stats.totalAdmissions,
      icon: ClipboardDocumentListIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Active Admissions',
      value: stats.activeAdmissions,
      icon: CheckCircleIcon,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    },
    {
      title: 'Total Reports',
      value: stats.totalReports,
      icon: DocumentTextIcon,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
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
        <h2 className="text-xl font-semibold text-gray-800">Welcome, Nurse!</h2>
        <p className="text-sm text-gray-600 mt-1">
          Here's an overview of patient care statistics and recent activities.
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

      {/* Recent Admissions */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Admissions</h3>
        {recentAdmissions.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No recent admissions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAdmissions.map((admission) => (
              <div
                key={admission._id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {admission.patient?.fullName || 'Unknown Patient'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Bed: {admission.bedNumber} • {formatDate(admission.admissionDate)}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(admission.status)}`}>
                  {admission.status || 'Admitted'}
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