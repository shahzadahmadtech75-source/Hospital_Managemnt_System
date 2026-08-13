import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  UserGroupIcon,
  UsersIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  HeartIcon,
  RectangleStackIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    nurses: 0,
    receptionists: 0,
    accountants: 0,
    invoices: 0,
    prescriptions: 0,
    reports: 0,
    operations: 0,
    births: 0,
    deaths: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/dashboard');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard stats';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Doctors',
      value: stats.doctors,
      icon: UserCircleIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Patients',
      value: stats.patients,
      icon: UsersIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Nurses',
      value: stats.nurses,
      icon: UserGroupIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Receptionists',
      value: stats.receptionists,
      icon: UserGroupIcon,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      title: 'Accountants',
      value: stats.accountants,
      icon: UserGroupIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Invoices',
      value: stats.invoices,
      icon: DocumentTextIcon,
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      title: 'Prescriptions',
      value: stats.prescriptions,
      icon: ClipboardDocumentListIcon,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    },
    {
      title: 'Reports',
      value: stats.reports,
      icon: DocumentTextIcon,
      color: 'bg-gray-50 text-gray-600 border-gray-200',
    },
    {
      title: 'Operations',
      value: stats.operations,
      icon: BeakerIcon,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
    {
      title: 'Births',
      value: stats.births,
      icon: RectangleStackIcon,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
    },
    {
      title: 'Deaths',
      value: stats.deaths,
      icon: HeartIcon,
      color: 'bg-gray-100 text-gray-600 border-gray-300',
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
        <h2 className="text-xl font-semibold text-gray-800">Admin Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          Overview of hospital statistics and performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Total Staff Summary */}
      <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-800">Total Staff</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.doctors + stats.nurses + stats.receptionists + stats.accountants}
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-blue-600 font-medium">{stats.doctors}</span>
              <span className="text-blue-600 ml-1">Doctors</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{stats.nurses}</span>
              <span className="text-blue-600 ml-1">Nurses</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{stats.receptionists}</span>
              <span className="text-blue-600 ml-1">Receptionists</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{stats.accountants}</span>
              <span className="text-blue-600 ml-1">Accountants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Patients Summary */}
      <div className="mt-4 bg-green-50 rounded-lg border border-green-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-green-800">Total Patients</p>
            <p className="text-2xl font-bold text-green-900">{stats.patients}</p>
          </div>
          <div className="flex gap-6 text-sm text-green-600">
            <span>Active Patients</span>
            <span>Registered Users</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;