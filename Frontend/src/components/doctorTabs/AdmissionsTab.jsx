import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  HomeIcon,
  RectangleStackIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const AdmissionsTab = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    patientId: '',
    bedNumber: '',
    bedType: '',
    admissionDate: '',
    dischargeDate: '',
    reason: '',
    status: 'admitted',
  });

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/doctor/admissions');
      if (response.data.success) {
        setAdmissions(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch admissions';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await axiosInstance.get('/doctor/patients');
      if (response.data.success) {
        setPatients(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleViewAdmission = (admission) => {
    setSelectedAdmission(admission);
    setShowDetailModal(true);
  };

  const openCreateModal = () => {
    fetchPatients();
    setFormData({
      patientId: '',
      bedNumber: '',
      bedType: '',
      admissionDate: new Date().toISOString().split('T')[0],
      dischargeDate: '',
      reason: '',
      status: 'admitted',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (admission) => {
    setSelectedAdmission(admission);
    setFormData({
      patientId: admission.patient?._id || '',
      bedNumber: admission.bedNumber || '',
      bedType: admission.bedType || '',
      admissionDate: admission.admissionDate ? admission.admissionDate.split('T')[0] : '',
      dischargeDate: admission.dischargeDate ? admission.dischargeDate.split('T')[0] : '',
      reason: admission.reason || '',
      status: admission.status || 'admitted',
    });
    fetchPatients();
    setShowEditModal(true);
  };

  const handleCreateAdmission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/doctor/admissions', formData);
      if (response.data.success) {
        toast.success('Bed allotted successfully');
        setShowCreateModal(false);
        fetchAdmissions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to allot bed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAdmission = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/doctor/admissions/${selectedAdmission._id}`, formData);
      if (response.data.success) {
        toast.success('Admission updated successfully');
        setShowEditModal(false);
        setSelectedAdmission(null);
        fetchAdmissions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update admission';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmission = async (admissionId) => {
    if (!confirm('Are you sure you want to delete this admission?')) return;
    try {
      const response = await axiosInstance.delete(`/doctor/admissions/${admissionId}`);
      if (response.data.success) {
        toast.success('Admission deleted successfully');
        setShowDetailModal(false);
        fetchAdmissions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete admission';
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
        icon: BuildingOffice2Icon, // ✅ was HospitalIcon (undefined) — this crashed on every admitted record
        label: 'Admitted',
      },
      discharged: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: HomeIcon,
        label: 'Discharged',
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading admissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Bed Allotment</h2>
          <p className="text-sm text-gray-600 mt-1">Manage patient admissions and bed allotments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Allot Bed
        </button>
      </div>

      {/* Admissions List */}
      {admissions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No admissions found</p>
          <p className="text-gray-500 text-sm mt-1">Allot a bed to admit a patient</p>
        </div>
      ) : (
        <div className="space-y-4">
          {admissions.map((admission) => (
            <div
              key={admission._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {admission.patient?.fullName || 'Unknown Patient'}
                        </h3>
                        {getStatusBadge(admission.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <RectangleStackIcon className="w-4 h-4 mr-1" />
                          Bed: {admission.bedNumber || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                          {getBedTypeLabel(admission.bedType)}
                        </span>
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
                      </div>
                      {admission.reason && (
                        <p className="text-sm text-gray-600 mt-2 truncate max-w-md">
                          Reason: {admission.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewAdmission(admission)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(admission)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  {admission.status !== 'discharged' && (
                    <button
                      onClick={() => handleDeleteAdmission(admission._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Admission Details</h3>
                  <p className="text-sm text-gray-500">
                    Patient: {selectedAdmission.patient?.fullName || 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAdmission(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Status</p>
                  {getStatusBadge(selectedAdmission.status)}
                </div>

                {/* Patient Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-800">{selectedAdmission.patient?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedAdmission.patient?.phone || 'No phone'}</p>
                </div>

                {/* Bed Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Bed Number</p>
                    <p className="font-medium text-gray-800">{selectedAdmission.bedNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Bed Type</p>
                    <p className="font-medium text-gray-800">{getBedTypeLabel(selectedAdmission.bedType)}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500">Admission Date</p>
                    <p className="font-medium text-gray-800">{formatDate(selectedAdmission.admissionDate)}</p>
                  </div>
                  {selectedAdmission.dischargeDate && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500">Discharge Date</p>
                      <p className="font-medium text-gray-800">{formatDate(selectedAdmission.dischargeDate)}</p>
                    </div>
                  )}
                </div>

                {/* Reason */}
                {selectedAdmission.reason && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
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

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                {selectedAdmission.status !== 'discharged' && (
                  <button
                    onClick={() => handleDeleteAdmission(selectedAdmission._id)}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                  >
                    Delete Admission
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAdmission(null);
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Allot Bed</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ patientId: '', bedNumber: '', bedType: '', admissionDate: '', dischargeDate: '', reason: '', status: 'admitted' });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number *</label>
                    <input
                      type="text"
                      value={formData.bedNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., B-101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
                    <select
                      value={formData.bedType}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedType: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="general">General Ward</option>
                      <option value="semi_private">Semi-Private</option>
                      <option value="private">Private Room</option>
                      <option value="icu">ICU</option>
                      <option value="nicu">NICU</option>
                      <option value="emergency">Emergency</option>
                      <option value="isolation">Isolation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
                  <input
                    type="date"
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for admission"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingPatients}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Allotting...' : 'Allot Bed'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Admission</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAdmission(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateAdmission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={formData.patientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                    <input
                      type="text"
                      value={formData.bedNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., B-101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                    <select
                      value={formData.bedType}
                      onChange={(e) => setFormData(prev => ({ ...prev, bedType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="general">General Ward</option>
                      <option value="semi_private">Semi-Private</option>
                      <option value="private">Private Room</option>
                      <option value="icu">ICU</option>
                      <option value="nicu">NICU</option>
                      <option value="emergency">Emergency</option>
                      <option value="isolation">Isolation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Date</label>
                  <input
                    type="date"
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="admitted">Admitted</option>
                    <option value="discharged">Discharged</option>
                    <option value="transferred">Transferred</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for admission"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingPatients}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Admission'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsTab;