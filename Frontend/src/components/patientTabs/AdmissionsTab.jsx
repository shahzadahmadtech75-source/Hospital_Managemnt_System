import React, { useState, useEffect } from 'react';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  HomeIcon,
   RectangleStackIcon,
} from '@heroicons/react/24/outline';

const AdmissionsTab = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch admissions on mount
  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/patient/admissions');

      if (response.data.success) {
        setAdmissions(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch admission history';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (admission) => {
    setSelectedAdmission(admission);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedAdmission(null);
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

  const formatDateWithTime = (dateString) => {
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      admitted: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BuildingOffice2Icon, // ✅ was <span>🏥</span> — a rendered element, not a component; crashed when used as <Icon />
        label: 'Admitted',
      },
      discharged: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: HomeIcon,
        label: 'Discharged',
      },
      'in-treatment': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: PendingIcon,
        label: 'In Treatment',
      },
      transferred: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: BuildingOfficeIcon,
        label: 'Transferred',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon,
        label: 'Cancelled',
      },
    };

    const config = statusConfig[status] || statusConfig.admitted;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getBedTypeLabel = (bedType) => {
    const types = {
      general: 'General Ward',
      semi_private: 'Semi-Private',
      private: 'Private Room',
      icu: 'ICU',
      nicu: 'NICU',
      emergency: 'Emergency',
      isolation: 'Isolation',
    };
    return types[bedType] || bedType || 'General Ward';
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading admission history...</div>
        </div>
      </div>
    );
  }

  // Empty State
  if (admissions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Admission Records</p>
          <p className="text-gray-500 text-sm mt-1">
            You don't have any hospital admission history yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Admission History</h2>
        <p className="text-sm text-gray-600 mt-1">
          View your hospital admission records and stay details
        </p>
      </div>

      {/* Admissions List */}
      <div className="space-y-4">
        {admissions.map((admission) => (
          <div
            key={admission._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Left - Admission Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        Admission #{admission._id.slice(-6).toUpperCase()}
                      </h3>
                      {getStatusBadge(admission.status)}
                    </div>
                    
                    {/* Doctor Info */}
                    {admission.doctor && (
                      <p className="text-sm text-gray-600">
                        Doctor: Dr. {admission.doctor.fullName || 'Unknown'} • {admission.doctor.specialization || 'General'}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Admitted: {formatDate(admission.admissionDate)}
                      </span>
                      {admission.dischargeDate && (
                        <span className="flex items-center">
                          <HomeIcon className="w-4 h-4 mr-1" />
                          Discharged: {formatDate(admission.dischargeDate)}
                        </span>
                      )}
                      {admission.bedNumber && (
                        <span className="flex items-center">
                          <RectangleStackIcon className="w-4 h-4 mr-1" />
                          Bed: {admission.bedNumber}
                        </span>
                      )}
                      {admission.bedType && (
                        <span className="flex items-center">
                          <BuildingOffice2Icon className="w-4 h-4 mr-1" />
                          {getBedTypeLabel(admission.bedType)}
                        </span>
                      )}
                    </div>

                    {admission.reason && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                        Reason: {admission.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewDetails(admission)}
                  className="inline-flex items-center px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-md transition-colors border border-purple-200"
                >
                  <EyeIcon className="w-4 h-4 mr-1.5" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admission Detail Modal */}
      {showDetailModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      Admission Details
                    </h3>
                    {getStatusBadge(selectedAdmission.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Admission #{selectedAdmission._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Admission Info */}
              <div className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Admission Date</p>
                    <p className="font-medium text-gray-800">
                      {formatDateWithTime(selectedAdmission.admissionDate)}
                    </p>
                  </div>
                  {selectedAdmission.dischargeDate && (
                    <div>
                      <p className="text-xs text-gray-500">Discharge Date</p>
                      <p className="font-medium text-gray-800">
                        {formatDateWithTime(selectedAdmission.dischargeDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bed Details */}
                {(selectedAdmission.bedNumber || selectedAdmission.bedType) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Bed Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedAdmission.bedNumber && (
                        <div>
                          <p className="text-sm text-gray-500">Bed Number</p>
                          <p className="font-medium text-gray-800">{selectedAdmission.bedNumber}</p>
                        </div>
                      )}
                      {selectedAdmission.bedType && (
                        <div>
                          <p className="text-sm text-gray-500">Bed Type</p>
                          <p className="font-medium text-gray-800">
                            {getBedTypeLabel(selectedAdmission.bedType)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Doctor Info */}
                {selectedAdmission.doctor && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Attending Doctor</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {selectedAdmission.doctor.profileImage ? (
                          <img
                            src={selectedAdmission.doctor.profileImage}
                            alt={selectedAdmission.doctor.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Dr. {selectedAdmission.doctor.fullName || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedAdmission.doctor.specialization || 'General'} • {selectedAdmission.doctor.department || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                {selectedAdmission.reason && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Reason for Admission</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedAdmission.reason}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Created: {formatDateWithTime(selectedAdmission.createdAt)}</p>
                  {selectedAdmission.updatedAt && (
                    <p>Last Updated: {formatDateWithTime(selectedAdmission.updatedAt)}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
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

export default AdmissionsTab;