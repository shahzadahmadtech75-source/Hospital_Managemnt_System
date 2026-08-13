import React, { useState, useEffect } from 'react';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import {
  UserIcon,
  EyeIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const DoctorsTab = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchParams, setSearchParams] = useState({
    query: '',
    department: '',
    specialization: '',
    isAvailable: '',
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParams]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const params = {};
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] && searchParams[key] !== '') {
          params[key] = searchParams[key];
        }
      });

      const response = await axiosInstance.get('/receptionist/doctors/search', { params });
      if (response.data.success) {
        setDoctors(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to search doctors';
      toast.error(message);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
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

  const getAvailabilityBadge = (isAvailable) => {
    return isAvailable ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Unavailable
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading doctors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Doctors</h2>
        <p className="text-sm text-gray-600 mt-1">Search and view doctor information</p>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              name="query"
              placeholder="Name, dept, specialization..."
              value={searchParams.query}
              onChange={handleInputChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
          <input
            type="text"
            name="department"
            placeholder="e.g., Cardiology"
            value={searchParams.department}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Specialization</label>
          <input
            type="text"
            name="specialization"
            placeholder="e.g., Cardiologist"
            value={searchParams.specialization}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Availability</label>
          <select
            name="isAvailable"
            value={searchParams.isAvailable}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Search Indicator */}
      {searching && (
        <div className="text-center py-2 mb-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Searching...
          </div>
        </div>
      )}

      {/* Doctors List */}
      {doctors.length === 0 && !searching ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No doctors found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {doctor.profileImage ? (
                    <img
                      src={doctor.profileImage}
                      alt={doctor.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-7 h-7 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-base truncate">
                    Dr. {doctor.fullName || 'Unknown'}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium truncate">
                    {doctor.specialization || 'General'}
                  </p>
                  <p className="text-sm text-gray-500 truncate flex items-center">
                    <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                    {doctor.department || 'General'}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">
                  <CurrencyDollarIcon className="w-3 h-3 inline mr-1" />
                  {doctor.consultationFee ? `$${doctor.consultationFee}` : 'N/A'}
                </span>
                <span className="text-xs text-gray-500">
                  <BriefcaseIcon className="w-3 h-3 inline mr-1" />
                  {doctor.experienceYears || 0} yrs
                </span>
                {getAvailabilityBadge(doctor.isAvailable)}
              </div>

              <button
                onClick={() => handleViewDoctor(doctor)}
                className="w-full mt-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors border border-blue-200 flex items-center justify-center gap-1"
              >
                <EyeIcon className="w-4 h-4" />
                View Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Detail Modal */}
      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {selectedDoctor.profileImage ? (
                      <img
                        src={selectedDoctor.profileImage}
                        alt={selectedDoctor.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Dr. {selectedDoctor.fullName || 'Unknown'}
                    </h3>
                    <p className="text-blue-600 font-medium">{selectedDoctor.specialization || 'General'}</p>
                    <p className="text-sm text-gray-500">{selectedDoctor.department || 'General'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Availability</p>
                  {getAvailabilityBadge(selectedDoctor.isAvailable)}
                  {selectedDoctor.availability && (
                    <p className="text-sm text-gray-600 mt-1">{selectedDoctor.availability}</p>
                  )}
                </div>

                {selectedDoctor.email && (
                  <div className="flex items-center space-x-3 text-sm">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-gray-700">{selectedDoctor.email}</p>
                    </div>
                  </div>
                )}

                {selectedDoctor.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-gray-700">{selectedDoctor.phone}</p>
                    </div>
                  </div>
                )}

                {selectedDoctor.address && (
                  <div className="flex items-start space-x-3 text-sm">
                    <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-gray-700">{selectedDoctor.address}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedDoctor.qualification && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500">Qualification</p>
                      <p className="font-medium text-gray-800 text-sm">{selectedDoctor.qualification}</p>
                    </div>
                  )}
                  {selectedDoctor.experienceYears && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="font-medium text-gray-800 text-sm">{selectedDoctor.experienceYears} years</p>
                    </div>
                  )}
                </div>

                {selectedDoctor.consultationFee && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500">Consultation Fee</p>
                    <p className="font-medium text-gray-800 text-sm">${selectedDoctor.consultationFee}</p>
                  </div>
                )}

                {selectedDoctor.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">About</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 text-sm">
                      {selectedDoctor.description}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400 border-t border-gray-200 pt-4">
                  <p>Username: {selectedDoctor.username || 'N/A'}</p>
                  <p>Status: {selectedDoctor.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
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

export default DoctorsTab;