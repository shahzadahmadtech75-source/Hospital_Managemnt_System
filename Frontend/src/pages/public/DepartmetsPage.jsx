import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import AppointmentBookingModal from '../../components/common/AppointmentBookingModal';
import { Link } from 'react-router-dom';

import {
  BuildingOfficeIcon,
  EyeIcon,
  XMarkIcon,
  UserGroupIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  IdentificationIcon,
  ShieldCheckIcon,
  HeartIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  PhoneIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// Pure layout content — not tied to any backend data
const trustPoints = [
  { icon: ShieldCheckIcon, title: 'Accredited care', desc: 'Every department follows nationally recognized safety and quality standards.' },
  { icon: AcademicCapIcon, title: 'Specialist-led teams', desc: 'Departments are staffed by physicians trained in their specific field, not generalists.' },
  { icon: ClockIcon, title: '24/7 emergency support', desc: 'Critical departments maintain round-the-clock coverage for urgent cases.' },
  { icon: HeartIcon, title: 'Patient-first approach', desc: 'Every department is built around clear communication and coordinated care.' },
];

// Pure layout content — describes the flow, not tied to any backend data
const howItWorks = [
  { step: '01', icon: MagnifyingGlassIcon, title: 'Browse departments', desc: 'Search or scroll to find the department that matches your care needs.' },
  { step: '02', icon: EyeIcon, title: 'Review the details', desc: 'Open a department to see its specialists and what it covers.' },
  { step: '03', icon: CalendarDaysIcon, title: 'Book an appointment', desc: 'Choose a specialist within that department and schedule your visit.' },
];

const PulseLine = ({ className = '' }) => (
  <svg viewBox="0 0 200 40" className={className} fill="none" preserveAspectRatio="none">
    <polyline
      points="0,20 40,20 55,5 68,35 82,20 200,20"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pulse-path"
    />
  </svg>
);

const DepartmentsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false); {/* Appointment Modal */}
      
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filter departments based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDepartments(departments);
    } else {
      const term = searchTerm.toLowerCase().trim();
      setFilteredDepartments(
        departments.filter(
          (d) =>
            d.name?.toLowerCase().includes(term) ||
            d.description?.toLowerCase().includes(term)
        )
      );
    }
    setCurrentPage(1);
  }, [searchTerm, departments]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/public/departments');
      if (response.data.success) {
        setDepartments(response.data.data || []);
        setFilteredDepartments(response.data.data || []);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch departments';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDetailModal(true);
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

  const getTruncatedDescription = (description, maxLength = 100) => {
    if (!description) return 'Comprehensive medical care';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real, derived from actual API data — total specialists across all departments
  const totalSpecialists = departments.reduce((sum, d) => sum + (d.doctors?.length || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Loading departments...
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        {/* Hero Section */}
<section className="relative bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm tracking-wide uppercase mb-4">
        <Squares2X2Icon className="w-4 h-4" />
        Departments at City Care Hospital
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
        Specialized care, organized <span className="text-blue-600">around you</span>
      </h1>
      <PulseLine className="w-32 h-8 text-blue-500 mb-5" />
      <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
        Every department is staffed by specialists trained in their field —
        so wherever you start, you're already in the right hands.
      </p>
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setIsModalOpen(true)}
  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          Book an Appointment <ArrowRightIcon className="w-4 h-4" />
        </button>
        <Link to='/doctors'>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 border border-slate-200 hover:border-blue-300 text-white font-medium rounded-lg transition-colors">
          View All Doctors
        </button></Link>
      </div>
    </div>

    <div className="relative">
      <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-100">
        <img
          src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=900&auto=format&fit=crop"
          alt="Hospital reception area"
          className="w-full h-[420px] object-cover"
        />
      </div>
      <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-blue-50 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Nationally Accredited</p>
          <p className="text-xs text-slate-400">Joint Commission Certified</p>
        </div>
      </div>
    </div>
  </div>
</section>

  {/* separating line */}
<div className="relative py-2 mt-1.5">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
  </div>

  <div className="relative flex justify-center">
    <span className="bg-green px-4 flex gap-5">
      <span className="block w-1.5 h-1.5 rounded-full bg-green-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-red-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-blue-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-yellow-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-indigo-800" />
    </span>
  </div>
</div>
        {/* Why Choose Our Departments — static trust band, no backend data needed */}
        <section className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="max-w-2xl mb-10">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Why it matters</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                What every department is built on
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustPoints.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={i}
                    className="group bg-white rounded-2xl border border-green-400 p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-0.5"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 border border-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:border-blue-600">
                      <Icon className="w-6 h-6 text-white transition-colors duration-300 " />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{t.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

  {/* separating line */}
<div className="relative py-2 mt-1.5">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
  </div>

  <div className="relative flex justify-center">
    <span className="bg-green px-4 flex gap-5">
      <span className="block w-1.5 h-1.5 rounded-full bg-green-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-red-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-blue-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-yellow-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-indigo-800" />
    </span>
  </div>
</div>
        {/* Stats + Search Band — real numbers from your API data */}
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Total Departments</span>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{departments.length}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <UserGroupIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Total Specialists</span>
                    <p className="text-2xl font-bold text-slate-900 leading-tight">{totalSpecialists}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Active Departments</span>
                    <p className="text-2xl font-bold text-green-600 leading-tight">{departments.length}</p>
                  </div>
                </div>
              </div>
              <div className="relative w-full sm:w-72">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-800" />
                <input
                  type="text"
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Departments Grid Section — core functional block, untouched logic */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mb-10">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Browse by specialty</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Find the right department for your care
            </h2>
          </div>

          {currentDepartments.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
              <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No departments found</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Departments will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentDepartments.map((department) => (
                  <div
                    key={department._id}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Department Image */}
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
                      {department.image ? (
                        <img
                          src={department.image}
                          alt={department.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-blue-400">
                          <BuildingOfficeIcon className="w-16 h-16" />
                          <span className="text-sm font-medium mt-2">No Image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-5 border-t border-slate-100">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {department.name}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed min-h-[48px]">
                        {getTruncatedDescription(department.description, 100)}
                      </p>

                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserGroupIcon className="w-3.5 h-3.5 text-blue-400" />
                          {department.doctors?.length || 0} Doctors
                        </span>
                        {department.createdAt && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                            Since {formatDate(department.createdAt)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleViewDepartment(department)}
                        className="w-full mt-4 px-4 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-medium rounded-lg transition-colors border border-blue-100 hover:border-blue-600 flex items-center justify-center gap-2 group/btn"
                      >
                        <EyeIcon className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        View Department
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 pt-8 border-t border-slate-100">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          : 'text-gray-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

  {/* separating line */}
<div className="relative py-2 mt-1.5">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
  </div>

  <div className="relative flex justify-center">
    <span className="bg-green px-4 flex gap-5">
      <span className="block w-1.5 h-1.5 rounded-full bg-green-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-red-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-blue-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-yellow-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-indigo-800" />
    </span>
  </div>
</div>
        {/* How It Works — static, purely layout/flow, no backend data */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-2xl mb-12">
              <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Getting started</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                Three steps from browsing to booked
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {howItWorks.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative border-green-300 border-2 rounded p-4">
                    <div className="flex items-center gap-3 mb-4 ">
                      <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-3xl font-bold text-blue-100">{step.step}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    {i < howItWorks.length - 1 && (
                      <div className="hidden sm:block absolute top-5 left-full w-8 -ml-4">
                        <ArrowRightIcon className="w-4 h-4 text-blue-200" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA — real specialist count from API, contact details are static placeholders */}
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
                {totalSpecialists > 0
                  ? `Not sure which of our ${departments.length} departments fits your needs?`
                  : 'Not sure which department fits your needs?'}
              </h2>
              <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                Our care coordination team can point you to the right specialist,
                or connect you directly if it's urgent.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button  onClick={() => setIsModalOpen(true)}
 className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-lg transition-colors">
                  Book an Appointment <ArrowRightIcon className="w-4 h-4" />
                </button>

                <Link to='/contact'>
                <button className="inline-flex items-center gap-2 px-6 py-3 border border-blue-300 hover:bg-blue-500/30 text-white font-medium rounded-lg transition-colors">
                  Contact US
                </button></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

  {/* separating line */}
<div className="relative py-2 mt-1.5">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
  </div>

  <div className="relative flex justify-center">
    <span className="bg-green px-4 flex gap-5">
      <span className="block w-1.5 h-1.5 rounded-full bg-green-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-red-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-blue-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-yellow-800" />
      <span className="block w-1.5 h-1.5 rounded-full bg-indigo-800" />
    </span>
  </div>
</div>
      <Footer />

      {/* Department Detail Modal — unchanged logic */}
      {showDetailModal && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedDepartment.image ? (
                      <img
                        src={selectedDepartment.image}
                        alt={selectedDepartment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {selectedDepartment.name}
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                      <UserGroupIcon className="w-3.5 h-3.5 text-blue-400" />
                      {selectedDepartment.doctors?.length || 0} Doctors
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-700 mb-1">About this Department</p>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedDepartment.description || 'Comprehensive medical care provided by our expert team.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500">Department Name</p>
                    <p className="font-medium text-slate-800">{selectedDepartment.name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500">Doctor Count</p>
                    <p className="font-medium text-slate-800">{selectedDepartment.doctors?.length || 0}</p>
                  </div>
                  {selectedDepartment.createdAt && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 sm:col-span-2">
                      <p className="text-xs text-slate-500">Established</p>
                      <p className="font-medium text-slate-800">{formatDate(selectedDepartment.createdAt)}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-2">
                  <IdentificationIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Department ID</p>
                    <p className="text-sm text-slate-600 font-mono">{selectedDepartment._id}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedDepartment(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AppointmentBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default DepartmentsPage;