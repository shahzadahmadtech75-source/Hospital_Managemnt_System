import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/Toaster';
import axiosInstance from '../../api/axiosInstance';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const ContactPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    emergencyType: '',
    message: '',
    urgencyLevel: 'medium',
  });

  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency' },
    { value: 'accident', label: 'Accident' },
    { value: 'urgent_care', label: 'Urgent Care' },
    { value: 'other', label: 'Other' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || user?.role !== 'patient') {
      toast.error('Please login as a patient to submit emergency contact');
      navigate('/login', { state: { from: '/contact' } });
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/emergency', formData);
      if (response.data.success) {
        setSuccess(true);
        setFormData({
          emergencyType: '',
          message: '',
          urgencyLevel: 'medium',
        });
        toast.success('Emergency contact submitted successfully');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit emergency contact';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: PhoneIcon,
      title: 'Emergency Hotline',
      details: ['(555) 123-4567', '24/7 Available'],
      color: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
    },
    {
      icon: EnvelopeIcon,
      title: 'Email Us',
      details: ['info@hms.com', 'emergency@hms.com'],
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      icon: MapPinIcon,
      title: 'Visit Us',
      details: ['123 Healthcare Blvd', 'Medical District, MD 10001'],
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
    },
    {
      icon: ClockIcon,
      title: 'Working Hours',
      details: ['Mon-Fri: 8AM - 8PM', 'Sat: 9AM - 5PM'],
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              We're here to help. Reach out to us for any medical emergencies or general inquiries.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 -mt-8">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-lg border ${info.color} p-6 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className={`w-12 h-12 rounded-full ${info.color} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${info.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
                  {info.details.map((detail, i) => (
                    <p key={i} className="text-sm text-gray-600">{detail}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        {/* Emergency Form */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Emergency Contact Form</h2>
                <p className="text-sm text-gray-500">For urgent medical assistance, please fill this form</p>
              </div>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-700">Emergency contact submitted successfully!</p>
                  <p className="text-sm text-green-600">Our team will reach out to you shortly.</p>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please <button onClick={() => navigate('/login', { state: { from: '/contact' } })} className="font-semibold underline hover:text-yellow-900">login</button> as a patient to submit emergency contact.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Type *
                </label>
                <select
                  name="emergencyType"
                  value={formData.emergencyType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select emergency type</option>
                  {emergencyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {urgencyLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: level.value }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        formData.urgencyLevel === level.value
                          ? `${level.color} border-current`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Please describe your emergency or concern in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !isAuthenticated || user?.role !== 'patient'}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Emergency Contact'}
              </button>

              {isAuthenticated && user?.role !== 'patient' && (
                <p className="text-sm text-red-600 text-center">
                  Only patients can submit emergency contact requests.
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;