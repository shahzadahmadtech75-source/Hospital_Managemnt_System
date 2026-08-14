import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const EmergencyTab = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [filteredEmergencies, setFilteredEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEmergencies();
  }, [filterStatus]);

  useEffect(() => {
    let filtered = emergencies;
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(e =>
        e.patientName?.toLowerCase().includes(term) ||
        e.phone?.includes(term) ||
        e.emergencyType?.toLowerCase().includes(term) ||
        e.message?.toLowerCase().includes(term)
      );
    }
    
    setFilteredEmergencies(filtered);
  }, [searchTerm, emergencies]);

  const fetchEmergencies = async () => {
    setLoading(true);
    try {
      const params = filterStatus === 'all' ? {} : { status: filterStatus };
      const response = await axiosInstance.get('/admin/emergency', { params });
      if (response.data.success) {
        setEmergencies(response.data.data || []);
        setFilteredEmergencies(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch emergencies';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmergency = (emergency) => {
    setSelectedEmergency(emergency);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (emergencyId, status) => {
    setUpdating(true);
    try {
      const response = await axiosInstance.patch(`/admin/emergency/${emergencyId}`, { status });
      if (response.data.success) {
        toast.success(`Status updated to ${status}`);
        fetchEmergencies();
        setShowDetailModal(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEmergency = async (emergencyId) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;
    try {
      const response = await axiosInstance.delete(`/admin/emergency/${emergencyId}`);
      if (response.data.success) {
        toast.success('Emergency contact deleted');
        setShowDetailModal(false);
        fetchEmergencies();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete';
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getUrgencyBadge = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[level] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ClockIcon, label: 'Pending' },
      'in-progress': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ExclamationTriangleIcon, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircleIcon, label: 'Resolved' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon, label: 'Cancelled' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {c.label}
      </span>
    );
  };

  const getEmergencyTypeLabel = (type) => {
    const types = {
      medical: 'Medical Emergency',
      accident: 'Accident',
      urgent_care: 'Urgent Care',
      other: 'Other',
    };
    return types[type] || type;
  };

  const statusOptions = ['all', 'pending', 'in-progress', 'resolved', 'cancelled'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading emergencies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-800">Emergency Contacts</h2>
        </div>
        <p className="text-sm text-gray-600">Manage emergency contact requests from patients</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Emergencies List */}
      {filteredEmergencies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No emergency contacts</p>
          <p className="text-gray-500 text-sm mt-1">All clear! No emergency requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEmergencies.map((emergency) => (
            <div
              key={emergency._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${getUrgencyBadge(emergency.urgencyLevel)} flex items-center justify-center flex-shrink-0 border`}>
                      <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {emergency.patientName || 'Unknown Patient'}
                        </h3>
                        {getStatusBadge(emergency.status)}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getUrgencyBadge(emergency.urgencyLevel)}`}>
                          {emergency.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Type:</span> {getEmergencyTypeLabel(emergency.emergencyType)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1" />
                          {emergency.phone || 'No phone'}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(emergency.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {emergency.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewEmergency(emergency)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmergency(emergency._id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">Emergency Details</h3>
                    {getStatusBadge(selectedEmergency.status)}
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedEmergency.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEmergency(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-800">{selectedEmergency.patientName}</p>
                  <p className="text-sm text-gray-500">{selectedEmergency.phone}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Emergency Type</p>
                    <p className="font-medium text-gray-800">{getEmergencyTypeLabel(selectedEmergency.emergencyType)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Urgency Level</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyBadge(selectedEmergency.urgencyLevel)}`}>
                      {selectedEmergency.urgencyLevel}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Message</p>
                  <p className="text-gray-700">{selectedEmergency.message}</p>
                </div>

                {selectedEmergency.adminNote && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Admin Note</p>
                    <p className="text-gray-700">{selectedEmergency.adminNote}</p>
                  </div>
                )}

                {selectedEmergency.resolvedAt && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Resolved At</p>
                    <p className="text-gray-700">{formatDate(selectedEmergency.resolvedAt)}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'in-progress', 'resolved', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedEmergency._id, status)}
                      disabled={updating || status === selectedEmergency.status}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                        status === selectedEmergency.status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      } disabled:opacity-50`}
                    >
                      {status === 'in-progress' ? 'In Progress' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => handleDeleteEmergency(selectedEmergency._id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEmergency(null);
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

export default EmergencyTab;