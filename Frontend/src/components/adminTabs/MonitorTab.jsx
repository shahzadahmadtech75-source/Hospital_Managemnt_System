import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  EyeIcon,
  XMarkIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const MonitorTab = () => {
  const [activeSection, setActiveSection] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState({
    invoices: true,
    admissions: true,
    reports: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const sections = [
    { id: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
    { id: 'admissions', label: 'Bed Allotments', icon: BuildingOfficeIcon },
    { id: 'reports', label: 'Reports', icon: ClipboardDocumentListIcon },
  ];

  useEffect(() => {
    fetchSectionData(activeSection);
  }, [activeSection]);

  const fetchSectionData = async (section) => {
    setLoading(prev => ({ ...prev, [section]: true }));
    try {
      switch (section) {
        case 'invoices':
          const invoicesRes = await axiosInstance.get('/admin/monitor/invoices');
          if (invoicesRes.data.success) {
            setInvoices(invoicesRes.data.data || []);
          }
          break;
        case 'admissions':
          const admissionsRes = await axiosInstance.get('/admin/monitor/bed-allotments');
          if (admissionsRes.data.success) {
            setAdmissions(admissionsRes.data.data || []);
          }
          break;
        case 'reports':
          const reportsRes = await axiosInstance.get('/admin/monitor/reports');
          if (reportsRes.data.success) {
            setReports(reportsRes.data.data || []);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      const message = error.response?.data?.message || `Failed to fetch ${section}`;
      toast.error(message);
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleViewDetails = async (section, id) => {
    try {
      let response;
      switch (section) {
        case 'invoices':
          response = await axiosInstance.get(`/admin/monitor/invoices/${id}`);
          break;
        case 'admissions':
          // No single admission endpoint in routes, use existing data
          const admission = admissions.find(a => a._id === id);
          setSelectedItem(admission);
          setShowDetailModal(true);
          return;
        case 'reports':
          response = await axiosInstance.get(`/admin/monitor/reports/${id}`);
          break;
        default:
          return;
      }
      if (response?.data.success) {
        setSelectedItem(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch details';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      admitted: 'bg-blue-100 text-blue-800 border-blue-200',
      discharged: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTypeBadge = (type) => {
    const types = {
      operation: 'bg-blue-100 text-blue-800 border-blue-200',
      birth: 'bg-green-100 text-green-800 border-green-200',
      death: 'bg-red-100 text-red-800 border-red-200',
    };
    return types[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getFilteredData = () => {
    const data = activeSection === 'invoices' ? invoices :
                 activeSection === 'admissions' ? admissions : reports;
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    return data.filter(item => {
      const searchable = JSON.stringify(item).toLowerCase();
      return searchable.includes(term);
    });
  };

  const renderContent = () => {
    const filteredData = getFilteredData();
    const isLoading = loading[activeSection];

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading {activeSection}...</div>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No {activeSection} found</p>
          <p className="text-gray-500 text-sm mt-1">No records available</p>
        </div>
      );
    }

    if (activeSection === 'invoices') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {invoice.invoiceNumber || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {invoice.patient?.fullName || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    {getPaymentStatusBadge(invoice.paymentStatus)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleViewDetails('invoices', invoice._id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeSection === 'admissions') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Bed</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((admission) => (
                <tr key={admission._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {admission.patient?.profileImage ? (
                          <img src={admission.patient.profileImage} alt={admission.patient.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {admission.patient?.fullName || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {admission.bedNumber || 'N/A'} ({admission.bedType || 'N/A'})
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(admission.status)}`}>
                      {admission.status || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(admission.admissionDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleViewDetails('admissions', admission._id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeSection === 'reports') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Report Date</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {report.patient?.fullName || 'Unknown'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(report.type)}`}>
                      {report.type || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                    {report.description || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {formatDate(report.reportDate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleViewDetails('reports', report._id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Monitor</h2>
        <p className="text-sm text-gray-600 mt-1">Monitor hospital activities and records</p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                setSearchTerm('');
              }}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Search ${activeSection}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Content */}
      {renderContent()}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {activeSection === 'invoices' ? 'Invoice Details' :
                   activeSection === 'admissions' ? 'Admission Details' :
                   'Report Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedItem).map(([key, value]) => {
                  if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') return null;
                  if (value === null || value === undefined) return null;
                  if (typeof value === 'object') {
                    if (key === 'patient') {
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500">Patient</p>
                          <p className="font-medium text-gray-800">{value?.fullName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{value?.phone || 'No phone'}</p>
                        </div>
                      );
                    }
                    if (key === 'doctor') {
                      return (
                        <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="font-medium text-gray-800">Dr. {value?.fullName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{value?.specialization || 'General'}</p>
                        </div>
                      );
                    }
                    return null;
                  }
                  if (key === 'paymentStatus') {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">Payment Status</p>
                        {getPaymentStatusBadge(value)}
                      </div>
                    );
                  }
                  if (key === 'status') {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">Status</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(value)}`}>
                          {value}
                        </span>
                      </div>
                    );
                  }
                  if (key === 'type') {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">Type</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadge(value)}`}>
                          {value}
                        </span>
                      </div>
                    );
                  }
                  if (key === 'totalAmount' || key === 'paidAmount' || key === 'dueAmount') {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-medium text-gray-800">{formatCurrency(value)}</p>
                      </div>
                    );
                  }
                  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-gray-700">{formatDate(value)}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-gray-700">{String(value)}</p>
                    </div>
                  );
                })}

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedItem._id}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorTab;