import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import DoctorProfileModal from '../../components/common/DoctorProfileModal';
import { HashLink } from 'react-router-hash-link';

import {
  PhoneIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // State for sections
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState({ departments: true, doctors: true });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for hero slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderInterval = useRef(null);

  // State for appointment form
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Hero slides data
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop',
      title: 'Quality Healthcare for All',
      subtitle: 'Compassionate care, advanced technology, and expert medical professionals dedicated to your well-being.',
      cta: 'Book Appointment',
      link : '#appointment'
    
    },
    {
      image: 'https://plus.unsplash.com/premium_photo-1681843126728-04eab730febe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGRvY3RvcnN8ZW58MHx8MHx8fDA%3D',
      title: 'Expert Medical Team',
      subtitle: 'Our highly skilled doctors and nurses provide personalized care using the latest medical advancements.',
      cta: 'Meet Our Doctors',
      link:'/doctors'
    },
    {
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=1200&h=600&fit=crop',
      title: '24/7 Emergency Care',
      subtitle: 'Round-the-clock emergency services with rapid response teams and state-of-the-art facilities.',
      cta: 'Emergency Contact',
      link:'/contact'
    },
  ];

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get('/public/departments');
        setDepartments(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoading((prev) => ({ ...prev, departments: false }));
      }
    };
    fetchDepartments();
  }, []);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axiosInstance.get('/public/doctors');
        setDoctors(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      } finally {
        setLoading((prev) => ({ ...prev, doctors: false }));
      }
    };
    fetchDoctors();
  }, []);

  // Hero slider auto-play
  useEffect(() => {
    sliderInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(sliderInterval.current);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    clearInterval(sliderInterval.current);
    sliderInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
  };

  // Handle doctor view
  const handleViewDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  // Handle appointment form submission
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);

    // Check if user is logged in and has patient role
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, redirect: 'appointment' } });
      return;
    }

    if (user.role !== 'patient') {
      setFormError('Only patients can book appointments. Please contact support.');
      return;
    }

    setFormLoading(true);
    try {
      await axiosInstance.post('/patient/appointments', formData);
      setFormSuccess(true);
      setFormData({
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
      });
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book appointment. Please try again.';
      setFormError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  // Quick action cards data
  const quickActions = [
    {
      icon: PhoneIcon,
      title: 'Emergency Contact',
      description: '24/7 emergency assistance available',
      detail: '(555) 123-4567',
      bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/60',
      iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    },
    {
      icon: CalendarIcon,
      title: 'Fast Booking',
      description: 'Book appointments online in minutes',
      detail: 'Available 24/7',
      bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/60',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    {
      icon: ClockIcon,
      title: 'Opening Hours',
      description: 'Mon-Fri: 8AM - 8PM',
      detail: 'Sat: 9AM - 5PM',
      bg: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/60',
      iconBg: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Hero Slider */}
      <section id="home" className="relative pt-16 bg-white dark:bg-gray-900">
  <div className="relative h-[520px] md:h-[440px] overflow-hidden">
    {slides.map((slide, index) => (
      <div
        key={index}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid md:grid-cols-2 h-full items-center">
          {/* Left: Text content */}
          <div className="order-2 md:order-1 px-6 sm:px-10 lg:px-16">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              {slide.title}
            </h1>
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl">
              {slide.subtitle}
            </p>
            <HashLink smooth to={slide.link}>
  <button className="px-6 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
              {slide.cta}
            </button>
</HashLink>
          </div>

          {/* Right: Image, full-bleed to the edge */}
          <div className="relative h-full order-1 md:order-2 min-h-[220px]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* soft fade so the image blends into the white panel, like the reference */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent hidden md:block" />
          </div>
        </div>
      </div>
    ))}

    {/* Slider Controls */}
    <button
      onClick={prevSlide}
      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100 rounded-full shadow-md transition-colors z-20"
      aria-label="Previous slide"
    >
      <ChevronLeftIcon className="w-6 h-6" />
    </button>
    <button
      onClick={nextSlide}
      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100 rounded-full shadow-md transition-colors z-20"
      aria-label="Next slide"
    >
      <ChevronRightIcon className="w-6 h-6" />
    </button>

    {/* Slider Dots */}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
      {slides.map((_, index) => (
        <button
          key={index}
          onClick={() => goToSlide(index)}
          className={`h-2 rounded-full transition-all ${
            index === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
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
      {/* Quick Action Cards */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className={`p-6 rounded-lg border ${action.bg} transition-all hover:shadow-md`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.iconBg}`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{action.description}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">{action.detail}</p>
                  </div>
                </div>
              </div>
            ))}
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
      {/* Welcome Section */}
      <section id="about" className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&h=400&fit=crop"
                alt="Hospital"
                className="rounded-lg shadow-md w-full h-[300px] object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Welcome to HMS
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                At HMS, we are committed to providing exceptional healthcare services with compassion, 
                innovation, and excellence. Our state-of-the-art facility is equipped with the latest 
                medical technology, and our team of experienced professionals is dedicated to ensuring 
                the best possible outcomes for our patients.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Whether you need routine check-ups, specialized treatments, or emergency care, 
                we are here to serve you with the highest standards of medical care.
              </p>
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
      {/* Departments Section */}
      <section id="departments" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
            Our Departments
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Comprehensive medical departments staffed by highly qualified specialists
          </p>

          {loading.departments ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No departments available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
               <div
  key={dept._id}
  className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-slate-400 dark:border-gray-700 p-6 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-[0_8px_30px_-12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
>
  {/* Top accent line — appears on hover, signals "selected/active" state */}
  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

  {/* Icon */}
  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800 transition-colors duration-300  group-hover:border-blue-400">
    {dept.image ? (
      <img
        src={dept.image}
        alt={dept.name}
        className="w-18 h-18 object-contain rounded-md"
      />
    ) : (
      <BuildingOfficeIcon className="w-6 h-6 text-blue-500 transition-colors duration-300 group-hover:text-white" />
    )}
  </div>

  {/* Department Name */}
  <h3 className="font-semibold text-slate-900 dark:text-gray-100 text-base mb-1.5 tracking-tight">
    {dept.name}
  </h3>

  {/* Description */}
  <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed mb-4 min-h-[40px]">
    {dept.description || 'Comprehensive medical care'}
  </p>

  {/* Doctor count */}
  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-gray-700">
    <UserGroupIcon className="w-4 h-4 text-blue-400" />
    <span className="text-sm font-medium text-slate-700 dark:text-gray-200">
      {dept.doctors || 0} <span className="font-normal text-slate-400 dark:text-gray-500">Doctors</span>
    </span>
  </div>
</div>
              ))}
            </div>
          )}
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
      {/* Doctors Section */}
      <section id="doctors" className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
            Our Doctors
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Expert medical professionals dedicated to your health and well-being
          </p>

          {loading.doctors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No doctors available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-slate-400 dark:border-gray-700 p-6 transition-all duration-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-[0_8px_30px_-12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
                >
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                  {/* Doctor Image */}
                  <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage}
                        alt={doctor.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-gray-400 dark:text-gray-500">
                        <UserIcon className="w-12 h-12" />
                        <span className="text-sm mt-2">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Doctor Info */}
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">
                    Dr. {doctor.fullName}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">
                    {doctor.specialization}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {doctor.department}
                  </p>
                  
                  {/* Qualification & Experience */}
                  <div className="mt-2 space-y-1">
                    {doctor.qualification && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <AcademicCapIcon className="w-3 h-3" />
                        {doctor.qualification}
                      </p>
                    )}
                    {doctor.experienceYears && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {doctor.experienceYears} years experience
                      </p>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <button
                    onClick={() => handleViewDoctor(doctor)}
                    className="w-full mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
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
      {/* Appointment Form Section */}
      <section id="appointment" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-4">
            Get in Touch & Book Appointment
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            Schedule an appointment with our expert medical professionals
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            {formSuccess && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">Appointment booked successfully!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">We will contact you shortly to confirm.</p>
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start space-x-3">
                <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{formError}</p>
              </div>
            )}

            <form onSubmit={handleAppointmentSubmit} className="space-y-5">
              <div>
                <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Doctor *
                </label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.fullName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleFormChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Appointment Time *
                </label>
                <select
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 8;
                    return [
                      `${hour.toString().padStart(2, '0')}:00`,
                      `${hour.toString().padStart(2, '0')}:30`,
                    ];
                  }).flat().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Visit *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleFormChange}
                  required
                  placeholder="Please describe your symptoms or reason for booking"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Booking...' : 'Book Appointment'}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  You will be redirected to login if you're not signed in.
                </p>
              )}
            </form>
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
      <Footer />

      {/* Doctor Profile Modal */}
      <DoctorProfileModal 
        doctor={selectedDoctor}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDoctor(null);
        }}
        isOpen={isModalOpen}
      />
    </div>
  );
};

export default LandingPage;