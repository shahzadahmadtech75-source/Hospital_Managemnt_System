import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });

  // Complete appointment form
  const [completeData, setCompleteData] = useState({
    caseHistory: '',
    consultationNotes: '',
    medications: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? {} : { status: filter };
      const response = await axiosInstance.get('/doctor/appointments', { params });

      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch appointments';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await axiosInstance.get('/doctor/patients/all');
      if (response.data.success) {
        setPatients(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const response = await axiosInstance.patch(`/doctor/appointments/${appointmentId}/status`, { status });
      if (response.data.success) {
        toast.success(`Appointment ${status} successfully`);
        fetchAppointments();
        setShowDetailModal(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update appointment';
      toast.error(message);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/doctor/appointments/${appointmentId}/complete`, completeData);
      if (response.data.success) {
        toast.success('Appointment completed successfully');
        setShowDetailModal(false);
        setCompleteData({ caseHistory: '', consultationNotes: '', medications: '' });
        fetchAppointments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete appointment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/doctor/appointments', formData);
      if (response.data.success) {
        toast.success('Appointment created successfully');
        setShowCreateModal(false);
        setFormData({ patientId: '', appointmentDate: '', appointmentTime: '', reason: '' });
        fetchAppointments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create appointment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAppointment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/doctor/appointments/${selectedAppointment._id}`, formData);
      if (response.data.success) {
        toast.success('Appointment updated successfully');
        setShowEditModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update appointment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;
    
    try {
      const response = await axiosInstance.delete(`/doctor/appointments/${appointmentId}`);
      if (response.data.success) {
        toast.success('Appointment deleted successfully');
        setShowDetailModal(false);
        fetchAppointments();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete appointment';
      toast.error(message);
    }
  };

  const openCreateModal = () => {
    fetchPatients();
    setShowCreateModal(true);
  };

  const openEditModal = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patientId: appointment.patient?._id || '',
      appointmentDate: appointment.appointmentDate ? appointment.appointmentDate.split('T')[0] : '',
      appointmentTime: appointment.appointmentTime || '',
      reason: appointment.reason || '',
    });
    fetchPatients();
    setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: PendingIcon, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircleIcon, label: 'Approved' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckBadgeIcon, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon, label: 'Cancelled' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircleIcon, label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filters = ['all', 'pending', 'approved', 'completed', 'cancelled'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your appointments and patient consultations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No appointments found</p>
          <p className="text-gray-500 text-sm mt-1">
            {filter === 'all' ? 'No appointments yet.' : `No ${filter} appointments.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-800">
                          {appointment.patient?.fullName || 'Unknown Patient'}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(appointment.appointmentDate)}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatTime(appointment.appointmentTime)}
                        </span>
                        {appointment.reason && (
                          <span className="text-gray-600 truncate max-w-xs">
                            Reason: {appointment.reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewAppointment(appointment)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(appointment._id, 'approved')}
                        className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appointment._id, 'rejected')}
                        className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {appointment.status === 'approved' && (
                    <button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                    >
                      Complete
                    </button>
                  )}
                  {(appointment.status === 'pending' || appointment.status === 'approved') && (
                    <button
                      onClick={() => openEditModal(appointment)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Appointment Details</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.appointmentTime)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedAppointment(null);
                    setCompleteData({ caseHistory: '', consultationNotes: '', medications: '' });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-medium text-gray-800">{selectedAppointment.patient?.fullName || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{selectedAppointment.patient?.phone || 'No phone'}</p>
                </div>

                {selectedAppointment.reason && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedAppointment.reason}
                    </p>
                  </div>
                )}

                {selectedAppointment.status === 'approved' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Complete Appointment</p>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Case History"
                        value={completeData.caseHistory}
                        onChange={(e) => setCompleteData(prev => ({ ...prev, caseHistory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                      />
                      <textarea
                        placeholder="Consultation Notes"
                        value={completeData.consultationNotes}
                        onChange={(e) => setCompleteData(prev => ({ ...prev, consultationNotes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                      />
                      <textarea
                        placeholder="Medications"
                        value={completeData.medications}
                        onChange={(e) => setCompleteData(prev => ({ ...prev, medications: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="2"
                      />
                      <button
                        onClick={() => handleCompleteAppointment(selectedAppointment._id)}
                        disabled={submitting}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Completing...' : 'Complete Appointment'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                  <div className="flex gap-2">
                    {selectedAppointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedAppointment._id, 'approved')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedAppointment._id, 'rejected')}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'approved') && (
                      <button
                        onClick={() => handleDeleteAppointment(selectedAppointment._id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-md"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold text-gray-800">Create Appointment</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ patientId: '', appointmentDate: '', appointmentTime: '', reason: '' });
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <select
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'].map((t) => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for appointment"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingPatients}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Appointment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Appointment</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditAppointment} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <select
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select time</option>
                    {['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'].map((t) => (
                      <option key={t} value={t}>{formatTime(t)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for appointment"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || loadingPatients}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Appointment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsTab;