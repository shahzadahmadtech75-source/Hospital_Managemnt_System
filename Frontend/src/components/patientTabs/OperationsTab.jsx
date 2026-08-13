import React, { useState, useEffect } from 'react';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  BeakerIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const OperationsTab = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch operations on mount
  useEffect(() => {
    fetchOperations();
  }, []);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/patient/operations');

      if (response.data.success) {
        setOperations(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch operation history';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (operation) => {
    setSelectedOperation(operation);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedOperation(null);
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
      scheduled: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: PendingIcon,
        label: 'Scheduled',
      },
      completed: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Completed',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircleIcon,
        label: 'Cancelled',
      },
      'in-progress': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: BeakerIcon,
        label: 'In Progress',
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading operation history...</div>
        </div>
      </div>
    );
  }

  // Empty State
  if (operations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BeakerIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Operation Records</p>
          <p className="text-gray-500 text-sm mt-1">
            You don't have any operation or surgical history yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Operation History</h2>
        <p className="text-sm text-gray-600 mt-1">
          View your surgical and procedure records
        </p>
      </div>

      {/* Operations List */}
      <div className="space-y-4">
        {operations.map((operation) => (
          <div
            key={operation._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Left - Operation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <BeakerIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-800">
                        Operation #{operation._id.slice(-6).toUpperCase()}
                      </h3>
                      {getStatusBadge(operation.status)}
                    </div>
                    
                    {/* Doctor Info */}
                    {operation.doctor && (
                      <p className="text-sm text-gray-600">
                        Surgeon: Dr. {operation.doctor.fullName || 'Unknown'} • {operation.doctor.specialization || 'General'}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Date: {formatDate(operation.operationDate)}
                      </span>
                    </div>

                    {operation.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {operation.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleViewDetails(operation)}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md transition-colors border border-indigo-200"
                >
                  <EyeIcon className="w-4 h-4 mr-1.5" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Operation Detail Modal */}
      {showDetailModal && selectedOperation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      Operation Details
                    </h3>
                    {getStatusBadge(selectedOperation.status)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Operation #{selectedOperation._id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Operation Info */}
              <div className="space-y-4">
                {/* Date */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Operation Date</p>
                  <p className="font-medium text-gray-800">
                    {formatDateWithTime(selectedOperation.operationDate)}
                  </p>
                </div>

                {/* Doctor Info */}
                {selectedOperation.doctor && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Surgeon</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {selectedOperation.doctor.profileImage ? (
                          <img
                            src={selectedOperation.doctor.profileImage}
                            alt={selectedOperation.doctor.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Dr. {selectedOperation.doctor.fullName || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedOperation.doctor.specialization || 'General'} • {selectedOperation.doctor.department || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedOperation.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Procedure Description</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedOperation.description}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {selectedOperation.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedOperation.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Created: {formatDateWithTime(selectedOperation.createdAt)}</p>
                  {selectedOperation.updatedAt && (
                    <p>Last Updated: {formatDateWithTime(selectedOperation.updatedAt)}</p>
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

export default OperationsTab;