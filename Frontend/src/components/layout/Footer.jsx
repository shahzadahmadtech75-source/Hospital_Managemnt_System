import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-lg font-semibold text-white">HMS</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Providing quality healthcare services with compassion and excellence. Your health is our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#departments" className="text-gray-400 hover:text-white transition-colors">
                  Departments
                </a>
              </li>
              <li>
                <a href="#doctors" className="text-gray-400 hover:text-white transition-colors">
                  Our Doctors
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                123 Healthcare Blvd,<br />
                Medical District, MD 10001
              </li>
              <li className="text-gray-400">
                Phone: (555) 123-4567
              </li>
              <li className="text-gray-400">
                Email: info@hms.com
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h3 className="text-white font-semibold mb-4">Working Hours</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">
                <span className="text-white">Mon - Fri:</span> 8:00 AM - 8:00 PM
              </li>
              <li className="text-gray-400">
                <span className="text-white">Saturday:</span> 9:00 AM - 5:00 PM
              </li>
              <li className="text-gray-400">
                <span className="text-white">Sunday:</span> Closed
              </li>
              <li className="text-gray-400">
                <span className="text-white">Emergency:</span> 24/7 Available
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} HMS - Hospital Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;