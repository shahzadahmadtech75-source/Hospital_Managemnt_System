import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gray-900 text-gray-300">
   
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
                <img
                  className="w-full h-full object-cover"
                  src="https://tse1.mm.bing.net/th/id/OIP.XDpsKD3Omlj227bBS54s6wHaHa?r=0&pid=Api&h=220&P=0"
                  alt="HMS logo"
                />
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-blue-400 to-green-500 bg-clip-text text-transparent">
                HMS
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Providing quality healthcare services with compassion and excellence. Your health is our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
         <ul className="space-y-1 text-sm">
  <li>
    <Link to="/home" className="text-gray-400 hover:text-white transition-colors">
      Home
    </Link>
  </li>
  <li>
    <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
      About Us
    </Link>
  </li>
  <li>
    <Link to="/departments" className="text-gray-400 hover:text-white transition-colors">
      Departments
    </Link>
  </li>
  <li>
    <Link to="/doctors" className="text-gray-400 hover:text-white transition-colors">
      Our Doctors
    </Link>
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
<div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
  <p>&copy; {currentYear} HMS - Hospital Management System. All rights reserved.</p>

  {showScrollTop && (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-md shadow-blue-900/30 hover:from-blue-500 hover:to-blue-700 hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0"
    >
      <ArrowUpIcon className="w-4 h-4" />
    </button>
  )}
</div>
      </div>
    </footer>
  );
};

export default Footer;