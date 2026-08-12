import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DoctorProfileModal = ({ doctor, onClose }) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors z-10"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-6 md:p-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-4 border-gray-200">
              {doctor.profileImage ? (
                <img 
                  src={doctor.profileImage} 
                  alt={doctor.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-4xl font-bold">
                  {doctor.fullName?.charAt(0) || 'D'}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Dr. {doctor.fullName}
              </h2>
              <p className="text-lg text-blue-600 font-medium">{doctor.specialization}</p>
              <p className="text-gray-600">{doctor.department}</p>
              
              <div className="flex flex-wrap gap-3 mt-3 justify-center md:justify-start">
                {doctor.qualification && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                    {doctor.qualification}
                  </span>
                )}
                {doctor.experienceYears && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                    {doctor.experienceYears} years experience
                  </span>
                )}
                {doctor.consultationFee && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200">
                    ${doctor.consultationFee} consultation fee
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {doctor.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{doctor.description}</p>
            </div>
          )}

          {/* Availability */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Availability</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              doctor.isAvailable 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {doctor.isAvailable ? 'Available for consultation' : 'Currently unavailable'}
            </span>
          </div>

          {/* Book Button */}
          <button
            onClick={() => {
              onClose();
              // Scroll to contact form
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileModal;