import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import AppointmentBookingModal from '../../components/common/AppointmentBookingModal';
import { PulseLine } from '../../components/common/PulseLine';
import { Link } from 'react-router-dom';
import SectionPulseDivider from '../../components/common/SectionPulseDivider';
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
  ShieldCheckIcon,
  HeartIcon,
  ClockIcon,
  ArrowRightIcon,
  ClipboardDocumentCheckIcon,
  
} from '@heroicons/react/24/outline';

// Pure layout content — not tied to any backend data
const trustPoints = [
  { icon: ShieldCheckIcon, title: 'Verified credentials', desc: 'Every doctor listed is licensed and credentialed before they ever appear on this page.' },
  { icon: AcademicCapIcon, title: 'Specialist training', desc: 'Our physicians hold advanced qualifications specific to the care they provide.' },
  { icon: ClockIcon, title: 'Real-time availability', desc: 'Availability status updates live, so you always know who you can book right now.' },
  { icon: HeartIcon, title: 'Patient-centered care', desc: 'Every consultation is built around listening first, treating second.' },
];

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
  const itemsPerPage = 8;

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
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-600">
        <CheckCircleIcon className="w-3 h-3 mr-1" />
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-600">
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

  // Real, derived from actual API data
  const availableCount = doctors.filter((d) => d.isAvailable).length;
  const doctorsWithExperience = doctors.filter((d) => d.experienceYears);
  const avgExperience = doctorsWithExperience.length
    ? Math.round(
        doctorsWithExperience.reduce((sum, d) => sum + Number(d.experienceYears || 0), 0) /
          doctorsWithExperience.length
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Loading doctors...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <style>{`
        .pulse-path {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: pulse-draw 3.5s ease-in-out infinite;
        }
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 220; }
          40% { stroke-dashoffset: 0; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -220; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-path { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50 via-white to-white dark:from-blue-900 dark:via-gray-900 dark:to-gray-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm tracking-wide uppercase mb-4">
                <UserIcon className="w-4 h-4" />
                Meet Our Physicians
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-gray-100 leading-tight mb-4">
                Experts you can <span className="text-blue-600">trust</span>, right when you need them
              </h1>
              <PulseLine className="w-32 h-8 text-blue-500 mb-5" />
              <p className="text-lg text-slate-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
                Search by name, specialty, or department to find a physician who
                fits your care — then book directly, no phone tag required.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => document.getElementById('doctors-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Browse Doctors <ArrowRightIcon className="w-4 h-4" />
                </button>
                <Link to='/departments'><button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 border border-slate-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-500 text-white font-medium rounded-lg transition-colors">
                  View Departments
                </button></Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-100 dark:shadow-none">
                <img
                  src="https://plus.unsplash.com/premium_photo-1658506671316-0b293df7c72b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZG9jdG9yc3xlbnwwfHwwfHx8MA%3D%3D"
                  alt="Physician team"
                  className="w-full h-[420px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-blue-50 dark:bg-gray-800 dark:border-gray-700 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-gray-700 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">Credential Verified</p>
                  <p className="text-xs text-slate-400 dark:text-gray-400">Every physician, checked</p>
                </div>
              </div>
            </div>
          </div>
        </section>
<SectionPulseDivider />
        {/* Why Trust Our Doctors — static trust band */}
        <section className="bg-white dark:bg-gray-800 border-y border-slate-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl mb-10">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Why patients choose us</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100">
                What sets our physicians apart
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPoints.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={i}
                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-slate-500 dark:border-gray-700 p-6 transition-all duration-300 hover:border-blue-200 dark:hover:border-gray-600 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-gray-700 hover:-translate-y-0.5"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 border border-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:border-blue-600">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-2">{t.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

              <SectionPulseDivider />
        {/* Stats + Filters — real numbers derived from your API data */}
        <section id="doctors-grid" className="bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-gray-400">Total Doctors</span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 leading-tight">{doctors.length}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900 border border-green-100 dark:border-green-700 flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-gray-400">Available Now</span>
                    <p className="text-2xl font-bold text-green-600 leading-tight">{availableCount}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-gray-400">Departments</span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 leading-tight">{departments.length}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-gray-400">Specializations</span>
                    <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 leading-tight">{specializations.length}</p>
                  </div>
                </div>
                {avgExperience !== null && (
                  <>
                    <div className="w-px h-10 bg-slate-200 dark:bg-gray-700 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-700 flex items-center justify-center flex-shrink-0">
                        <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-gray-400">Avg. Experience</span>
                        <p className="text-2xl font-bold text-slate-900 dark:text-gray-100 leading-tight">{avgExperience} yrs</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-gray-700">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-700 dark:text-blue-400" />
                  <input
                    type="text"
                    placeholder="Search doctors by name, specialization, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 border border-blue-300 dark:border-blue-600 pr-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-4 py-2.5 border border-green-500 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={filterSpecialization}
                  onChange={(e) => setFilterSpecialization(e.target.value)}
                  className="px-4 py-2.5 border border-green-500 dark:border-green-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
<SectionPulseDivider />
              {/* Quick specialty chips — built from real specializations data */}
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => setFilterSpecialization('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      filterSpecialization === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    All Specialties
                  </button>
                  {specializations.slice(0, 8).map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setFilterSpecialization(spec)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        filterSpecialization === spec
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Doctors Grid Section — core functional block, untouched logic, denser cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mb-10">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Full directory</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-gray-100">
              Browse all physicians
            </h2>
          </div>

          {currentDoctors.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700">
              <UserIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No doctors found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {searchTerm || filterDepartment !== 'all' || filterSpecialization !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No doctors available at the moment'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {currentDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-gray-700 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Doctor Image — shrunk from h-56 to h-36 */}
                    <div className="h-36 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-700 overflow-hidden relative">
                      {doctor.profileImage ? (
                        <img
                          src={doctor.profileImage}
                          alt={doctor.fullName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-blue-400 dark:text-blue-600">
                          <UserIcon className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {getAvailabilityBadge(doctor.isAvailable)}
                      </div>
                    </div>

                    {/* Content — tightened padding and type sizes */}
                    <div className="p-3.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 leading-snug mb-0.5 truncate">
                        Dr. {doctor.fullName}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium truncate">
                        {doctor.specialization || 'General Medicine'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-gray-400 truncate">{doctor.department || 'General'}</p>

                      {/* Qualifications / experience / fee — compact single row */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 pt-2 border-t border-slate-100 dark:border-gray-700 text-[11px] text-slate-500 dark:text-gray-400">
                        {doctor.qualification && (
                          <span className="flex items-center gap-1 truncate max-w-[90px]">
                            <AcademicCapIcon className="w-3 h-3 flex-shrink-0" />
                            {doctor.qualification}
                          </span>
                        )}
                        {doctor.experienceYears && (
                          <span className="flex items-center gap-1">
                            <BriefcaseIcon className="w-3 h-3" />
                            {doctor.experienceYears}y
                          </span>
                        )}
                        {doctor.consultationFee && (
                          <span className="flex items-center gap-1 text-slate-700 dark:text-gray-300 font-medium ml-auto">
                            <CurrencyDollarIcon className="w-3 h-3" />
                            {doctor.consultationFee}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1.5 mt-3">
                        <button
                          onClick={() => handleViewDoctor(doctor)}
                          className="flex-1 px-2.5 py-1.5 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-700 text-blue-700 dark:text-gray-200 text-xs font-medium rounded-lg transition-colors border border-blue-100 dark:border-gray-600 flex items-center justify-center gap-1"
                        >
                          <EyeIcon className="w-3.5 h-3.5" />
                          Profile
                        </button>
                        <button
                          onClick={() => handleBookAppointment(doctor)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
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
                <div className="flex items-center justify-center gap-2 mt-10 pt-8 border-t border-slate-100 dark:border-gray-700">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Closing CTA — real doctor count from API, contact details are static placeholders */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl px-8 md:px-16 py-14 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-blue-200 mx-auto mb-5" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {doctors.length > 0
                  ? `Can't decide between our ${doctors.length} doctors?`
                  : "Can't decide which doctor to see?"}
              </h2>
              <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                Our care coordination team can match you with the right specialist
                based on your symptoms and history.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => setShowBookingModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 dark:bg-gray-300 dark:hover:bg-blue-300 text-blue-700 dark:text-blue-800 font-semibold rounded-lg transition-colors cursor-pointer">
                  Book an Appointment <ArrowRightIcon className="w-4 h-4" />
                </button>
                <Link to='/contact'>
                <button className="inline-flex items-center gap-2 px-6 py-3 border border-blue-800 dark:border-blue-500 hover:bg-blue-500/30 text-white font-medium rounded-lg transition-colors cursor-pointer">
                  <PhoneIcon className="w-4 h-4" /> Contact US
                </button></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
<SectionPulseDivider />
      <Footer />

      {/* Doctor Detail Modal — unchanged logic */}
      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-gray-700">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-gray-700 border border-blue-100 dark:border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-gray-100">
                      Dr. {selectedDoctor.fullName}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium">{selectedDoctor.specialization || 'General Medicine'}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{selectedDoctor.department || 'General'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4">
                {/* Availability */}
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Availability</span>
                  {getAvailabilityBadge(selectedDoctor.isAvailable)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDoctor.qualification && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Qualification</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">{selectedDoctor.qualification}</p>
                    </div>
                  )}
                  {selectedDoctor.experienceYears && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Experience</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">{selectedDoctor.experienceYears} years</p>
                    </div>
                  )}
                  {selectedDoctor.consultationFee && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Consultation Fee</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">${selectedDoctor.consultationFee}</p>
                    </div>
                  )}
                  {selectedDoctor.phone && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">{selectedDoctor.phone}</p>
                    </div>
                  )}
                  {selectedDoctor.email && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700 sm:col-span-2">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">{selectedDoctor.email}</p>
                    </div>
                  )}
                  {selectedDoctor.address && (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700 sm:col-span-2">
                      <p className="text-xs text-slate-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-slate-800 dark:text-gray-100">{selectedDoctor.address}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedDoctor.description && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4 border border-blue-100 dark:border-blue-700">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">About</p>
                    <p className="text-slate-700 dark:text-gray-300 leading-relaxed">{selectedDoctor.description}</p>
                  </div>
                )}

                {/* Doctor ID */}
                <div className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Doctor ID</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300 font-mono">{selectedDoctor._id}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-gray-700 flex justify-between">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDoctor(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleBookAppointment(selectedDoctor);
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
