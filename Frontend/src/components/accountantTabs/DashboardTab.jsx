import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const DashboardTab = () => {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    partiallyPaid: 0,
    totalPatients: 0,
    totalDoctors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      try {
        const invoicesRes = await axiosInstance.get('/accountant/invoices');
        if (invoicesRes.data.success) {
          const invoices = invoicesRes.data.data || [];
          
          // Calculate stats
          const paid = invoices.filter(i => i.paymentStatus === 'paid').length;
          const unpaid = invoices.filter(i => i.paymentStatus === 'unpaid').length;
          const partially = invoices.filter(i => i.paymentStatus === 'partially_paid').length;
          const totalRevenue = invoices.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
          
          setStats(prev => ({
            ...prev,
            totalInvoices: invoices.length,
            paidInvoices: paid,
            unpaidInvoices: unpaid,
            partiallyPaid: partially,
            totalRevenue: totalRevenue,
          }));
          
          // Get recent invoices (last 5)
          const sorted = [...invoices].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentInvoices(sorted.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      }

      // Fetch patients
      try {
        const patientsRes = await axiosInstance.get('/accountant/patients');
        if (patientsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalPatients: patientsRes.data.count || 0
          }));
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      }

      // Fetch doctors
      try {
        const doctorsRes = await axiosInstance.get('/accountant/doctors');
        if (doctorsRes.data.success) {
          setStats(prev => ({
            ...prev,
            totalDoctors: doctorsRes.data.count || 0
          }));
        }
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
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

  const formatCurrency = (amount) => {
    return `$${amount?.toFixed(2) || '0.00'}`;
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      paid: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Paid',
      },
      unpaid: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon,
        label: 'Unpaid',
      },
      partially_paid: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ClockIcon,
        label: 'Partially Paid',
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: XCircleIcon,
        label: 'Cancelled',
      },
    };
    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.totalInvoices,
      icon: DocumentTextIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Paid',
      value: stats.paidInvoices,
      icon: CheckCircleIcon,
      color: 'bg-green-50 text-green-600 border-green-200',
    },
    {
      title: 'Unpaid',
      value: stats.unpaidInvoices,
      icon: XCircleIcon,
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    {
      title: 'Partially Paid',
      value: stats.partiallyPaid,
      icon: ClockIcon,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    },
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: UserGroupIcon,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: UserCircleIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
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
        <h2 className="text-xl font-semibold text-gray-800">Welcome, Accountant!</h2>
        <p className="text-sm text-gray-600 mt-1">
          Here's an overview of financial statistics and recent invoices.
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

      {/* Recent Invoices */}
      <div>
        <h3 className="text-md font-semibold text-gray-800 mb-4">Recent Invoices</h3>
        {recentInvoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">No recent invoices</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice._id}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {invoice.invoiceNumber || 'INV-' + invoice._id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invoice.patient?.fullName || 'Unknown Patient'} • {formatDate(invoice.issueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(invoice.totalAmount)}
                  </span>
                  {getPaymentStatusBadge(invoice.paymentStatus)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;