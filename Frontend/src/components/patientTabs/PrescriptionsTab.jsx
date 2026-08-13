import React, { useState, useEffect } from 'react';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon as PendingIcon,
} from '@heroicons/react/24/outline';

const PrescriptionsTab = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch prescriptions on mount and page change
  useEffect(() => {
    fetchPrescriptions();
  }, [pagination.page]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/patient/prescriptions', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });

      if (response.data.success) {
        setPrescriptions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch prescriptions';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    setLoadingDetail(true);
    setShowDetailModal(true);

    try {
      const response = await axiosInstance.get(`/patient/prescriptions/${prescriptionId}`);

      if (response.data.success) {
        setSelectedPrescription(response.data.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch prescription details';
      toast.error(message);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedPrescription(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
      active: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircleIcon,
        label: 'Active',
      },
      completed: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: CheckCircleIcon,
        label: 'Completed',
      },
      expired: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: ClockIcon,
        label: 'Expired',
      },
    };

    const config = statusConfig[status] || statusConfig.active;
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
          <div className="text-gray-600">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  // Empty State
  if (prescriptions.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Prescriptions Found</p>
          <p className="text-gray-500 text-sm mt-1">
            You don't have any prescriptions yet. Your doctor will prescribe medications during your visit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Prescriptions</h2>
        <p className="text-sm text-gray-600 mt-1">
          View your prescribed medications and treatment plans
        </p>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {prescriptions.map((prescription) => {
          const doctor = prescription.doctor || {};
          const appointment = prescription.appointment || {};

          return (
            <div
              key={prescription._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left - Prescription Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          Prescription
                        </h3>
                        {getStatusBadge(prescription.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Dr. {doctor.fullName || 'Unknown Doctor'} • {doctor.specialization || 'General'}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(prescription.prescriptionDate)}
                        </span>
                        {appointment.appointmentDate && (
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            Appointment: {formatDate(appointment.appointmentDate)}
                          </span>
                        )}
                        {prescription.medications && prescription.medications.length > 0 && (
                          <span className="flex items-center text-gray-600">
                            <BeakerIcon className="w-4 h-4 mr-1" />
                            {prescription.medications.length} medication(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewPrescription(prescription._id)}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200"
                  >
                    <EyeIcon className="w-4 h-4 mr-1.5" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {prescriptions.length} of {pagination.total} prescriptions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="px-3 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Prescription Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading prescription details...</div>
              </div>
            ) : selectedPrescription ? (
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-800">Prescription Details</h3>
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Prescribed on {formatDate(selectedPrescription.prescriptionDate)}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Doctor Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Prescribed By</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        Dr. {selectedPrescription.doctor?.fullName || 'Unknown Doctor'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedPrescription.doctor?.specialization || 'General'} • {selectedPrescription.doctor?.department || ''}
                      </p>
                      {selectedPrescription.doctor?.qualification && (
                        <p className="text-sm text-gray-500">{selectedPrescription.doctor.qualification}</p>
                      )}
                    </div>
                    {selectedPrescription.appointment && (
                      <div className="text-right text-sm text-gray-500">
                        <p>Appointment</p>
                        <p className="font-medium text-gray-700">
                          {formatDate(selectedPrescription.appointment.appointmentDate)}
                        </p>
                        <p className="text-gray-500">
                          {formatTime(selectedPrescription.appointment.appointmentTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medications */}
                {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <BeakerIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Medications ({selectedPrescription.medications.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedPrescription.medications.map((med, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{med.medicationName}</p>
                              <p className="text-sm text-gray-600">
                                {med.dosage} • {med.frequency}
                              </p>
                              {med.duration && (
                                <p className="text-sm text-gray-500">Duration: {med.duration}</p>
                              )}
                              {med.instructions && (
                                <p className="text-sm text-gray-600 mt-1 bg-blue-50 p-1.5 rounded border border-blue-100">
                                  💊 {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnosis & Notes */}
                <div className="space-y-4">
                  {selectedPrescription.diagnosis && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Diagnosis</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {selectedPrescription.diagnosis}
                      </p>
                    </div>
                  )}

                  {selectedPrescription.notes && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {selectedPrescription.notes}
                      </p>
                    </div>
                  )}

                  {selectedPrescription.followUpDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-700">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        Follow-up recommended: {formatDate(selectedPrescription.followUpDate)}
                      </p>
                    </div>
                  )}
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsTab;