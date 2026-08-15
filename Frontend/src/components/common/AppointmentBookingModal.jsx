import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const AppointmentBookingModal = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });

  // Fetch doctors on mount
  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/public/doctors');
      if (response.data.success) {
        setDoctors(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated and is a patient
    if (!isAuthenticated) {
      toast.error('Please login as a patient to book an appointment');
      return;
    }

    if (user?.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/patient/appointments', formData);
      if (response.data.success) {
        toast.success('Appointment booked successfully!');
        setFormData({
          doctorId: '',
          appointmentDate: '',
          appointmentTime: '',
          reason: '',
        });
        onClose();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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

  if (!isOpen) return null;

  const isPatient = isAuthenticated && user?.role === 'patient';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Login Required</p>
                <p className="text-sm text-yellow-700">
                  Please <a href="/login" className="font-semibold underline hover:text-yellow-900">login</a> as a patient to book an appointment.
                </p>
              </div>
            </div>
          )}

          {isAuthenticated && !isPatient && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Patient Access Only</p>
                <p className="text-sm text-red-700">
                  Only patients can book appointments. Please login with a patient account.
                </p>
              </div>
            </div>
          )}

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Select Doctor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Doctor *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  disabled={!isPatient || submitting}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Appointment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  disabled={!isPatient || submitting}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Appointment Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Time *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  required
                  disabled={!isPatient || submitting}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select time</option>
                  {['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00'].map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-2.5 pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="3"
                  disabled={!isPatient || submitting}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  placeholder="Briefly describe your symptoms or reason for booking"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isPatient || submitting}
              className={`w-full py-3 font-medium rounded-md transition-colors ${
                isPatient
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>

            {/* Helper Text */}
            {!isPatient && isAuthenticated && (
              <p className="text-sm text-center text-gray-500">
                You need a patient account to book appointments.
              </p>
            )}
            {!isAuthenticated && (
              <p className="text-sm text-center text-gray-500">
                <a href="/login" className="text-blue-600 hover:underline">Login</a> to book an appointment.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingModal;