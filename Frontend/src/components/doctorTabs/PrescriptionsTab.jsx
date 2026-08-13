import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const PrescriptionsTab = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    appointmentId: '',
    caseHistory: '',
    medications: [],
    extraNotes: '',
  });

  const [medicationInput, setMedicationInput] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/doctor/prescriptions');
      if (response.data.success) {
        setPrescriptions(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch prescriptions';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await axiosInstance.get('/doctor/appointments', { params: { status: 'completed' } });
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch completed appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleViewPrescription = (prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailModal(true);
  };

  const openCreateModal = () => {
    fetchCompletedAppointments();
    setFormData({
      appointmentId: '',
      caseHistory: '',
      medications: [],
      extraNotes: '',
    });
    setMedicationInput({
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
    setShowCreateModal(true);
  };

  const openEditModal = (prescription) => {
    setSelectedPrescription(prescription);
    setFormData({
      appointmentId: prescription.appointment?._id || '',
      caseHistory: prescription.caseHistory || '',
      medications: prescription.medications || [],
      extraNotes: prescription.extraNotes || '',
    });
    setShowEditModal(true);
  };

  const addMedication = () => {
    if (!medicationInput.medicineName || !medicationInput.dosage || !medicationInput.frequency || !medicationInput.duration) {
      toast.error('Please fill all medication fields');
      return;
    }
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { ...medicationInput }]
    }));
    setMedicationInput({
      medicineName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (formData.medications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/doctor/prescriptions', formData);
      if (response.data.success) {
        toast.success('Prescription created successfully');
        setShowCreateModal(false);
        fetchPrescriptions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create prescription';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();
    if (formData.medications.length === 0) {
      toast.error('Please add at least one medication');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/doctor/prescriptions/${selectedPrescription._id}`, formData);
      if (response.data.success) {
        toast.success('Prescription updated successfully');
        setShowEditModal(false);
        setSelectedPrescription(null);
        fetchPrescriptions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update prescription';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrescription = async (prescriptionId) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return;
    try {
      const response = await axiosInstance.delete(`/doctor/prescriptions/${prescriptionId}`);
      if (response.data.success) {
        toast.success('Prescription deleted successfully');
        setShowDetailModal(false);
        fetchPrescriptions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete prescription';
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading prescriptions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Prescriptions</h2>
          <p className="text-sm text-gray-600 mt-1">Create and manage patient prescriptions</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Prescription
        </button>
      </div>

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No prescriptions found</p>
          <p className="text-gray-500 text-sm mt-1">Create your first prescription for a completed appointment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-800">
                        Prescription for {prescription.patient?.fullName || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {prescription.medications?.length || 0} medication(s) • {formatDate(prescription.prescriptionDate)}
                      </p>
                      {prescription.appointment && (
                        <p className="text-sm text-gray-500">
                          Appointment: {formatDate(prescription.appointment.appointmentDate)} at {formatTime(prescription.appointment.appointmentTime)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewPrescription(prescription)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(prescription)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePrescription(prescription._id)}
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
      {showDetailModal && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Prescription Details</h3>
                  <p className="text-sm text-gray-500">
                    Prescribed on {formatDate(selectedPrescription.prescriptionDate)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-800">{selectedPrescription.patient?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedPrescription.patient?.phone || 'No phone'}</p>
                </div>

                {/* Case History */}
                {selectedPrescription.caseHistory && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Case History</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedPrescription.caseHistory}
                    </p>
                  </div>
                )}

                {/* Medications */}
                {selectedPrescription.medications && selectedPrescription.medications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <BeakerIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Medications ({selectedPrescription.medications.length})
                    </p>
                    <div className="space-y-3">
                      {selectedPrescription.medications.map((med, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{med.medicineName}</p>
                              <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                              <p className="text-sm text-gray-500">Duration: {med.duration}</p>
                              {med.instructions && (
                                <p className="text-sm text-gray-600 mt-1">💊 {med.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extra Notes */}
                {selectedPrescription.extraNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedPrescription.extraNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => handleDeletePrescription(selectedPrescription._id)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-md transition-colors"
                >
                  Delete Prescription
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPrescription(null);
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
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Create Prescription</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ appointmentId: '', caseHistory: '', medications: [], extraNotes: '' });
                    setMedicationInput({ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePrescription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed Appointment *</label>
                  <select
                    value={formData.appointmentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select appointment</option>
                    {appointments.map((app) => (
                      <option key={app._id} value={app._id}>
                        {app.patient?.fullName || 'Unknown'} - {formatDate(app.appointmentDate)} at {formatTime(app.appointmentTime)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case History</label>
                  <textarea
                    value={formData.caseHistory}
                    onChange={(e) => setFormData(prev => ({ ...prev, caseHistory: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief case history"
                  />
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medications *</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      placeholder="Medicine name *"
                      value={medicationInput.medicineName}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, medicineName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Dosage *"
                      value={medicationInput.dosage}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, dosage: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Frequency *"
                      value={medicationInput.frequency}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, frequency: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Duration *"
                      value={medicationInput.duration}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, duration: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Instructions (optional)"
                      value={medicationInput.instructions}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, instructions: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.medications.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.medications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                          <span className="text-sm">{med.medicineName} - {med.dosage}</span>
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Notes</label>
                  <textarea
                    value={formData.extraNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, extraNotes: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingAppointments}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Prescription'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Prescription</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPrescription(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdatePrescription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Case History</label>
                  <textarea
                    value={formData.caseHistory}
                    onChange={(e) => setFormData(prev => ({ ...prev, caseHistory: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief case history"
                  />
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medications *</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      placeholder="Medicine name *"
                      value={medicationInput.medicineName}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, medicineName: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Dosage *"
                      value={medicationInput.dosage}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, dosage: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Frequency *"
                      value={medicationInput.frequency}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, frequency: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      placeholder="Duration *"
                      value={medicationInput.duration}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, duration: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Instructions (optional)"
                      value={medicationInput.instructions}
                      onChange={(e) => setMedicationInput(prev => ({ ...prev, instructions: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.medications.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.medications.map((med, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                          <span className="text-sm">{med.medicineName} - {med.dosage}</span>
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Notes</label>
                  <textarea
                    value={formData.extraNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, extraNotes: e.target.value }))}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Prescription'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsTab;