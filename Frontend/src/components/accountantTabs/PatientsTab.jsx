import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  UserIcon,
  EyeIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const PatientsTab = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientAdmissions, setPatientAdmissions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const term = searchTerm.toLowerCase().trim();
      setFilteredPatients(
        patients.filter(p =>
          p.fullName?.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phone?.includes(term)
        )
      );
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/accountant/patients');
      if (response.data.success) {
        setPatients(response.data.data || []);
        setFilteredPatients(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch patients';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
    setLoadingDetails(true);
    
    try {
      // Fetch patient appointments
      const appointmentsRes = await axiosInstance.get(`/accountant/patients/${patient._id}/appointments`);
      if (appointmentsRes.data.success) {
        setPatientAppointments(appointmentsRes.data.data || []);
      }

      // Fetch patient admissions
      const admissionsRes = await axiosInstance.get(`/accountant/patients/${patient._id}/admissions`);
      if (admissionsRes.data.success) {
        setPatientAdmissions(admissionsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch patient details:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoadingDetails(false);
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

  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': 'bg-red-100 text-red-700 border-red-200',
      'A-': 'bg-red-100 text-red-700 border-red-200',
      'B+': 'bg-blue-100 text-blue-700 border-blue-200',
      'B-': 'bg-blue-100 text-blue-700 border-blue-200',
      'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
      'AB-': 'bg-purple-100 text-purple-700 border-purple-200',
      'O+': 'bg-green-100 text-green-700 border-green-200',
      'O-': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[bloodGroup] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      admitted: 'bg-blue-100 text-blue-800 border-blue-200',
      discharged: 'bg-green-100 text-green-800 border-green-200',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading patients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Patients</h2>
        <p className="text-sm text-gray-600 mt-1">View all patients and their records</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No patients found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchTerm ? 'Try adjusting your search' : 'No patients registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {patient.profileImage ? (
                    <img
                      src={patient.profileImage}
                      alt={patient.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-base truncate">
                    {patient.fullName || 'Unknown'}
                  </h3>
                  {patient.email && (
                    <p className="text-sm text-gray-500 truncate flex items-center">
                      <EnvelopeIcon className="w-3 h-3 mr-1" />
                      {patient.email}
                    </p>
                  )}
                  {patient.phone && (
                    <p className="text-sm text-gray-500 truncate flex items-center">
                      <PhoneIcon className="w-3 h-3 mr-1" />
                      {patient.phone}
                    </p>
                  )}
                  {patient.bloodGroup && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getBloodGroupColor(patient.bloodGroup)}`}>
                      {patient.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-500">
                {patient.gender && <span className="capitalize">{patient.gender}</span>}
                {patient.dateOfBirth && <span>• {formatDate(patient.dateOfBirth)}</span>}
              </div>

              <button
                onClick={() => handleViewPatient(patient)}
                className="w-full mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 flex items-center justify-center gap-1"
              >
                <EyeIcon className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Patient Detail Modal */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {selectedPatient.profileImage ? (
                      <img
                        src={selectedPatient.profileImage}
                        alt={selectedPatient.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedPatient.fullName || 'Unknown'}
                    </h3>
                    {selectedPatient.bloodGroup && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getBloodGroupColor(selectedPatient.bloodGroup)}`}>
                        {selectedPatient.bloodGroup}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPatient(null);
                    setPatientAppointments([]);
                    setPatientAdmissions([]);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPatient.email && (
                    <div className="flex items-center space-x-3 text-sm">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-gray-700">{selectedPatient.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.phone && (
                    <div className="flex items-center space-x-3 text-sm">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-gray-700">{selectedPatient.phone}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.gender && (
                    <div className="flex items-center space-x-3 text-sm">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-gray-700 capitalize">{selectedPatient.gender}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.dateOfBirth && (
                    <div className="flex items-center space-x-3 text-sm">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="text-gray-700">{formatDate(selectedPatient.dateOfBirth)}</p>
                      </div>
                    </div>
                  )}
                  {selectedPatient.address && (
                    <div className="flex items-start space-x-3 text-sm col-span-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-gray-700">{selectedPatient.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-2">Patient ID</p>
                  <p className="text-sm text-gray-700 font-mono">{selectedPatient._id}</p>
                </div>

                {/* Appointments */}
                {loadingDetails ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500 text-sm">Loading patient records...</div>
                  </div>
                ) : (
                  <>
                    {patientAppointments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                          Appointments ({patientAppointments.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patientAppointments.slice(0, 5).map((appt) => (
                            <div key={appt._id} className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Dr. {appt.doctor?.fullName || 'Unknown'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(appt.status)}`}>
                                  {appt.status || 'Pending'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(appt.appointmentDate)} at {formatTime(appt.appointmentTime)}
                              </div>
                              {appt.reason && (
                                <div className="text-xs text-gray-600 mt-1 truncate">{appt.reason}</div>
                              )}
                            </div>
                          ))}
                          {patientAppointments.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">+{patientAppointments.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {patientAdmissions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 mr-2 text-purple-600" />
                          Admissions ({patientAdmissions.length})
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {patientAdmissions.slice(0, 5).map((admission) => (
                            <div key={admission._id} className="bg-gray-50 p-2 rounded-md border border-gray-200 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  Bed {admission.bedNumber || 'N/A'} - {admission.bedType || 'N/A'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(admission.status)}`}>
                                  {admission.status || 'Admitted'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Admitted: {formatDate(admission.admissionDate)}
                                {admission.dischargeDate && ` • Discharged: ${formatDate(admission.dischargeDate)}`}
                              </div>
                              {admission.reason && (
                                <div className="text-xs text-gray-600 mt-1 truncate">{admission.reason}</div>
                              )}
                            </div>
                          ))}
                          {patientAdmissions.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">+{patientAdmissions.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}

                    {patientAppointments.length === 0 && patientAdmissions.length === 0 && (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">No appointments or admissions found for this patient</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPatient(null);
                    setPatientAppointments([]);
                    setPatientAdmissions([]);
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

export default PatientsTab;