import React, { useState, useEffect } from 'react';
import { toast } from '../common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const DoctorsTab = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/patient/doctors');
      
      if (response.data.success) {
        setDoctors(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch doctors';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = async (doctorId) => {
    setLoadingDetail(true);
    setShowDetailModal(true);
    
    try {
      const response = await axiosInstance.get(`/patient/doctors/${doctorId}`);
      
      if (response.data.success) {
        setSelectedDoctor(response.data.data);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch doctor details';
      toast.error(message);
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedDoctor(null);
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading doctors...</div>
        </div>
      </div>
    );
  }

  // Empty State
  if (doctors.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Doctors Found</p>
          <p className="text-gray-500 text-sm mt-1">
            You haven't had any appointments yet. Book an appointment to see your doctors here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Your Doctors</h2>
        <p className="text-sm text-gray-600 mt-1">
          Doctors you have consulted or have appointments with
        </p>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doctor) => (
          <div
            key={doctor._id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Doctor Image */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {doctor.profileImage ? (
                  <img
                    src={doctor.profileImage}
                    alt={doctor.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-base">
                  Dr. {doctor.fullName}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {doctor.specialization}
                </p>
                <p className="text-sm text-gray-500">
                  {doctor.department}
                </p>
                {doctor.qualification && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <AcademicCapIcon className="w-3 h-3 mr-1" />
                    {doctor.qualification}
                  </p>
                )}
              </div>
            </div>

            {/* View Profile Button */}
            <button
              onClick={() => handleViewDoctor(doctor._id)}
              className="w-full mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 flex items-center justify-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* Doctor Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">Loading doctor details...</div>
              </div>
            ) : selectedDoctor ? (
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedDoctor.profileImage ? (
                        <img
                          src={selectedDoctor.profileImage}
                          alt={selectedDoctor.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        Dr. {selectedDoctor.fullName}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {selectedDoctor.specialization}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedDoctor.department}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Doctor Details */}
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  {/* Qualification & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDoctor.qualification && (
                      <div className="flex items-center space-x-2 text-sm">
                        <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Qualification</p>
                          <p className="text-gray-700">{selectedDoctor.qualification}</p>
                        </div>
                      </div>
                    )}
                    {selectedDoctor.experienceYears && (
                      <div className="flex items-center space-x-2 text-sm">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="text-gray-700">{selectedDoctor.experienceYears} years</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone & Address */}
                  {(selectedDoctor.phone || selectedDoctor.address) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedDoctor.phone && (
                        <div className="flex items-center space-x-2 text-sm">
                          <PhoneIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="text-gray-700">{selectedDoctor.phone}</p>
                          </div>
                        </div>
                      )}
                      {selectedDoctor.address && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPinIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500">Address</p>
                            <p className="text-gray-700">{selectedDoctor.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Consultation Fee & Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDoctor.consultationFee && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Consultation Fee</p>
                          <p className="text-gray-700 font-medium">${selectedDoctor.consultationFee}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <div className={`w-2.5 h-2.5 rounded-full ${selectedDoctor.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-xs text-gray-500">Availability</p>
                        <p className={`font-medium ${selectedDoctor.isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                          {selectedDoctor.isAvailable ? 'Available' : 'Unavailable'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedDoctor.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">About</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                        {selectedDoctor.description}
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

export default DoctorsTab;