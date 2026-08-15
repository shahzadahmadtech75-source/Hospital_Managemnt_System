import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import AppointmentBookingModal from '../../components/common/AppointmentBookingModal';
import {
  UserIcon,
  EyeIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const DoctorsPage = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSpecialization, setFilterSpecialization] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch doctors on mount
  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  // Filter doctors based on search and filters
  useEffect(() => {
    let filtered = doctors;

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.fullName?.toLowerCase().includes(term) ||
          d.specialization?.toLowerCase().includes(term) ||
          d.department?.toLowerCase().includes(term) ||
          d.qualification?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter((d) => d.department === filterDepartment);
    }

    // Specialization filter
    if (filterSpecialization !== 'all') {
      filtered = filtered.filter((d) => d.specialization === filterSpecialization);
    }

    setFilteredDoctors(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterSpecialization, doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/public/doctors');
      if (response.data.success) {
        const doctorData = response.data.data || [];
        setDoctors(doctorData);

        // Extract unique specializations
        const uniqueSpecializations = [
          ...new Set(doctorData.map((d) => d.specialization).filter(Boolean)),
        ];
        setSpecializations(uniqueSpecializations);

        // Extract unique departments
        const uniqueDepartments = [
          ...new Set(doctorData.map((d) => d.department).filter(Boolean)),
        ];
        setDepartments(uniqueDepartments);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch doctors';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get('/public/departments');
      if (response.data.success) {
        // We already extract departments from doctors data
        // This is just a fallback
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  };

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingModal(true);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTruncatedDescription = (description, maxLength = 120) => {
    if (!description) return 'Experienced medical professional dedicated to patient care.';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDoctors = filteredDoctors.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-600">Loading doctors...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Doctors</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Expert medical professionals dedicated to your health and well-being
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats and Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-500">Total Doctors</span>
                  <p className="text-2xl font-bold text-gray-800">{doctors.length}</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <span className="text-sm text-gray-500">Departments</span>
                  <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
                </div>
                <div className="w-px h-10 bg-gray-200"></div>
                <div>
                  <span className="text-sm text-gray-500">Specializations</span>
                  <p className="text-2xl font-bold text-green-600">{specializations.length}</p>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors by name, specialization, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          {currentDoctors.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No doctors found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm || filterDepartment !== 'all' || filterSpecialization !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No doctors available at the moment'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  >
                    {/* Doctor Image */}
                    <div className="h-56 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
                      {doctor.profileImage ? (
                        <img
                          src={doctor.profileImage}
                          alt={doctor.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-blue-400">
                          <UserIcon className="w-16 h-16" />
                          <span className="text-sm font-medium mt-2">No Image</span>
                        </div>
                      )}
                      {/* Availability Badge Overlay */}
                      <div className="absolute top-3 right-3">
                        {getAvailabilityBadge(doctor.isAvailable)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        Dr. {doctor.fullName}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {doctor.specialization || 'General Medicine'}
                      </p>
                      <p className="text-sm text-gray-500">{doctor.department || 'General'}</p>

                      {/* Qualifications and Experience */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {doctor.qualification && (
                          <span className="flex items-center gap-1">
                            <AcademicCapIcon className="w-3.5 h-3.5" />
                            {doctor.qualification}
                          </span>
                        )}
                        {doctor.experienceYears && (
                          <span className="flex items-center gap-1">
                            <BriefcaseIcon className="w-3.5 h-3.5" />
                            {doctor.experienceYears} yrs
                          </span>
                        )}
                        {doctor.consultationFee && (
                          <span className="flex items-center gap-1 text-gray-700 font-medium">
                            <CurrencyDollarIcon className="w-3.5 h-3.5" />
                            ${doctor.consultationFee}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed min-h-[40px]">
                        {getTruncatedDescription(doctor.description, 100)}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleViewDoctor(doctor)}
                          className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors border border-blue-200 flex items-center justify-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Profile
                        </button>
                        <button
                          onClick={() => handleBookAppointment(doctor)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />

      {/* Doctor Detail Modal */}
      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
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
                    <h3 className="text-2xl font-bold text-gray-800">
                      Dr. {selectedDoctor.fullName}
                    </h3>
                    <p className="text-blue-600 font-medium">{selectedDoctor.specialization || 'General Medicine'}</p>
                    <p className="text-sm text-gray-500">{selectedDoctor.department || 'General'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                {/* Availability */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Availability</span>
                  {getAvailabilityBadge(selectedDoctor.isAvailable)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDoctor.qualification && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500">Qualification</p>
                      <p className="font-medium text-gray-800">{selectedDoctor.qualification}</p>
                    </div>
                  )}
                  {selectedDoctor.experienceYears && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500">Experience</p>
                      <p className="font-medium text-gray-800">{selectedDoctor.experienceYears} years</p>
                    </div>
                  )}
                  {selectedDoctor.consultationFee && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500">Consultation Fee</p>
                      <p className="font-medium text-gray-800">${selectedDoctor.consultationFee}</p>
                    </div>
                  )}
                  {selectedDoctor.phone && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{selectedDoctor.phone}</p>
                    </div>
                  )}
                  {selectedDoctor.email && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sm:col-span-2">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{selectedDoctor.email}</p>
                    </div>
                  )}
                  {selectedDoctor.address && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sm:col-span-2">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="font-medium text-gray-800">{selectedDoctor.address}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedDoctor.description && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 mb-1">About</p>
                    <p className="text-gray-700 leading-relaxed">{selectedDoctor.description}</p>
                  </div>
                )}

                {/* Doctor ID */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs text-gray-500">Doctor ID</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedDoctor._id}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleBookAppointment(selectedDoctor);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedDoctor(null);
        }}
        preSelectedDoctor={selectedDoctor?._id}
      />
    </div>
  );
};

export default DoctorsPage;